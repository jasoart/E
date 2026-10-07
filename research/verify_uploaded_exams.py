"""Verify the short GSAT evidence excerpts against locally supplied question PDFs.

Requires the Poppler ``pdftotext`` executable. No third-party Python package is
needed. Original question papers are read locally and are never copied into the
repository. A nonzero exit code reports an identity, page, or quotation mismatch.

Example:
    python research/verify_uploaded_exams.py --pdf-dir /workspace/attachments
"""

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys


DEFAULT_EVIDENCE = Path(__file__).resolve().parents[1] / "assets/data/exam-evidence.json"


def normalize(text):
    """Normalize layout whitespace only; preserve wording and punctuation."""
    return re.sub(r"\s+", " ", text).strip()


def identify_pdfs(pdf_dir, sources):
    expected = {source["sha256"]: source for source in sources}
    found = {}
    for path in sorted(pdf_dir.rglob("*.pdf")):
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest in expected:
            found[expected[digest]["year"]] = path
    missing = [source["fileName"] for source in sources if source["year"] not in found]
    if missing:
        raise ValueError("Missing PDFs with the recorded SHA-256: " + ", ".join(missing))
    return found


def read_page(path, page):
    result = subprocess.run(
        ["pdftotext", "-layout", "-f", str(page), "-l", str(page), str(path), "-"],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return result.stdout


def verify(evidence, pdf_dir, extract_dir=None):
    if not shutil.which("pdftotext"):
        raise ValueError("Install Poppler's pdftotext before running this verification.")
    paths = identify_pdfs(pdf_dir, evidence["sources"])
    pages = {}
    for source in evidence["sources"]:
        year = source["year"]
        for page in range(1, source["pdf_pages"] + 1):
            raw = read_page(paths[year], page)
            pages[year, page] = normalize(raw)
            if extract_dir:
                extract_dir.mkdir(parents=True, exist_ok=True)
                (extract_dir / f"{year}-p{page:02}.txt").write_text(raw, encoding="utf-8")

    failures = []
    ids = set()
    sources_by_year = {source["year"]: source for source in evidence["sources"]}
    for record in evidence["records"]:
        rid = record["id"]
        if rid in ids:
            failures.append(f"{rid}: duplicate ID")
        ids.add(rid)
        if record["printedPage"] + 1 != record["pdfPage"]:
            failures.append(f"{rid}: cover-page offset does not match the source paper")
        if record["filename"] != sources_by_year[record["year"]]["fileName"]:
            failures.append(f"{rid}: source file label mismatch")
        page = pages.get((record["year"], record["pdfPage"]), "")
        excerpt = normalize(record["excerpt"])
        if excerpt not in page:
            failures.append(f"{rid}: excerpt not found verbatim on its cited PDF page")
        if normalize(record["pattern"]).casefold() not in excerpt.casefold():
            failures.append(f"{rid}: exact pattern is not contained in the excerpt")
        if record["officialAnswerVerified"] is not False:
            failures.append(f"{rid}: question-paper evidence cannot verify an official answer key")
        if record["sourceKind"] == "option" and not record.get("optionLabel"):
            failures.append(f"{rid}: option label required")

    for claim in evidence["verifiedClaims"]:
        page = pages.get((claim["year"], claim["pdfPage"]), "")
        for item in claim["evidence"]:
            if normalize(item["text"]) not in page:
                failures.append(f"{claim['id']}: {item['sourceKind']} excerpt not found on cited page")

    if evidence["verification"]["entryCount"] != len(evidence["records"]):
        failures.append("verification.entryCount does not match the records array")
    if evidence["verification"]["officialAnswerKeysIncluded"] is not False:
        failures.append("This set includes question papers only, without official answer keys")
    if failures:
        raise ValueError("\n".join(failures))
    return {
        "pdfCount": len(paths),
        "verifiedRecords": len(evidence["records"]),
        "verifiedClaims": len(evidence["verifiedClaims"]),
        "recordsPerYear": dict(sorted(Counter(r["year"] for r in evidence["records"]).items())),
        "officialAnswerKeysIncluded": False,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdf-dir", type=Path, required=True, help="Recursively search this local directory")
    parser.add_argument("--evidence", type=Path, default=DEFAULT_EVIDENCE)
    parser.add_argument("--extract-dir", type=Path, help="Optional local folder for page text; keep outside the repository")
    args = parser.parse_args()
    try:
        data = json.loads(args.evidence.read_text(encoding="utf-8"))
        result = verify(data, args.pdf_dir, args.extract_dir)
    except (ValueError, OSError, KeyError, subprocess.CalledProcessError) as error:
        print(f"Verification failed: {error}", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
