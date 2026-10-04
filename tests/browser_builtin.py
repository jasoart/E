"""Mobile-size Chromium checks for local study; not an iPhone/GPU inference test."""
from functools import partial
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def main():
    server = http.server.ThreadingHTTPServer(
        ("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}/"
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                executable_path="/usr/bin/chromium",
                args=["--no-sandbox", "--disable-dev-shm-usage", "--no-proxy-server"])
            context = browser.new_context(viewport={"width": 390, "height": 844},
                                          is_mobile=True, has_touch=True)
            context.add_init_script("localStorage.setItem('gsat-standalone-favorites-v1', '[\"challenge\",\"legacy-word\"]');")
            page = context.new_page()
            external, errors = [], []
            page.route("https://**/*", lambda route: (external.append(route.request.url), route.abort()))
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(base, wait_until="domcontentloaded")
            page.locator("#bootStatus").wait_for(state="hidden")
            assert page.locator("#totalCount").inner_text() == "6,012"
            assert page.locator("#exampleResults .gold-example").count() >= 2
            assert page.locator("#tutorModelSource").count() == 0
            # A word selection is entirely local, including less common words.
            for word in ["abandon", "abnormal", "neither adj./adv./pron./", "sustainable"]:
                page.evaluate("word => selectEntry(VOCABULARY.findIndex(e => e.word === word))", word)
                assert page.locator("#exampleResults .gold-example").count() >= 2, word
            page.evaluate("selectEntry(VOCABULARY.findIndex(e => e.word === 'abnormal'))")
            page.locator("#builtinClozeInput").fill("wrong")
            page.locator("#builtinClozeCheck").click()
            assert "abnormal" in page.locator("#builtinClozeFeedback").inner_text().lower()
            page.locator("#builtinClozeRetry").click()
            page.locator("#builtinClozeInput").fill("abnormal")
            page.locator("#builtinClozeCheck").click()
            assert page.locator("#builtinClozeFeedback").inner_text()
            page.locator("#coachInput").fill("搭配 climate")
            page.locator("#coachLookup").click()
            assert "climate" in page.locator("#coachOutput").inner_text()
            page.locator("#coachInput").fill("Although the plan is useful, but it costs too much. We discuss about its risks. <img src=x onerror=alert(1)> Clean energy helps communities.")
            page.locator("#coachAnalyze").click()
            assert "discuss" in page.locator("#coachOutput").inner_text()
            assert page.locator("#coachOutput img").count() == 0
            assert "不提供學測作文分數" in page.locator("#coachOutput").inner_text()
            page.evaluate("selectEntry(VOCABULARY.findIndex(e => e.word === 'challenge'))")
            page.locator("#favoriteButton").click()
            assert json.loads(page.evaluate("localStorage.getItem('gsat-standalone-favorites-v1')")) == ["legacy-word"]
            page.locator("#favoriteButton").click()
            assert set(json.loads(page.evaluate("localStorage.getItem('gsat-standalone-favorites-v1')"))) == {"legacy-word", "challenge"}
            # Confirm delayed setup cannot start provider/model requests.
            page.wait_for_timeout(1200)
            assert not external, external
            assert not errors, errors
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "mobile horizontal overflow"
            page.screenshot(path="/tmp/e-built-in-mobile.png", full_page=True)
            browser.close()
        print("Browser passed: 390px layout, local examples, coach extraction/escaping, favorites, zero external requests.")
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
