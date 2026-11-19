"""Exercise real animation lifecycle, keyboard focus and reduced-motion behavior."""
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
    checks = []
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                executable_path=os.environ.get('CHROMIUM_EXECUTABLE', '/usr/bin/chromium'),
                args=['--no-sandbox', '--disable-dev-shm-usage'])
            page = browser.new_page(viewport={'width': 1280, 'height': 900}, reduced_motion='no-preference')
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.route('https://**/*', lambda route: route.abort())
            page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='load')
            page.locator('#bootStatus').wait_for(state='hidden')
            page.evaluate('ensureBm25Index()')
            detail = page.evaluate('''() => {
                selectEntry(VOCABULARY.findIndex(entry => entry.word === 'bank'));
                const animation = wordDetail.getAnimations().find(item => item.id === 'dictionary-detail');
                return {heading: wordDetail.querySelector('h2').textContent,
                    duration: animation?.effect.getTiming().duration,
                    running: animation?.playState === 'running'};
            }''')
            assert detail['heading'] == 'bank' and detail['running'], detail
            assert 0 < detail['duration'] <= 250, detail
            checks.append('detail content is immediate and has a brief live transition')

            rapid = page.evaluate('''() => {
                const old = wordDetail.getAnimations().find(item => item.id === 'dictionary-detail');
                for (const word of ['elbow', 'challenge', 'teacher', 'bank']) {
                    selectEntry(VOCABULARY.findIndex(entry => entry.word === word));
                }
                return {oldState: old?.playState,
                    heading: wordDetail.querySelector('h2').textContent,
                    transitions: wordDetail.getAnimations().filter(item => item.id === 'dictionary-detail').length};
            }''')
            assert rapid == {'oldState': 'idle', 'heading': 'bank', 'transitions': 1}, rapid
            page.wait_for_function('wordDetail.getAnimations().length === 0')
            assert page.locator('#wordDetail').evaluate('element => getComputedStyle(element).opacity') == '1'
            checks.append('rapid switches cancel the old effect and keep the final card')

            page.evaluate('state.query = ""; applyFilters()')
            row = page.locator('#wordList .row').nth(2)
            index = row.get_attribute('data-index')
            heading = row.locator('strong').inner_text()
            row.focus()
            page.keyboard.press('Enter')
            assert page.locator('#wordDetail h2').inner_text() == heading
            assert page.evaluate('document.activeElement.dataset.index') == index
            page.locator('#favoriteButton').focus()
            page.keyboard.press('Enter')
            assert page.locator('#favoriteButton').get_attribute('aria-pressed') == 'true'
            assert page.evaluate('document.activeElement.id') == 'favoriteButton'
            checks.append('keyboard selection retains row focus and favorite state stays accessible')

            page.evaluate("selectEntry(VOCABULARY.findIndex(entry => entry.word === 'teacher'))")
            page.emulate_media(reduced_motion='reduce')
            page.wait_for_function('UI_ACTIVE_MOTION.size === 0')
            reduced = page.evaluate('''() => {
                selectEntry(VOCABULARY.findIndex(entry => entry.word === 'challenge'));
                state.query = 'challenge'; applyFilters();
                document.getElementById('favoriteButton').click();
                return document.getAnimations().filter(item => item.id.startsWith('dictionary-')).length;
            }''')
            assert reduced == 0, reduced
            assert page.locator('#wordDetail h2').inner_text() == 'challenge'
            checks.append('a live reduced-motion change cancels running effects and prevents new ones')

            page.emulate_media(reduced_motion='no-preference')
            fallback = page.evaluate('''() => {
                const animate = Element.prototype.animate;
                try {
                    Element.prototype.animate = undefined;
                    selectEntry(VOCABULARY.findIndex(entry => entry.word === 'elbow'));
                    return {heading: wordDetail.querySelector('h2').textContent,
                        opacity: getComputedStyle(wordDetail).opacity};
                } finally { Element.prototype.animate = animate; }
            }''')
            assert fallback == {'heading': 'elbow', 'opacity': '1'}, fallback
            checks.append('missing Web Animations API leaves content fully visible')

            page.set_viewport_size({'width': 390, 'height': 844})
            page.evaluate("selectEntry(VOCABULARY.findIndex(entry => entry.word === 'challenge'))")
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print(json.dumps({'motion': checks, 'pageErrors': []}, ensure_ascii=False))


if __name__ == '__main__':
    main()
