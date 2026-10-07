'use strict';
// Exercise storage boundaries and the learner's actions without any network or
// downloaded dependencies. Full DOM/layout integration is in browser_notebook.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '../assets/js/retrieval-practice.js'), 'utf8');
const key = 'gsat-notebook-retrieval-v1';
const note = {collocations: [
  {en: 'responsive to change', zh: '對變化有反應', note: 'to 後接名詞'},
  {en: 'responsive to feedback', zh: '對回饋有反應'},
  {en: 'a responsive government', zh: '能回應需求的政府'},
  {en: 'a responsive design', zh: '能配合裝置的設計'},
]};
function environment({stored = new Map(), writeFails = false, noteValue = note} = {}) {
  const writes = [], scheduled = [];
  const context = {console, Map, Set, WeakMap, Date, JSON, Number, Object, String, Array};
  function node(attributes = {}) {
    const listeners = new Map(), attrs = new Map(Object.entries(attributes));
    let html = '', children = [];
    const result = {hidden: attrs.has('hidden'), disabled: attrs.has('disabled'), value: '', dataset: {}, textContent: '',
      get innerHTML() {return html;},
      set innerHTML(value) {
        html = String(value); children = [];
        for (const match of html.matchAll(/<([a-z0-9]+)\b([^>]*)>/gi)) {
          const attributes = {};
          for (const attr of match[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attributes[attr[1]] = attr[2] ?? '';
          children.push(node(attributes));
        }
      },
      addEventListener(type, callback) {listeners.set(type, callback);},
      emit(type = 'click', options = {}) {
        const event = {key: '', isComposing: false, defaultPrevented: false, preventDefault() {this.defaultPrevented = true;}, ...options};
        if (!(type === 'click' && this.disabled)) listeners.get(type)?.(event);
        return event;
      },
      setAttribute(name, value) {attrs.set(name, String(value));},
      getAttribute(name) {return attrs.get(name) ?? null;},
      removeAttribute(name) {attrs.delete(name);},
      querySelector(selector) {return children.find(child => selector[0] === '#' ? child.getAttribute('id') === selector.slice(1) : (child.getAttribute('class') || '').split(/\s+/).includes(selector.slice(1))) || null;},
      focus() {context.document.activeElement = this;},
    };
    return result;
  }
  const answerNodes = ['notebookSenses', 'notebookCollocations', 'notebookRelations', 'notebookFamily', 'exampleCard',
    'notebookEvidence', 'notebookArchive', 'notebookLegacyPoints', 'builtinPractice', 'builtinWriting', 'notebookNavigation', 'reviewActions'].map(id => node({id}));
  const detail = {querySelectorAll: () => answerNodes};
  const host = node(); host.closest = () => detail;
  const reviewStatus = node();
  context.localStorage = {
    getItem: name => stored.get(name) ?? null,
    setItem(name, value) {if (writeFails) throw new Error('quota'); writes.push(name); stored.set(name, String(value));},
  };
  context.document = {activeElement: null, getElementById: id => id === 'retrievalPractice' ? host : id === 'wordDetail' ? detail : id === 'reviewStatus' ? reviewStatus : null};
  context.getExamNotebook = () => noteValue;
  context.markReview = (word, rating) => {scheduled.push({word, rating}); return {due: '2026-10-09'};};
  vm.createContext(context); vm.runInContext(source, context);
  const run = code => vm.runInContext(code, context);
  const json = code => JSON.parse(run(`JSON.stringify(${code})`));
  const query = selector => host.querySelector(selector);
  const render = () => run('renderRetrievalPractice({word:"responsive"})');
  return {run, json, render, query, host, answerNodes, stored, writes, scheduled, reviewStatus, context};
}
function attempt(e, text = 'my own reasonable English', rating = 'good') {
  e.query('#retrievalAnswer').value = text;
  e.query('.retrieval-form').emit('submit');
  assert.equal(e.host.dataset.phase, 'revealed');
  e.query(`.retrieval-${rating}`).emit();
}

test('reading or entering recall never changes existing favorites/review records', () => {
  const stored = new Map([['gsat-standalone-favorites-v1', '["legacy-word"]'], ['gsat-v3-review-queue-v1', '{"legacy-word":{"stage":3}}']]);
  const e = environment({stored});
  e.render(); e.query('.retrieval-start').emit();
  assert.deepEqual(e.writes, []);
  assert.equal(stored.get('gsat-standalone-favorites-v1'), '["legacy-word"]');
  assert.equal(stored.get('gsat-v3-review-queue-v1'), '{"legacy-word":{"stage":3}}');
  assert.deepEqual(e.scheduled, []);
});

test('three distinct complete chunks are selected, prioritizing unresolved attempts', () => {
  const e = environment();
  const record = {word: 'responsive', chunk: 'a responsive design', meaning: '能配合裝置的設計'};
  e.context.record = record;
  assert.equal(e.run('saveRetrievalAttempt(record,"again",new Date("2026-10-08T12:00:00Z"))'), true);
  const questions = e.json('retrievalQuestions({word:"responsive"})');
  assert.equal(questions.length, 3);
  assert.equal(questions[0].chunk, 'a responsive design');
  assert.equal(new Set(questions.map(question => question.id)).size, 3);
  const empty = environment({noteValue: {collocations: [{en: '', zh: 'missing'}, {en: 'a chunk', zh: ''}]}});
  empty.render(); assert.equal(empty.host.hidden, true); assert.equal(empty.host.innerHTML, '');
});

test('answer-bearing sections stay concealed before and during the answer comparison', () => {
  const e = environment(); e.render();
  e.answerNodes[1].hidden = true;
  e.answerNodes[2].setAttribute('data-retrieval-concealed', 'previous-value');
  e.query('.retrieval-start').emit();
  assert.ok(e.answerNodes.every(node => node.hidden && node.getAttribute('data-retrieval-concealed') === 'true'));
  assert.equal(e.context.document.activeElement, e.query('#retrievalAnswer'));
  assert.doesNotMatch(e.host.innerHTML, /responsive to change|responsive to feedback/);
  e.query('#retrievalAnswer').value = 'responsive to change'; e.query('.retrieval-form').emit('submit');
  assert.equal(e.host.dataset.phase, 'revealed');
  assert.match(e.host.innerHTML, /responsive to change/);
  assert.ok(e.answerNodes.every(node => node.hidden));
  e.query('.retrieval-exit').emit();
  assert.equal(e.host.dataset.phase, 'idle');
  assert.equal(e.context.document.activeElement, e.query('.retrieval-start'));
  assert.equal(e.answerNodes[0].hidden, false);
  assert.equal(e.answerNodes[1].hidden, true);
  assert.equal(e.answerNodes[2].getAttribute('data-retrieval-concealed'), 'previous-value');
  assert.equal(e.answerNodes[0].getAttribute('data-retrieval-concealed'), null);
  assert.deepEqual(e.writes, []);
});

test('an empty submission cannot reveal answers; Escape restores reading and keyboard focus', () => {
  const e = environment(); e.render(); e.query('.retrieval-start').emit();
  e.query('.retrieval-form').emit('submit');
  assert.equal(e.host.dataset.phase, 'prompt');
  assert.match(e.query('.retrieval-feedback').textContent, /請先寫下/);
  const composition = e.query('.retrieval-session').emit('keydown', {key: 'Escape', isComposing: true});
  assert.equal(composition.defaultPrevented, false);
  assert.equal(e.host.dataset.phase, 'prompt');
  const exit = e.query('.retrieval-session').emit('keydown', {key: 'Escape'});
  assert.equal(exit.defaultPrevented, true);
  assert.equal(e.host.dataset.phase, 'idle');
  assert.ok(e.answerNodes.every(node => !node.hidden));
  assert.equal(e.context.document.activeElement, e.query('.retrieval-start'));
  assert.deepEqual(e.writes, []);
});

test('cannot recall is followed by correction and one later retry, never an automatic success', () => {
  const e = environment(); e.render(); e.query('.retrieval-start').emit();
  e.query('.retrieval-forgot').emit();
  assert.equal(e.host.dataset.phase, 'revealed');
  assert.equal(e.query('.retrieval-good').disabled, true);
  e.query('.retrieval-good').emit(); assert.equal(e.host.dataset.phase, 'revealed');
  assert.deepEqual(e.writes, []);
  e.query('.retrieval-again').emit();
  assert.equal(e.json('readRetrievalProgress()')[0].result, 'again');
  attempt(e); attempt(e);
  assert.equal(e.host.dataset.phase, 'prompt');
  assert.match(e.host.innerHTML, /訂正後再回想/);
  assert.ok(e.answerNodes.every(node => node.hidden));
  attempt(e, 'still learning', 'again');
  assert.equal(e.host.dataset.phase, 'complete');
  assert.ok(e.answerNodes.every(node => !node.hidden));
  const records = e.json('readRetrievalProgress()');
  assert.equal(records.length, 3); assert.equal(records[0].attempts, 1);
  const retried = records.find(row => row.chunk === 'responsive to change');
  assert.equal(retried.attempts, 2); assert.equal(retried.result, 'again');
  assert.deepEqual(e.scheduled, []);
});

test('explicit self-rating stores progress without the typed answer; schedule requires a separate choice', () => {
  const e = environment(); e.render(); e.query('.retrieval-start').emit();
  const privateText = 'a private sentence which must never be stored';
  attempt(e, privateText); attempt(e, privateText); attempt(e, privateText);
  assert.equal(e.host.dataset.phase, 'complete');
  assert.equal(e.context.document.activeElement, e.query('.retrieval-complete-heading'));
  assert.equal(e.json('readRetrievalProgress()').length, 3);
  assert.ok(e.writes.every(name => name === key));
  assert.ok(!e.stored.get(key).includes(privateText));
  assert.deepEqual(e.scheduled, []);
  e.query('.retrieval-schedule-again').emit();
  assert.deepEqual(e.scheduled, [{word: 'responsive', rating: 'again'}]);
  assert.equal(e.host.dataset.phase, 'scheduled');
  assert.equal(e.query('.retrieval-schedule-good').disabled, true);
  e.query('.retrieval-schedule-good').emit(); assert.equal(e.scheduled.length, 1);
  assert.match(e.reviewStatus.textContent, /2026-10-09/);
});

test('rerendering an active host restores sections and invalidates old handlers', () => {
  const e = environment(); e.render(); e.query('.retrieval-start').emit();
  const oldForgot = e.query('.retrieval-forgot');
  e.render();
  assert.equal(e.host.dataset.phase, 'idle');
  assert.ok(e.answerNodes.every(node => !node.hidden));
  oldForgot.emit(); assert.equal(e.host.dataset.phase, 'idle');
  assert.deepEqual(e.writes, []);
});

test('localStorage failures leave the full practice usable and report persistence failure', () => {
  const e = environment({writeFails: true}); e.render(); e.query('.retrieval-start').emit();
  attempt(e); attempt(e); attempt(e);
  assert.equal(e.host.dataset.phase, 'complete');
  assert.match(e.host.innerHTML, /無法儲存本次練習紀錄/);
  assert.ok(e.answerNodes.every(node => !node.hidden));
  assert.deepEqual(e.writes, []);
});

test('corrupt, oversized, invalid dates and unrelated persisted objects are rejected', () => {
  const e = environment();
  const valid = {word: 'responsive', chunk: 'responsive to change', meaning: '對變化有反應', attempts: 1, result: 'again', updatedAt: 1, lastDay: '2026-10-08'};
  for (const value of ['{oops', JSON.stringify({version: 2, records: [valid]}), JSON.stringify({version: 1, records: 'no'}), 'x'.repeat(524289)]) {
    e.stored.set(key, value); assert.deepEqual(e.json('readRetrievalProgress()'), []);
  }
  const variants = [null, {...valid, result: 'perfect'}, {...valid, attempts: Infinity}, {...valid, attempts: 0}, {...valid, lastDay: '2026-02-30'}, {...valid, chunk: 'x'.repeat(241)}, {...valid, updatedAt: -1}];
  e.stored.set(key, JSON.stringify({version: 1, records: [valid, ...variants]}));
  assert.deepEqual(e.json('readRetrievalProgress()'), [valid]);
  e.context.valid = valid;
  assert.equal(e.run('saveRetrievalAttempt(valid,"perfect")'), false);
  assert.equal(e.run('saveRetrievalAttempt(valid,"again",new Date("invalid"))'), false);
  assert.deepEqual(e.writes, []);
});

test('storage is bounded and question identities change with the teaching chunk', () => {
  const e = environment();
  e.run('for(let i=0;i<520;i++) saveRetrievalAttempt({word:"word",chunk:"chunk "+i,meaning:"意思"},"good",new Date(100000+i));');
  const records = e.json('readRetrievalProgress()');
  assert.equal(records.length, 512);
  assert.equal(records[0].chunk, 'chunk 8'); assert.equal(records.at(-1).chunk, 'chunk 519');
  assert.notEqual(e.run('retrievalQuestionId({word:"word",chunk:"old",meaning:"意思"})'), e.run('retrievalQuestionId({word:"word",chunk:"new",meaning:"意思"})'));
});

test('typed text and source data are escaped before answer comparison HTML', () => {
  const e = environment({noteValue: {collocations: [{en: '<source>', zh: '提示 <tag>', note: '<img src=x>'}]}});
  e.render(); e.query('.retrieval-start').emit();
  assert.match(e.host.innerHTML, /提示 &lt;tag&gt;/);
  e.query('#retrievalAnswer').value = '<img src=x onerror=alert(1)>';
  e.query('.retrieval-form').emit('submit');
  assert.doesNotMatch(e.host.innerHTML, /<img|<source>|<tag>/);
  assert.match(e.host.innerHTML, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.deepEqual(e.writes, []);
});
