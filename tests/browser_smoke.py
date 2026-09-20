"""Run: python tests/browser_smoke.py; requires chromium and python playwright."""
import json,threading,http.server,socketserver,time,pathlib,os
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*a,**k):super().__init__(*a,directory=str(ROOT),**k)
    def log_message(self,*a):pass
class Server(socketserver.ThreadingMixIn,http.server.HTTPServer):daemon_threads=True
httpd=Server(('127.0.0.1',0),Handler);threading.Thread(target=httpd.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{httpd.server_port}/'
records=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--proxy-bypass-list=*'])
  context=browser.new_context(viewport={'width':1330,'height':850})
  context.add_init_script("localStorage.setItem('gsat-standalone-favorites-v1',JSON.stringify(['challenge','legacy-word']));")
  page=context.new_page()
  page.on('request',lambda request:records.append(request.url) if 'reference-details.json' in request.url else None)
  page.on('pageerror',lambda err:print('PAGEERROR:',str(err)))
  # block remote APIs only after local startup; browser should not proxy loopback
  page.goto(base,wait_until='domcontentloaded',timeout=60000)
  page.locator('#bootStatus').wait_for(state='hidden',timeout=45000)
  print('START',page.locator('#totalCount').inner_text(),page.locator('#collocationCount').inner_text(), 'V6' in page.title())
  assert page.locator('#totalCount').inner_text()=='6,012'
  assert page.evaluate("localStorage.getItem('gsat-standalone-favorites-v1')")== '["challenge","legacy-word"]'
  assert len(records)==0,records
  page.locator('#searchInput').fill('carbon emissions');page.wait_for_timeout(200)
  print('SEARCH RESULTS',page.locator('#resultCount').inner_text())
  assert page.locator('#resultCount').inner_text()!='0'
  page.locator('#diagnosticStart').click();page.locator('.diagnostic-option').count() # may be zero; just progress
  print('DIAGNOSTIC',page.locator('.diagnostic-progress').inner_text())
  # Force deterministic wrong answer, then repeat wrong review and choose correct by question answer index.
  page.locator('.diagnostic-options button').first.click()
  wrong=page.locator('.diagnostic-options button.wrong').count()
  if not wrong:
   page.locator('.practice-next').click()
   page.locator('.diagnostic-options button').first.click()
  print('MISTAKES',page.locator('#diagnosticWrongCount').inner_text())
  assert int(page.locator('#diagnosticWrongCount').inner_text())>=1
  # Navigate to cited 'fuel', expand a real quote. Fetch happens only here.
  page.locator('#searchInput').fill('fuel');page.wait_for_timeout(220)
  # Click word in result list if present; likely search auto-select not on input.
  page.locator('#wordList').get_by_text('fuel',exact=True).first.click()
  page.locator('.pattern-references').first.locator('summary').click()
  page.wait_for_timeout(650)
  assert len(records)==1,records
  quote=page.locator('.pattern-references blockquote[data-source-id]').count()
  loaded=page.locator('.pattern-references blockquote').first.inner_text()
  print('LAZY LOAD',quote,loaded[:95]);assert quote==0 and '載入' not in loaded
  print('FAVORITES',page.evaluate("localStorage.getItem('gsat-standalone-favorites-v1')"))
  assert page.evaluate("localStorage.getItem('gsat-standalone-favorites-v1')")== '["challenge","legacy-word"]'
  page.screenshot(path=str(ROOT/'tests/browser_screenshot.png'),full_page=False)
  browser.close()
 print('BROWSER SMOKE PASSED')
finally:httpd.shutdown()
