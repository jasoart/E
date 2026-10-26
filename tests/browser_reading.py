"""Reading filters, source scope and CSV export in desktop/mobile Chromium."""
import csv
from functools import partial
import http.server
import io
import json
import os
from pathlib import Path
import threading

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def expected_words(data, year="all", topic="all", section="all", priority="all", collection="entries"):
    passages = {row["id"]: row for row in data["passages"]}
    eligible = {
        pid for pid, passage in passages.items()
        if (year == "all" or str(passage["year"]) == year)
        and (topic == "all" or passage["topicId"] == topic)
        and (section == "all" or passage["section"] == section)
    }
    return {
        word for word, row in data[collection].items()
        if (priority == "all" or row["priority"] == priority)
        and any(occurrence["passageId"] in eligible for occurrence in row["occurrences"])
    }


def main():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}/"
    outcomes = []
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                executable_path=os.environ.get("CHROMIUM_EXECUTABLE", "/usr/bin/chromium"),
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
            context = browser.new_context(viewport={"width": 1280, "height": 900}, accept_downloads=True)
            context.add_init_script("""(() => {
                if(localStorage.getItem('gsat-standalone-favorites-v1')===null)
                    localStorage.setItem('gsat-standalone-favorites-v1','["challenge","legacy-reading-word"]');
                if(localStorage.getItem('gsat-v3-review-queue-v1')===null)
                    localStorage.setItem('gsat-v3-review-queue-v1','{"challenge":{"stage":1,"due":"2020-01-01","last":"2019-12-31","rating":"good"}}');
            })()""")
            page = context.new_page()
            errors, external, failed_local = [], [], []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("response", lambda response: failed_local.append(response.url) if response.url.startswith(base) and response.status >= 400 else None)
            page.route("https://**/*", lambda route: (external.append(route.request.url), route.abort()))
            page.goto(base, wait_until="load")
            page.locator("#bootStatus").wait_for(state="hidden")
            page.wait_for_function("BM25_INDEX.ready")
            data = page.evaluate("GSAT_READING_VOCABULARY")
            assert len(data["entries"]) >= 500
            assert page.evaluate("VOCABULARY.length") == 6024
            original_favorites = page.evaluate("localStorage.getItem('gsat-standalone-favorites-v1')")
            original_review = page.evaluate("localStorage.getItem('gsat-v3-review-queue-v1')")
            assert set(json.loads(original_favorites)) == {"challenge", "legacy-reading-word"}
            assert json.loads(original_review)["challenge"]["stage"] == 1

            page.locator("#searchInput").fill("synesthesia")
            page.locator("#readingSearchNotice").wait_for(state="visible")
            page.locator("#viewReadingSupplemental").click()
            assert page.locator("#readingFilters").is_visible()
            assert page.locator("#readingSupplemental").get_attribute("open") is not None
            assert page.locator('[data-reading-word="synesthesia"]').is_visible()
            page.locator("#readingSupplemental > summary").click()
            page.locator("#searchInput").fill("")
            page.wait_for_function("state.query === ''")
            page.locator("#allTab").click()
            outcomes.append("global search discovers new supplemental terms and opens the matching reading results")

            page.locator("#readingTab").click()
            assert page.locator("#readingFilters").is_visible()
            assert set(page.evaluate("state.filtered.map(row=>row.entry.word)")) == expected_words(data)
            assert int(page.locator("#readingTabCount").inner_text().replace(",", "")) == len(data["entries"])
            assert page.locator("#readingFilterStatus").inner_text()
            outcomes.append("reading tab exposes the complete evidenced overlay without appending word IDs")

            passage = next(row for row in data["passages"] if row["year"] == 115 and row["section"] == "reading")
            topic = passage["topicId"]
            page.locator("#readingYear").select_option("115")
            page.locator("#readingTopic").select_option(topic)
            page.locator("#readingSection").select_option("reading")
            expected = expected_words(data, "115", topic, "reading")
            assert expected
            assert set(page.evaluate("state.filtered.map(row=>row.entry.word)")) == expected
            assert page.locator("#readingVocabulary").is_visible()
            assert "實際詞形" in page.locator("#readingVocabulary").inner_text()
            assert "PDF 第" in page.locator("#readingVocabulary").inner_text()
            outcomes.append("year, topic and section intersect through a real common source passage")

            with page.expect_download() as event:
                page.locator("#exportReadingVocabulary").click()
            download = event.value
            assert download.suggested_filename.endswith(".csv")
            records = list(csv.DictReader(io.StringIO(Path(download.path()).read_text(encoding="utf-8-sig"))))
            original_rows = [row for row in records if row["詞條類型"] == "既有詞條"]
            supplemental_rows = [row for row in records if row["詞條類型"] == "閱讀題材補充詞"]
            assert {row["詞條"] for row in original_rows} == expected
            assert {row["詞條"] for row in supplemental_rows} == expected_words(data, "115", topic, "reading", collection="supplemental")
            assert all(row["年份"] == "115" for row in records)
            assert all(row["原詞表釋義"] for row in original_rows)
            assert all(row["補充釋義（本站整理）"] and not row["原詞表釋義"] for row in supplemental_rows)
            assert "語境義對照題組" in records[0]
            outcomes.append("downloaded CSV preserves original meanings and exports only filtered source references")

            for selector in ("#readingYear", "#readingTopic", "#readingSection"):
                page.locator(selector).select_option("all")
            supplemental_word = "synesthesia"
            assert supplemental_word in data["supplemental"]
            page.locator("#searchInput").fill(supplemental_word)
            page.wait_for_function("query => state.query === query", arg=supplemental_word)
            page.evaluate("state.levels.clear(); applyFilters()")
            assert page.evaluate("state.filtered.length") == 0
            assert page.locator("#exportReadingVocabulary").is_enabled()
            page.locator("#readingSupplemental > summary").click()
            assert page.locator(f'[data-reading-word="{supplemental_word}"]').is_visible()
            assert "聯覺" in page.locator(f'[data-reading-word="{supplemental_word}"]').inner_text()
            assert "PDF 第" in page.locator(f'[data-reading-word="{supplemental_word}"]').inner_text()
            with page.expect_download() as event:
                page.locator("#exportReadingVocabulary").click()
            supplement_only = list(csv.DictReader(io.StringIO(Path(event.value.path()).read_text(encoding="utf-8-sig"))))
            assert {row["詞條"] for row in supplement_only} == {supplemental_word}
            assert all(row["詞條類型"] == "閱讀題材補充詞" for row in supplement_only)
            page.locator("#readingSupplemental > summary").click()
            page.evaluate("state.levels=new Set(LEVELS); syncLevelButtons()")
            page.locator("#searchInput").fill("")
            page.wait_for_function("state.query === ''")
            outcomes.append("new topic terms keep independent source evidence, search and CSV export when no official-level word matches")
            page.locator("#readingPriority").select_option("cross-year")
            assert set(page.evaluate("state.filtered.map(row=>row.entry.word)")) == expected_words(data, priority="cross-year")
            page.locator("#readingPriority").select_option("all")
            target = next((word, row) for word, row in data["entries"].items() if row.get("readingSense") and len(row["readingSense"]) >= 6)
            word, record = target
            page.evaluate("word => window.readingTestWord = word", word)
            page.locator("#searchInput").fill(record["readingSense"])
            page.wait_for_function("query => state.query === query && state.filtered.some(row => row.entry.word === window.readingTestWord)", arg=record["readingSense"])
            page.evaluate("word => selectEntry(VOCABULARY.findIndex(entry => entry.word === word))", word)
            assert page.locator("#readingVocabulary .reading-sense").inner_text() == record["readingSense"]
            assert "語境義對照" in page.locator("#readingVocabulary").inner_text()
            original_meaning = page.evaluate("VOCABULARY[state.selectedIndex].meaning")
            assert page.locator("#notebookSenses .original-meaning-text").inner_text() == original_meaning
            outcomes.append("edited reading meanings are searchable while original dictionary meanings remain visible")

            page.locator("#searchInput").fill("")
            page.wait_for_function("state.query === ''")
            for width in (390, 320):
                page.set_viewport_size({"width": width, "height": 844})
                page.locator("#readingFilters").scroll_into_view_if_needed()
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), width
                assert page.locator("#readingYear").is_visible()
            page.emulate_media(reduced_motion="reduce")
            page.locator("#readingYear").select_option("111")
            page.wait_for_function("UI_ACTIVE_MOTION.size === 0")
            assert page.evaluate("document.getAnimations().filter(animation => animation.id.startsWith('dictionary-')).length") == 0
            assert page.evaluate("localStorage.getItem('gsat-standalone-favorites-v1')") == original_favorites
            assert page.evaluate("localStorage.getItem('gsat-v3-review-queue-v1')") == original_review
            assert not external, external
            assert not errors, errors
            assert not failed_local, failed_local
            outcomes.append("320/390px controls reflow, reduced motion is respected and legacy storage is untouched")
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print(json.dumps({"reading":outcomes,"pageErrors":[],"externalRequests":0}, ensure_ascii=False))


if __name__ == "__main__":
    main()
