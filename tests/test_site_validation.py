"""Prevent deployment of missing assets, stale caches, and diverging entry pages."""
import importlib.util
import hashlib
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location("validate_site", Path(__file__).resolve().parents[1] / "tools/validate_site.py")
site = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(site)


class SiteValidationTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        (self.root / "assets").mkdir()
        (self.root / "assets/app.js").write_text("'use strict';", encoding="utf-8")
        self.digest = hashlib.sha256((self.root / "assets/app.js").read_bytes()).hexdigest()[:12]

    def html(self, body):
        for name in ("index.html", "index .html"):
            (self.root / name).write_text(body, encoding="utf-8")

    def test_current_hash_and_external_reference_link_are_valid(self):
        self.html(f'<script src="./assets/app.js?v={self.digest}"></script><a href="https://example.org">source</a>')
        self.assertEqual(site.validate_assets(self.root)[0], [])

    def test_missing_and_stale_hashes_fail(self):
        for query in ("", "?v=old", f"?v={self.digest}&v=old"):
            with self.subTest(query=query):
                self.html(f'<script src="./assets/app.js{query}"></script>')
                self.assertIn("Missing or stale asset hash", " ".join(site.validate_assets(self.root)[0]))

    def test_missing_asset_and_entry_divergence_fail(self):
        self.html('<script src="./assets/missing.js?v=any"></script>')
        (self.root / "index .html").write_text("old entry", encoding="utf-8")
        errors = " ".join(site.validate_assets(self.root)[0])
        self.assertIn("Missing local asset", errors)
        self.assertIn("byte-identical", errors)

    def test_encoded_traversal_and_site_root_absolute_paths_fail(self):
        for url in ("../outside.js", "%2e%2e/outside.js", "/assets/app.js"):
            with self.subTest(url=url):
                with self.assertRaises(ValueError):
                    site.local_file(self.root, url)

    def test_external_startup_script_fails_but_data_and_fragment_urls_do_not_resolve(self):
        self.html('<script src="https://example.org/app.js"></script>')
        self.assertIn("Startup scripts", " ".join(site.validate_assets(self.root)[0]))
        self.assertIsNone(site.local_file(self.root, "#search"))
        self.assertIsNone(site.local_file(self.root, "data:image/png;base64,aGVsbG8="))

    def test_refresh_is_deterministic_and_preserves_fragment(self):
        self.html('<script src="./assets/app.js?mode=study&v=old#section"></script>')
        site.refresh_hashes(self.root)
        first = (self.root / "index.html").read_bytes()
        self.assertIn(f"mode=study&v={self.digest}#section".encode(), first)
        self.assertEqual(first, (self.root / "index .html").read_bytes())
        self.assertEqual(site.validate_assets(self.root)[0], [])
        site.refresh_hashes(self.root)
        self.assertEqual(first, (self.root / "index.html").read_bytes())

    def test_missing_nested_manifest_icon_fails(self):
        path = self.root / "manifest.webmanifest"
        path.write_text('{"icons":[{"src":"assets/missing.png"}]}', encoding="utf-8")
        digest = hashlib.sha256(path.read_bytes()).hexdigest()[:12]
        self.html(f'<link rel="manifest" href="./manifest.webmanifest?v={digest}">')
        self.assertIn("Missing local asset: assets/missing.png", " ".join(site.validate_assets(self.root)[0]))

    def script_items(self, paths, **attributes):
        return [("script", "src", "./" + path, {"src": "./" + path, "defer": None, **attributes})
                for path in paths]

    def test_startup_dependency_order_duplicate_and_missing_scripts(self):
        self.assertEqual(site.validate_startup_scripts(self.script_items(site.STARTUP_SCRIPTS)), [])
        swapped = list(site.STARTUP_SCRIPTS)
        swapped[0], swapped[1] = swapped[1], swapped[0]
        for paths in (swapped, site.STARTUP_SCRIPTS[1:], site.STARTUP_SCRIPTS[:-1], (*site.STARTUP_SCRIPTS, site.STARTUP_SCRIPTS[0])):
            with self.subTest(paths=paths):
                self.assertIn("dependency order", " ".join(site.validate_startup_scripts(self.script_items(paths))))

    def test_async_and_model_startup_are_rejected(self):
        items = self.script_items(site.STARTUP_SCRIPTS)
        del items[0][3]["defer"]
        self.assertIn("deferred document order", " ".join(site.validate_startup_scripts(items)))
        for attrs in ({"async": None}, {"type": "module"}):
            self.assertIn("deferred document order", " ".join(site.validate_startup_scripts(self.script_items(site.STARTUP_SCRIPTS, **attrs))))
        self.assertIn("model-based speech", " ".join(site.validate_startup_scripts(self.script_items(["assets/js/local-tts.js"]))))


if __name__ == "__main__":
    unittest.main()
