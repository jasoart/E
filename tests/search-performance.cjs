'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {environment, queries} = require('../tools/benchmark_search.cjs');

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
