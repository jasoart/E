"""Real Chromium interactions; recording responses are controlled test fixtures."""
from functools import partial
import http.server
import io
import json
from pathlib import Path
import threading
import wave

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def main():
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/'
    outcomes = []
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
            context = browser.new_context(viewport={'width': 1280, 'height': 900})
            context.add_init_script("localStorage.setItem('gsat-standalone-favorites-v1', '[\"challenge\",\"legacy-word\"]');")
            page = context.new_page()
            external, errors, failed_local = [], [], []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('response', lambda response: failed_local.append(response.url) if response.url.startswith(base) and response.status >= 400 else None)
            page.route('https://**/*', lambda route: (external.append(route.request.url), route.abort()))
            page.goto(base, wait_until='load')
            page.locator('#bootStatus').wait_for(state='hidden')
            page.wait_for_function('BM25_INDEX.ready')
            assert not external, external

            def select(word):
                page.evaluate('word => selectEntry(VOCABULARY.findIndex(entry => entry.word === word))', word)
                assert page.locator('#wordDetail h2').inner_text() == word

            select('challenge')
            original = page.evaluate('VOCABULARY[state.selectedIndex].meaning')
            assert page.locator('#notebookSenses .original-meaning-text').is_visible()
            assert page.locator('#notebookSenses .original-meaning-text').inner_text() == original
            for meaning in ('盤問', '要求', '懷疑', '表示異議'):
                assert meaning in page.locator('#notebookSenses').inner_text()
            assert page.locator('#notebookSenses details.original-meaning').count() == 0
            for word in ('mean', 'light', 'right', 'abnormal'):
                select(word)
                assert page.locator('#notebookSenses .original-meaning-text').inner_text() == page.evaluate('VOCABULARY[state.selectedIndex].meaning')
            outcomes.append('complete original meanings visible for curated and uncurated words')

            # Selecting a source/accent/speed and clicking device-only playback cannot contact providers.
            page.locator('#pronunciationSource').select_option('device')
            page.locator('#pronunciationAccent').select_option('en-GB')
            page.locator('#pronunciationRate').select_option('0.7')
            before = len(external)
            page.locator('#speakButton').click()
            page.wait_for_function("['ready','unavailable','error','playing'].includes(localVoiceStatus().state)")
            assert len(external) == before
            page.reload(wait_until='load')
            page.locator('#bootStatus').wait_for(state='hidden')
            assert page.locator('#pronunciationSource').input_value() == 'device'
            assert page.locator('#pronunciationAccent').input_value() == 'en-GB'
            assert page.locator('#pronunciationRate').input_value() == '0.7'
            outcomes.append('pronunciation preferences persist; device-only mode sends no requests')

            select('challenge')
            old_review = page.evaluate("localStorage.getItem('gsat-v3-review-queue-v1')")
            page.locator('.retrieval-start').click()
            assert page.locator('#retrievalPractice').get_attribute('data-phase') == 'prompt'
            assert not page.locator('#notebookSenses').is_visible()
            assert not page.locator('#notebookCollocations').is_visible()
            assert page.locator('#retrievalPractice .retrieval-reference').count() == 0
            page.locator('.retrieval-reveal').click()
            assert page.locator('#retrievalPractice').get_attribute('data-phase') == 'prompt'
            assert page.locator('.retrieval-feedback').inner_text()
            page.locator('#retrievalAnswer').press('Escape')
            assert page.locator('#notebookSenses').is_visible()
            assert page.locator('.retrieval-start').evaluate('(node) => node === document.activeElement')

            page.locator('.retrieval-start').click()
            page.locator('.retrieval-forgot').click()
            assert page.locator('.retrieval-good').is_disabled()
            assert page.locator('.retrieval-reference').inner_text()
            page.locator('.retrieval-again').click()
            # Self-rated recall is deliberate: a typed attempt is required, then the learner checks meaning.
            for _ in range(6):
                if page.locator('#retrievalPractice').get_attribute('data-phase') == 'complete':
                    break
                page.locator('#retrievalAnswer').fill('my attempted complete chunk')
                page.locator('.retrieval-reveal').click()
                page.locator('.retrieval-good').click()
            assert page.locator('#retrievalPractice').get_attribute('data-phase') == 'complete'
            assert page.locator('#notebookSenses').is_visible()
            assert page.evaluate("localStorage.getItem('gsat-v3-review-queue-v1')") == old_review
            progress = page.evaluate("localStorage.getItem('gsat-notebook-retrieval-v1')")
            assert 'my attempted complete chunk' not in progress
            assert len(json.loads(progress)['records']) == 3
            page.locator('.retrieval-schedule-again').click()
            assert json.loads(page.evaluate("localStorage.getItem('gsat-v3-review-queue-v1')"))['challenge']['rating'] == 'again'
            assert set(json.loads(page.evaluate("localStorage.getItem('gsat-standalone-favorites-v1')"))) == {'challenge', 'legacy-word'}
            page.locator('.retrieval-exit').click()
            outcomes.append('recall conceals answers, requires an attempt, retries and schedules without touching favorites')

            # Browser exercise of metadata/media/provenance UI with an explicit controlled recording.
            recording_url = 'https://upload.wikimedia.org/wikipedia/commons/a/ab/En-us-challenge.ogg'
            source_url = 'https://commons.wikimedia.org/wiki/File:En-us-challenge.ogg'
            fixture = {'query': {'pages': {'9': {'pageid': 9, 'ns': 6, 'title': 'File:En-us-challenge.ogg', 'imageinfo': [{
                'url': recording_url, 'descriptionurl': source_url, 'mime': 'audio/ogg', 'mediatype': 'AUDIO',
                'extmetadata': {'LicenseShortName': {'value': 'CC BY-SA 4.0'}, 'LicenseUrl': {'value': 'https://creativecommons.org/licenses/by-sa/4.0/'}, 'Artist': {'value': '<b>Test Reader</b>'}}
            }]}}}}
            audio = io.BytesIO()
            with wave.open(audio, 'wb') as output:
                output.setnchannels(1)
                output.setsampwidth(2)
                output.setframerate(8000)
                output.writeframes(b'\x00\x00' * 2400)
            page.route('https://commons.wikimedia.org/w/api.php**', lambda route: (external.append(route.request.url), route.fulfill(status=200, content_type='application/json', body=json.dumps(fixture), headers={'Access-Control-Allow-Origin': '*'})))
            page.route(recording_url, lambda route: (external.append(route.request.url), route.fulfill(status=200, content_type='audio/wav', body=audio.getvalue(), headers={'Access-Control-Allow-Origin': '*'})))
            page.locator('#pronunciationSource').select_option('commons')
            page.locator('#speakButton').click()
            page.wait_for_function("localVoiceStatus().source === 'commons' && ['playing','ready'].includes(localVoiceStatus().state)")
            assert page.locator('#audioSourceLink').get_attribute('href') == source_url
            assert page.locator('#audioLicenseLink').get_attribute('href') == 'https://creativecommons.org/licenses/by-sa/4.0/'
            assert 'Test Reader' in page.locator('#audioAttribution').inner_text()
            assert page.locator('#audioAttribution b').count() == 0
            page.locator('#stopLocalVoiceButton').click()
            assert page.locator('#audioSourceLink').is_hidden()
            outcomes.append('controlled Commons fixture plays through browser and shows recording-specific attribution/license')

            # Gstatic success uses a controlled waveform, not a claim about live CDN availability.
            gstatic_url = 'https://ssl.gstatic.com/dictionary/static/sounds/oxford/challenge--_us_1.mp3'
            page.route(gstatic_url, lambda route: (external.append(route.request.url), route.fulfill(status=200, content_type='audio/wav', body=audio.getvalue())))
            page.locator('#pronunciationSource').select_option('auto')
            before = len(external)
            page.locator('#speakButton').click()
            page.wait_for_function("localVoiceStatus().source === 'gstatic' && ['playing','ready'].includes(localVoiceStatus().state)")
            assert external[before:] == [gstatic_url]
            assert page.locator('#audioSourceLink').get_attribute('href') == gstatic_url
            assert page.locator('#audioLicenseLink').is_hidden()
            assert '美式' in page.locator('#audioStatus').inner_text()
            page.locator('#stopLocalVoiceButton').click()
            outcomes.append('controlled Gstatic direct media, exact US URL, source link and no invented license')

            # Short category sessions keep legacy mistakes and hide translations until requested.
            page.evaluate("localStorage.setItem(GSAT_DIAG_KEY, '{}')")
            page.locator('#diagnosticCategory').select_option('詞性轉換')
            page.locator('#diagnosticStart').click()
            assert page.evaluate('gsatDiagnosticSession.length') == 6
            assert not page.locator('.diagnostic-hint .practice-meaning').is_visible()
            page.locator('.diagnostic-hint summary').click()
            assert page.locator('.diagnostic-hint .practice-meaning').is_visible()
            q = page.evaluate('gsatDiagnosticSession[0]')
            page.locator(f'[data-option="{(q["answer"] + 1) % 4}"]').click()
            assert q['explanation'] in page.locator('.diagnostic-explain').inner_text()
            assert page.evaluate('diagnosticWrongCount()') == 1
            page.locator('#diagnosticReview').click()
            assert page.evaluate('gsatDiagnosticSession.length') == 1
            page.locator(f'[data-option="{q["answer"]}"]').click()
            assert page.evaluate('diagnosticWrongCount()') == 0
            page.locator('#diagnosticCategory').select_option('')
            page.locator('#diagnosticStart').click()
            assert page.evaluate('gsatDiagnosticSession.length') == 10
            outcomes.append('category selection, ten-question sessions, optional hints, feedback and correct-only mistake removal')

            for width in (390, 320):
                page.set_viewport_size({'width': width, 'height': 844})
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
                page.locator('.retrieval-start').click()
                assert page.locator('#retrievalAnswer').is_visible()
                page.locator('.retrieval-exit').click()
                assert page.locator('#notebookSenses .original-meaning-text').is_visible()
            page.screenshot(path='/tmp/e-learning-320.png', full_page=True)
            page.locator('.diagnostic-panel').screenshot(path='/tmp/e-diagnostic-320.png')
            assert not errors, errors
            assert not failed_local, failed_local
            browser.close()
        print(json.dumps({'passed': outcomes, 'mobileWidths': [390, 320], 'automaticExternalRequests': 0}, ensure_ascii=False, indent=2))
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    main()
