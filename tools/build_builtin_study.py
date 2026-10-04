#!/usr/bin/env python3
"""Build an additive offline study layer; never writes the original vocabulary."""
import argparse
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sqlite3
import tempfile
import zipfile
from collections import Counter, defaultdict


class TextOnly(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.ignored = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.ignored += 1
        if tag in ("br", "p", "div"):
            self.parts.append(" ")

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self.ignored:
            self.ignored -= 1
        if tag in ("p", "div"):
            self.parts.append(" ")

    def handle_data(self, data):
        if not self.ignored:
            self.parts.append(data)


def text(value):
    parser = TextOnly()
    parser.feed(str(value or ""))
    return re.sub(r"\s+", " ", html.unescape("".join(parser.parts))).strip()


def normalize(value):
    return re.sub(r"\s+", " ", text(value).replace("’", "'")).strip().casefold()


def aliases(word):
    """Expand only explicit slash/parenthesis variants, never fuzzy-match words."""
    result = {normalize(word)}
    for part in str(word).split("/"):
        part = part.strip()
        base = re.sub(r"\([^)]*\)", "", part).strip()
        if base:
            # Repair this one explicitly printed variant without renaming its ID.
            result.add("sportswoman" if normalize(base) == "sportswoma n" else normalize(base))
        for addition in re.findall(r"\(([^)]*)\)", part):
            for variant in addition.split(","):
                variant = variant.strip()
                if variant:
                    result.add(normalize(variant))
                    if "," not in addition:
                        result.add(normalize(base + variant))
    return sorted(result - {""})


def read_apkg(path):
    """Read the real collection only; never extract media or execute templates."""
    with zipfile.ZipFile(path) as archive:
        names = set(archive.namelist())
        chosen = next((name for name in ("collection.anki21", "collection.anki2") if name in names), None)
        if not chosen:
            raise ValueError("No uncompressed SQLite collection found. A zstd-only collection.anki21b needs a separately verified decompressor; this stdlib importer does not silently read its compatibility placeholder.")
        if "collection.anki21b" in names and "collection.anki21" not in names:
            raise ValueError("zstd collection.anki21b is not supported by this stdlib importer; do not use collection.anki2 as a substitute.")
        data = archive.read(chosen)
    if not data.startswith(b"SQLite format 3\x00"):
        raise ValueError("Collection is not an uncompressed SQLite database")
    notes = []
    with tempfile.TemporaryDirectory(prefix="anki-study-") as directory:
        database = Path(directory) / "collection.sqlite"
        database.write_bytes(data)
        connection = sqlite3.connect(database.as_uri() + "?mode=ro&immutable=1", uri=True)
        try:
            models = json.loads(connection.execute("SELECT models FROM col").fetchone()[0])
            for rowid, model_id, fields in connection.execute("SELECT id,mid,flds FROM notes ORDER BY id"):
                names = [field["name"] for field in sorted(models[str(model_id)]["flds"], key=lambda f: f["ord"])]
                values = dict(zip(names, (text(value) for value in fields.split("\x1f"))))
                required = {"Front", "Back", "vacabulary", "example", "sound", "memo", "memo翻譯"}
                if not required.issubset(values):
                    raise ValueError("Uploaded deck field schema differs; inspect its fields before importing")
                notes.append({"Word": values["Front"], "meaningZh": values["Back"], "pos": values["vacabulary"],
                              "rowid": rowid, "examples": [{"text": values["example"], "translationZh": values["sound"]},
                                                          {"text": values["memo"], "translationZh": values["memo翻譯"]}]})
        finally:
            connection.close()
    return notes


def teaching_labels(sentence):
    value = sentence.casefold()
    patterns = [
        (r"\beven though\b|\balthough\b", "although／even though 讓步子句", "先承認一項事實，再交代與預期不同的情況。"),
        (r"\bbecause\b", "because 原因子句", "用具體原因支持主句，檢查原因與結果是否合理。"),
        (r"\bunless\b", "unless 條件子句", "unless 表示『除非』；避免把條件誤讀成已發生的事實。"),
        (r"\bif\b", "if 引導子句（條件／是否需依上下文判讀）", "判斷 if 是提出條件，還是轉述『是否』。"),
        (r",\s*(?:who|which)\b", "逗號後 who／which 補充關係子句", "補充資訊與主句區分，並找出 who／which 的先行詞。"),
        (r"\bso that\b|\bin order to\b", "目的表達 so that／in order to", "說明行動目的，並區分目的與已實現的結果。"),
        (r"\b(?:before|after|when|while|until)\b", "時間／對比連接詞（功能需依上下文判讀）", "依事件順序判斷時態；while 也可能表示對比。"),
    ]
    for pattern, grammar, tip in patterns:
        if re.search(pattern, value):
            return grammar, tip
    return "句子結構未分類", "先確認主詞、動詞與目標詞的本句字義，再練習用不同情境改寫。"


IRREGULAR = {
    "be": "am is are was were been being", "have": "has had", "do": "does did done", "go": "goes went gone",
    "make": "made", "take": "took taken", "give": "gave given", "get": "got gotten", "come": "came", "see": "saw seen",
    "know": "knew known", "think": "thought", "find": "found", "write": "wrote written", "speak": "spoke spoken",
    "choose": "chose chosen", "lead": "led", "teach": "taught", "buy": "bought", "bring": "brought", "build": "built",
    "feel": "felt", "keep": "kept", "leave": "left", "meet": "met", "run": "ran", "say": "said", "send": "sent",
    "stand": "stood", "understand": "understood", "win": "won", "eat": "ate eaten", "drink": "drank drunk",
    "break": "broke broken", "hold": "held", "hear": "heard", "lose": "lost", "pay": "paid", "sell": "sold", "sit": "sat",
    "sleep": "slept", "spend": "spent", "swim": "swam swum", "fall": "fell fallen", "grow": "grew grown", "rise": "rose risen",
    "drive": "drove driven", "fly": "flew flown", "lie": "lay lain", "lay": "laid", "mislead": "misled", "catch": "caught",
    "fight": "fought", "seek": "sought", "throw": "threw thrown", "wear": "wore worn", "steal": "stole stolen", "freeze": "froze frozen",
    "shake": "shook shaken", "forget": "forgot forgotten", "forgive": "forgave forgiven", "begin": "began begun", "bite": "bit bitten",
    "child": "children", "person": "people", "man": "men", "woman": "women", "foot": "feet", "tooth": "teeth", "mouse": "mice",
    "good": "better best", "bad": "worse worst", "little": "less least", "many": "more most", "much": "more most",
    "arise": "arose arisen", "awake": "awoke awoken", "bear": "bore born borne", "become": "became", "bend": "bent",
    "bid": "bade bidden", "bind": "bound", "bleed": "bled", "blow": "blew blown", "cling": "clung", "creep": "crept",
    "criterion": "criteria", "deal": "dealt", "dig": "dug", "draw": "drew drawn", "flee": "fled", "forbid": "forbade forbidden",
    "forsake": "forsook forsaken", "fisherman": "fishermen", "freshman": "freshmen", "grind": "ground", "hang": "hung hanged",
    "hide": "hid hidden", "kneel": "knelt", "leaf": "leaves", "lend": "lent", "misunderstand": "misunderstood", "overcome": "overcame",
    "overhear": "overheard", "overtake": "overtook overtaken", "overthrow": "overthrew overthrown", "ox": "oxen", "ride": "rode ridden",
    "shine": "shone", "shoot": "shot", "shrink": "shrank shrunk", "sing": "sang sung", "sink": "sank sunk", "slide": "slid",
    "spin": "spun", "spit": "spat", "spring": "sprang sprung", "stick": "stuck", "sting": "stung", "stink": "stank stunk",
    "stride": "strode stridden", "strike": "struck stricken", "strive": "strove striven", "swear": "swore sworn", "sweep": "swept",
    "swing": "swung", "tear": "tore torn", "tell": "told", "undergo": "underwent undergone", "undertake": "undertook undertaken",
    "wake": "woke woken", "weep": "wept", "wind": "wound", "withdraw": "withdrew withdrawn", "withhold": "withheld",
}


def target_forms(word):
    result = set(aliases(word))
    if word == "neither adj./adv./pron./":
        result.add("neither")
    for base in list(result):
        result.update(IRREGULAR.get(base, "").split())
        if len(base) < 3:
            continue
        result.update((base + "s", base + "es", base + "er", base + "est", base + "'s"))
        result.add(base + ("d" if base.endswith("e") else "ed"))
        result.add((base[:-1] if base.endswith("e") and not base.endswith("ee") else base) + "ing")
        if re.search(r"[^aeiou]y$", base):
            result.update((base[:-1] + "ies", base[:-1] + "ied", base[:-1] + "ier", base[:-1] + "iest"))
        if base.endswith("ie"):
            result.add(base[:-2] + "ying")
        if re.search(r"[aeiou][bcdfgklmnprst]$", base):
            result.update(base + base[-1] + suffix for suffix in ("ed", "ing", "er", "est"))
        if base.endswith("c"):
            result.update((base + "ked", base + "king"))
    return result


def has_target(sentence, word):
    forms = target_forms(word)
    value = normalize(sentence)
    return any(re.search(r"(?<!\w)" + re.escape(form) + r"(?!\w)", value) for form in forms)


def build(notes, vocabulary, overrides):
    by_word = defaultdict(list)
    for note in notes:
        by_word[normalize(note["Word"])].append(note)
    entries = {}
    missing, exact_matches, alias_matches, questionable = [], 0, 0, []
    for original in vocabulary:
        word = original["word"]
        matched = []
        for key in aliases(word):
            matched.extend(by_word.get(key, []))
        matched = list({note["rowid"]: note for note in matched}.values())
        if normalize(word) in by_word:
            exact_matches += 1
            # Case distinguishes the month March from the verb/noun march.
            literal = [note for note in matched if note["Word"] == word]
            if literal:
                matched = literal
        elif matched:
            alias_matches += 1
        meanings = list(dict.fromkeys(note["meaningZh"] for note in matched if note["meaningZh"]))
        study = {"plainMeaning": "；".join(meanings) or text(original.get("meaning", "")),
                 "ankiMeaning": "；".join(meanings), "examples": [], "familyExamples": [], "collocations": []}
        seen = set()
        for note in matched:
            for example in note["examples"]:
                key = (example["text"], example["translationZh"])
                if not all(key) or key in seen:
                    continue
                seen.add(key)
                grammar, tip = teaching_labels(example["text"])
                item = {**example, "source": "uploaded-anki", "grammar": grammar,
                        "writingTip": tip, "topic": "原卡例句（題材未分類）"}
                if has_target(example["text"], word):
                    study["examples"].append(item)
                else:
                    study["familyExamples"].append(item)
                    questionable.append({"word": word, "noteWord": note["Word"], "rowid": note["rowid"], "example": example["text"]})
        for phrase in str(original.get("collocations", "")).split(";"):
            if phrase.strip():
                study["collocations"].append([phrase.strip(), "原詞表搭配（未附中文翻譯）", "保留原網站教材搭配。"])
        if word in overrides:
            override = overrides[word]
            for key in ("plainMeaning", "usageNote"):
                if key in override:
                    study[key] = override[key]
            extra = override.get("examples", [])
            if any(row.get("source") != "self-authored" for row in extra):
                raise ValueError("Author overrides must explicitly identify self-authored examples: " + word)
            for row in extra:
                if not row.get("text") or not row.get("translationZh"):
                    raise ValueError("Override example lacks bilingual text: " + word)
                if not has_target(row["text"], word):
                    raise ValueError("Author override example does not contain the target word/form: " + word)
            study["examples"] = extra + study["examples"]
            study["collocations"] = override.get("collocations", []) + study["collocations"]
        if len(study["examples"]) < 2:
            missing.append(word)
        entries[word] = study
    unknown = sorted(set(overrides) - set(entries))
    if unknown:
        raise ValueError("Overrides contain unknown exact word IDs: " + repr(unknown))
    counts = Counter(example["source"] for entry in entries.values() for example in entry["examples"])
    summary = {"notes": len(notes), "distinctAnkiHeadwords": len(by_word), "vocabularyEntries": len(vocabulary),
               "exactHeadwordMatches": exact_matches, "aliasMatches": alias_matches, "unmatchedBeforeOverrides": len(vocabulary) - exact_matches - alias_matches,
               "coveredEntries": len(entries) - len(missing), "missingEntries": missing, "exampleCount": sum(counts.values()),
               "examplesBySource": dict(counts), "collocationCount": sum(len(entry["collocations"]) for entry in entries.values()),
               "authorOverrideEntries": len(overrides), "exactTargetCheckFlags": len(questionable),
               "familyExampleCount": sum(len(entry["familyExamples"]) for entry in entries.values()),
               "targetCheckNote": "Rule-based target-form flags require review; morphology support is partial and flags are not proven errors.",
               "provenance": "Uploaded Anki materials retain uploaded-anki attribution; source/license is not asserted to be public domain.",
               "originalMeanings": "Unchanged in vocabulary.js; the UI must retain access to every original meaning."}
    return {"version": 1, "sourceSummary": summary, "entries": entries}, questionable


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apkg", required=True, type=Path)
    parser.add_argument("--vocabularyJson", "--vocabulary", dest="vocabulary", required=True, type=Path)
    parser.add_argument("--overrides", action="append", default=[], type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--allow-draft", action="store_true", help="Allow output with reported missing entries")
    args = parser.parse_args()
    vocabulary = json.loads(args.vocabulary.read_text(encoding="utf-8"))
    if isinstance(vocabulary, dict):
        vocabulary = vocabulary["vocabulary"]
    if len({row["word"] for row in vocabulary}) != len(vocabulary):
        raise ValueError("Vocabulary exact word IDs must be unique")
    overrides = {}
    for path in args.overrides:
        rows = json.loads(path.read_text(encoding="utf-8"))
        duplicated = set(rows) & set(overrides)
        if duplicated:
            raise ValueError("Duplicate override exact IDs: " + repr(sorted(duplicated)))
        overrides.update(rows)
    notes = read_apkg(args.apkg)
    data, flags = build(notes, vocabulary, overrides)
    data["sourceSummary"]["apkgSha256"] = hashlib.sha256(args.apkg.read_bytes()).hexdigest()
    report = {"sourceSummary": data["sourceSummary"], "targetCheckFlags": flags}
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if data["sourceSummary"]["missingEntries"] and not args.allow_draft:
        raise ValueError("Release blocked: entries lack two bilingual examples: " + repr(data["sourceSummary"]["missingEntries"]))
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text('"use strict";\n// Additive study materials. Original vocabulary meanings remain in vocabulary.js.\nconst BUILTIN_STUDY_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(json.dumps(data["sourceSummary"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
