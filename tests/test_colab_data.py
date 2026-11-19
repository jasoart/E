"""Cross-check original training seeds against this checkout's restored curriculum."""
import json
from pathlib import Path
import re
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
TOKENS = re.compile(r"[A-Za-z]+(?:[-'’][A-Za-z]+)*")


class CurriculumDataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "curriculum.json"
            subprocess.run(["node", str(ROOT / "colab/export_curriculum.cjs"), str(target)], check=True, capture_output=True)
            cls.curriculum = json.loads(target.read_text(encoding="utf-8"))

    def test_restored_lexicon_keeps_compact_word_aliases(self):
        self.assertEqual(len(self.curriculum["vocabulary"]), 6012)
        self.assertEqual(self.curriculum["pattern_count"], 2500)
        for word in ["improve", "development", "encourage", "satisfy", "achieve"]:
            self.assertIn(self.curriculum["lexical_levels"][word], range(1, 7))

    def test_original_seeds_have_valid_target_length_and_levels(self):
        ids, sentences = set(), set()
        paths = sorted((ROOT / "colab/data").glob("*examples*.jsonl"))
        self.assertGreaterEqual(len(paths), 2)
        count = 0
        for path in paths:
            for line in path.read_text(encoding="utf-8").splitlines():
                row = json.loads(line)
                with self.subTest(file=path.name, example=row["id"]):
                    self.assertNotIn(row["id"], ids)
                    ids.add(row["id"])
                    tokens = [token.lower().replace("’", "'") for token in TOKENS.findall(row["sentence"])]
                    sentence = " ".join(tokens)
                    self.assertNotIn(sentence, sentences)
                    sentences.add(sentence)
                    self.assertGreaterEqual(len(tokens), 8)
                    self.assertLessEqual(len(tokens), 24)
                    self.assertTrue(any(form.lower() in tokens for form in row["target_forms"]))
                    base = "satisfy" if row["target_word"] == "satisfied" else row["target_word"]
                    self.assertEqual(row["level"], self.curriculum["lexical_levels"][base])
                    self.assertEqual(row["license"], "CC0-1.0")
                    self.assertTrue(row["source"].startswith("self-authored"))
                    count += 1
        self.assertGreaterEqual(count, 120)


if __name__ == "__main__":
    unittest.main()
