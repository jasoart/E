"""Exercise the V2 notebook in a real Chromium page; no device audio claim."""
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
    base = f'http://127.0.0.1:{server.server_port}/'
    outcomes = []
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE', '/usr/bin/chromium'), args=['--no-sandbox', '--disable-dev-shm-usage'])
            context = browser.new_context(viewport={'width': 1280, 'height': 900})
            context.add_init_script("localStorage.setItem('gsat-standalone-favorites-v1', '[\"challenge\",\"legacy-word\"]');")
            page = context.new_page()
            errors, external, failed_local, lexical_requests = [], [], [], []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('response', lambda response: failed_local.append(response.url) if response.url.startswith(base) and response.status >= 400 else None)
            page.on('request', lambda request: lexical_requests.append(request.url) if request.url.endswith('/assets/data/wordnet-learning.json') else None)
            page.route('https://**/*', lambda route: (external.append(route.request.url), route.abort()))

            def lookup(word):
                page.locator('#allTab').click()
                page.locator('#searchInput').fill(word)
                page.wait_for_function('word => searchTimer === null && state.query === word', arg=word)
                page.locator('#wordList .row').first.click()
                assert page.locator('#wordDetail h2').inner_text() == word

            page.goto(base, wait_until='load')
            page.locator('#bootStatus').wait_for(state='hidden')
            assert page.locator('#totalCount').inner_text() == '6,012'
            stats = page.evaluate('notebookStats()')
            assert stats['words'] >= 200 and stats['collocations'] >= 800 and stats['examples'] >= 400, stats
            assert page.locator('#aiSearchButton').count() == 0
            assert page.locator('#loadLocalVoiceButton').count() == 0
            outcomes.append('V2 data counts, 6,012 original words, no AI/model controls')

            page.locator('#notebookTab').click()
            assert page.evaluate('state.filtered.every(({entry}) => !!getExamNotebook(entry))')
            assert page.locator('#wordList .row').count() == 60
            outcomes.append('browse V2 notes with pagination')

            # V2 must reach ordinary words as well as the editorial subset.
            assert stats['words'] == page.evaluate('VOCABULARY.length')
            assert stats['guidedWords'] > 5000
            page.locator('#notebookSource').select_option('guided')
            assert page.evaluate("state.filtered.every(({entry}) => getExamNotebook(entry).provenance === 'source-guided')")
            guided_word = page.evaluate("VOCABULARY.find(entry => getExamNotebook(entry).provenance === 'source-guided' && !getExamNotebook(entry).collocations.length).word")
            lookup(guided_word)
            assert '學測情境導讀' in page.locator('.notebook-intro').inner_text()
            assert page.locator('#notebookRelations .notebook-contrast').count() == 2
            assert '完整句' in page.locator('#notebookCollocations').inner_text()
            assert page.locator('.notebook-sentence-guide').count() >= 2
            assert '仿學測自編' not in page.locator('#exampleResults').inner_text()
            assert not lexical_requests, lexical_requests
            page.locator('.notebook-sentence-guide').first.evaluate('(element) => { element.open = true; }')
            assert '原句鄰近字' in page.locator('.notebook-sentence-guide').first.inner_text()
            page.locator('.retrieval-start').click()
            assert not page.locator('#exampleCard').is_visible()
            assert not page.locator('#notebookRelations').is_visible()
            assert page.locator('.retrieval-reference').count() == 0
            page.locator('.retrieval-reveal').click()
            assert '請先寫下' in page.locator('.retrieval-feedback').inner_text()
            page.locator('#retrievalAnswer').fill('My first attempt.')
            page.locator('.retrieval-reveal').click()
            assert page.locator('.retrieval-reference').is_visible()
            page.locator('.retrieval-exit').click()
            assert page.locator('#exampleCard').is_visible()
            page.locator('#searchInput').fill('')
            page.wait_for_function("state.query === '' && searchTimer === null")
            page.locator('#notebookTab').click()
            page.locator('#notebookSource').select_option('curated')
            assert page.locator('#wordList .row').count() > 0
            assert page.evaluate('state.filtered.every(({entry}) => !!getCuratedExamNotebook(entry))')
            page.locator('#notebookSource').select_option('')
            outcomes.append('all-word V2 coverage, provenance filters, guided reading and gated sentence recall')

            assert stats['grammarPatterns'] == 232
            page.locator('.stats-extra > summary').click()
            assert page.locator('#notebookGrammarPatternCount').inner_text() == '232'
            page.locator('.stats-extra > summary').click()
            for word in ('although', 'to', 'which'):
                lookup(word)
                assert '文法句型' in page.locator('#notebookCollocations').inner_text()
                assert '開始句型回想' in page.locator('.retrieval-start').inner_text()
                assert page.locator('.notebook-reference-links a').count() >= 1
                assert page.locator('.notebook-lexical').count() == 0
            page.locator('.retrieval-start').click()
            assert not page.locator('#notebookSenses').is_visible()
            assert not page.locator('#notebookCollocations').is_visible()
            assert page.locator('.retrieval-reference').count() == 0
            page.locator('.retrieval-forgot').click()
            assert 'which' in page.locator('.retrieval-reference').inner_text()
            assert page.locator('.retrieval-good').is_disabled()
            page.locator('.retrieval-exit').click()
            assert page.locator('#notebookCollocations').is_visible()
            lookup('she (her, hers, herself)')
            assert '語法形式' in page.locator('#notebookFamily').inner_text()
            assert 'herself' in page.locator('#notebookFamily').inner_text()
            lookup('pajamas')
            assert 'pair' in page.locator('#notebookFamily').inner_text()
            outcomes.append('dedicated function-word grammar, pronoun forms, sources and gated pattern recall')

            lookup('bank')
            page.locator('#notebookRelations .notebook-lexical').evaluate('(element) => { element.open = true; }')
            page.wait_for_function("() => document.querySelector('#notebookRelations .notebook-lexical').dataset.lexicalLoaded === 'true'")
            senses = page.locator('#notebookRelations .notebook-lexical-items').inner_text()
            assert 'body of water' in senses and 'financial institution' in senses
            assert 'WordNet 3.1' in page.locator('#notebookRelations').inner_text()
            lookup('teacher')
            page.locator('#notebookFamily .notebook-lexical').evaluate('(element) => { element.open = true; }')
            page.wait_for_function("() => document.querySelector('#notebookFamily .notebook-lexical').dataset.lexicalLoaded === 'true'")
            assert 'teach' in page.locator('#notebookFamily .notebook-lexical-items').inner_text()
            assert len(lexical_requests) == 1, lexical_requests
            outcomes.append('lazy dictionary senses and explicit derivations with one same-origin request')

            lookup('elbow')
            assert '擠' in page.locator('#notebookSenses').inner_text()
            assert 'elbow' in page.locator('#notebookCollocations').inner_text()
            assert 'KK 美式' in page.locator('.title-row .phonetic').inner_text()
            assert page.locator('#exampleResults .builtin-source').all_inner_texts() == ['仿學測自編'] * page.locator('#exampleResults .builtin-source').count()
            page.locator('.notebook-evidence').evaluate('(element) => { element.open = true; }')
            page.wait_for_function("() => document.querySelector('.notebook-evidence-items').textContent.includes('elbow')")
            evidence = page.locator('.notebook-evidence-items').inner_text()
            assert '選項' in evidence and '115' in evidence
            outcomes.append('elbow verb sense, chunks, KK, original question and option')

            for word in ('elbow', 'tight', 'exacerbate'):
                lookup(word)
                page.locator('#examTab').click()
                page.locator('#examYearFilters [data-year="115"]').click()
                assert page.locator('#wordList .row').count() > 0, word
                assert page.evaluate('word => state.filtered.some(({entry}) => entry.word === word)', word), word
            outcomes.append('newly verified elbow, tight and exacerbate appear in 115 exam filter')

            lookup('exacerbate')
            assert 'add fuel to the fire' in page.locator('#notebookRelations').inner_text().lower()
            assert 'exacerbation' in page.locator('#notebookFamily').inner_text()
            assert '補充' in page.locator('#wordDetail .topline').inner_text()
            assert '缺乏溝通' in page.locator('#exampleResults').inner_text() or 'communication' in page.locator('#exampleResults').inner_text()
            outcomes.append('supplemental word, contextual idiom, family and writing examples')

            lookup('responsive')
            assert 'to' in page.locator('#notebookCollocations .chunk-preposition').all_inner_texts()
            question = page.evaluate('builtinClozeQuestion(VOCABULARY[state.selectedIndex], builtinExampleResult(VOCABULARY[state.selectedIndex]).examples[0])')
            page.locator('#builtinClozeInput').fill('wrong')
            page.locator('#builtinClozeCheck').click()
            assert page.locator('#builtinClozeFeedback').get_attribute('data-correct') == 'false'
            page.locator('#builtinClozeRetry').click()
            page.locator('#builtinClozeInput').fill(question['answer'])
            page.locator('#builtinClozeCheck').click()
            assert page.locator('#builtinClozeFeedback').get_attribute('data-correct') == 'true'
            outcomes.append('responsive to and corrected cloze retrieval')

            # Existing stored IDs survive the extra entries and sentence replacement.
            lookup('challenge')
            page.locator('#favoriteButton').click()
            assert json.loads(page.evaluate("localStorage.getItem('gsat-standalone-favorites-v1')")) == ['legacy-word']
            page.locator('#favoriteButton').click()
            assert set(json.loads(page.evaluate("localStorage.getItem('gsat-standalone-favorites-v1')"))) == {'challenge', 'legacy-word'}
            page.locator('#reviewGood').click()
            assert 'challenge' in json.loads(page.evaluate("localStorage.getItem('gsat-v3-review-queue-v1')"))
            outcomes.append('original favorites and review persistence')

            assert not external, external
            for width in (390, 320):
                page.set_viewport_size({'width': width, 'height': 844})
                lookup('exacerbate')
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{width}px horizontal overflow'
                assert page.locator('#notebookFamily').inner_text()
                lookup(guided_word)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{width}px guided notebook overflow'
                assert page.locator('.retrieval-start').is_visible()
                lookup('to')
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{width}px grammar pattern overflow'
                lookup('she (her, hers, herself)')
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{width}px pronoun form overflow'
            page.screenshot(path='/tmp/e-notebook-mobile.png', full_page=True)
            outcomes.append('390px and 320px notebook layout without horizontal overflow')

            # Only a deliberate pronunciation click contacts providers. Abort all
            # metadata requests to verify fallback; this is not real audio validation.
            lookup('exacerbate')
            page.locator('#speakButton').click()
            page.wait_for_function("() => ['unavailable','playing','ready'].includes(localVoiceStatus().state)")
            assert len(external) == 3, external
            assert external[0] == 'https://ssl.gstatic.com/dictionary/static/sounds/oxford/exacerbate--_us_1.mp3', external
            assert external[1] == 'https://api.dictionaryapi.dev/api/v2/entries/en/exacerbate', external
            assert external[2].startswith('https://commons.wikimedia.org/w/api.php?'), external
            assert '模型' not in page.locator('#audioStatus').inner_text()
            outcomes.append('explicit Gstatic then dictionary then Commons requests and offline/device outcome')
            assert not errors, errors
            assert not failed_local, failed_local
            browser.close()
        print(json.dumps({'passed': outcomes, 'notebook': stats, 'pageErrors': errors, 'failedLocalResources': failed_local,
                          'audio': 'all recording providers deliberately aborted; real audio/device quality untested'}, ensure_ascii=False, indent=2))
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    main()
