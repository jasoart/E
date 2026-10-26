"""Check bilingual reading sizes, phonetics and narrow/text-enlarged layouts."""
from functools import partial
import http.server
import json
import os
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def main():
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    results = []
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                executable_path=os.environ.get('CHROMIUM_EXECUTABLE', '/usr/bin/chromium'),
                args=['--no-sandbox', '--disable-dev-shm-usage'])
            page = browser.new_page(viewport={'width': 1280, 'height': 900})
            errors, font_requests = [], []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('request', lambda request: font_requests.append(request.url)
                    if request.resource_type == 'font' else None)
            page.route('https://**/*', lambda route: route.abort())
            page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='load')
            page.locator('#bootStatus').wait_for(state='hidden')
            page.evaluate('ensureBm25Index()')

            def lookup(word):
                page.locator('#searchInput').fill(word)
                page.wait_for_function('word => searchTimer === null && state.query === word', arg=word)
                page.locator('#wordList .row').first.click()
                assert page.locator('#wordDetail h2').inner_text() == word

            def assert_layout(width, text_scale=1):
                page.set_viewport_size({'width': width, 'height': 900})
                page.evaluate('scale => document.documentElement.style.fontSize = `${100 * scale}%`', text_scale)
                measurement = page.evaluate('''() => {
                    const size = selector => parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
                    const ipa = document.querySelector('.phonetic>span:not(.phonetic-source)');
                    const style = getComputedStyle(ipa);
                    const phoneticRange = document.createRange();
                    phoneticRange.selectNodeContents(ipa);
                    const rect = phoneticRange.getBoundingClientRect();
                    const detail = document.querySelector('#wordDetail').getBoundingClientRect();
                    return {
                        width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
                        meaning: size('.notebook-core-meaning p'),
                        example: size('.gold-example blockquote'),
                        input: size('#searchInput'),
                        phoneticFont: style.fontFamily, phoneticStyle: style.fontStyle,
                        phoneticLeft: rect.left, phoneticRight: rect.right,
                        detailLeft: detail.left, detailRight: detail.right
                    };
                }''')
                assert measurement['scrollWidth'] <= width + 1, measurement
                assert measurement['meaning'] >= 16 * text_scale, measurement
                assert measurement['example'] >= 19 * text_scale, measurement
                assert measurement['input'] >= 16 * text_scale, measurement
                assert 'Charis SIL' in measurement['phoneticFont'], measurement
                assert measurement['phoneticStyle'] == 'normal', measurement
                assert measurement['phoneticLeft'] >= measurement['detailLeft'], measurement
                assert measurement['phoneticRight'] <= measurement['detailRight'], measurement
                results.append({'width': width, 'textScale': text_scale, 'status': 'passed'})

            lookup('challenge')
            for width in (1280, 390, 320):
                assert_layout(width)
            assert_layout(390, 2)
            page.evaluate('document.documentElement.style.fontSize = "100%"')
            lookup('she (her, hers, herself)')
            assert_layout(320)
            assert not errors, errors
            assert not font_requests, font_requests
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print(json.dumps({'typography': results, 'externalFontRequests': 0}, ensure_ascii=False))


if __name__ == '__main__':
    main()
