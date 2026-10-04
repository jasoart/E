"""CPU-only checks of training/data boundaries; not a claim of GPU efficacy."""
import ast
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import textwrap
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "colab"))
import gsat_workflow as w


def record(word="protect", identifier="example-1"):
    return {"id": identifier, "target_word": word, "target_forms": [word, word + "s"],
            "sentence": f"Students should {word} the river by reducing waste at school.",
            "level": 4, "source": "self-authored-test", "license": "CC0-1.0", "grammar_tag": "auto"}


class FakeTokenizer:
    eos_token_id = 9

    def __init__(self, prefix_length=3, answer_length=4):
        self.prefix_length = prefix_length
        self.answer_length = answer_length

    def apply_chat_template(self, messages, tokenize, add_generation_prompt):
        return [1] * self.prefix_length

    def __call__(self, answer, add_special_tokens):
        return {"input_ids": [2] * self.answer_length}


class DatasetTests(unittest.TestCase):
    def test_bundled_data_valid_and_distinct(self):
        for name in ("gsat115_style_examples.jsonl", "gsat_examples_demo.jsonl"):
            rows = w.read_jsonl(ROOT / "colab/data" / name)
            self.assertGreaterEqual(len(rows), 50)
            partitions = w.split_records(rows)
            self.assertTrue(all(partitions.values()))
            self.assertTrue(all(r["license"] == "CC0-1.0" for r in rows))

    def test_does_not_accept_bool_level(self):
        row = record(); row["level"] = True
        with self.assertRaisesRegex(ValueError, "level"):
            w.validate_record(row)

    def test_source_and_license_required(self):
        for key in ("source", "license"):
            row = record(); del row[key]
            with self.assertRaisesRegex(ValueError, key): w.validate_record(row)

    def test_wrong_target_and_substring_rejected(self):
        row = record(); row["target_word"] = "pro"; row["target_forms"] = ["pro"]
        with self.assertRaisesRegex(ValueError, "contain the target"):
            w.validate_record(row)

    def test_target_inflection_can_match(self):
        self.assertTrue(w.contains_target("She protects the river.", ["protect", "protects"]))
        self.assertFalse(w.contains_target("Protection is useful.", ["protect"]))

    def test_all_senses_and_rows_stay_in_one_partition(self):
        rows = [record(f"word{x}", f"id{x}-{i}") for x in range(50) for i in range(3)]
        parts = w.split_records(rows)
        assignments = {}
        for name, data in parts.items():
            for row in data: assignments.setdefault(row["target_word"], set()).add(name)
        self.assertTrue(all(len(names) == 1 for names in assignments.values()))
        self.assertEqual(parts, w.split_records(list(reversed(rows))))

    def test_added_words_do_not_change_existing_split(self):
        rows = [record(f"word{x}", f"id{x}") for x in range(30)]
        before = {row["id"]: name for name, data in w.split_records(rows).items() for row in data}
        after = {row["id"]: name for name, data in w.split_records(rows + [record("new", "new")]).items() for row in data}
        self.assertTrue(all(after[key] == name for key, name in before.items()))

    def test_curriculum_schema_and_lexical_levels(self):
        document = {"vocabulary": [{"word": "attend(ance)", "level": 4}], "lexical_levels": {"attend": 4}}
        index = w.curriculum_index(document)
        self.assertIn("attend(ance)", index)
        self.assertEqual(w.build_coverage_index(index, document["lexical_levels"])["attend"], 4)
        self.assertIn("attend", index)
        self.assertIn("attendance", index)


class PromptAndMaskTests(unittest.TestCase):
    def test_danube_prompt_never_uses_unsupported_system_role(self):
        messages = w.build_messages(record())
        self.assertEqual([message["role"] for message in messages], ["user"])
        self.assertTrue(messages[0]["content"].startswith(w.SYSTEM_PROMPT + "\n\n"))

    def test_browser_python_exact_prompt_parity_all_grammar_tags(self):
        cases = []
        for tag in w.GRAMMAR_INSTRUCTIONS:
            cases.append({"word": "attend(ance)/attend", "partOfSpeech": "verb", "meaning": " 參加\n活動 ",
                          "level": 2, "patterns": [" attend school ", "attend a meeting", "ignored"],
                          "topic": "school\tclubs", "grammar_tag": tag})
        script = "const core=require(process.argv[1]);const x=JSON.parse(process.argv[2]);process.stdout.write(JSON.stringify(x.map(core.buildMessages)));"
        result = subprocess.check_output(["node", "-e", script, str(ROOT / "colab/browser-runtime/tutor-core.js"), json.dumps(cases)], text=True)
        expected = json.loads(result)
        for index, case in enumerate(cases):
            python_case = dict(case, target_word=case["word"], meaning_zh=case["meaning"])
            self.assertEqual(w.build_messages(python_case), expected[index])

    def test_only_answer_and_eos_receive_loss(self):
        row = w.tokenize_answer(FakeTokenizer(), w.build_messages(record()), "A valid sentence.")
        self.assertEqual(row["labels"][:3], [-100, -100, -100])
        self.assertEqual(row["labels"][3:], [2, 2, 2, 2, 9])
        self.assertEqual(row["input_ids"][-1], 9)

    def test_long_prompt_and_answer_are_rejected_not_truncated(self):
        for tokenizer in (FakeTokenizer(prefix_length=385), FakeTokenizer(answer_length=96)):
            with self.assertRaisesRegex(ValueError, "budget"):
                w.tokenize_answer(tokenizer, w.build_messages(record()), "Anything.")

    def test_missing_eos_is_an_error(self):
        tokenizer = FakeTokenizer(); tokenizer.eos_token_id = None
        with self.assertRaisesRegex(ValueError, "EOS"):
            w.tokenize_answer(tokenizer, w.build_messages(record()), "Anything.")


class EvaluationTests(unittest.TestCase):
    def test_word_counts_contractions_and_inflections(self):
        words = w.english_words("We don't waste water; she protects it every day.")
        self.assertIn("don't", words)
        self.assertEqual(len(words), 9)

    def test_8gram_overlap_normalizes_punctuation_and_case(self):
        reference = w.ngrams("The students worked together to protect the beautiful river.")
        self.assertTrue(w.ngrams("THE students worked together, to protect the beautiful river!") & reference)
        self.assertFalse(w.ngrams("Students cleaned a river near their school on Sunday.") & reference)

    def test_missing_reference_is_not_zero_overlap(self):
        row = record(); coverage = {word: 1 for word in w.english_words(row["sentence"])}
        score = w.score_sentence(row, row["sentence"], coverage)
        summary = w.summarize_scores([{"score": score}])
        self.assertIsNone(summary["copied_8gram_rate"])
        self.assertFalse(summary["reference_overlap_checked"])

    def test_multiple_sentences_and_translation_flagged(self):
        row = record(); coverage = {word: 1 for word in w.english_words(row["sentence"])}
        self.assertFalse(w.score_sentence(row, row["sentence"] + " We agree.", coverage)["single_sentence"])
        self.assertFalse(w.score_sentence(row, row["sentence"] + " 翻譯", coverage)["single_sentence"])

    def test_demo_and_missing_phone_review_fail_closed(self):
        parts = w.split_records(w.read_jsonl(ROOT / "colab/data/gsat115_style_examples.jsonl"))
        gate = w.release_gate(parts, {}, 400 * 1024**2)
        self.assertFalse(gate["release_eligible"])
        self.assertTrue(any("iPhone" in reason for reason in gate["reasons"]))

    def test_full_gate_requires_equal_prompts_and_real_reference_check(self):
        parts = {"train": [record(f"word{x}", f"train{x}") for x in range(200)], "validation": [record()],
                 "test": [record(f"test{x}", f"test{x}") for x in range(50)]}
        metrics = {"count": 50, "prompt_sha256": "same", "target_match": 1, "length_ok": 1,
                   "single_sentence": 1, "ceec_coverage": 0.98, "reference_overlap_checked": True, "copied_8gram_rate": 0}
        reports = {stage: copy.deepcopy(metrics) for stage in ("baseline", "finetuned", "q4")}
        args = (parts, reports, 500 * 1024**2, {"reviewed_examples": 50, "grammar_accuracy": 0.98}, {"device": "iPhone 13", "passed": True})
        self.assertTrue(w.release_gate(*args)["release_eligible"])
        reports["q4"]["prompt_sha256"] = "different"
        self.assertFalse(w.release_gate(*args)["release_eligible"])
        reports["q4"]["prompt_sha256"] = "same"; reports["q4"]["reference_overlap_checked"] = False
        self.assertFalse(w.release_gate(*args)["release_eligible"])

    def test_manifest_matches_browser_and_has_checksums(self):
        with tempfile.TemporaryDirectory() as directory:
            artifact = Path(directory); (artifact / "onnx").mkdir()
            (artifact / "onnx/model_q4.onnx").write_bytes(b"placeholder-test-only")
            lock = {"base_revision": "a" * 40, "base_license": "apache-2.0"}
            manifest = w.write_manifest(artifact, lock, {}, {"release_eligible": False}, "local/test-model")
            self.assertEqual(manifest["model_files"], ["onnx/model_q4.onnx"])
            self.assertEqual(manifest["files"][0]["sha256"], w.sha256_file(artifact / "onnx/model_q4.onnx"))
            self.assertTrue((artifact / "runtime-manifest.json").exists())
            script = "const c=require(process.argv[1]);const m=JSON.parse(process.argv[2]);process.stdout.write(JSON.stringify(c.validateManifest(m)));"
            subprocess.check_output(["node", "-e", script, str(ROOT / "colab/browser-runtime/tutor-core.js"), json.dumps(manifest)])


class ReferenceIndexTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.directory = Path(directory.name)

    def pdf(self, filename, content=b"fake-pdf-test-only"):
        path = self.directory / filename
        path.write_bytes(content)
        return path

    def reader(self, pages_by_name):
        def load(filename):
            pages = [SimpleNamespace(extract_text=lambda text=text: text)
                     for text in pages_by_name[Path(filename).name]]
            return SimpleNamespace(pages=pages)
        return Mock(side_effect=load)

    def test_multiple_documents_union_and_content_dedup_without_reference_text_metadata(self):
        first_text = "The students worked together to protect the beautiful river."
        second_text = "When local farmers share their knowledge everyone benefits from cooperation."
        first = self.pdf("111.pdf", b"first")
        duplicate = self.pdf("111-copy.pdf", b"first")
        specification = self.pdf("115-specification.pdf", b"second")
        reader = self.reader({first.name: [first_text], specification.name: ["中文說明頁", second_text]})
        with patch.dict(sys.modules, {"pypdf": SimpleNamespace(PdfReader=reader)}):
            index = w.reference_ngram_index([first, duplicate, specification])
        self.assertEqual(index["ngrams"], w.ngrams(first_text) | w.ngrams(second_text))
        self.assertEqual(reader.call_count, 2)
        metadata = index["metadata"]
        self.assertEqual(metadata["uploaded_document_count"], 3)
        self.assertEqual(metadata["unique_document_count"], 2)
        self.assertEqual(metadata["duplicate_document_count"], 1)
        self.assertEqual(metadata["page_count"], 3)
        self.assertEqual(metadata["english_8gram_count"], len(index["ngrams"]))
        self.assertEqual(metadata["documents"][0]["sha256"], w.sha256_file(first))
        self.assertEqual(metadata["documents"][0]["duplicate_filenames"], [duplicate.name])
        self.assertEqual(metadata["documents"][1]["pages_with_8grams"], 1)
        self.assertNotIn(first_text, json.dumps(metadata))
        self.assertNotIn(second_text, json.dumps(metadata))
        self.assertEqual(metadata["role"], "no-copy-overlap-reference-only")

    def test_reference_fragments_never_cross_page_boundaries(self):
        path = self.pdf("112.pdf")
        page_one, page_two = "These students often help", "their neighbors after school"
        valid_page = "Local volunteers planted many trees near the school last spring."
        reader = self.reader({path.name: [page_one, page_two, valid_page]})
        with patch.dict(sys.modules, {"pypdf": SimpleNamespace(PdfReader=reader)}):
            index = w.reference_ngram_index([path])
        self.assertEqual(index["ngrams"], w.ngrams(valid_page))
        self.assertFalse(w.ngrams(page_one + " " + page_two) & index["ngrams"])
        self.assertEqual(index["metadata"]["documents"][0]["page_count"], 3)
        self.assertEqual(index["metadata"]["documents"][0]["pages_with_8grams"], 1)

    def test_each_distinct_reference_must_extract_english_8grams(self):
        good, bad = self.pdf("113.pdf", b"good"), self.pdf("spec.pdf", b"bad")
        reader = self.reader({good.name: ["Students cleaned a river near their school on Sunday."],
                              bad.name: ["中文說明", "Only seven words appear on this page."]})
        with patch.dict(sys.modules, {"pypdf": SimpleNamespace(PdfReader=reader)}):
            with self.assertRaisesRegex(ValueError, "No English 8-word.*spec.pdf"):
                w.reference_ngram_index([good, bad])

    def test_invalid_inputs_fail_before_extraction(self):
        empty, wrong = self.pdf("empty.pdf", b""), self.pdf("notes.txt")
        cases = (([], "At least one"), ([empty], "empty"), ([wrong], "must be a PDF"),
                 ([self.directory / "missing.pdf"], "not a file"), (str(wrong), "list"))
        reader = Mock()
        with patch.dict(sys.modules, {"pypdf": SimpleNamespace(PdfReader=reader)}):
            for paths, message in cases:
                with self.subTest(paths=paths), self.assertRaisesRegex(ValueError, message):
                    w.reference_ngram_index(paths)
        reader.assert_not_called()

    def test_corrupt_pageless_and_extraction_errors_identify_document(self):
        path = self.pdf("114.pdf")
        readers = (
            (Mock(side_effect=RuntimeError("parse failure")), "Cannot read.*114.pdf"),
            (Mock(return_value=SimpleNamespace(pages=[])), "no pages.*114.pdf"),
            (Mock(return_value=SimpleNamespace(pages=[SimpleNamespace(extract_text=Mock(side_effect=RuntimeError("extract failure")))])),
             "114.pdf, page 1"),
        )
        for reader, message in readers:
            with self.subTest(message=message), patch.dict(sys.modules, {"pypdf": SimpleNamespace(PdfReader=reader)}):
                with self.assertRaisesRegex(ValueError, message):
                    w.reference_ngram_index([path])

    def test_single_pdf_compatibility_and_evaluation_use_same_union(self):
        row = record()
        path = self.pdf("115.pdf")
        reader = self.reader({path.name: [row["sentence"]]})
        with patch.dict(sys.modules, {"pypdf": SimpleNamespace(PdfReader=reader)}):
            index = w.reference_ngram_index([path])
            self.assertEqual(w.reference_ngrams(path), index["ngrams"])
        coverage = {word: 1 for word in w.english_words(row["sentence"])}
        score = w.score_sentence(row, row["sentence"], coverage, index["ngrams"])
        self.assertTrue(score["copied_8gram"])
        self.assertEqual(row, record(), "Reference indexing must not modify training records")


class ReferenceNotebookIntegrationTests(unittest.TestCase):
    @staticmethod
    def builder_cell(marker):
        builder = ast.parse((ROOT / "colab/build_notebook.py").read_text(encoding="utf-8"))
        cell = next(node.args[0].value for node in ast.walk(builder)
                    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
                    and node.func.id == "code" and node.args and isinstance(node.args[0], ast.Constant)
                    and isinstance(node.args[0].value, str) and marker in node.args[0].value)
        return ast.parse(textwrap.dedent(cell)).body

    @classmethod
    def upload_code(cls):
        """Run the builder's actual upload block without Colab/GPU/network setup."""
        statements = cls.builder_cell("reference_metadata = None")
        relevant = [node for node in statements if
                    (isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id in
                     ("reference", "reference_metadata") for target in node.targets)) or
                    (isinstance(node, ast.If) and isinstance(node.test, ast.Name) and node.test.id == "UPLOAD_REFERENCE_PDF")]
        return compile(ast.Module(body=relevant, type_ignores=[]), "reference-upload-cell", "exec")

    def test_notebook_uploads_multiple_pdfs_and_saves_only_metadata(self):
        sentence = "Students should protect the river by reducing waste at school."
        reader = Mock(return_value=SimpleNamespace(pages=[SimpleNamespace(extract_text=lambda: sentence)]))
        with tempfile.TemporaryDirectory() as directory, patch.dict(sys.modules, {"pypdf": SimpleNamespace(PdfReader=reader)}):
            namespace = {"RUN_DIR": Path(directory), "Path": Path, "workflow": w,
                         "UPLOAD_REFERENCE_PDF": True,
                         "files": SimpleNamespace(upload=lambda: {"111.pdf": b"exam", "111-copy.pdf": b"exam", "spec.pdf": b"spec"})}
            exec(self.upload_code(), namespace)
            self.assertEqual(namespace["reference"], w.ngrams(sentence))
            metadata = namespace["reference_metadata"]
            self.assertEqual(metadata["uploaded_document_count"], 3)
            self.assertEqual(metadata["unique_document_count"], 2)
            self.assertNotIn(sentence, json.dumps(metadata))
            self.assertEqual(sorted(path.name for path in Path(directory).iterdir()), ["reference_pdfs"])

    def test_run_lock_and_candidate_export_reference_metadata_without_pdf_or_text(self):
        sentence = "Students should protect the river by reducing waste at school."
        pdf_content = b"fake-pdf-source-content-test-only"
        reader = Mock(return_value=SimpleNamespace(pages=[SimpleNamespace(extract_text=lambda: sentence)]))
        with tempfile.TemporaryDirectory() as directory, patch.dict(sys.modules, {"pypdf": SimpleNamespace(PdfReader=reader)}):
            run_dir = Path(directory)
            namespace = {"RUN_DIR": run_dir, "Path": Path, "workflow": w, "UPLOAD_REFERENCE_PDF": True,
                         "files": SimpleNamespace(upload=lambda: {"115-spec.pdf": pdf_content})}
            exec(self.upload_code(), namespace)
            namespace.update(lock={}, BASE_REPO_SHA="a" * 40, METHOD="lora", INITIALIZATION="standard",
                             DEMO_MODE=True, records=[record()])
            update = next(node for node in self.builder_cell("lock = workflow.lock_model_revision")
                          if isinstance(node, ast.Expr) and isinstance(node.value, ast.Call)
                          and isinstance(node.value.func, ast.Attribute) and node.value.func.attr == "update")
            exec(compile(ast.Module(body=[update], type_ignores=[]), "run-lock-update", "exec"), namespace)
            self.assertEqual(namespace["lock"]["reference_index"], namespace["reference_metadata"])
            w.write_json(run_dir / "run_lock.json", namespace["lock"])
            artifact = run_dir / "browser_model"
            artifact.mkdir()
            zip_path = w.package_candidate(artifact, run_dir)
            with zipfile.ZipFile(zip_path) as candidate:
                self.assertEqual(candidate.namelist(), ["run_lock.json"])
                saved = candidate.read("run_lock.json")
                self.assertNotIn(pdf_content, saved)
                self.assertNotIn(sentence.encode(), saved)
                self.assertEqual(json.loads(saved)["reference_index"]["documents"][0]["filename"], "115-spec.pdf")
            self.assertTrue((run_dir / "reference_pdfs/115-spec.pdf").exists())

    def test_notebook_rejects_empty_mixed_and_empty_content_uploads(self):
        for uploads in ({}, {"111.pdf": b"pdf", "notes.txt": b"text"}, {"111.pdf": b""}):
            with self.subTest(uploads=uploads), tempfile.TemporaryDirectory() as directory:
                namespace = {"RUN_DIR": Path(directory), "Path": Path, "workflow": w,
                             "UPLOAD_REFERENCE_PDF": True, "files": SimpleNamespace(upload=lambda: uploads)}
                with self.assertRaises(ValueError):
                    exec(self.upload_code(), namespace)
                self.assertEqual(list(Path(directory).iterdir()), [])

    def test_no_upload_is_explicitly_unchecked(self):
        namespace = {"UPLOAD_REFERENCE_PDF": False}
        exec(self.upload_code(), namespace)
        self.assertIsNone(namespace["reference"])
        self.assertIsNone(namespace["reference_metadata"])


class NotebookTests(unittest.TestCase):
    def test_notebook_cells_compile_and_embed_current_sources(self):
        notebook = json.loads((ROOT / "colab/gsat_danube_colab.ipynb").read_text(encoding="utf-8"))
        code_cells = [cell["source"] for cell in notebook["cells"] if cell["cell_type"] == "code"]
        for number, source in enumerate(code_cells): compile(source, f"cell-{number}", "exec")
        embedded_cell = next(source for source in code_cells if source.startswith("EMBEDDED_FILES ="))
        embedded = ast.literal_eval(ast.parse(embedded_cell).body[0].value)
        for filename, source in embedded.items():
            path = ROOT / "colab" / ("data" if filename.endswith(".jsonl") else "") / filename
            self.assertEqual(source, path.read_text(encoding="utf-8"), f"Rebuild notebook after changing {filename}")
        combined = "\n".join(code_cells)
        self.assertNotIn("push_to_hub", combined)
        self.assertNotIn("upload_folder", combined)
        self.assertIn("workflow.evaluate_q4", combined)
        self.assertIn("files.download(zip_path)", combined)


if __name__ == "__main__":
    unittest.main()
