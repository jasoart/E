"""Verify additive data provenance, exact IDs and useful import failure modes."""
import importlib.util
import json
from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("build_builtin_study", ROOT / "tools/build_builtin_study.py")
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)


class BuiltinStudyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        script = "const fs=require('fs'),vm=require('vm'),c=vm.createContext({});for(const f of ['vocabulary.js','builtin-study.js'])vm.runInContext(fs.readFileSync(process.argv[1]+'/assets/data/'+f,'utf8'),c);console.log(JSON.stringify(vm.runInContext('({vocabulary:VOCABULARY,study:BUILTIN_STUDY_DATA})',c)));"
        result = subprocess.run(["node", "-e", script, str(ROOT)], check=True, capture_output=True, text=True)
        cls.data = json.loads(result.stdout)

    def test_all_original_exact_ids_have_bilingual_examples(self):
        vocabulary, study = self.data["vocabulary"], self.data["study"]
        self.assertEqual(len(vocabulary), 6012)
        self.assertEqual(set(study["entries"]), {row["word"] for row in vocabulary})
        for original in vocabulary:
            with self.subTest(word=original["word"]):
                self.assertTrue(original["meaning"])
                row = study["entries"][original["word"]]
                self.assertTrue(row["plainMeaning"])
                self.assertGreaterEqual(len(row["examples"]), 2)
                self.assertTrue(all(example["text"] and example["translationZh"] for example in row["examples"]))
                self.assertTrue(all(BUILDER.has_target(example["text"], original["word"]) for example in row["examples"]))
                self.assertTrue(all(example["source"] in {"uploaded-anki", "self-authored"} for example in row["examples"]))

    def test_source_counts_and_no_private_paths(self):
        study = self.data["study"]
        counts = {}
        for row in study["entries"].values():
            for example in row["examples"]:
                counts[example["source"]] = counts.get(example["source"], 0) + 1
        self.assertEqual(counts, study["sourceSummary"]["examplesBySource"])
        self.assertEqual(sum(counts.values()), study["sourceSummary"]["exampleCount"])
        self.assertEqual(study["sourceSummary"]["missingEntries"], [])
        self.assertNotIn("/workspace/attachments", json.dumps(study))

    def test_self_authored_examples_come_from_author_override_files(self):
        authored = set()
        for path in (ROOT / "colab/data").glob("builtin_overrides_*.json"):
            for word, row in json.loads(path.read_text()).items():
                authored.update((word, example["text"], example["translationZh"]) for example in row.get("examples", []))
        for word, row in self.data["study"]["entries"].items():
            for example in row["examples"]:
                if example["source"] == "self-authored":
                    self.assertIn((word, example["text"], example["translationZh"]), authored)

    def test_aliases_are_explicit_and_keep_original_exact_id(self):
        self.assertIn("achievement", BUILDER.aliases("achieve(ment)"))
        self.assertIn("actress", BUILDER.aliases("actor/actress"))
        self.assertNotIn("abandonment", BUILDER.aliases("abandon"))
        self.assertIn("neither adj./adv./pron./", self.data["study"]["entries"])

    def test_html_is_plain_text_and_scripts_are_not_executed(self):
        self.assertEqual(BUILDER.text('<b>hello</b><br>world<script>alert(1)</script>'), "hello world")

    def test_missing_examples_are_reported_and_wrong_provenance_is_rejected(self):
        vocabulary = [{"word": "unknown", "meaning": "原意"}]
        data, flags = BUILDER.build([], vocabulary, {})
        self.assertEqual(data["sourceSummary"]["missingEntries"], ["unknown"])
        self.assertEqual(data["entries"]["unknown"]["plainMeaning"], "原意")
        with self.assertRaises(ValueError):
            BUILDER.build([], vocabulary, {"unknown": {"examples": [{"source": "uploaded-anki", "text": "x", "translationZh": "y"}]}})

    def test_target_check_handles_inflections_without_substring_matches(self):
        self.assertTrue(BUILDER.has_target("They abandoned the house.", "abandon"))
        self.assertTrue(BUILDER.has_target("Children need clean water.", "child"))
        self.assertFalse(BUILDER.has_target("Their grandmother smiled.", "mother"))
        self.assertFalse(BUILDER.has_target("Biodiversity supports ecosystems.", "diversity"))
        self.assertTrue(BUILDER.has_target("She is a sportswoman.", "sportsman/sportswoma n"))

    def test_related_word_examples_do_not_count_as_main_examples(self):
        vocabulary = [{"word": "diversity", "meaning": "多樣性"}]
        notes = [{"Word": "diversity", "meaningZh": "多樣性", "rowid": 1, "examples": [
            {"text": "Diversity helps us learn.", "translationZh": "多樣性有助我們學習。"},
            {"text": "Biodiversity supports ecosystems.", "translationZh": "生物多樣性支持生態系。"}]}]
        data, flags = BUILDER.build(notes, vocabulary, {})
        self.assertEqual(len(data["entries"]["diversity"]["examples"]), 1)
        self.assertEqual(len(data["entries"]["diversity"]["familyExamples"]), 1)
        self.assertEqual(data["sourceSummary"]["missingEntries"], ["diversity"])


if __name__ == "__main__":
    unittest.main()
