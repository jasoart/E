#!/usr/bin/env python3
"""Prepare attributed English–Chinese reference pairs for the local index.

Input: ManyThings' cmn.txt (English, Chinese, attribution; tab-separated).
OpenCC dictionary text files are used for a simple longest-match character/phrase
conversion. Both the supplied Chinese and the adapted text are retained.
"""
import argparse
import csv
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
WORDS = re.compile(r"[A-Za-z]+(?:[-'][A-Za-z]+)*")
CREDIT = re.compile(r"^CC-BY 2\.0 \(France\) Attribution: tatoeba\.org #(\d+) \(([^)]+)\) & #(\d+) \(([^)]+)\)$")


def read_mapping(directory, filenames):
    mapping = {}
    for filename in filenames:
        for line in (directory / filename).read_text(encoding="utf8").splitlines():
            if not line or line.startswith("#"):
                continue
            key, values = line.split("\t", 1)
            mapping[key] = values.split(" ")[0]
    return mapping, max(map(len, mapping))


def convert(text, mapping, max_length):
    result = []
    i = 0
    while i < len(text):
        for width in range(min(max_length, len(text) - i), 0, -1):
            key = text[i:i + width]
            if key in mapping:
                result.append(mapping[key])
                i += width
                break
        else:
            result.append(text[i])
            i += 1
    return "".join(result)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--opencc-directory", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=ROOT / "research/tatoeba-sentence-pairs.json")
    args = parser.parse_args()
    mapping, max_length = read_mapping(args.opencc_directory, ("STCharacters.txt", "STPhrases.txt"))
    variants, variants_max = read_mapping(args.opencc_directory, ("TWVariants.txt", "TWVariantsPhrases.txt"))
    pairs = {}
    with args.source.open(encoding="utf8", newline="") as f:
        for row in csv.reader(f, delimiter="\t"):
            if len(row) != 3:
                continue
            english, original, credit = (field.strip() for field in row)
            match = CREDIT.fullmatch(credit)
            count = len(WORDS.findall(english))
            if not match or not 9 <= count <= 30 or not re.search(r"[\u4e00-\u9fff]", original):
                continue
            if not re.match(r"^[A-Z\"']", english) or not re.search(r"[.!?][\"']?$", english):
                continue
            traditional = convert(convert(original, mapping, max_length), variants, variants_max)
            en_id, en_author, zh_id, zh_author = match.groups()
            pair = {"text": english, "translationZh": traditional, "translationOriginal": original,
                    "enId": en_id, "enAuthor": en_author, "zhId": zh_id, "zhAuthor": zh_author}
            key = english.casefold()
            # Prefer a Chinese sentence that needed fewer script changes.
            changed = sum(a != b for a, b in zip(original, traditional)) + abs(len(original) - len(traditional))
            if key not in pairs or changed < pairs[key][0]:
                pairs[key] = (changed, pair)
    rows = [value[1] for value in pairs.values()]
    data = {"source": "Tatoeba, distributed by ManyThings; snapshot mirrored at JYRoy/TransformerEN2CN datasets/cmn.txt (blob a14124a158ff4ac6415aa77fd3aad1fb3cb5cd73)",
            "license": "CC BY 2.0 FR", "chineseConversion": "Two longest-match dictionary passes using OpenCC ST and Taiwan-variant dictionaries; original Chinese retained. This is not the full OpenCC segmentation algorithm.", "sentences": rows}
    args.output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(json.dumps({"uniqueEnglishSentences": len(rows), "convertedTranslations": sum(row["translationOriginal"] != row["translationZh"] for row in rows)}))


if __name__ == "__main__":
    main()
