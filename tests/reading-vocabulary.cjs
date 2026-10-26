'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/js/reading.js'), 'utf8');
function helperEnvironment(data) {
  const context = {fixture: data};
  vm.createContext(context);
  if (data !== undefined) vm.runInContext('const GSAT_READING_VOCABULARY = fixture;', context);
  vm.runInContext(source, context);
  const run = code => vm.runInContext(code, context);
  const json = code => JSON.parse(run(`JSON.stringify(${code})`));
  return {context, run, json};
}
function fixtureData() {
  return {
    sources: [{year:111}, {year:112}],
    topics: [{id:'health',label:'健康'}, {id:'nature',label:'自然'}],
    passages: [
      {id:'old-health',year:111,section:'reading',questionRange:'35–38',pdfPages:[6],printedPages:[5],topicId:'health',titleZh:'健康文章'},
      {id:'new-nature',year:112,section:'mixed',questionRange:'47–50',pdfPages:[10],printedPages:[9],topicId:'nature',titleZh:'自然文章'},
    ],
    entries: {bank:{years:[111,112],topics:['health','nature'],priority:'cross-year',passageCount:2,
      occurrences:[{passageId:'old-health',form:'bank',pdfPage:6,printedPage:5,matchKind:'exact'},
        {passageId:'new-nature',form:'banks',pdfPage:10,printedPage:9,matchKind:'inflection'}],
      readingSense:'依文章判斷指銀行或河岸。',collocations:[['river bank','河岸']],note:'詞形證據不表示所有字族曾出題。'}},
    stats:{words:1,passages:2,years:2,curatedWords:1},
  };
}

test('year, topic and section filters require evidence in one passage', () => {
  const e = helperEnvironment(fixtureData());
  assert.equal(e.run('readingEntryMatches("bank",{readingYear:"111",readingTopic:"health",readingSection:"reading"})'), true);
  assert.equal(e.run('readingEntryMatches("bank",{readingYear:"111",readingTopic:"nature"})'), false, 'Separate years/topics must not create a fictitious joint occurrence');
  assert.equal(e.run('readingEntryMatches("bank",{readingYear:"111",readingSection:"mixed"})'), false);
  assert.equal(e.run('readingEntryMatches("bank",{readingYear:"112",readingTopic:"nature",readingSection:"mixed",readingPriority:"cross-year"})'), true);
  assert.equal(e.run('readingEntryMatches("bank",{readingPriority:"topic"})'), false);
  assert.equal(e.run('readingEntryMatches("missing",{})'), false);
  assert.deepEqual(e.json('getReadingOccurrences("bank",{readingYear:"112"}).map(row=>({form:row.form,year:row.passage.year,page:row.pdfPage}))'), [{form:'banks',year:112,page:10}]);
  for (const filters of ['undefined','{}','{readingYear:"all",readingTopic:"",readingSection:null}']) {
    assert.equal(e.run(`getReadingOccurrences("bank",${filters}).length`), 2);
  }
  assert.equal(e.run('getReadingVocabulary({word:"bank"})===getReadingVocabulary("bank")'), true);
  assert.equal(e.run('getReadingVocabulary("constructor")'), null, 'Inherited object properties are not vocabulary records');
});

test('reading rendering escapes text and preserves the distinction between original gloss and edited meaning', () => {
  const data = fixtureData(), payload = '<img src=x onerror=alert(1)>';
  data.entries.bank.readingSense = payload;
  data.entries.bank.note = payload;
  data.entries.bank.collocations = [[payload,payload]];
  data.entries.bank.occurrences[0].form = payload;
  data.passages[0].titleZh = payload;
  data.topics[0].label = payload;
  const before = JSON.stringify(data), e = helperEnvironment(data);
  const html = e.run('renderReadingVocabulary({word:"bank",meaning:"原始釋義"})');
  assert.ok(!html.includes('<img'), html);
  assert.ok(html.includes('&lt;img'), html);
  assert.match(html, /閱讀語境義 · 本站整理/);
  assert.match(html, /PDF 第 6 頁/);
  assert.match(html, /不是未來出題機率/);
  assert.equal(JSON.stringify(data), before, 'Rendering must not change source evidence');
  delete data.entries.bank.readingSense;
  const original = helperEnvironment(data).run('renderReadingVocabulary({word:"bank",meaning:"原始釋義<&>"})');
  assert.match(original, /原詞表釋義 · 配合題組語境判斷/);
  assert.ok(original.includes('原始釋義&lt;&amp;&gt;'));
});

function parseCsv(value) {
  const records = [], row = [];
  let cell = '', quoted = false;
  for (let i = value.charCodeAt(0) === 0xFEFF ? 1 : 0; i < value.length; i++) {
    const char = value[i];
    if (char === '"') {
      if (quoted && value[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && char === ',') { row.push(cell); cell = ''; }
    else if (!quoted && char === '\r' && value[i + 1] === '\n') {
      row.push(cell); records.push(row.splice(0)); cell = ''; i++;
    } else cell += char;
  }
  assert.equal(quoted, false, 'CSV contains an unterminated quoted field');
  return records;
}

test('CSV export contains only the selected evidence and safely quotes spreadsheet fields', () => {
  const data = fixtureData();
  data.entries.bank.readingSense = '"引號",逗點\n下一行';
  const e = helperEnvironment(data);
  e.context.rows = [{entry:{word:'bank',partOfSpeech:'n.',meaning:'=SUM(1,2)'}}];
  const csv = e.run('readingCsvText(rows,{readingYear:"112"})');
  assert.equal(csv.charCodeAt(0), 0xFEFF);
  const parsed = parseCsv(csv);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[1].length, parsed[0].length);
  const row = Object.fromEntries(parsed[0].map((heading,index)=>[heading,parsed[1][index]]));
  assert.equal(row['詞條'], 'bank');
  assert.equal(row['原詞表釋義'], "'=SUM(1,2)");
  assert.equal(row['閱讀語境義（本站整理）'], '"引號",逗點\n下一行');
  assert.equal(row['年份'], '112');
  assert.equal(row['主題'], '自然');
  assert.equal(row['實際詞形'], 'banks');
  assert.ok(!row['題組'].includes('111'));
  assert.ok(!row['頁碼'].includes('PDF 第 6 頁'));
  assert.equal(parseCsv(e.run('readingCsvText(rows,{readingYear:"111",readingTopic:"nature"})')).length, 1);
});

test('optional reading overlay leaves legacy lookup usable when it is unavailable', () => {
  const e = helperEnvironment();
  assert.equal(e.run('readingVocabularyData()'), null);
  assert.equal(e.run('getReadingVocabulary("bank")'), null);
  assert.deepEqual(e.json('getReadingOccurrences("bank",{})'), []);
  assert.equal(e.run('readingEntryMatches("bank",{})'), false);
  assert.equal(e.run('renderReadingVocabulary({word:"bank",meaning:"銀行"})'), '');
  assert.equal(e.run('readingSearchText("bank")'), '');
  assert.equal(parseCsv(e.run('readingCsvText([{word:"bank"}],{})')).length, 1);
});

test('published reading evidence uses existing exact IDs and factual passage/year counters', () => {
  const {environment} = require('../tools/benchmark_search.cjs');
  const e = environment();
  assert.equal(e.run('typeof GSAT_READING_VOCABULARY'), 'object', 'Production material snapshot must load the reading overlay');
  const data = JSON.parse(e.run('JSON.stringify(GSAT_READING_VOCABULARY)'));
  const vocabulary = JSON.parse(e.run('JSON.stringify(VOCABULARY.map(({word,meaning,level})=>({word,meaning,level})))'));
  const words = new Map(vocabulary.map(entry => [entry.word,entry]));
  const manifest = JSON.parse(fs.readFileSync(path.join(root,'research/reading_corpus_manifest.json'),'utf8'));
  const passages = new Map(data.passages.map(passage => [passage.id,passage]));
  const inventories = new Map(manifest.passages.map(passage => [passage.id,passage.tokens]));
  assert.equal(vocabulary.length, 6024);
  assert.equal(words.size, 6024);
  assert.ok(Object.keys(data.entries).length >= 500, 'Expansion should contain a substantial reading vocabulary');
  assert.equal(data.stats.words, Object.keys(data.entries).length);
  assert.equal(data.stats.passages, passages.size);
  assert.equal(passages.size, 25);
  assert.deepEqual([...new Set(data.sources.map(source => source.year))].sort(), [111,112,113,114,115]);
  let edited = 0;
  for (const [word,record] of Object.entries(data.entries)) {
    assert.ok(words.has(word), `${word} is not an existing exact word ID`);
    assert.ok(words.get(word).meaning.trim(), `${word} must keep its original gloss`);
    assert.ok(record.occurrences.length > 0, `${word} has no actual body evidence`);
    const seen = new Set(), years = new Set(), topics = new Set(), groupIds = new Set();
    for (const occurrence of record.occurrences) {
      const passage = passages.get(occurrence.passageId);
      assert.ok(passage, `${word}: missing passage ${occurrence.passageId}`);
      assert.ok(passage.pdfPages.includes(occurrence.pdfPage));
      assert.equal(occurrence.printedPage, occurrence.pdfPage-1);
      assert.ok(['exact','inflection','compound'].includes(occurrence.matchKind));
      if (occurrence.matchKind === 'compound') {
        assert.ok(typeof occurrence.component === 'string' && occurrence.component.length > 0, `${word}: compound evidence needs its actual component`);
        assert.ok(occurrence.form.toLowerCase().split('-').includes(occurrence.component.toLowerCase()), `${word}: component is not a complete compound segment`);
        assert.ok(record.editorialPassageIds?.includes(occurrence.passageId), `${word}: compound component needs passage-specific editorial review`);
      }
      assert.ok(inventories.get(passage.id).some(token => token.form === occurrence.form && token.pdfPage === occurrence.pdfPage), `${word}: evidence ${occurrence.form} not in actual body inventory`);
      const key = JSON.stringify([occurrence.passageId,occurrence.form,occurrence.pdfPage]);
      assert.ok(!seen.has(key), `${word}: duplicate occurrence summary`); seen.add(key);
      years.add(passage.year); topics.add(passage.topicId); groupIds.add(passage.id);
    }
    assert.deepEqual([...record.years].sort(), [...years].sort(), word);
    assert.deepEqual([...record.topics].sort(), [...topics].sort(), word);
    assert.equal(record.passageCount, groupIds.size, word);
    assert.ok(['cross-year','passage-core','topic'].includes(record.priority));
    if (record.priority === 'cross-year') assert.ok(years.size >= 2, `${word}: cross-year priority needs distinct-year evidence`);
    if (record.readingSense) {
      assert.equal(typeof record.readingSense,'string'); assert.ok(record.readingSense.trim()); edited++;
      assert.ok(record.editorialPassageIds?.length, `${word}: an edited sense needs explicit source scope`);
      assert.ok(record.editorialPassageIds.every(id=>groupIds.has(id)), `${word}: edited sense is not supported by its word occurrences`);
    }
  }
  assert.equal(data.stats.curatedWords,edited);
});

test('edited reading guidance is searchable without indexing the full examination text', () => {
  const {environment} = require('../tools/benchmark_search.cjs');
  const e = environment();
  const selected = e.run('Object.entries(GSAT_READING_VOCABULARY.entries).find(([word,row])=>row.readingSense&&row.readingSense.length>=6)?.[0]');
  assert.ok(selected, 'Need an edited reading sense to test retrieval');
  e.context.selected = selected;
  assert.equal(e.run('readingSearchText(VOCABULARY.find(entry=>entry.word===selected)).includes(GSAT_READING_VOCABULARY.entries[selected].readingSense)'), true);
  assert.equal(e.run('searchFields(VOCABULARY.find(entry=>entry.word===selected)).all.includes(normalizeSearchValue(GSAT_READING_VOCABULARY.entries[selected].readingSense))'), true);
  assert.equal(e.run('!!scoreSearchEntry(VOCABULARY.find(entry=>entry.word===selected),GSAT_READING_VOCABULARY.entries[selected].readingSense)'), true);
});

test('reading supplemental terms have their own glosses and real evidence without becoming official IDs', () => {
  const {environment} = require('../tools/benchmark_search.cjs');
  const e = environment();
  const data = JSON.parse(e.run('JSON.stringify(GSAT_READING_VOCABULARY)'));
  const ids = new Set(Array.from(e.run('VOCABULARY.map(entry=>entry.word)')));
  const aliases = new Set(Array.from(e.run('VOCABULARY.flatMap(entry=>builtinTargetAliases(entry.word)).map(word=>word.normalize("NFKC").toLowerCase())')));
  const manifest = JSON.parse(fs.readFileSync(path.join(root,'research/reading_corpus_manifest.json'),'utf8'));
  const passages = new Map(manifest.passages.map(passage=>[passage.id,passage]));
  const terms = Object.entries(data.supplemental || {});
  assert.ok(terms.length > 0, 'Reading extensions should include verified terms outside the existing dictionary');
  assert.equal(data.stats.supplementalWords,terms.length);
  for (const [word,record] of terms) {
    assert.ok(!ids.has(word), `${word} is an existing word ID, not an extension`);
    assert.ok(!aliases.has(word.normalize('NFKC').toLowerCase()), `${word} is already an official dictionary alias`);
    assert.ok(typeof record.pos === 'string' && record.pos.trim(), `${word}: missing part of speech`);
    assert.ok(typeof record.meaningZh === 'string' && /[\u3400-\u9fff]/.test(record.meaningZh), `${word}: missing Chinese meaning`);
    assert.ok(typeof record.note === 'string' && record.note.trim(), `${word}: missing context guidance`);
    assert.ok(record.occurrences.length, `${word}: missing actual reading evidence`);
    const years = new Set(), topics = new Set(), passageIds = new Set(), seen = new Set();
    for (const occurrence of record.occurrences) {
      const passage = passages.get(occurrence.passageId);
      assert.ok(passage, `${word}: missing source passage`);
      assert.ok(passage.tokens.some(token=>token.form===occurrence.form && token.pdfPage===occurrence.pdfPage), `${word}: unattested form ${occurrence.form}`);
      assert.equal(occurrence.printedPage,occurrence.pdfPage-1);
      const key = JSON.stringify([occurrence.passageId,occurrence.pdfPage,occurrence.form]);
      assert.ok(!seen.has(key),`${word}: duplicate evidence`);seen.add(key);
      years.add(passage.year);topics.add(passage.topicId);passageIds.add(passage.id);
    }
    assert.deepEqual([...record.years].sort(),[...years].sort(),word);
    assert.deepEqual([...record.topics].sort(),[...topics].sort(),word);
    assert.equal(record.passageCount,passageIds.size,word);
    if(record.priority==='cross-year')assert.ok(years.size>=2,word);
  }
  assert.equal(e.run('VOCABULARY.length'),6024,'Extension cards must not alter official/full-notebook coverage');
});
