"""Keep factual reading-body evidence distinct from questions and answer options."""
import copy
from collections import Counter
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("reading_corpus", ROOT / "research/extract_reading_corpus.py")
corpus = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(corpus)


class ReadingCorpusTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.loads((ROOT / "research/reading_corpus_manifest.json").read_text(encoding="utf-8"))

    def test_reviewed_anchors_exclude_headers_questions_and_options(self):
        page = """Header and reading directions
        Shared body starts with renewable energy.
        Families use solar panels in their homes.
        The body ends with local cooperation.
        35. Which option is correct?
        (A) irrelevant distractor (B) another option
        Page footer
        """
        segment = {"pdfPage": 6, "startAnchor": "Shared body starts", "endAnchor": "local cooperation."}
        body = corpus.slice_body(page, segment)
        self.assertEqual(body, "Shared body starts with renewable energy. Families use solar panels in their homes. The body ends with local cooperation.")
        forms = {row["form"] for row in corpus.surface_inventory(body, 6)}
        self.assertNotIn("Header", forms)
        self.assertNotIn("Which", forms)
        self.assertNotIn("distractor", forms)
        self.assertNotIn("footer", forms)

    def test_duplicate_missing_or_reversed_anchors_fail_instead_of_slicing_arbitrarily(self):
        for text, segment in [
            ("start body finish start", {"startAnchor": "start", "endAnchor": "finish"}),
            ("start body finish", {"startAnchor": "missing", "endAnchor": "finish"}),
            ("start body finish", {"startAnchor": "start", "endAnchor": "missing"}),
            ("finish body start", {"startAnchor": "start", "endAnchor": "finish"}),
        ]:
            with self.subTest(text=text, segment=segment):
                with self.assertRaises(ValueError):
                    corpus.slice_body(text, segment)

    def test_explicit_speaker_removal_and_tokenization_preserve_case_and_real_forms(self):
        page = "Heading\nBody begins here.\nUSER_NAME 10:30\nSolar solar solar-panel workers’\nBody ends here.\nQuestions"
        body = corpus.slice_body(page, {"startAnchor":"Body begins", "endAnchor":"Body ends here.", "removeLines":["USER_NAME 10:30"]})
        rows = corpus.surface_inventory(body, 10)
        counts = {row["form"]:row["count"] for row in rows}
        self.assertNotIn("USER", counts)
        self.assertEqual(counts["Solar"], 1)
        self.assertEqual(counts["solar"], 1)
        self.assertEqual(counts["solar-panel"], 1)
        self.assertEqual(counts["workers"], 1)
        self.assertTrue(all(row["pdfPage"] == 10 for row in rows))
        self.assertEqual(corpus.surface_inventory("don’t don't don’t", 6), [{"form":"don't","pdfPage":6,"count":3}])
        self.assertEqual(corpus.normalize_text("solar-\n panel   systems"), "solar-panel systems")

    def test_five_original_sources_and_twenty_five_reviewed_body_groups_are_complete(self):
        summary = corpus.validate_manifest(self.manifest)
        self.assertEqual((summary["sources"],summary["passages"],summary["readingPassages"],summary["mixedPassages"],summary["structurePassages"]), (5,25,15,5,5))
        self.assertEqual(len(self.manifest["sources"]), 5)
        expected_hashes = {
            111:"5877adb44710601bd1e9580e063d00f702acd7229a0fa97425290fe90044c358",
            112:"79f8f0a5822b9fbdc424cccbf88fdff124c80b9cf0bd8a56913901cd1bb0f741",
            113:"09d35c2ed8561e0845dbbe305e12f5342b27f209fb44d801ff7f9f1f9e519ecf",
            114:"51c8d9f7c2715adf74cae808bde4906cfadee19d0ec379df3b33881c35960a78",
            115:"e5a644f0133482a86f0befb3dfd9aaa2161be2685a00620950581db7ad6bc3f2",
        }
        self.assertEqual({row["year"]:row["sha256"] for row in self.manifest["sources"]}, expected_hashes)
        for year in range(111,116):
            passages = [row for row in self.manifest["passages"] if row["year"] == year]
            self.assertEqual({row["questionRange"] for row in passages if row["section"] == "reading"}, {"35-38","39-42","43-46"})
            self.assertEqual([row["questionRange"] for row in passages if row["section"] == "mixed"], ["47-49" if year == 111 else "47-50"])
            self.assertEqual([row["questionRange"] for row in passages if row["section"] == "structure"], ["31-34"])

    def test_public_manifest_contains_inventories_and_short_anchors_not_full_bodies(self):
        forbidden = {"text","body","fullText","rawText","pageText"}
        def inspect(value):
            if isinstance(value, dict):
                self.assertTrue(forbidden.isdisjoint(value), f"Full passage field present: {set(value) & forbidden}")
                for child in value.values():
                    inspect(child)
            elif isinstance(value, list):
                for child in value:
                    inspect(child)
        inspect(self.manifest)
        for passage in self.manifest["passages"]:
            counts = Counter((row["form"],row["pdfPage"]) for row in passage["tokens"])
            self.assertTrue(all(count == 1 for count in counts.values()))
            self.assertEqual(sum(row["count"] for row in passage["tokens"]), passage["tokenCount"])
            self.assertEqual(passage["printedPages"], [page-1 for page in passage["pdfPages"]])
            self.assertTrue(all(3 <= len(segment[anchor]) <= 160 for segment in passage["segments"] for anchor in ("startAnchor","endAnchor")))

    def test_corrupt_page_counts_and_inventory_records_are_rejected(self):
        cases = []
        def damaged(change):
            value = copy.deepcopy(self.manifest); change(value); cases.append(value)
        damaged(lambda value:value["sources"][0].update(pages=11))
        damaged(lambda value:value["passages"][0].update(printedPages=[99]))
        damaged(lambda value:value["passages"][0]["tokens"][0].update(count=True))
        damaged(lambda value:value["passages"][0]["tokens"][0].update(count=0))
        damaged(lambda value:value["passages"][0]["tokens"][0].update(pdfPage=12))
        damaged(lambda value:value["passages"][0]["tokens"].append(value["passages"][0]["tokens"][0].copy()))
        damaged(lambda value:value["passages"][0].update(section="answer-option"))
        damaged(lambda value:value["passages"].pop())
        for number, value in enumerate(cases):
            with self.subTest(number=number):
                with self.assertRaises(ValueError):
                    corpus.validate_manifest(value)


if __name__ == "__main__":
    unittest.main()
