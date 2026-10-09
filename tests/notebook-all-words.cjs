'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function environment(){
  const c=vm.createContext({console,localStorage:{getItem:()=>null},document:{getElementById:()=>({})},setTimeout,clearTimeout});
  for(const file of ['js/config','data/vocabulary','data/collocations','data/learning','data/builtin-study','data/exam-notebook',
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
test('sentence recall is explicitly distinguished from a verified collocation',()=>{
  const e=environment();
  const rows=e.run(`(()=>{
    const entry=VOCABULARY.find(row=>!getExamNotebook(row).collocations.length);
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
