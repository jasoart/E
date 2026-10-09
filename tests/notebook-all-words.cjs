'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function environment(){
  const c=vm.createContext({console,URL,localStorage:{getItem:()=>null},document:{getElementById:()=>({})},setTimeout,clearTimeout});
  for(const file of ['js/config','data/vocabulary','data/collocations','data/learning','data/builtin-study','data/exam-notebook','data/authored-scenarios',
    'js/exam-notes','js/state','js/builtin','js/search','js/examples','js/retrieval-practice','js/ui'])
    vm.runInContext(fs.readFileSync(path.join(root,'assets',file+'.js'),'utf8'),c,{filename:file});
  return {c,run:s=>vm.runInContext(s,c)};
}
test('every exact official and supplemental ID has usable V2 notes and a recall session',()=>{
  const e=environment();
  const failures=e.run(`VOCABULARY.flatMap(entry=>{
    const note=getExamNotebook(entry),errors=[];
    if(!note?.senses.length||note.examples.length<2)errors.push(entry.word+': incomplete note');
    if(!retrievalQuestions(entry,[]).length)errors.push(entry.word+': no recall session');
    for(const example of note?.examples||[]){
      if(!['self-authored','uploaded-anki'].includes(example.source))errors.push(entry.word+': unknown provenance');
      if(!example.translationZh)errors.push(entry.word+': missing translation');
      const guide=notebookExampleGuide(entry,example);
      if(!guide.target||!guide.prompt||!guide.evidence||!guide.transfer)errors.push(entry.word+': incomplete guide');
    }
    for(const html of [renderNotebookContextPatterns(entry,note),renderNotebookRelations(note,entry),renderNotebookFamily(note,entry)]){
      if(!html||html.includes('尚未就緒')||html.includes('card-empty'))errors.push(entry.word+': empty teaching field');
    }
    return errors;
  })`);
  assert.deepEqual(Array.from(failures),[]);
  assert.equal(e.run('VOCABULARY.slice(0,GSAT_OFFICIAL_VOCABULARY_COUNT).length'),6012);
  assert.equal(e.run('notebookStats().listedWords'),e.run('VOCABULARY.length'));
});
test('source-guided notes preserve imported text and never relabel it as authored',()=>{
  const e=environment();
  assert.equal(e.run(`VOCABULARY.every(entry=>{
    const note=getExamNotebook(entry);
    if(note.provenance!=='source-guided')return true;
    return note.examples===BUILTIN_STUDY_DATA.entries[entry.word].examples&&
      builtinExampleResult(entry).examples.every(example=>example.source!=='uploaded-anki'||!example.examStyle);
  })`),true);
  e.run(`var ordinary=VOCABULARY.find(entry=>getExamNotebook(entry).provenance==='source-guided'&&getExamNotebook(entry).examples[0].source==='uploaded-anki')`);
  const html=e.run('renderGsatExampleCard(builtinExampleResult(ordinary).examples[0],1,ordinary)');
  assert.match(html,/上傳教材/);assert.doesNotMatch(html,/仿學測自編|句子結構未分類|題材未分類/);
});
test('original scenario pairs contain the target and move unchanged imports into the archive',()=>{
  const e=environment();
  const failures=e.run(`VOCABULARY.flatMap(entry=>{
    const note=getExamNotebook(entry);if(note.provenance!=='authored-scenarios')return [];
    const errors=[],original=getOriginalStudy(entry);
    if(!original?.examples.length)errors.push(entry.word+': missing original archive');
    if(note.examples.length!==2||note.examples[0].text===note.examples[1].text)errors.push(entry.word+': need distinct pair');
    for(const row of note.examples){
      if(row.source!=='self-authored'||!row.examStyle||!builtinClozeQuestion(entry,row))errors.push(entry.word+': invalid original sentence');
      if(!row.grammar||!row.writingTip||!row.translationZh)errors.push(entry.word+': missing contextual guidance');
      if(original.examples.some(x=>x.source==='uploaded-anki'&&x.text===row.text))errors.push(entry.word+': imported sentence relabeled');
    }
    return errors;
  })`);
  assert.deepEqual(Array.from(failures),[]);
  assert.equal(e.run('notebookStats().scenarioWords'),e.run('GSAT_AUTHORED_SCENARIOS.stats.sharedWords'));
  assert.equal(e.run('notebookStats().originalPairWords+notebookStats().guidedWords'),6024);
  assert.equal(e.run(`VOCABULARY.filter(row=>/^a/i.test(row.word)).every(row=>getExamNotebook(row).provenance!=='source-guided')`),true);
});
test('noun and pronoun abbreviations are not confused with verb and noun substrings',()=>{
  const e=environment();
  assert.match(e.run(`notebookPosPrompt({partOfSpeech:'adv.'})`),/修飾動作/);
  assert.match(e.run(`notebookPosPrompt({partOfSpeech:'pron.'})`),/連接或指向/);
  assert.match(e.run(`notebookPosPrompt({partOfSpeech:'vt./n.'})`),/時態與主被動/);
});
test('sentence recall is explicitly distinguished from a verified collocation',()=>{
  const e=environment();
  const rows=e.run(`(()=>{
    const entry=VOCABULARY.find(row=>!getExamNotebook(row).collocations.length&&!getExamNotebook(row).grammarPatterns?.length);
    return {word:entry.word,questions:retrievalQuestions(entry,[]),examples:getExamNotebook(entry).examples};
  })()`);
  assert.ok(rows.questions.length>=1);
  for(const q of rows.questions){assert.equal(q.kind,'sentence');assert.ok(rows.examples.some(x=>x.text===q.chunk&&x.translationZh===q.meaning));}
});
test('POS guidance does not mislabel after + noun as a clause',()=>{
  const e=environment();
  const guide=e.run(`notebookExampleGuide({word:'apple',partOfSpeech:'n.'},{text:'She ate an apple after lunch.'})`);
  assert.match(guide.evidence,/後接名詞、動名詞或子句/);
  assert.doesNotMatch(guide.evidence,/after 引導.*子句/);
  assert.equal(e.run(`notebookSourceSenses({meaning:'a. 熟練的；n. 專家',partOfSpeech:'adj./n.'})[0].pos`),'adj.');
});
test('family expansion uses editorial relationships and preserves exact variant IDs',()=>{
  const e=environment();
  assert.ok(e.run(`getExamNotebook('accuracy').family.some(row=>row.word==='accurate')`));
  assert.equal(e.run(`getExamNotebook('unknown-word')`),null);
  assert.ok(e.run(`VOCABULARY.filter(row=>/march/i.test(row.word)).every(row=>getExamNotebook(row).examples===BUILTIN_STUDY_DATA.entries[row.word].examples)`));
  assert.ok(e.run(`getExamNotebook('ethic(s)').examples.some(row=>row.text.includes('ethic'))`));
});
test('WordNet extract has verifiable polysemy and only explicit derivational relations',()=>{
  const data=JSON.parse(fs.readFileSync(path.join(root,'assets/data/wordnet-learning.json'),'utf8'));
  const e=environment();
  const ids=e.run('VOCABULARY.map(row=>row.word)');
  assert.equal(data.stats.listedWords,ids.length);
  assert.ok(data.stats.coveredWords>5900);
  assert.ok(Object.keys(data.entries).every(word=>ids.includes(word)));
  assert.ok(data.entries.bank.senses.some(row=>row.gloss.includes('body of water')));
  assert.ok(data.entries.bank.senses.some(row=>row.gloss.includes('financial institution')));
  assert.ok(data.entries.teacher.family.some(row=>row.word==='teach'&&row.pos==='v.'));
  assert.deepEqual(data.entries.apple.family,[]);
  assert.ok(data.entries.prudent.family.some(row=>row.word==='prudence'));
  const guide=e.run(`notebookExampleGuide({word:'apple',partOfSpeech:'n.'},{text:'She ate an apple after lunch.'})`);
  assert.match(guide.evidenceWindow,/ate an 【apple】 after lunch/);
  assert.ok(!guide.evidenceWindow.includes('________'));
});
test('all 64 IDs without a WordNet sense have dedicated bilingual editorial notes',()=>{
  const e=environment();
  const lexicon=JSON.parse(fs.readFileSync(path.join(root,'assets/data/wordnet-learning.json'),'utf8'));
  const missing=e.run('VOCABULARY.map(row=>row.word)').filter(word=>!lexicon.entries[word]?.senses?.length);
  assert.equal(missing.length,64);
  e.c.missing=missing;
  assert.deepEqual(Array.from(e.run(`missing.filter(word=>{
    const note=getCuratedExamNotebook(word);
    return !note||note.examples.length!==2||!note.references?.length||note.examples.some(row=>row.source!=='self-authored');
  })`)),[]);
});
test('grammar patterns are practiced and counted separately from lexical collocations',()=>{
  const e=environment();
  assert.equal(e.run(`Object.values(GSAT_EXAM_NOTEBOOK.entries).filter(note=>note.kind==='grammar').length`),58);
  assert.equal(e.run(`VOCABULARY.every(entry=>{
    const note=getExamNotebook(entry);if(note.kind!=='grammar')return true;
    return note.collocations.length===0&&note.grammarPatterns.length>=4&&retrievalQuestions(entry,[]).every(q=>q.kind==='pattern');
  })`),true);
  assert.equal(e.run(`notebookStats().grammarPatterns`),232);
  assert.equal(e.run(`notebookStats().collocations`),e.run(`VOCABULARY.reduce((sum,entry)=>sum+getExamNotebook(entry).collocations.length,0)`));
  const html=e.run(`renderNotebookContextPatterns({word:'to'},getExamNotebook('to'))`);
  assert.match(html,/文法句型/);assert.match(html,/look forward/);
  assert.equal(e.run(`renderNotebookLexical({word:'to'},'family')`),'');
});
test('pronoun forms, article and modal retain their actual grammatical roles',()=>{
  const e=environment();
  const html=e.run(`renderNotebookFamily(getExamNotebook('she (her, hers, herself)'),{word:'she (her, hers, herself)'})`);
  assert.match(html,/語法形式/);assert.match(html,/herself/);assert.match(html,/所有格限定詞/);
  assert.equal(e.run(`getExamNotebook('she').family.length`),0);
  assert.equal(e.run(`getExamNotebook('the').senses[0].pos`),'art.');
  assert.equal(e.run(`getExamNotebook('shall').senses[0].pos`),'aux.');
  assert.match(e.run(`renderNotebookFamily(getExamNotebook('pajamas'),{word:'pajamas'})`),/主詞中心為 pair/);
});
test('grammar patterns and form guidance are searchable and reference links are safe',()=>{
  const e=environment();
  assert.match(e.run(`searchFields(VOCABULARY.find(row=>row.word==='to')).pattern`),/object to v-ing/);
  assert.match(e.run(`searchFields(VOCABULARY.find(row=>row.word==='she (her, hers, herself)')).notes`),/所有格限定詞/);
  const html=e.run(`renderNotebookReferences({references:[{label:'Unsafe',url:'javascript:alert(1)'},{label:'Grammar <source>',url:'https://dictionary.cambridge.org/grammar/british-grammar/to'}]})`);
  assert.doesNotMatch(html,/javascript:|Unsafe|Grammar <source>/);
  assert.match(html,/Grammar &lt;source&gt;/);assert.match(html,/dictionary.cambridge.org/);
});
