'use strict';
// Run: node --test tests/exam-year-index.cjs. No external requests or packages.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createHash} = require('node:crypto');

const root = path.resolve(__dirname, '..');
const sourceBytes = fs.readFileSync(path.join(root, 'assets/data/exam-evidence.json'));
const evidence = JSON.parse(sourceBytes);

function element() {
  const classes = new Set();
  return {innerHTML: '', textContent: '', hidden: false, dataset: {}, value: '',
    isConnected: true, className: '', addEventListener() {}, setAttribute() {},
    querySelectorAll: () => [], querySelector: () => null, scrollIntoView() {},
    scrollTo() {}, appendChild() {}, focus() {}, classList: {
      add: value => classes.add(value), remove: value => classes.delete(value),
      toggle(value, enabled) { enabled ? classes.add(value) : classes.delete(value); },
      contains: value => classes.has(value),
    }};
}

function environment({loadIndex = true} = {}) {
  const nodes = new Map(), requests = [];
  const get = id => {
    if (!nodes.has(id)) nodes.set(id, element());
    return nodes.get(id);
  };
  const context = {console, URL, URLSearchParams, performance, setTimeout, clearTimeout,
    innerWidth: 1280, navigator: {}, matchMedia: () => ({matches: false}),
    localStorage: {getItem: () => null, setItem() {}},
    document: {getElementById: get, querySelectorAll: () => [], addEventListener() {},
      activeElement: {}, createElement: element, body: element()},
    fetch(url) { requests.push(url); return Promise.resolve({ok: true, json: async () => evidence}); },
    stopPronunciation() {}, speakWord() {}, speakSentence() {},
    localVoiceStatus: () => ({message: '裝置英文語音'}),
  };
  context.window = context;
  vm.createContext(context);
  const files = ['js/config.js', 'data/vocabulary.js', 'data/collocations.js',
    'data/learning.js', 'data/builtin-study.js', 'data/exam-notebook.js'];
  if (loadIndex) files.push('data/exam-evidence-index.js');
  files.push('js/exam-notes.js', 'js/state.js', 'js/builtin.js', 'js/search.js',
    'js/examples.js', 'js/ui.js', 'js/favorites.js');
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(root, 'assets', file), 'utf8'), context, {filename: file});
  const run = code => vm.runInContext(code, context);
  const json = code => JSON.parse(run(`JSON.stringify(${code})`));
  return {context, get, requests, run, json};
}

test('the lightweight year index matches all verified records without copying quotation fields', () => {
  const e = environment();
  const index = e.json('GSAT_EXAM_EVIDENCE_INDEX');
  const expected = {};
  for (const record of evidence.records) {
    for (const word of record.headwords || [record.headword]) {
      const key = word.normalize('NFKC').toLowerCase().replace(/’/g, "'").replace(/\s+/g, ' ').trim();
      expected[key] ??= new Set();
      expected[key].add(String(record.year));
    }
  }
  const years = Object.fromEntries(Object.entries(expected).sort(([a], [b]) => a.localeCompare(b))
    .map(([word, values]) => [word, [...values].sort((a, b) => Number(a) - Number(b))]));
  assert.equal(index.recordCount, 127);
  assert.equal(index.recordCount, evidence.records.length);
  assert.equal(index.sourceSha256, createHash('sha256').update(sourceBytes).digest('hex'));
  assert.deepEqual(index.yearsByHeadword, years);
  assert.deepEqual(Object.keys(index).sort(), ['recordCount', 'schemaVersion', 'sourceFile', 'sourceSha256', 'yearsByHeadword']);
  assert.equal(e.requests.length, 0);
});

test('exam years union legacy citations with new citations through exact official aliases', () => {
  const e = environment();
  e.run('target=VOCABULARY.find(entry=>entry.word==="enhance(ment)")');
  const legacy = e.json('getGsatPoints(target).flatMap(point=>point.evidence)');
  assert.ok(legacy.includes('113'));
  assert.ok(!legacy.includes('115'));
  assert.deepEqual(e.json('getExamEvidenceYears(target)'), ['113', '115']);
  for (const word of ['tight', 'elbow', 'exacerbate']) {
    e.context.word = word;
    assert.deepEqual(e.json('getExamEvidenceYears(VOCABULARY.find(entry=>entry.word===word))'), ['115']);
  }
  const legacyOnly = e.run('VOCABULARY.find(entry=>getGsatPoints(entry).some(point=>point.evidence.length)&&!examNotebookAliases(entry.word).some(word=>GSAT_EXAM_EVIDENCE_INDEX.yearsByHeadword[word]))?.word');
  assert.ok(legacyOnly, 'Need a real legacy-only citation to verify preserved coverage');
  e.context.word = legacyOnly;
  assert.deepEqual(e.json('getExamEvidenceYears(VOCABULARY.find(entry=>entry.word===word))'),
    e.json('[...new Set(getGsatPoints(VOCABULARY.find(entry=>entry.word===word)).flatMap(point=>point.evidence))].sort()'));
  assert.equal(e.requests.length, 0);
});

test('the actual exam tab includes new 115 highlights and respects all five year selections', () => {
  const e = environment();
  e.run('state.examYear="115";setListMode("exam")');
  const words = e.json('state.filtered.map(({entry})=>entry.word)');
  for (const word of ['tight', 'elbow', 'exacerbate', 'enhance(ment)']) assert.ok(words.includes(word), `${word} missing from 115 tab`);
  for (const year of ['111', '112', '113', '114', '115']) {
    e.context.selectedYear = year;
    e.run('state.examYear=selectedYear;applyFilters()');
    assert.deepEqual(e.json('state.filtered.map(({entry})=>entry.word).sort()'),
      e.json('VOCABULARY.filter(entry=>getExamEvidenceYears(entry).includes(selectedYear)).map(entry=>entry.word).sort()'));
    if (year !== '115') {
      for (const word of ['tight', 'elbow', 'exacerbate']) assert.ok(!e.json('state.filtered.map(({entry})=>entry.word)').includes(word), `${word} incorrectly included in ${year}`);
    }
  }
  e.run('state.examYear="all";applyFilters()');
  assert.deepEqual(e.json('state.filtered.map(({entry})=>entry.word).sort()'),
    e.json('VOCABULARY.filter(entry=>getExamEvidenceYears(entry).length).map(entry=>entry.word).sort()'));
  const counts = e.json('state.filtered.map(({entry})=>getExamEvidenceYears(entry).length)');
  assert.ok(counts.every((count, index) => index === 0 || count <= counts[index - 1]), 'Exam sorting must use the union of citation years');
  e.run('state.levels=new Set([1]);applyFilters()');
  assert.ok(e.run('state.filtered.every(({entry})=>entry.level===1)'));
  assert.equal(e.requests.length, 0, 'Year filtering must not download quotation text');
});

test('new citation words receive EXAM badges without fetching sources', () => {
  const e = environment();
  for (const word of ['tight', 'elbow', 'exacerbate']) {
    e.context.word = word;
    e.run('state.filtered=VOCABULARY.map((entry,index)=>({entry,index})).filter(({entry})=>entry.word===word);renderList()');
    assert.match(e.get('wordList').innerHTML, /class="row-exam">EXAM/);
  }
  assert.equal(e.requests.length, 0);
});

test('source text still loads only when the evidence panel is opened', async () => {
  const e = environment();
  e.run('state.examYear="115";setListMode("exam")');
  const host = element(), details = element();
  details.open = false;
  details.dataset.evidenceWord = 'exacerbate';
  details.querySelector = () => host;
  e.context.details = details;
  await e.run('loadNotebookEvidence(details)');
  assert.equal(e.requests.length, 0);
  details.open = true;
  await e.run('loadNotebookEvidence(details)');
  assert.deepEqual(e.requests, ['./assets/data/exam-evidence.json']);
  assert.match(host.innerHTML, /exacerbated the situation/);
  assert.match(host.innerHTML, /選項用語 · 非正解標記/);
});

test('legacy filtering remains available when the optional citation index is absent', () => {
  const e = environment({loadIndex: false});
  e.run('state.examYear="all";setListMode("exam")');
  assert.deepEqual(e.json('state.filtered.map(({entry})=>entry.word).sort()'),
    e.json('VOCABULARY.filter(entry=>getGsatPoints(entry).some(point=>point.evidence.length)).map(entry=>entry.word).sort()'));
  assert.equal(e.requests.length, 0);
});
