"""List or stage the self-contained GitHub Pages directory used by browser tests."""
import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import shutil
from urllib.parse import unquote, urlsplit


class PageAssets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = set()

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key not in ("href", "src") or not value:
                continue
            url = urlsplit(value)
            if url.scheme or url.netloc or not url.path:
                continue
            self.paths.add(Path(unquote(url.path)).as_posix())


def release_files(root):
    page = PageAssets()
    page.feed((root / "index.html").read_text())
    paths = page.paths | {
        "index.html", "index .html",
        "gsat-lexicon-v6-github/index.html", "gsat-lexicon-v6-github/index .html",
        "assets/data/exam-evidence.json", "assets/data/wordnet-learning.json", "assets/data/reference-details.json",
    }
    manifest = json.loads((root / "manifest.webmanifest").read_text())
    paths.update(icon["src"] for icon in manifest["icons"])
    for path in paths:
        if not (root / path).is_file() or Path(path).suffix in {".md", ".py", ".wasm"}:
            raise ValueError(f"Unexpected release dependency: {path}")
    return sorted(paths)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--copy-to", type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    for name in release_files(root):
        if args.copy_to:
            target = args.copy_to / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(root / name, target)
        else:
            print(name)
