"""Analyze local uploaded GSAT references without publishing PDF text.

Input JSON: [{"id": "111", "path": "/local/exam.pdf"}, ...].
Requires pypdf and pdftotext. Output contains provenance/counts only.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import statistics
import subprocess
import tempfile

WORD = re.compile(r"[A-Za-z]+(?:[-'’][A-Za-z]+)*")


def lexical_stem_metrics(text):
    """Ten lexical-question stems, not all reading-passage sentences.

    The blank is counted as one word even when PDF extraction loses underscores.
    Numerals are excluded. Hyphenated words and contractions count as one.
    A question can contain several sentences; do not interpret as sentence lengths.
    """
    matches = list(re.finditer(r"(?m)^\s*([1-9]|10)\.\s+", text))[:10]
    if [int(match.group(1)) for match in matches] != list(range(1, 11)):
        raise ValueError("Cannot reliably identify the first ten lexical questions")
    rows = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index < 9 else len(text)
        segment = text[match.end():end]
        boundary = re.search(r"\(\s*A\s*\)", segment)
        if not boundary:
            raise ValueError(f"Missing option boundary at question {index + 1}")
        stem = segment[:boundary.start()]
        if len(stem) > 1200 or not WORD.findall(stem):
            raise ValueError(f"Ambiguous extraction at question {index + 1}")
        rows.append({"question": index + 1, "printed_page": 1, "pdf_page": 2,
                     "english_token_count_with_one_blank": len(WORD.findall(stem)) + 1})
    counts = [row["english_token_count_with_one_blank"] for row in rows]
    return {"sample_count": len(rows), "min": min(counts), "median": statistics.median(counts),
            "max": max(counts), "above_24_tokens": sum(count > 24 for count in counts), "questions": rows}


def analyze(sources):
    from pypdf import PdfReader

    documents = []
    for source in sources:
        path = Path(source["path"])
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        reader = PdfReader(path)
        item = {"id": source["id"], "file_name": path.name, "sha256": digest,
                "pdf_pages": len(reader.pages),
                "kind": "exam" if source["id"] in {"111", "112", "113", "114", "115"} else "official_specification"}
        if item["kind"] == "exam":
            with tempfile.TemporaryDirectory() as directory:
                text_path = Path(directory) / "exam.txt"
                subprocess.run(["pdftotext", "-layout", str(path), str(text_path)], check=True)
                item["lexical_stem_sample"] = lexical_stem_metrics(text_path.read_text(encoding="utf-8"))
        documents.append(item)
    all_counts = [row["english_token_count_with_one_blank"] for document in documents
                  for row in document.get("lexical_stem_sample", {}).get("questions", [])]
    return {"schema_version": 1, "documents": documents,
            "total_pdf_pages": sum(item["pdf_pages"] for item in documents),
            "method": "First ten lexical-question stems per year; English regex tokens + one blank; numerals excluded; a stem may contain multiple sentences. Not official sentence difficulty or all-exam statistics.",
            "lexical_stem_summary": {"count": len(all_counts), "min": min(all_counts),
                                     "median": statistics.median(all_counts), "max": max(all_counts),
                                     "above_24_tokens": sum(count > 24 for count in all_counts)}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sources", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = analyze(json.loads(args.sources.read_text(encoding="utf-8")))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result["lexical_stem_summary"], ensure_ascii=False))


if __name__ == "__main__":
    main()
