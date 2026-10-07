'use strict';
// Run: node --test tests/exam-notes.cjs. Uses released data and Node's VM only.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const evidence = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/exam-evidence.json'), 'utf8'));

function element() {
  const listeners = new Map(), classes = new Set();
  return {
    innerHTML: '', textContent: '', hidden: false, value: '', disabled: false,
    dataset: {}, className: '', isConnected: true, children: [],
    addEventListener(type, callback) { listeners.set(type, callback); },
    emit(type = 'click') { listeners.get(type)?.({currentTarget: this, preventDefault() {}}); },
    setAttribute() {}, querySelectorAll() { return []; }, querySelector() { return null; },
    appendChild(child) { this.children.push(child); }, scrollIntoView() {}, scrollTo() {}, focus() {},
    classList: {
      add(value) { classes.add(value); }, remove(value) { classes.delete(value); },
      contains(value) { return classes.has(value); },
      toggle(value, enabled) {
        const on = enabled ?? !classes.has(value);
        on ? classes.add(value) : classes.delete(value);
        return on;
      },
    },
  };
}

function environment({fetchImpl} = {}) {
  const nodes = new Map(), writes = [], requests = [];
  const stored = new Map([
    ['gsat-standalone-favorites-v1', '["challenge","legacy-custom-word"]'],
    ['gsat-v3-review-queue-v1', '{"challenge":{"stage":2,"due":"2027-01-01"}}'],
  ]);
  const get = id => {
    if (!nodes.has(id)) nodes.set(id, element());
    return nodes.get(id);
  };
  const context = {
    console, URL, URLSearchParams, performance, setTimeout, clearTimeout, innerWidth: 1280,
    navigator: {}, matchMedia: () => ({matches: false}),
    localStorage: {
      getItem: key => stored.get(key) ?? null,
      setItem(key, value) { writes.push(key); stored.set(key, String(value)); },
    },
    document: {
      getElementById: get, createElement: element, querySelectorAll: () => [],
      addEventListener() {}, activeElement: {tagName: 'BODY'}, body: element(),
    },
    fetch(url, options) {
      requests.push({url, options});
      return fetchImpl ? fetchImpl(url, options) : Promise.resolve({ok: true, json: async () => evidence});
    },
    stopPronunciation() {}, speakWord() {}, speakSentence() {},
    localVoiceStatus: () => ({message: '裝置英文語音'}),
  };
  context.window = context;
  vm.createContext(context);
  const load = file => vm.runInContext(fs.readFileSync(path.join(root, 'assets', file), 'utf8'), context, {filename: file});
  const run = code => vm.runInContext(code, context);
  for (const file of ['js/config.js', 'data/vocabulary.js', 'data/collocations.js', 'data/learning.js', 'data/builtin-study.js']) load(file);
  const originalVocabulary = run('JSON.stringify(VOCABULARY)');
  const originalStudies = JSON.parse(run('JSON.stringify(BUILTIN_STUDY_DATA.entries)'));
  for (const file of ['data/kk-pronunciation.js', 'data/exam-notebook.js', 'data/exam-evidence-index.js', 'js/exam-notes.js', 'js/state.js', 'js/builtin.js', 'js/search.js', 'js/examples.js', 'js/ui.js', 'js/favorites.js']) load(file);
  return {run, context, get, requests, stored, writes, originalVocabulary, originalStudies};
}

function sourceDetails(word, {open = true, connected = true} = {}) {
  const host = element(), details = element();
  host.innerHTML = 'waiting';
  details.open = open;
  details.isConnected = connected;
  details.dataset.evidenceWord = word;
  details.querySelector = selector => selector === '.notebook-evidence-items' ? host : null;
  return {details, host};
}

function selectAndRender(e, word) {
  e.context.requestedWord = word;
  e.run('state.selectedIndex=VOCABULARY.findIndex(entry=>entry.word===requestedWord)');
  assert.ok(e.run('state.selectedIndex') >= 0, `Missing live word: ${word}`);
  e.run('renderDetail(VOCABULARY[state.selectedIndex], state.selectedIndex)');
}

test('the original 6,012 exact entries and saved IDs survive additive notebook integration', () => {
  const e = environment();
  assert.equal(JSON.parse(e.originalVocabulary).length, 6012);
  assert.equal(e.run('GSAT_OFFICIAL_VOCABULARY_COUNT'), 6012);
  assert.equal(e.run('JSON.stringify(VOCABULARY.slice(0,GSAT_OFFICIAL_VOCABULARY_COUNT))'), e.originalVocabulary);
  assert.equal(e.run('new Set(VOCABULARY.map(entry=>entry.word)).size'), e.run('VOCABULARY.length'));
  const supplemental = JSON.parse(e.run('JSON.stringify(VOCABULARY.slice(GSAT_OFFICIAL_VOCABULARY_COUNT))'));
  assert.ok(supplemental.length > 0, 'Missing supplemental words');
  for (const entry of supplemental) {
    assert.equal(entry.supplemental, true, entry.word);
    assert.match(entry.source, /補充|不列入|延伸/, entry.word);
  }
  selectAndRender(e, 'exacerbate');
  assert.match(e.get('wordDetail').innerHTML, /補充詞彙/);
  assert.match(e.get('wordDetail').innerHTML, /原 6,012 詞條以外/);
  assert.doesNotMatch(e.get('wordDetail').innerHTML, /class="badge">LEVEL 6/);
  assert.equal(e.stored.get('gsat-standalone-favorites-v1'), '["challenge","legacy-custom-word"]');
  assert.equal(e.stored.get('gsat-v3-review-queue-v1'), '{"challenge":{"stage":2,"due":"2027-01-01"}}');
  assert.equal(e.writes.length, 0, 'Loading and rendering must not migrate user progress');
});

test('released notebook coverage is reachable and the displayed totals match its data', () => {
  const e = environment();
  const result = JSON.parse(e.run(`JSON.stringify((()=>{
    const notes=Object.values(GSAT_EXAM_NOTEBOOK.entries||{});
    const reachable=new Set(VOCABULARY.map(getExamNotebook).filter(Boolean));
    return {heads:notes.length,reachable:reachable.size,listedWords:VOCABULARY.filter(entry=>getExamNotebook(entry)).length,
      chunks:notes.reduce((sum,note)=>sum+(note.collocations?.length||0),0),
      examples:notes.reduce((sum,note)=>sum+(note.examples?.length||0),0),
      stats:notebookStats(), missing:notes.filter(note=>!reachable.has(note)).length};
  })())`));
  assert.ok(result.heads >= 200, `Only ${result.heads} notebook headwords`);
  assert.ok(result.chunks >= 800, `Only ${result.chunks} collocations`);
  assert.ok(result.examples >= 400, `Only ${result.examples} authored examples`);
  assert.equal(result.missing, 0, 'Curated entries must be reachable through actual vocabulary IDs');
  assert.equal(result.reachable, result.heads);
  assert.equal(result.stats.words, result.heads);
  assert.equal(result.stats.listedWords, result.listedWords);
  assert.equal(result.stats.collocations, result.chunks);
  assert.equal(result.stats.examples, result.examples);
  assert.equal(result.stats.supplemental, e.run('VOCABULARY.length-GSAT_OFFICIAL_VOCABULARY_COUNT'));
});

test('every released replacement example can be practiced for its actual target ID, including supplements', () => {
  const e = environment();
  const result = JSON.parse(e.run(`JSON.stringify((()=>{
    const failures=[]; let checked=0,supplemental=0;
    for(const entry of VOCABULARY){
      const note=getExamNotebook(entry); if(!note?.examples?.length)continue;
      for(const example of builtinExampleResult(entry).examples){
        checked++; if(entry.supplemental)supplemental++;
        const question=builtinClozeQuestion(entry,example);
        if(!question)failures.push(entry.word+': target absent from '+example.text);
        else if(!checkBuiltinAnswer(question,question.answer.toUpperCase()))failures.push(entry.word+': actual answer rejected');
        if(example.examStyle!==true||example.source!=='self-authored')failures.push(entry.word+': replacement provenance missing');
        if(!example.translationZh||!example.grammar||!example.writingTip)failures.push(entry.word+': teaching fields missing');
      }
    }
    return {checked,supplemental,failures};
  })())`));
  assert.deepEqual(result.failures, [], result.failures.slice(0, 15).join('\n'));
  assert.ok(result.checked >= 400, `Only ${result.checked} live replacement examples`);
  assert.ok(result.supplemental > 0);
});

test('Anki examples move to the archive while authored exam-style sentences become primary', () => {
  const e = environment();
  const word = e.run(`VOCABULARY.find(entry=>getExamNotebook(entry)?.examples?.length&&
    getOriginalStudy(entry)?.examples?.some(example=>example.source==='uploaded-anki'))?.word`);
  assert.ok(word, 'Need a real imported example to exercise the replacement and archive paths');
  e.context.requestedWord = word;
  const archive = JSON.parse(e.run('JSON.stringify(getOriginalStudy(requestedWord))'));
  assert.deepEqual(archive, e.originalStudies[word]);
  selectAndRender(e, word);
  assert.match(e.get('exampleResults').innerHTML, /仿學測自編/);
  assert.doesNotMatch(e.get('exampleResults').innerHTML, /class="builtin-source">上傳教材/);
  assert.match(e.get('wordDetail').innerHTML, /原有與上傳教材例句/);
  const imported = archive.examples.find(example => example.source === 'uploaded-anki');
  e.context.importedText = imported.text;
  assert.ok(e.get('wordDetail').innerHTML.includes(e.run('escapeHtml(importedText)')));
  assert.equal(e.requests.length, 0, 'Rendering a notebook must not eagerly fetch citations');
});

test('new words, usage chunks, idioms and word-family terms enter the existing search', () => {
  const e = environment();
  for (const word of ['exacerbate', 'responsive']) {
    e.context.query = word;
    assert.equal(e.run('hybridSearch(query)[0].entry.word'), word);
    assert.ok(e.run('getExamNotebook(query)'), `Missing curated note for ${word}`);
  }
  assert.ok(e.run('hybridSearch("add fuel to the fire").some(row=>row.entry.word==="exacerbate")'));
  assert.ok(e.run('hybridSearch("exacerbation").some(row=>row.entry.word==="exacerbate")'));
  assert.ok(e.run('hybridSearch("responsive to").some(row=>row.entry.word==="responsive")'));
  assert.ok(e.run(`(()=>{const entry=VOCABULARY.find(item=>item.word==='elbow'), note=getExamNotebook(entry);
    return note.senses.every(sense=>searchFields(entry).meaning.includes(normalizeSearchValue(sense.meaning)));})()`));
  assert.equal(e.requests.length, 0, 'Search must remain local');
});

test('KK transcription is labelled by its actual source and unsafe provenance links are rejected', () => {
  const e = environment();
  const word = e.run('VOCABULARY.find(entry=>GSAT_KK_PRONUNCIATION.entries?.[entry.word]?.length)?.word');
  assert.ok(word, 'Missing released KK transcription data');
  e.context.requestedWord = word;
  const display = e.run('renderNotebookPhonetic(VOCABULARY.find(entry=>entry.word===requestedWord),null)');
  const details = e.run('renderPronunciationDetails(VOCABULARY.find(entry=>entry.word===requestedWord))');
  assert.match(display, /CMUdict 轉寫/);
  assert.match(details, /並非來源字典原刊的 KK 標記/);
  assert.match(details, /未將多種讀音自行指定給詞性/);
  assert.match(details, /授權說明/);
  const unsafe = e.run('renderNotebookPhonetic({word:"not-in-dictionary",pronunciation:"/original/"},{kk:{value:"/fabricated/",sourceUrl:"javascript:alert(1)"}})');
  assert.doesNotMatch(unsafe, /fabricated|javascript:/);
  assert.match(unsafe, /KK 尚未收錄/);
});

test('notebook definitions, relationships, examples, archive and provenance escape supplied text', () => {
  const e = environment();
  e.context.payload = '<img src=x onerror="alert(1)">';
  const rendered = e.run(`(()=>{
    const note={senses:[{pos:payload,meaning:payload,usage:payload}],
      synonyms:[{en:payload,zh:payload,note:payload}],idioms:[{en:payload,zh:payload,note:payload}],
      family:[{word:payload,pos:payload,meaning:payload}]};
    return renderNotebookSenses({meaning:payload},null,note)+renderNotebookRelations(note)+renderNotebookFamily(note)+
      renderGsatExampleCard({text:payload,translationZh:payload,topic:payload,grammar:payload,writingTip:payload,sourceLabel:payload},1)+
      renderNotebookSource({word:payload},note)+
      renderNotebookPhonetic({word:'unknown'},{kk:{value:payload,sourceLabel:payload,sourceUrl:'https://example.org/?q='+encodeURIComponent(payload)}});
  })()`);
  assert.doesNotMatch(rendered, /<img\b/);
  assert.match(rendered, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.doesNotMatch(rendered, /data-evidence-word="<img/);
});

test('source excerpts load only on expansion, share a request, and keep options distinct from answers', async () => {
  const e = environment();
  const responsive = sourceDetails('responsive', {open: false});
  e.context.sourceNode = responsive.details;
  await e.run('loadNotebookEvidence(sourceNode)');
  assert.equal(e.requests.length, 0);
  responsive.details.open = true;
  await e.run('loadNotebookEvidence(sourceNode)');
  assert.equal(e.requests.length, 1);
  assert.equal(e.requests[0].url, './assets/data/exam-evidence.json');
  assert.match(responsive.host.innerHTML, /responsive to/);
  assert.match(responsive.host.innerHTML, /選項用語 · 非正解標記/);
  assert.match(responsive.host.innerHTML, /教學整理/);
  const tight = sourceDetails('tight');
  e.context.sourceNode = tight.details;
  await e.run('loadNotebookEvidence(sourceNode)');
  assert.match(tight.host.innerHTML, /______ schedule/);
  assert.match(tight.host.innerHTML, /B: tight/);
  assert.match(tight.host.innerHTML, /未核對官方答案/);
  const exacerbate = sourceDetails('exacerbate');
  e.context.sourceNode = exacerbate.details;
  await e.run('loadNotebookEvidence(sourceNode)');
  assert.match(exacerbate.host.innerHTML, /exacerbated the situation/);
  assert.match(exacerbate.host.innerHTML, /Added fuel to the fire/);
  assert.match(exacerbate.host.innerHTML, /本文用語/);
  assert.match(exacerbate.host.innerHTML, /選項用語 · 非正解標記/);
  assert.equal(e.requests.length, 1, 'All notebook citations should share the same local dataset request');
  assert.equal(evidence.verification.entryCount, evidence.records.length);
  assert.ok(evidence.records.every(record => record.officialAnswerVerified === false));
});

test('pending evidence never updates a detached old word panel or contaminates the next word', async () => {
  let resolveRequest;
  const e = environment({fetchImpl: () => new Promise(resolve => { resolveRequest = resolve; })});
  const old = sourceDetails('exacerbate'), current = sourceDetails('responsive');
  e.context.oldNode = old.details;
  const oldLoad = e.run('loadNotebookEvidence(oldNode)');
  old.details.isConnected = false;
  e.context.currentNode = current.details;
  const currentLoad = e.run('loadNotebookEvidence(currentNode)');
  assert.equal(e.requests.length, 1);
  resolveRequest({ok: true, json: async () => evidence});
  await Promise.all([oldLoad, currentLoad]);
  assert.equal(old.host.innerHTML, 'waiting');
  assert.match(current.host.innerHTML, /responsive to/);
  assert.doesNotMatch(current.host.innerHTML, /exacerbated the situation/);
  assert.equal(old.details.dataset.evidenceLoaded, undefined);
  assert.equal(current.details.dataset.evidenceLoaded, 'true');
});

test('citation metadata and quotations escape malicious markup without changing stored evidence', async () => {
  const payload = '<img src=x onerror="alert(1)">';
  const altered = structuredClone(evidence);
  const record = altered.records.find(item => item.headword === 'tight');
  for (const key of ['excerpt', 'pattern', 'meaningZh', 'location', 'filename', 'candidateOption', 'noteZh']) record[key] = payload;
  const e = environment({fetchImpl: async () => ({ok: true, json: async () => altered})});
  const source = sourceDetails('tight');
  e.context.sourceNode = source.details;
  await e.run('loadNotebookEvidence(sourceNode)');
  assert.doesNotMatch(source.host.innerHTML, /<img\b/);
  assert.ok((source.host.innerHTML.match(/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/g) || []).length >= 7);
  assert.equal(evidence.records.find(item => item.headword === 'tight').excerpt.includes(payload), false);
});

test('failed citation requests can retry after recovery and uncurated words do not gain invented sources', async () => {
  let calls = 0;
  const e = environment({fetchImpl: async () => {
    calls++;
    if (calls === 1) throw Error('temporarily unavailable');
    return {ok: true, json: async () => evidence};
  }});
  const source = sourceDetails('responsive');
  e.context.sourceNode = source.details;
  await e.run('loadNotebookEvidence(sourceNode)');
  assert.match(source.host.innerHTML, /暫時無法載入/);
  assert.equal(source.details.dataset.evidenceLoaded, undefined);
  await e.run('loadNotebookEvidence(sourceNode)');
  assert.match(source.host.innerHTML, /responsive to/);
  assert.equal(calls, 2);
  const absent = sourceDetails('no-such-word-in-the-exam');
  e.context.sourceNode = absent.details;
  await e.run('loadNotebookEvidence(sourceNode)');
  assert.match(absent.host.innerHTML, /未收錄此詞/);
  assert.doesNotMatch(absent.host.innerHTML, /notebook-evidence-record/);
});

test('the notebook-only view reaches all curated live IDs and respects search and level filters', () => {
  const e = environment();
  const expected = e.run('VOCABULARY.filter(entry=>getExamNotebook(entry)).length');
  e.run('setListMode("notebook")');
  assert.equal(e.run('state.notebookOnly'), true);
  assert.equal(e.run('state.filtered.length'), expected);
  assert.ok(e.run('state.filtered.every(row=>getExamNotebook(row.entry))'));
  assert.equal(e.get('notebookTab').classList.contains('on'), true);
  e.run('state.query="exacerbate";applyFilters()');
  assert.equal(e.run('state.filtered[0].entry.word'), 'exacerbate');
  e.run('state.query="";state.levels=new Set([1]);applyFilters()');
  assert.ok(e.run('state.filtered.every(row=>row.entry.level===1&&getExamNotebook(row.entry))'));
  e.run('state.levels=new Set(LEVELS);setListMode("all")');
  assert.equal(e.run('state.notebookOnly'), false);
  assert.equal(e.run('state.filtered.length'), e.run('VOCABULARY.length'));
});

test('all live words show the complete original meaning in the primary senses field', () => {
  const e = environment();
  assert.equal(e.run(`VOCABULARY.every(entry => {
    const html=renderNotebookSenses(entry,getBuiltinStudy(entry),getExamNotebook(entry));
    return html.includes('<p class="original-meaning-text">'+escapeHtml(entry.meaning||"原詞表未附釋意")+'</p>')
      && !html.includes('<details') && !html.includes(' hidden');
  })`), true);
  e.run('renderDetail(VOCABULARY.find(entry=>entry.word==="challenge"),0)');
  const html=e.get('wordDetail').innerHTML;
  const senses=html.slice(html.indexOf('id="notebookSenses"'),html.indexOf('id="notebookCollocations"'));
  for(const meaning of ['盤問','要求','懷疑','表示異議'])assert.ok(senses.includes(meaning),meaning);
  assert.ok(senses.includes(e.originalStudies.challenge.plainMeaning));
  e.context.originalStudies=e.originalStudies;
  assert.equal(e.run(`VOCABULARY.every(entry => {
    const original=originalStudies[entry.word];
    if(!original)return true;
    const html=renderNotebookSenses(entry,getBuiltinStudy(entry),getExamNotebook(entry));
    return (!original.plainMeaning||html.includes(escapeHtml(original.plainMeaning)))
      && (!original.ankiMeaning||html.includes(escapeHtml(original.ankiMeaning)));
  })`),true);
  assert.ok(senses.includes('學測情境補充與用法'));
  assert.match(e.run('notebookPartOfSpeech(VOCABULARY.find(entry=>entry.word==="mean"))'),/n\./);
  assert.match(e.run('notebookPartOfSpeech(VOCABULARY.find(entry=>entry.word==="right"))'),/vt\./);
});

test('full original and uploaded meanings stay escaped alongside curated senses', () => {
  const e=environment();
  e.context.meaningEntry={meaning:'n. 全部原義 <img src=x onerror=alert(1)>',partOfSpeech:'n.'};
  e.context.meaningStudy={ankiMeaning:'<script>上傳釋意</script>'};
  const html=e.run('renderNotebookSenses(meaningEntry,meaningStudy,{senses:[{pos:"n.",meaning:"補充義",usage:"語境"}]})');
  assert.ok(html.includes('全部原義 &lt;img'));
  assert.ok(html.includes('&lt;script&gt;上傳釋意&lt;/script&gt;'));
  assert.ok(html.includes('補充義'));
  assert.doesNotMatch(html,/<img|<script|<details/);
});
