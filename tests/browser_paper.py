"""Exercise the exact production file set, including direct and historical URLs."""
from functools import partial
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
from threading import Thread
from urllib.parse import quote

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def main():
    with TemporaryDirectory() as directory, sync_playwright() as playwright:
        public = Path(directory)
        subprocess.run([sys.executable, str(ROOT / "tools/release_files.py"), "--copy-to", directory], check=True)
        with ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=directory)) as server:
            Thread(target=server.serve_forever, daemon=True).start()
            address = f"http://127.0.0.1:{server.server_port}/"
            browser = playwright.chromium.launch(executable_path=os.environ.get("CHROMIUM_EXECUTABLE", "/usr/bin/chromium"), args=["--no-sandbox", "--disable-dev-shm-usage"])
            try:
                for width in (1280, 375, 320):
                    page = browser.new_page(viewport={"width":width,"height":850},reduced_motion="reduce")
                    errors = []
                    page.on("pageerror", lambda err: errors.append(str(err)))
                    page.on("response", lambda res: errors.append(res.url) if res.url.startswith(address) and res.status >= 400 else None)
                    page.goto(address+"?paper=115&q=9#paperVocabulary")
                    page.wait_for_selector("#bootStatus", state="hidden")
                    assert page.locator("#paperVocabulary").evaluate("d=>d.open")
                    assert page.locator("#paperNumber").input_value()=="9"
                    assert page.locator(".paper-options li").count()==4
                    assert not page.locator(".paper-answer").evaluate("d=>d.open")
                    page.locator(".paper-answer summary").click()
                    assert "elbow" in page.locator(".paper-answer>p").first.inner_text()
                    assert len(page.locator(".paper-examples li p[lang=en] strong").all())==3
                    for option in page.locator(".paper-options li").all():
                        assert option.bounding_box()["x"] >= 0
                        assert option.bounding_box()["x"] + option.bounding_box()["width"] <= width + 1
                    page.locator(".paper-options a").nth(2).click()
                    assert "elbow" == page.evaluate("VOCABULARY[state.selectedIndex].word")
                    assert page.url.endswith("choice=C#wordDetail")
                    page.locator(".paper-references [data-paper-link]").first.click()
                    assert page.locator("#paperNumber").input_value()=="9"
                    page.go_back()
                    page.wait_for_function("location.hash==='#wordDetail' && VOCABULARY[state.selectedIndex].word==='elbow'")
                    page.goto(address+"?paper=115&q=4&choice=A#wordDetail")
                    page.wait_for_function("VOCABULARY[state.selectedIndex].word==='initial'")
                    assert "initially" in page.locator(".paper-references").inner_text()
                    page.select_option("#paperYear","111")
                    assert page.locator("#paperNumber").input_value()=="1"
                    page.select_option("#paperNumber","5")
                    assert page.locator(".paper-options strong").first.inner_text()=="Tagging"
                    assert page.locator(".paper-options a").first.inner_text()=="查原形 tag"
                    assert not page.locator(".paper-answer").evaluate("d=>d.open")
                    page.goto(address+"?paper=bad&q=-1#paperVocabulary")
                    page.wait_for_selector("#bootStatus", state="hidden")
                    assert page.locator("#paperYear").input_value()=="115" and page.locator("#paperNumber").input_value()=="1"
                    assert not errors, errors
                    page.close()
                page=browser.new_page()
                for filename in ("index .html","gsat-lexicon-v6-github/index .html","gsat-lexicon-v6-github/index.html"):
                    page.goto(address+quote(filename))
                    page.wait_for_selector("#bootStatus",state="attached")
                    page.wait_for_function("document.getElementById('bootStatus').hidden")
                    assert page.locator("#paperVocabulary").count()==1
                for filename in ("README.md","SOURCE_GUIDE.md","docs/ARCHITECTURE.md","assets/vendor/kokoro/kokoro.bundle.mjs"):
                    assert page.request.get(address+filename).status==404
                for file in sorted(p for p in public.rglob("*") if p.is_file()):
                    response=page.request.get(address+quote(file.relative_to(public).as_posix()))
                    assert response.ok and hashlib.sha256(response.body()).digest()==hashlib.sha256(file.read_bytes()).digest(), file
                print("All release files, four entry URLs, and paper/card navigation at 1280, 375 and 320 pixels passed.")
            finally:
                browser.close()
                server.shutdown()


if __name__=="__main__":
    main()
