#!/usr/bin/env python3
"""Audit the 111–115 reading-body inventories without publishing passage text.

CI can run ``--check`` using only the committed manifest. With ``--pdf-dir``,
PyMuPDF verifies source hashes, explicit body anchors and per-page inventories.
Full extracted bodies are optional private intermediates outside the repository.
"""
import argparse
from collections import Counter
import copy
import hashlib
import json
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "research" / "reading_corpus_manifest.json"
LATIN_WORD = re.compile(r"[A-Za-z\u00c0-\u024f]+(?:[-'][A-Za-z\u00c0-\u024f]+)*")


def normalize_text(text):
    """Unify compatibility characters and layout whitespace, not the wording."""
    text = unicodedata.normalize("NFKC", str(text))
    text = re.sub(r"(?<=[A-Za-z\u00c0-\u024f])-\s*\n\s*(?=[A-Za-z\u00c0-\u024f])", "-", text)
    return re.sub(r"\s+", " ", text).strip()


def slice_body(page_text, segment):
    """Select one explicitly reviewed span; exclude headers and answer material."""
    omitted = {normalize_text(line) for line in segment.get("removeLines", [])}
    lines = [line for line in page_text.splitlines() if normalize_text(line) not in omitted]
    text = normalize_text("\n".join(lines))
    start, end = normalize_text(segment["startAnchor"]), normalize_text(segment["endAnchor"])
    if not start or not end or text.count(start) != 1 or text.count(end) != 1:
        raise ValueError(f"Body anchors must each occur exactly once on PDF page {segment.get('pdfPage')}")
    first, last = text.index(start), text.index(end)
    if last < first:
        raise ValueError("Body end anchor precedes its start")
    return text[first:last + len(end)]


def surface_inventory(text, pdf_page):
    """Count normalized surface forms, keeping case for proper-name review."""
    normalized = unicodedata.normalize("NFKC", text).replace("’", "'").replace("‘", "'")
    normalized = normalized.replace("‐", "-").replace("‑", "-")
    counts = Counter(LATIN_WORD.findall(normalized))
    return [{"form": form, "pdfPage": pdf_page, "count": count}
            for form, count in sorted(counts.items(), key=lambda row: (row[0].casefold(), row[0]))]


def validate_manifest(data):
    if data.get("schemaVersion") != 1:
        raise ValueError("Unsupported corpus manifest schema")
    sources = {row["year"]: row for row in data["sources"]}
    if len(sources) != 5 or set(sources) != set(range(111, 116)):
        raise ValueError("Exactly the five 111–115 exam sources are required")
    topics = {row["id"] for row in data["topics"]}
    if len(topics) != len(data["topics"]) or not all(topics):
        raise ValueError("Topic IDs must be nonempty and unique")
    for source in sources.values():
        if source["pages"] != 12 or not re.fullmatch(r"[0-9a-f]{64}", source["sha256"]):
            raise ValueError("Invalid source page count or SHA-256")
    seen, by_year = set(), Counter()
    for passage in data["passages"]:
        pid, year = passage["id"], passage["year"]
        if pid in seen or year not in sources or passage["topicId"] not in topics:
            raise ValueError(f"Invalid or duplicated passage: {pid}")
        seen.add(pid)
        if passage["section"] not in {"reading", "mixed", "structure"}:
            raise ValueError(f"Unknown section: {pid}")
        by_year[year, passage["section"]] += 1
        pages = passage["pdfPages"]
        if not pages or pages != sorted(set(pages)) or any(type(page) is not int or not 1 <= page <= sources[year]["pages"] for page in pages):
            raise ValueError(f"Invalid body page list: {pid}")
        if passage["printedPages"] != [page - 1 for page in pages]:
            raise ValueError(f"Wrong cover-page offset: {pid}")
        if [segment["pdfPage"] for segment in passage["segments"]] != pages:
            raise ValueError(f"Segment and body pages differ: {pid}")
        for segment in passage["segments"]:
            if not all(isinstance(segment.get(key), str) and 3 <= len(segment[key]) <= 160 for key in ("startAnchor", "endAnchor")):
                raise ValueError(f"Missing or overlong identifying anchors: {pid}")
        if not re.fullmatch(r"[0-9a-f]{64}", passage["bodySha256"]):
            raise ValueError(f"Invalid normalized body hash: {pid}")
        keys = set()
        for token in passage["tokens"]:
            key = token["form"], token["pdfPage"]
            if key in keys or token["pdfPage"] not in pages or LATIN_WORD.fullmatch(token["form"]) is None:
                raise ValueError(f"Invalid or duplicate surface inventory row: {pid}")
            if type(token["count"]) is not int or token["count"] < 1:
                raise ValueError(f"Invalid surface count: {pid}")
            keys.add(key)
        expected = sorted(passage["tokens"], key=lambda row: (row["form"].casefold(), row["form"], row["pdfPage"]))
        if passage["tokens"] != expected or sum(row["count"] for row in passage["tokens"]) != passage["tokenCount"]:
            raise ValueError(f"Unsorted inventory or wrong total: {pid}")
        if not 100 <= passage["tokenCount"] <= 800:
            raise ValueError(f"Unexpected passage body size: {pid}")
    if len(seen) != 25 or any(by_year[year, section] != expected for year in sources
                              for section, expected in (("reading", 3), ("mixed", 1), ("structure", 1))):
        raise ValueError("Expected three reading groups, one mixed body and one structure body per year")
    return {"sources": len(sources), "passages": len(seen),
            "readingPassages": sum(row["section"] == "reading" for row in data["passages"]),
            "mixedPassages": sum(row["section"] == "mixed" for row in data["passages"]),
            "structurePassages": sum(row["section"] == "structure" for row in data["passages"]),
            "bodyTokens": sum(row["tokenCount"] for row in data["passages"])}


def extract_manifest(data, pdf_dir):
    import fitz  # Optional for CI's committed-inventory checks.

    expected = {row["sha256"]: row for row in data["sources"]}
    paths = {}
    for path in sorted(Path(pdf_dir).rglob("*.pdf")):
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest in expected:
            paths[expected[digest]["year"]] = path
    missing = [row["year"] for row in data["sources"] if row["year"] not in paths]
    if missing:
        raise ValueError(f"Missing PDFs with matching SHA-256 for years: {missing}")
    updated, bodies, page_text = copy.deepcopy(data), [], {}
    for year, path in paths.items():
        with fitz.open(path) as document:
            source = next(row for row in data["sources"] if row["year"] == year)
            if len(document) != source["pages"]:
                raise ValueError(f"PDF page count differs for {year}")
            for passage in (row for row in data["passages"] if row["year"] == year):
                for segment in passage["segments"]:
                    page = segment["pdfPage"]
                    # Content-stream order preserves the two-column narratives in
                    # these PDFs; sorting by y would interleave unrelated columns.
                    page_text[year, page] = document[page - 1].get_text(sort=False)
    for passage in updated["passages"]:
        segments, inventory = [], []
        for segment in passage["segments"]:
            body = slice_body(page_text[passage["year"], segment["pdfPage"]], segment)
            segments.append({"pdfPage": segment["pdfPage"], "text": body})
            inventory.extend(surface_inventory(body, segment["pdfPage"]))
        combined = "\n".join(row["text"] for row in segments)
        passage["tokens"] = sorted(inventory, key=lambda row: (row["form"].casefold(), row["form"], row["pdfPage"]))
        passage["tokenCount"] = sum(row["count"] for row in inventory)
        passage["bodySha256"] = hashlib.sha256(combined.encode("utf-8")).hexdigest()
        bodies.append({"id": passage["id"], "year": passage["year"], "section": passage["section"],
                       "questionRange": passage["questionRange"], "titleZh": passage["titleZh"],
                       "topicId": passage["topicId"], "segments": segments, "text": combined})
    validate_manifest(updated)
    return updated, bodies


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--pdf-dir", type=Path)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--output-bodies", type=Path, help="Private full text; must be outside the repository")
    args = parser.parse_args()
    try:
        data = json.loads(args.manifest.read_text(encoding="utf-8"))
        if args.output_bodies and (not args.pdf_dir or args.output_bodies.resolve().is_relative_to(ROOT)):
            raise ValueError("Private body output requires PDFs and a path outside the repository")
        if args.pdf_dir:
            updated, bodies = extract_manifest(data, args.pdf_dir)
            if args.check and updated != data:
                raise ValueError("Committed reading inventory differs from the uploaded PDF bodies")
            if not args.check:
                args.manifest.write_text(json.dumps(updated, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            data = updated
            if args.output_bodies:
                args.output_bodies.parent.mkdir(parents=True, exist_ok=True)
                args.output_bodies.write_text(json.dumps(bodies, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        result = validate_manifest(data)
        result["sourceVerification"] = "PDF hashes and body inventories verified" if args.pdf_dir else "committed inventory structure only; PDFs not supplied"
        print(json.dumps(result, ensure_ascii=False))
    except (KeyError, ValueError, OSError, ImportError) as error:
        parser.exit(1, f"Reading corpus audit failed: {error}\n")


if __name__ == "__main__":
    main()
