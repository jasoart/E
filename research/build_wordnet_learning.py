"""Extract vocabulary-specific WordNet 3.1 sense candidates for the V2 notebook.

The source corpus is a local build-time input, never a production dependency.
Install wordnet-db@3.1.14 and pass its dict directory via --dict-dir.
"""

import argparse
import json
import re
import subprocess
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets/data/wordnet-learning.json"
NOTICE = ROOT / "assets/data/wordnet.NOTICE.txt"
POS_FILES = {"n": "noun", "v": "verb", "a": "adj", "r": "adv"}
POS_LABELS = {"n": "n.", "v": "v.", "a": "adj.", "r": "adv."}
LIMITS = {"n": 3, "v": 3, "a": 2, "r": 2}


def vocabulary():
    script = """const fs=require('fs'),vm=require('vm');let c=vm.createContext({});
vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),c);
console.log(JSON.stringify(vm.runInContext('VOCABULARY.map(x=>({word:x.word,partOfSpeech:x.partOfSpeech}))',c)));"""
    rows = json.loads(subprocess.check_output(
        ["node", "-e", script, str(ROOT / "assets/data/vocabulary.js")], text=True
    ))
    extras = json.loads((ROOT / "research/exam_notebook.json").read_text(encoding="utf-8"))["supplemental"]
    seen = {row["word"] for row in rows}
    rows.extend({"word": row["word"], "partOfSpeech": row["partOfSpeech"]}
                for row in extras if row["word"] not in seen)
    return rows


def aliases(word):
    parts = [word.lower().replace("’", "'")]
    if word == "neither adj./adv./pron./":
        parts.append("neither")
    if word == "sportsman/sportswoma n":
        parts.append("sportswoman")
    for part in word.lower().split("/"):
        part = part.strip()
        match = re.fullmatch(r"([^()]+)\(([^)]+)\)", part)
        if match:
            parts.append(match[1].strip())
            parts.extend(v.strip() for v in match[2].split(",") if "," in match[2])
            if "," not in match[2]:
                parts.append("argument" if part == "argue(argument)" else match[1] + match[2])
        elif re.fullmatch(r"[a-z]+(?:[-'][a-z]+)*(?: [a-z]+)*", part):
            parts.append(part)
    return list(dict.fromkeys(part.replace(" ", "_") for part in parts))


def parse_index(directory, wanted):
    result = defaultdict(list)
    offsets = defaultdict(set)
    for pos, suffix in POS_FILES.items():
        for line in (directory / ("index." + suffix)).open(encoding="latin-1"):
            if line.startswith(" "):
                continue
            bits = line.split()
            if len(bits) < 7 or bits[0] not in wanted:
                continue
            pointer_count = int(bits[3])
            synsets = bits[6 + pointer_count:]
            if len(synsets) != int(bits[2]):
                raise ValueError(f"Invalid WordNet index entry: {bits[0]}")
            result[(bits[0], pos)] = synsets
            offsets[pos].update(synsets)
    return result, offsets


def parse_data(line):
    head, _, gloss = line.partition(" | ")
    bits = head.split()
    if len(bits) < 5:
        raise ValueError("Incomplete WordNet synset")
    word_count = int(bits[3], 16)
    words = [bits[4 + i * 2].replace("_", " ") for i in range(word_count)]
    pointer_start = 4 + word_count * 2
    pointer_count = int(bits[pointer_start])
    pointers = [bits[pointer_start + 1 + i * 4:pointer_start + 5 + i * 4]
                for i in range(pointer_count)]
    definition = re.split(r';\s*"', gloss, maxsplit=1)[0].strip().rstrip(" ;")
    return {"words": words, "pointers": pointers, "definition": definition}


def load_synsets(directory, offsets):
    parsed = {}
    for pos, suffix in POS_FILES.items():
        for line in (directory / ("data." + suffix)).open(encoding="latin-1"):
            if len(line) < 9 or not line[:8].isdigit():
                continue
            offset = line[:8]
            if offset in offsets[pos]:
                parsed[(pos, offset)] = parse_data(line)
    # Follow only explicit lexical derivation pointers from selected synsets.
    extra = defaultdict(set)
    for (pos, _), synset in parsed.items():
        for pointer in synset["pointers"]:
            if pointer[0] == "+" and pointer[3] != "0000":
                extra["a" if pointer[2] == "s" else pointer[2]].add(pointer[1])
    for pos, suffix in POS_FILES.items():
        for line in (directory / ("data." + suffix)).open(encoding="latin-1"):
            if line[:8] in extra[pos] and (pos, line[:8]) not in parsed:
                parsed[(pos, line[:8])] = parse_data(line)
    return parsed


def build(directory):
    rows = vocabulary()
    wanted = {alias for row in rows for alias in aliases(row["word"])}
    index, offsets = parse_index(directory, wanted)
    synsets = load_synsets(directory, offsets)
    entries = {}
    for entry in rows:
        forms = aliases(entry["word"])
        seen_senses, seen_family = set(), set()
        senses, family = [], []
        for pos in POS_FILES:
            count = 0
            for form in forms:
                for offset in index.get((form, pos), []):
                    if count >= LIMITS[pos] or (pos, offset) in seen_senses:
                        continue
                    synset = synsets.get((pos, offset))
                    if not synset or not synset["definition"]:
                        continue
                    seen_senses.add((pos, offset))
                    count += 1
                    others = [word for word in synset["words"] if word.lower().replace(" ", "_") not in forms]
                    senses.append({"pos": POS_LABELS[pos], "gloss": synset["definition"],
                                   "synonyms": list(dict.fromkeys(others))[:3]})
                    for pointer in synset["pointers"]:
                        if pointer[0] != "+" or pointer[3] == "0000":
                            continue
                        source, target = int(pointer[3][:2], 16), int(pointer[3][2:], 16)
                        if source < 1 or source > len(synset["words"]):
                            continue
                        if synset["words"][source-1].lower().replace(" ", "_") not in forms:
                            continue
                        target_pos = "a" if pointer[2] == "s" else pointer[2]
                        related = synsets.get((target_pos, pointer[1]))
                        if not related or target < 1 or target > len(related["words"]):
                            continue
                        word = related["words"][target-1]
                        if word.lower().replace(" ", "_") in forms or word.lower() in seen_family:
                            continue
                        seen_family.add(word.lower())
                        family.append({"word": word, "pos": POS_LABELS[target_pos]})
        if senses:
            entries[entry["word"]] = {"senses": senses[:8], "family": family[:6]}
    stats = {"listedWords": len(rows), "coveredWords": len(entries),
             "senses": sum(len(row["senses"]) for row in entries.values()),
             "synonymCandidates": sum(sum(len(s["synonyms"]) for s in row["senses"]) for row in entries.values()),
             "derivedForms": sum(len(row["family"]) for row in entries.values())}
    return {"version": 1, "source": "Princeton WordNet 3.1", "package": "wordnet-db@3.1.14",
            "sourceUrl": "https://wordnet.princeton.edu/", "stats": stats, "entries": entries}


def notice(directory):
    lines = []
    for line in (directory / "index.noun").open(encoding="latin-1"):
        if not line.startswith(" "):
            break
        lines.append(re.sub(r"^\s*\d+\s", "", line).rstrip())
    return "Princeton WordNet 3.1 (excerpted for vocabulary learning)\n\n" + "\n".join(lines).strip() + "\n"


def validate_snapshot(payload):
    ids = {row["word"] for row in vocabulary()}
    entries = payload.get("entries", {})
    stats = payload.get("stats", {})
    if payload.get("version") != 1 or payload.get("source") != "Princeton WordNet 3.1":
        raise ValueError("Unexpected WordNet extract version/source")
    if not entries or not set(entries).issubset(ids) or stats.get("listedWords") != len(ids):
        raise ValueError("WordNet extract IDs/count differ from the original vocabulary")
    for word, row in entries.items():
        if not row.get("senses") or len(row["senses"]) > 8:
            raise ValueError(f"Invalid sense selection: {word}")
        if any(s["pos"] not in POS_LABELS.values() or not s["gloss"] for s in row["senses"]):
            raise ValueError(f"Invalid sense: {word}")
    if stats != {"listedWords": len(ids), "coveredWords": len(entries),
                 "senses": sum(len(row["senses"]) for row in entries.values()),
                 "synonymCandidates": sum(sum(len(s["synonyms"]) for s in row["senses"]) for row in entries.values()),
                 "derivedForms": sum(len(row["family"]) for row in entries.values())}:
        raise ValueError("WordNet extract statistics differ from its content")
    if "WordNet 3.1 Copyright 2011 by Princeton University" not in NOTICE.read_text(encoding="utf-8"):
        raise ValueError("WordNet 3.1 attribution is missing")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dict-dir", type=Path, help="wordnet-db@3.1.14/dict")
    parser.add_argument("--check", action="store_true", help="verify committed extract")
    args = parser.parse_args()
    if not args.check and not args.dict_dir:
        parser.error("--dict-dir is required to build the extract")
    if args.check:
        committed = json.loads(OUTPUT.read_text(encoding="utf-8"))
        validate_snapshot(committed)
        if args.dict_dir and (committed != build(args.dict_dir) or NOTICE.read_text(encoding="utf-8") != notice(args.dict_dir)):
            raise ValueError("Committed WordNet extract differs from source corpus")
        print(f"WordNet extract OK: {committed['stats']}")
        return
    OUTPUT.write_text(json.dumps(build(args.dict_dir), ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    NOTICE.write_text(notice(args.dict_dir), encoding="utf-8")
    main_check = json.loads(OUTPUT.read_text(encoding="utf-8"))
    validate_snapshot(main_check)
    print(f"Built WordNet extract: {main_check['stats']}")


if __name__ == "__main__":
    main()
