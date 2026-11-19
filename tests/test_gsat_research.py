"""Keep lexical-question sampling separate from option/PDF noise."""
import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "research/analyze_exam_references.py"
SPEC = importlib.util.spec_from_file_location("exam_reference_analysis", SCRIPT)
analysis = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(analysis)


def exam_text(stem="Students use _____ tools when they build a model together."):
    return "Cover and instructions\n" + "\n".join(
        f"{number}. {stem}\n(A) irrelevant distractor text with many extra words\n(B) item\n"
        for number in range(1, 11)
    )


class ResearchSamplingTests(unittest.TestCase):
    def test_answer_options_do_not_change_stem_counts(self):
        result = analysis.lexical_stem_metrics(exam_text())
        self.assertEqual(result["sample_count"], 10)
        self.assertEqual(result["min"], 10)
        changed = exam_text().replace("irrelevant distractor text with many extra words", "short")
        self.assertEqual(result, analysis.lexical_stem_metrics(changed))

    def test_lost_blank_underscores_do_not_drop_answer_token(self):
        underscored = analysis.lexical_stem_metrics(exam_text())
        spaces = analysis.lexical_stem_metrics(exam_text().replace("_____", "          "))
        self.assertEqual(underscored, spaces)

    def test_missing_question_or_option_fails_instead_of_inventing_stats(self):
        for text in [exam_text().replace("10.", "No number."), exam_text().replace("(A)", "[choice]")]:
            with self.assertRaises(ValueError):
                analysis.lexical_stem_metrics(text)


if __name__ == "__main__":
    unittest.main()
