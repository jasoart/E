'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function environment(){
  const c=vm.createContext({console,URL,localStorage:{getItem:()=>null},document:{getElementById:()=>({})},setTimeout,clearTimeout});
  for(const name of ['js/config','data/vocabulary','data/collocations','data/learning','data/builtin-study','data/exam-notebook','data/vocabulary-enrichment','data/authored-scenarios','data/reference-sentences','js/exam-notes','js/state','js/builtin','js/examples','js/ui'])
    vm.runInContext(fs.readFileSync(path.join(root,'assets',name+'.js'),'utf8'),c,{filename:name});
  return {c,run:source=>vm.runInContext(source,c)};
}
test('reference sentences have attribution, real target forms, unique text, and honest coverage totals',()=>{
  const e=environment();
  const issues=e.run(`VOCABULARY.flatMap(entry=>{
    const examples=builtinExampleResult(entry).examples,errors=[];
    if(new Set(examples.map(row=>row.text.toLowerCase().replace(/\\s+/g,' ').trim())).size!==examples.length)errors.push(entry.word+': duplicate');
    for(const row of examples.filter(item=>item.source==='tatoeba')){
      if(!/^\\d+$/.test(row.enId)||!/^\\d+$/.test(row.zhId)||!row.enAuthor||!row.zhAuthor||!row.translationOriginal||!row.translationZh)errors.push(entry.word+': missing attribution');
      if(!builtinClozeQuestion(entry,row)||row.wordCount<9||row.wordCount>30||row.examStyle)errors.push(entry.word+': invalid reference');
    }
    return errors;
  })`);
  assert.deepEqual(Array.from(issues),[]);
  const stats=e.run('GSAT_REFERENCE_SENTENCES.stats');
  assert.ok(stats.uniqueReferenceSentences>1000);
  assert.equal(stats.referenceAppearances,e.run(`VOCABULARY.reduce((n,entry)=>n+builtinExampleResult(entry).examples.filter(x=>x.source==='tatoeba').length,0)`));
  assert.equal(stats.completedWords,e.run(`VOCABULARY.filter(entry=>builtinExampleResult(entry).examples.length>=11).length`));
  assert.equal(stats.remainingWords,stats.totalWords-stats.completedWords);
  const report=JSON.parse(fs.readFileSync(path.join(root,'research/reference_sentence_coverage.json'),'utf8'));
  assert.equal(report.remaining.length,stats.remainingWords);
  assert.equal(report.remaining.reduce((n,row)=>n+row.missingContexts,0),stats.missingContexts);
});
test('reference cards show both authors and source links without claiming authorship',()=>{
  const e=environment();
  e.run(`var refWord=VOCABULARY.find(entry=>builtinExampleResult(entry).examples.some(item=>item.source==='tatoeba')); var ref=builtinExampleResult(refWord).examples.find(item=>item.source==='tatoeba')`);
  const html=e.run('renderGsatExampleCard(ref,4,refWord)');
  assert.match(html,/Tatoeba 參考句/);
  assert.match(html,/https:\/\/tatoeba\.org\/en\/sentences\/show\//);
  assert.match(html,/CC BY 2\.0 FR/);
  assert.doesNotMatch(html,/仿學測自編|學測導讀/);
  assert.ok(html.includes(e.run('escapeHtml(ref.enAuthor)')));
  assert.ok(html.includes(e.run('escapeHtml(ref.zhAuthor)')));
});
