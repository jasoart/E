#!/usr/bin/env python3
"""Validate deployable static assets and data without HTTP or third-party packages."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import parse_qs, unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
STARTUP_SCRIPTS = (
    "assets/js/config.js", "assets/data/vocabulary.js", "assets/data/collocations.js",
    "assets/data/learning.js", "assets/data/builtin-study.js", "assets/data/kk-pronunciation.js",
    "assets/data/exam-notebook.js", "assets/data/authored-scenarios.js", "assets/data/exam-evidence-index.js", "assets/js/exam-notes.js",
    "assets/js/state.js", "assets/js/builtin.js", "assets/js/search.js", "assets/js/examples.js",
    "assets/js/audio.js", "assets/js/retrieval-practice.js", "assets/js/ui.js", "assets/js/favorites.js",
    "assets/js/online.js", "assets/data/context-practice.js", "assets/js/diagnostics.js", "assets/js/local-coach.js", "assets/js/app.js",
)


def validate_startup_scripts(items):
    """Check the dependency order and deferred execution of the actual application."""
    scripts = [(urlsplit(url).path.removeprefix("./"), attrs)
               for tag, attribute, url, attrs in items if tag == "script" and attribute == "src"]
    paths = [path for path, _ in scripts]
    errors = []
    if "assets/js/local-tts.js" in paths:
        errors.append("Archived model-based speech must not load at startup")
    # Reusable fixture pages need not contain the application's full script list.
    if not any(path in STARTUP_SCRIPTS for path in paths):
        return errors
    if tuple(paths) != STARTUP_SCRIPTS:
        errors.append("Startup scripts are missing, duplicated, or out of dependency order")
    for path, attrs in scripts:
        if path in STARTUP_SCRIPTS and ("defer" not in attrs or "async" in attrs or attrs.get("type") == "module"):
            errors.append(f"Application scripts must execute in deferred document order: {path}")
    return errors


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.items = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        for attribute in ("src", "href"):
            if values.get(attribute):
                self.items.append((tag, attribute, values[attribute], values))


def local_file(root, url, relative_to=None):
    """Resolve project-relative URLs; reject escapes, including encoded traversal."""
    parts = urlsplit(url)
    if parts.scheme or parts.netloc or not parts.path:
        return None
    root = root.resolve()
    path = unquote(parts.path)
    if path.startswith("/"):
        raise ValueError(f"Use a relative path for GitHub Pages project sites: {url}")
    result = ((relative_to or root) / path).resolve()
    if not result.is_relative_to(root):
        raise ValueError(f"Asset escapes site root: {url}")
    if not result.is_file():
        raise ValueError(f"Missing local asset: {url}")
    return result


def validate_assets(root):
    errors, paths = [], set()
    main = root / "index.html"
    compatibility = root / "index .html"
    if not main.is_file():
        return ["Missing index.html"], paths
    if not compatibility.is_file() or compatibility.read_bytes() != main.read_bytes():
        errors.append("index.html and index .html must be byte-identical")
    parser = References()
    parser.feed(main.read_text(encoding="utf-8"))
    errors.extend(validate_startup_scripts(parser.items))
    for tag, attribute, url, attrs in parser.items:
        try:
            path = local_file(root, url)
            if path is None:
                if (tag == "script" and attribute == "src") or (tag == "link" and attrs.get("rel") == "stylesheet"):
                    errors.append(f"Startup scripts and styles must be local: {url}")
                continue
            paths.add(path)
            versions = parse_qs(urlsplit(url).query).get("v", [])
            expected = hashlib.sha256(path.read_bytes()).hexdigest()[:12]
            if versions != [expected]:
                errors.append(f"Missing or stale asset hash: {url}; expected v={expected}")
            if path.suffix == ".webmanifest":
                manifest = json.loads(path.read_text(encoding="utf-8"))
                for icon in manifest.get("icons", []):
                    icon_path = local_file(root, icon["src"], path.parent)
                    if icon_path is None:
                        errors.append(f"Manifest icon must be local: {icon['src']}")
                    else:
                        paths.add(icon_path)
            if path.suffix == ".css":
                for css_url in re.findall(r"url\(\s*['\"]?([^'\"\s)]+)['\"]?\s*\)", path.read_text(encoding="utf-8")):
                    asset = local_file(root, css_url, path.parent)
                    if asset is not None:
                        paths.add(asset)
        except (ValueError, KeyError, OSError) as error:
            errors.append(str(error))
    return errors, paths


def validate_data(root):
    # vm executes the committed data declarations, including the original ID repair
    # at the end of vocabulary.js. It does not load application code or fetch URLs.
    script = r"""
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const c = vm.createContext({});
for (const name of ['vocabulary', 'builtin-study', 'exam-notebook', 'exam-evidence-index']) {
  vm.runInContext(fs.readFileSync(path.join(process.argv[1], 'assets/data', name + '.js'), 'utf8'), c, {timeout: 5000});
}
const result = vm.runInContext(`({
  ids: VOCABULARY.map(row => row.word),
  studyIds: Object.keys(BUILTIN_STUDY_DATA.entries),
  supplemental: GSAT_EXAM_NOTEBOOK.supplemental.map(row => row.word),
  notebook: GSAT_EXAM_NOTEBOOK.stats,
  computed: {
    headwords: Object.keys(GSAT_EXAM_NOTEBOOK.entries).length,
    ...Object.fromEntries(['collocations', 'grammarPatterns', 'examples', 'senses', 'synonyms', 'idioms', 'family', 'forms'].map(field => [
      field, Object.values(GSAT_EXAM_NOTEBOOK.entries).reduce((sum, row) => sum + (row[field] || []).length, 0)
    ]))
  },
  evidenceIndex: GSAT_EXAM_EVIDENCE_INDEX
})`, c, {timeout: 5000});
console.log(JSON.stringify(result));
"""
    try:
        result = subprocess.run(["node", "-e", script, str(root)], capture_output=True, text=True, check=True, timeout=20)
        data = json.loads(result.stdout)
        evidence_bytes = (root / "assets/data/exam-evidence.json").read_bytes()
        evidence = json.loads(evidence_bytes)
    except (OSError, ValueError, subprocess.SubprocessError) as error:
        return [f"Cannot validate data declarations: {error}"], {}
    errors = []
    ids = set(data["ids"])
    if len(data["ids"]) != 6012 or len(ids) != 6012 or any(not isinstance(word, str) or not word for word in data["ids"]):
        errors.append("Original vocabulary must retain 6,012 distinct, nonempty IDs")
    if ids != set(data["studyIds"]):
        errors.append("Builtin study IDs must cover exactly the original vocabulary")
    supplements = data["supplemental"]
    if len(supplements) != len(set(supplements)) or ids.intersection(supplements):
        errors.append("Supplemental IDs must be unique and separate from original vocabulary")
    if data["notebook"] != data["computed"]:
        errors.append("Notebook statistics differ from actual learning material")
    if data["evidenceIndex"]["recordCount"] != len(evidence["records"]):
        errors.append("Citation index count differs from the evidence source")
    if data["evidenceIndex"]["sourceSha256"] != hashlib.sha256(evidence_bytes).hexdigest():
        errors.append("Citation index hash differs from the evidence source")
    return errors, {"originalWords": len(ids), "supplementalWords": len(supplements),
                    "notebook": data["computed"], "verifiedCitationRecords": len(evidence["records"])}


def refresh_hashes(root):
    """Update asset query hashes and copy the canonical HTML to the compatibility entry."""
    main = root / "index.html"
    source = main.read_text(encoding="utf-8")

    def replace(match):
        attribute, quote, url = match.groups()
        path = local_file(root, url)
        if path is None:
            return match.group(0)
        parts = urlsplit(url)
        # Preserve unrelated parameters and fragments if a future local link needs them.
        params = [part for part in parts.query.split("&") if part and part.split("=", 1)[0] != "v"]
        params.append("v=" + hashlib.sha256(path.read_bytes()).hexdigest()[:12])
        value = parts._replace(query="&".join(params)).geturl()
        return f"{attribute}={quote}{value}{quote}"

    updated = re.sub(r'''\b(src|href)=(["'])(.*?)\2''', replace, source)
    main.write_text(updated, encoding="utf-8")
    (root / "index .html").write_text(updated, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--refresh-hashes", action="store_true", help="update both HTML entries before validating")
    args = parser.parse_args()
    root = args.root.resolve()
    if args.refresh_hashes:
        try:
            refresh_hashes(root)
        except (OSError, ValueError) as error:
            raise SystemExit(str(error)) from error
    errors, paths = validate_assets(root)
    data_errors, counts = validate_data(root)
    errors.extend(data_errors)
    if errors:
        raise SystemExit("Static-site validation failed:\n- " + "\n- ".join(errors))
    print(json.dumps({"status": "passed", "localAssets": len(paths), "assetBytes": sum(path.stat().st_size for path in paths), **counts}, ensure_ascii=False))


if __name__ == "__main__":
    main()
