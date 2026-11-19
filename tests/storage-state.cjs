'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const keys = {
  favorites: 'gsat-standalone-favorites-v1',
  feedback: 'gsat-v2-search-feedback-v1',
  practice: 'gsat-v2-collocation-practice-v1',
  recent: 'gsat-v3-recent-searches-v1',
  review: 'gsat-v3-review-queue-v1'
};
function environment(stored = {}, {readDenied = false, writeDenied = false} = {}) {
  const data = new Map(Object.entries(stored)), writes = [], nodes = new Map();
  const context = vm.createContext({
    URL, setTimeout() { return 1; }, clearTimeout() {},
    VOCABULARY: ['challenge', 'constructor', 'toString', '__proto__'].map(word => ({word})),
    localStorage: {
      getItem(key) { if (readDenied) throw Error('Storage disabled'); return data.get(key) ?? null; },
      setItem(key, value) { if (writeDenied) throw Error('Quota exceeded'); writes.push(key); data.set(key, value); }
    },
    document: {getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {textContent: '', classList: {add() {}, remove() {}}});
      return nodes.get(id);
    }}
  });
  const run = source => vm.runInContext(source, context);
  for (const name of ['config', 'state']) run(fs.readFileSync(path.join(__dirname, '../assets/js', name + '.js'), 'utf8'));
  run('const SEARCH_RESULT_CACHE = new Map();');
  return {run, data, writes, json: source => JSON.parse(run('JSON.stringify(' + source + ')'))};
}

test('valid legacy storage retains keys, unknown IDs and optional metadata without startup writes', () => {
  const stored = {
    [keys.favorites]: '["challenge","legacy custom entry","__proto__"]',
    [keys.feedback]: '{"challenge":{"challenge":2,"legacy custom entry":3}}',
    [keys.practice]: '{"correct":3,"total":4}',
    [keys.recent]: '["challenge","take care of"]',
    [keys.review]: '{"challenge":{"stage":2,"due":"2020-01-01"},"legacy custom entry":{"stage":4,"due":"2028-02-29","last":"2026-10-25","rating":"good","imported":true}}'
  };
  const e = environment(stored);
  assert.deepEqual(e.json('[...state.favorites]'), ['challenge', 'legacy custom entry', '__proto__']);
  assert.deepEqual(e.json('state.searchFeedback'), JSON.parse(stored[keys.feedback]));
  assert.deepEqual(e.json('state.practice'), {correct: 3, total: 4});
  assert.deepEqual(e.json('state.recentSearches'), ['challenge', 'take care of']);
  assert.deepEqual(e.json('state.review'), JSON.parse(stored[keys.review]));
  assert.equal(e.run('isReviewDue("challenge")'), true);
  assert.deepEqual(e.writes, []);
  for (const [key, value] of Object.entries(stored)) assert.equal(e.data.get(key), value);
});

test('malformed JSON, wrong container types and denied storage have safe defaults without rewrites', () => {
  for (const raw of ['{broken', 'null', '[]', 'true', '1', '"not an object"']) {
    const e = environment(Object.fromEntries(Object.values(keys).map(key => [key, raw])));
    assert.deepEqual(e.json('state.practice'), {correct: 0, total: 0});
    assert.deepEqual(e.json('state.review'), {});
    assert.deepEqual(e.json('state.searchFeedback'), {});
    assert.deepEqual(e.json('state.recentSearches'), []);
    assert.deepEqual(e.writes, []);
  }
  const e = environment({}, {readDenied: true, writeDenied: true});
  assert.deepEqual(e.json('state.practice'), {correct: 0, total: 0});
  assert.deepEqual(e.json('state.review'), {});
  assert.deepEqual(e.json('[...state.favorites]'), []);
  assert.doesNotThrow(() => e.run('recordSearchFeedback("challenge","challenge");markReview("challenge","good");saveRecentSearch("challenge");savePracticeStats()'));
  assert.equal(e.run('state.searchFeedback.challenge.challenge'), 1);
  assert.equal(e.run('storedDateKey(state.review.challenge.due)'), true);
});

test('practice counters reject coercion and nonfinite values, preserve usable counts and bound increments', () => {
  for (const [raw, expected] of [
    ['{"correct":"3","total":4}', {correct: 0, total: 4}],
    ['{"correct":9,"total":4}', {correct: 4, total: 4}],
    ['{"correct":-1,"total":4.5}', {correct: 0, total: 0}],
    ['{"correct":1e999,"total":10}', {correct: 0, total: 10}],
    ['{"correct":null,"total":false}', {correct: 0, total: 0}],
    ['{"correct":2000000000,"total":2000000001}', {correct: 1000000000, total: 1000000000}]
  ]) {
    const e = environment({[keys.practice]: raw});
    assert.deepEqual(e.json('state.practice'), expected);
    assert.equal(e.data.get(keys.practice), raw);
  }
  const e = environment({[keys.practice]: '{"correct":1000000000,"total":1000000000}'});
  e.run('state.practice.correct++;state.practice.total++;savePracticeStats()');
  assert.deepEqual(JSON.parse(e.data.get(keys.practice)), {correct: 1000000000, total: 1000000000});
});

test('feedback normalizes query keys and keeps bounded integer counts in prototype-safe maps', () => {
  const raw = '{"  CHALLENGE  ":{"challenge":2,"legacy-word":100,"bad":"3","negative":-1,"fraction":1.5,"infinite":1e999,"__proto__":4,"constructor":5},"challenge":{"challenge":3},"constructor":{"toString":6},"broken":[],"empty":{},"!?":{ "challenge":4}}';
  const e = environment({[keys.feedback]: raw});
  assert.deepEqual(e.json('state.searchFeedback'), {
    challenge: {challenge: 3, 'legacy-word': 12, ...JSON.parse('{"__proto__":4}'), constructor: 5},
    constructor: {toString: 6}
  });
  assert.equal(e.run('Object.getPrototypeOf(state.searchFeedback)'), null);
  assert.equal(e.run('Object.getPrototypeOf(state.searchFeedback.challenge)'), null);
  assert.equal(e.run('state.searchFeedback.missing'), undefined);
  assert.equal(e.data.get(keys.feedback), raw);
  const many = Object.fromEntries(Array.from({length: 45}, (_, i) => ['query' + i, {challenge: 1}]));
  const capped = environment({[keys.feedback]: JSON.stringify(many)});
  assert.deepEqual(capped.json('Object.keys(state.searchFeedback)'), Array.from({length: 40}, (_, i) => 'query' + (i + 5)));
});

test('review rows require real calendar dates and recover damaged stages without losing unknown IDs', () => {
  const rows = {
    valid: {stage: 2, due: '2024-02-29', last: '2024-01-31', rating: 'again'},
    unknown: {stage: 'broken', due: '2028-02-29', last: '2025-02-29', rating: 'invented', note: 'legacy metadata'},
    missingStage: {due: '2030-12-31'},
    highStage: {stage: 100, due: '2030-12-31'},
    lowStage: {stage: -1, due: '2030-12-31'},
    nonLeap: {stage: 2, due: '2025-02-29'},
    rollover: {stage: 2, due: '2026-04-31'},
    noncanonical: {stage: 2, due: '2026-1-01'},
    zeroYear: {stage: 2, due: '0000-01-01'},
    array: [], null: null, missingDue: {stage: 2}
  };
  const e = environment({[keys.review]: JSON.stringify(rows)});
  assert.deepEqual(e.json('state.review'), {
    valid: rows.valid,
    unknown: {stage: 0, due: '2028-02-29', note: 'legacy metadata'},
    missingStage: {stage: 0, due: '2030-12-31'},
    highStage: {stage: 6, due: '2030-12-31'},
    lowStage: {stage: 0, due: '2030-12-31'}
  });
  assert.equal(e.run('storedDateKey("1900-02-29")'), false);
  assert.equal(e.run('storedDateKey("2000-02-29")'), true);
  assert.equal(e.run('storedDateKey("0099-01-01")'), true);
  assert.equal(e.run('storedDateKey("9999-12-31")'), true);
  e.run('markReview("unknown","good")');
  assert.equal(e.run('state.review.unknown.stage'), 1);
  assert.equal(e.run('storedDateKey(state.review.unknown.due)'), true);
});

test('prototype-name review IDs round-trip and inherited properties never become review entries', () => {
  const e = environment({[keys.review]: '{"__proto__":{"stage":1,"due":"2020-01-01"},"constructor":{"stage":2,"due":"2030-01-01"},"toString":{"stage":3,"due":"2030-01-01"}}'});
  assert.equal(e.run('Object.getPrototypeOf(state.review)'), null);
  assert.equal(e.run('reviewInfo("__proto__").stage'), 1);
  assert.equal(e.run('reviewInfo("constructor").stage'), 2);
  e.run('markReview("__proto__","good")');
  assert.equal(e.run('Object.getPrototypeOf(state.review)'), null);
  assert.equal(JSON.parse(e.data.get(keys.review)).__proto__.stage, 2);
  e.run('state.review=Object.create({constructor:{stage:3,due:"2020-01-01"}})');
  assert.equal(e.run('reviewInfo("constructor")'), null);
  assert.equal(e.run('isReviewDue("constructor")'), false);
});

test('recent history filters malformed entries before applying the existing eight-query limit', () => {
  const rows = [null, 12, false, {}, [], '', '   ', 'challenge', 'take care of', ...Array.from({length: 10}, (_, i) => 'word ' + i)];
  const e = environment({[keys.recent]: JSON.stringify(rows)});
  assert.deepEqual(e.json('state.recentSearches'), ['challenge', 'take care of', ...Array.from({length: 6}, (_, i) => 'word ' + i)]);
  assert.deepEqual(e.writes, []);
});

test('feedback invalidates only changed and evicted query caches, preserving unrelated cached results', () => {
  const rows = Object.fromEntries(Array.from({length: 40}, (_, i) => ['query' + i, {challenge: 1}]));
  const e = environment({[keys.feedback]: JSON.stringify(rows)});
  e.run('SEARCH_RESULT_CACHE.set("challenge",[1]);SEARCH_RESULT_CACHE.set("query0",[2]);SEARCH_RESULT_CACHE.set("query5",[3]);recordSearchFeedback("  CHALLENGE  ","__proto__")');
  assert.equal(e.run('SEARCH_RESULT_CACHE.has("challenge")'), false);
  assert.equal(e.run('SEARCH_RESULT_CACHE.has("query0")'), false);
  assert.deepEqual(e.json('SEARCH_RESULT_CACHE.get("query5")'), [3]);
  assert.equal(e.run('state.searchFeedback.challenge["__proto__"]'), 1);
  assert.equal(e.run('Object.keys(state.searchFeedback).length'), 40);
  assert.equal(e.run('Object.getPrototypeOf(state.searchFeedback.challenge)'), null);
  e.run('recordSearchFeedback("constructor","toString")');
  assert.equal(e.run('state.searchFeedback.constructor.toString'), 1);
  e.run('for(let i=0;i<20;i++)recordSearchFeedback("constructor","toString")');
  assert.equal(e.run('state.searchFeedback.constructor.toString'), 12);
});
