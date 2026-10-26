'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {environment, queries} = require('../tools/benchmark_search.cjs');

// Controlled corpora exercise cutoff/tie cases without depending on released
// learning content. Cache the supplied fields exactly as the production builder does.
function fixtureEnvironment(fields, concepts = []) {
  const context = {performance, console, fixtureFields: fields, fixtureConcepts: concepts};
  vm.createContext(context);
  const run = source => vm.runInContext(source, context);
  run(`
    const VOCABULARY=fixtureFields.map((fields,index)=>({word:fields.word,level:1,index}));
    const SEARCH_FIELD_CACHE=new WeakMap(),BM25_DOC_CACHE=new WeakMap();
    const BM25_INDEX={ready:false,df:new Map(),avgLength:1},state={searchFeedback:{}};
    const SEARCH_CONCEPTS=fixtureConcepts;
    function normalizeSearchValue(value){return String(value||'').normalize('NFKC').toLowerCase().replace(/’/g,"'").replace(/[^a-z0-9\\u3400-\\u9fff'-]+/gi,' ').replace(/\\s+/g,' ').trim()}
    VOCABULARY.forEach((entry,index)=>{
      const given=fixtureFields[index],fields={word:entry.word,aliases:[entry.word],pattern:'',meaning:'',notes:'',...given};
      fields.all=[fields.word,fields.aliases.join(' '),fields.pattern,fields.meaning,fields.notes].join(' ').trim();
      SEARCH_FIELD_CACHE.set(entry,fields);
    });
  `);
  run(fs.readFileSync(path.join(__dirname, '../assets/js/search.js'), 'utf8'));
  run(scanReference);
  return {context, run};
}

// Full-matrix optimal string alignment reference, independent of the bounded path.
function osa(a, b) {
  const d = Array.from({length: a.length + 1}, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) d[i][0] = i;
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[a.length][b.length];
}

// Pre-optimization retrieval and fusion, pinned here rather than reading moving HEAD.
// Uses the public lexical scorer (separately checked against unbounded OSA above).
const scanReference = `function referenceHybridSearch(rawQuery){
  const query=normalizeSearchValue(rawQuery),info=expandedQueryTerms(query),lexical=[],sparse=[],conceptual=[];
  VOCABULARY.forEach((entry,index)=>{
    const direct=scoreSearchEntry(entry,query);if(direct)lexical.push({entry,index,score:direct.score,reason:direct.reason});
    const sparseScore=bm25Score(entry,info.expanded);if(sparseScore>0)sparse.push({entry,index,score:sparseScore});
    const semantic=conceptScore(entry,info);if(semantic>0)conceptual.push({entry,index,score:semantic});
  });
  for(const items of [lexical,sparse,conceptual])items.sort((a,b)=>b.score-a.score);
  const fused=new Map(),lexicalByIndex=new Map(lexical.map(item=>[item.index,item]));
  const add=(items,weight,channel)=>items.slice(0,350).forEach((item,rank)=>{
    const record=fused.get(item.index)||{entry:item.entry,index:item.index,score:0,channels:new Set()};
    record.score+=weight/(60+rank+1);record.channels.add(channel);fused.set(item.index,record);
  });
  add(lexical,1.75,'字面');add(sparse,1,'BM25');if(info.hasConcept)add(conceptual,1.2,'概念');
  lexical.slice(0,30).forEach(item=>{const record=fused.get(item.index);if(record&&item.score>=1000)record.score+=.09;else if(record&&item.score>=940)record.score+=.025});
  Object.entries(state.searchFeedback[query]||{}).sort((a,b)=>b[1]-a[1]).forEach(([word,count],rank)=>{
    const index=VOCABULARY.findIndex(entry=>entry.word===word);if(index<0)return;
    const record=fused.get(index)||{entry:VOCABULARY[index],index,score:0,channels:new Set()};
    record.score+=Math.min(1.15,.7+Number(count)*.06)/(60+rank+1);record.channels.add('本機偏好');fused.set(index,record);
  });
  return [...fused.values()].map(record=>{const direct=lexicalByIndex.get(record.index),reason=direct&&direct.reason?direct.reason:record.channels.has('概念')?'概念擴展':record.channels.has('BM25')?'BM25 相關':'本機偏好';return{entry:record.entry,index:record.index,match:{score:record.score,reason,channels:[...record.channels]}}}).sort((a,b)=>b.match.score-a.match.score||a.entry.level-b.entry.level||a.entry.word.localeCompare(b.entry.word));
}`;

test('banded spelling distance matches full OSA for every small input and real-word mutations', () => {
  const e = environment();
  const strings = [''];
  for (let length = 1; length <= 4; length++) for (let n = 0; n < 3 ** length; n++) {
    let x = n, word = '';
    for (let i = 0; i < length; i++) { word += 'abc'[x % 3]; x = Math.floor(x / 3); }
    strings.push(word);
  }
  const pairs = strings.flatMap(a => strings.map(b => [a, b]));
  const words = JSON.parse(e.run('JSON.stringify(VOCABULARY.filter((entry,i)=>i%37===0).map(entry=>searchFields(entry).word))'));
  for (const word of words) {
    pairs.push([word, word.slice(1)], [word, 'z' + word], [word, word.slice(0, 2) + 'z' + word.slice(3)], [word, word.slice(0, 2) + (word[3] || '') + (word[2] || '') + word.slice(4)]);
  }
  e.context.cases = pairs;
  for (const limit of [1, 2]) {
    e.context.limit = limit;
    const distances = Array.from(e.run('cases.map(([a,b])=>boundedDamerauLevenshtein(a,b,limit))'));
    for (let i = 0; i < pairs.length; i++) assert.equal(distances[i], Math.min(limit + 1, osa(...pairs[i])), `${JSON.stringify(pairs[i])}, limit ${limit}`);
  }
});

test('inverted retrieval preserves full-scan scores, result order, match reasons and feedback', () => {
  const e = environment(); e.run(scanReference);
  // Partial idle construction then a cold query must neither miss nor duplicate postings.
  e.run('buildBm25Chunk(17)');
  for (const query of [...queries, '', '  CHALLENGE  ', 'responsiveness', 'care for', 'take care of', '任何一個']) {
    e.context.query = query;
    assert.equal(e.run('JSON.stringify(computeHybridSearch(query))'), e.run('JSON.stringify(referenceHybridSearch(query))'), query);
  }
  e.run(`state.searchFeedback['challenge']={'community':12,'challenge':2,'missing-old-word':10};SEARCH_RESULT_CACHE.clear()`);
  assert.equal(e.run('JSON.stringify(computeHybridSearch("challenge"))'), e.run('JSON.stringify(referenceHybridSearch("challenge"))'));
  for (const [query, expected] of [['challenge','challenge'], ['exacerbate','exacerbate'], ['responsvie','responsive'], ['add fuel to the fire','exacerbate'], ['導致','lead']]) {
    e.context.query = query; e.context.expected = expected;
    assert.equal(e.run('hybridSearch(query).some(row=>row.entry.word===expected)'), true, query);
  }
  assert.equal(e.run('hybridSearch("challenge")[0].entry.word'), 'challenge');
  assert.equal(e.run('hybridSearch("challenge")===hybridSearch("challenge")'), true);
  assert.equal(e.run('BM25_POSTINGS.get("任何一個")'), 0, 'Singleton document zero must not be mistaken for a missing posting');
  assert.equal(e.run('bm25Ranking(["任何一個"])[0].index'), 0);
});

test('spelling candidates retain every OSA match across short words, aliases and repeated bigrams', () => {
  const words = [];
  for (let length = 4; length <= 7; length++) for (let n = 0; n < 2 ** length; n++) {
    let x = n, word = '';
    for (let i = 0; i < length; i++) { word += 'ab'[x % 2]; x = Math.floor(x / 2); }
    words.push(word);
  }
  words.push('challenge', 'responsive', 'environment', 'accommodate', 'bookkeeper', 'well-being', "doesn't", 'abcdefghij', 'badcfeghij');
  const fields = words.map((word, index) => ({word, aliases: [word, words[(index * 13 + 7) % words.length]]}));
  // Separate entries can share an alias; all of their IDs must survive retrieval.
  fields.push({word:'other-entry', aliases:['other-entry', 'responsive', 'bookkeeper']});
  const e = fixtureEnvironment(fields);
  e.run('buildBm25Chunk(17);ensureBm25Index()');
  const queries = new Set(words);
  for (const word of words.slice(-9)) {
    queries.add(word.slice(1));
    queries.add('z' + word);
    queries.add(word.slice(0, 2) + 'z' + word.slice(3));
    queries.add(word[1] + word[0] + word.slice(2));
    queries.add(word.slice(0, -2) + word.at(-1) + word.at(-2));
  }
  for (const query of queries) {
    const limit = query.length <= 6 ? 1 : 2;
    const expected = fields.flatMap((field, index) => field.aliases.some(alias => osa(query, alias) <= limit) ? [index] : []);
    e.context.query = query; e.context.limit = limit;
    const actual = Array.from(e.run('[...fuzzySearchCandidates(query,limit).keys()].sort((a,b)=>a-b)'));
    assert.deepEqual(actual, expected, `${query}, limit ${limit}`);
  }
  for (const query of ['baaa', 'aaaaaa', 'aaaaaaa', 'challnege', 'responsvie', 'enviroment', 'acommodate', 'boookkeeper', 'badcfeghij']) {
    e.context.query = query;
    assert.equal(e.run('JSON.stringify(computeHybridSearch(query))'), e.run('JSON.stringify(referenceHybridSearch(query))'), query);
  }
});

test('bounded ranking keeps stable cutoff ties and lexical reasons outside its top 350', () => {
  const fields = Array.from({length:430}, (_, index) => ({word:`lemma${String(index).padStart(3,'0')}`, notes:'needle'}));
  const e = fixtureEnvironment(fields, [{triggers:['conceptual'],terms:['needle']}]);
  for (const query of ['', 'needle', 'conceptual']) {
    e.context.query = query;
    assert.equal(e.run('JSON.stringify(computeHybridSearch(query))'), e.run('JSON.stringify(referenceHybridSearch(query))'), query);
    assert.equal(e.run('computeHybridSearch(query).length'), 350);
  }
  assert.deepEqual(Array.from(e.run('computeHybridSearch("needle").map(row=>row.index)')), Array.from({length:350}, (_, i) => i));
  e.run(`state.searchFeedback.needle={lemma429:12}`);
  assert.equal(e.run('JSON.stringify(computeHybridSearch("needle"))'), e.run('JSON.stringify(referenceHybridSearch("needle"))'));
  assert.equal(e.run('computeHybridSearch("needle").find(row=>row.index===429).match.reason'), '搭配／提醒');
  assert.deepEqual(Array.from(e.run('computeHybridSearch("needle").find(row=>row.index===429).match.channels')), ['本機偏好']);

  const bm25Fields = fields.slice(0,350).map(field => ({...field, notes:`needle ${'filler '.repeat(30)}`}));
  bm25Fields.push({word:'meaning-entry',meaning:'needle'});
  const sparse = fixtureEnvironment(bm25Fields);
  assert.equal(sparse.run('JSON.stringify(computeHybridSearch("needle"))'), sparse.run('JSON.stringify(referenceHybridSearch("needle"))'));
  assert.equal(sparse.run('computeHybridSearch("needle").find(row=>row.index===350).match.reason'), '中文釋義');
  assert.deepEqual(Array.from(sparse.run('computeHybridSearch("needle").find(row=>row.index===350).match.channels')), ['BM25']);
});

test('top-K selection equals a stable full sort for varied scores, ties and limits', () => {
  const e = fixtureEnvironment([]);
  const items = Array.from({length:1200}, (_, index) => ({index, score:(index * 37) % 19}));
  // Reversed input makes the explicit vocabulary-index tie rule observable.
  e.context.items = [...items].reverse();
  for (const limit of [0, 1, 2, 17, 350, 1200, 1201]) {
    e.context.limit = limit;
    const actual = JSON.parse(e.run('JSON.stringify(topSearchRanking(items,limit))'));
    assert.deepEqual(actual, [...items].sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,limit), `limit ${limit}`);
  }
  assert.deepEqual(JSON.parse(e.run('JSON.stringify(items)')), [...items].reverse(), 'Selection must not mutate caller input');
});

test('sparse accumulation preserves document order and repeated-term scores', () => {
  const e = fixtureEnvironment([{word:'first',notes:'beta'}, {word:'second',notes:'alpha beta'}, {word:'third',notes:'alpha'}]);
  e.context.terms = ['alpha', 'missing', 'beta', 'alpha'];
  assert.equal(e.run('JSON.stringify(bm25Ranking(terms))'), e.run('JSON.stringify(VOCABULARY.map((entry,index)=>({entry,index,score:bm25Score(entry,terms)})).filter(row=>row.score>0))'));
  assert.equal(e.run('JSON.stringify(bm25Ranking(["missing"]))'), '[]');
});

test('query cache evicts the least recently accessed result and shares normalized keys', () => {
  const e = fixtureEnvironment([{word:'alpha'}]);
  e.run('const first=hybridSearch("query0"),second=hybridSearch("query1");for(let i=2;i<24;i++)hybridSearch("query"+i)');
  assert.equal(e.run('SEARCH_RESULT_CACHE.size'), 24);
  assert.equal(e.run('hybridSearch("  QUERY0  ")===first'), true, 'Normalized cache hits retain result identity');
  assert.equal(e.run('SEARCH_RESULT_CACHE.size'), 24, 'Equivalent queries share one slot');
  e.run('hybridSearch("query24")');
  assert.equal(e.run('SEARCH_RESULT_CACHE.size'), 24);
  assert.equal(e.run('SEARCH_RESULT_CACHE.has("query0")'), true, 'Access refreshes the oldest insertion');
  assert.equal(e.run('SEARCH_RESULT_CACHE.has("query1")'), false, 'The least recently accessed query is evicted');
  assert.equal(e.run('hybridSearch("query0")===first'), true);
  assert.equal(e.run('hybridSearch("query1")===second'), false, 'An evicted query is recomputed');
  assert.equal(e.run('SEARCH_RESULT_CACHE.size'), 24);
});

test('idle warm-up obeys elapsed budget, expired deadlines, and keeps one continuation', () => {
  const scheduled = []; let time = 0;
  const e = environment(undefined, {performance: {now: () => (time += 5)}, requestIdleCallback: callback => scheduled.push(callback)});
  e.run('warmSearchIndex({timeRemaining:()=>50})');
  assert.equal(e.run('bm25Cursor'), 1, 'One document can progress; elapsed time stops the second');
  assert.equal(scheduled.length, 1);
  e.run('warmSearchIndex({timeRemaining:()=>0})');
  assert.equal(e.run('bm25Cursor'), 2, 'Timed out work still makes bounded progress');
  assert.equal(scheduled.length, 1, 'An existing continuation must not be duplicated');
  scheduled.shift()({timeRemaining: () => 0});
  assert.equal(e.run('bm25Cursor'), 3);
  assert.equal(scheduled.length, 1);
  e.run('ensureBm25Index()');
  assert.equal(e.run('BM25_INDEX.ready'), true);
  scheduled.shift()({timeRemaining: () => 50});
  assert.equal(scheduled.length, 0, 'A query that completed the index cancels further scheduling');
});

test('setTimeout fallback also bounds warm-up when requestIdleCallback is absent', () => {
  const scheduled = []; let time = 0;
  const e = environment(undefined, {performance: {now: () => (time += 5)}, setTimeout: callback => scheduled.push(callback)});
  e.run('warmSearchIndex()');
  assert.equal(e.run('bm25Cursor'), 1);
  assert.equal(scheduled.length, 1);
  scheduled.shift()();
  assert.equal(e.run('bm25Cursor'), 2);
  assert.equal(scheduled.length, 1);
});

test('native background scheduling bounds work and leaves only one continuation', async () => {
  const tasks = []; let time = 0;
  const e = environment(undefined, {performance: {now: () => (time += 5)}, scheduler: {postTask(callback, options) {
    assert.equal(options.priority, 'background'); tasks.push(callback); return Promise.resolve();
  }}});
  e.run('warmSearchIndex()');
  assert.equal(e.run('bm25Cursor'), 1); assert.equal(tasks.length, 1);
  e.run('warmSearchIndex()'); assert.equal(tasks.length, 1);
  tasks.shift()(); assert.equal(e.run('bm25Cursor'), 3); assert.equal(tasks.length, 1);
  e.run('ensureBm25Index()'); tasks.shift()(); assert.equal(tasks.length, 0);
});
test('rejected native scheduler falls back to bounded timer work', async () => {
  const tasks = []; let time = 0;
  const e = environment(undefined, {performance: {now: () => (time += 5)}, setTimeout: callback => tasks.push(callback),
    scheduler: {postTask: () => Promise.reject(new Error('Unavailable'))}});
  e.run('warmSearchIndex()'); await new Promise(resolve => setImmediate(resolve));
  assert.equal(tasks.length, 1); tasks.shift()();
  assert.equal(e.run('bm25Cursor'), 2);
});
