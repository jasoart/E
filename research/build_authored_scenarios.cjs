#!/usr/bin/env node
'use strict';
// Index actual original sentences across words; never synthesize a sentence by
// inserting a target into a generic frame or relabel an imported Anki example.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const ctx=vm.createContext({console,localStorage:{getItem:()=>null},document:{getElementById:()=>({})}});
for(const name of ['js/config','data/vocabulary','data/collocations','data/learning','data/builtin-study','data/exam-notebook','js/exam-notes','js/state','js/builtin','js/examples'])
  vm.runInContext(fs.readFileSync(path.join(root,'assets',name+'.js'),'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
const raw=run('Object.values(BUILTIN_STUDY_DATA.entries).flatMap(x=>x.examples||[])');
const originals=run('VOCABULARY.flatMap(e=>(getOriginalStudy(e)||getBuiltinStudy(e))?.examples||[])');
const normalize=s=>s.replace(/\s+/g,' ').trim().toLowerCase();
const imported=new Set(originals.filter(x=>x.source==='uploaded-anki').map(x=>normalize(x.text)));
const fresh=fs.readFileSync(path.join(root,'research/authored_scenarios.txt'),'utf8').split(/\r?\n/).flatMap((line,index)=>{
  if(!line.trim()||line.startsWith('#'))return [];
  const fields=line.split('|').map(x=>x.trim());
  if(fields.length!==5||fields.some(x=>!x))throw Error(`Line ${index+1}: expected five nonempty editorial fields`);
  const [text,translationZh,grammar,writingTip,topic]=fields;
  const count=(text.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g)||[]).length;
  if(count<12||count>45)throw Error(`Line ${index+1}: unsuitable length ${count}`);
  if(!/[。！？]$/.test(translationZh)||!/[.!?]$/.test(text))throw Error(`Line ${index+1}: unfinished sentence`);
  if(imported.has(normalize(text)))throw Error(`Line ${index+1}: identical to imported material`);
  return [{text,translationZh,grammar,writingTip,topic,source:'self-authored',editorialOrigin:'original-scenarios'}];
});
const pool=new Map();
if(new Set(fresh.map(row=>normalize(row.text))).size!==fresh.length)
  throw Error('The original writing source contains duplicate sentences');
for(const example of [...fresh,...raw.filter(x=>x.source==='self-authored')]){
  const text=example.text,words=(text.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g)||[]).length;
  if(words<12||!example.translationZh||!example.grammar||!example.writingTip||imported.has(normalize(text)))continue;
  const key=normalize(text);if(pool.has(key))continue;
  const id='s'+crypto.createHash('sha256').update(text).digest('hex').slice(0,12);
  pool.set(key,{...example,id,source:'self-authored',examStyle:true,sharedScenario:true,
    editorialOrigin:example.editorialOrigin||'existing-authored-notes'});
}
const sentences=Object.fromEntries([...pool.values()].map(x=>[x.id,x]));
ctx.pool=[...pool.values()];
// Compile once per headword, then match real aliases/inflections at boundaries.
const entries=JSON.parse(run(`JSON.stringify(VOCABULARY.map(entry=>({word:entry.word,curated:!!getCuratedExamNotebook(entry),forms:[...new Set(builtinTargetAliases(entry.word).flatMap(alias=>[...wordForms(alias.toLowerCase()),...(BUILTIN_IRREGULAR_FORMS[alias.toLowerCase()]||[])]))]})))`));
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const assignments=entries.map(entry=>{
  if(entry.curated)return entry;
  const expression=new RegExp('(^|[^\\p{L}\\p{N}_])('+entry.forms.map(escape).sort((a,b)=>b.length-a.length).join('|')+')(?=$|[^\\p{L}\\p{N}_])','iu');
  const candidates=[...pool.values()].filter(row=>{
    if(!expression.test(row.text))return false;
    if(entry.word==='am/a.m.')return /\ba\.m\./i.test(row.text);
    if(entry.word==='pm/p.m.')return /\bp\.m\./i.test(row.text);
    if(entry.word==='March')return /\bMarch\b/.test(row.text);
    if(entry.word==='march')return /\bmarch(?:es|ed|ing)?\b/.test(row.text);
    if(entry.word==='August')return /\bAugust\b/.test(row.text);
    if(entry.word==='May')return /\bMay\b/.test(row.text);
    return true;
  });
  const first=candidates[0];
  const second=candidates.find(x=>x!==first&&x.topic!==first.topic)||candidates[1];
  return {word:entry.word,ids:[first?.id,second?.id].filter(Boolean)};
});
const byWord={},remaining=[];
for(const row of assignments){
  if(row.curated)continue;
  if(row.ids.length===2)byWord[row.word]=row.ids;
  else remaining.push({word:row.word,availableOriginalContexts:row.ids.length});
}
// A build-time matcher must agree with the actual recall matcher, not just with
// a looser candidate index. This also protects slash and parenthesized IDs.
ctx.assignments=byWord;ctx.sentences=sentences;
const mismatches=run(`VOCABULARY.flatMap(e=>(assignments[e.word]||[]).filter(id=>!builtinClozeQuestion(e,sentences[id])).map(id=>e.word+': '+id))`);
if(mismatches.length)throw Error(mismatches.join('\n'));
const used=new Set(Object.values(byWord).flat()),selected=Object.fromEntries([...used].sort().map(id=>[id,sentences[id]]));
const stats={newlyWrittenSentences:fresh.length,sharedWords:Object.keys(byWord).length,sharedSentenceAppearances:used.size?Object.keys(byWord).length*2:0,
  uniqueSharedSentences:used.size,curatedWords:assignments.filter(x=>x.curated).length,remainingWords:remaining.length,totalWords:assignments.length};
const data={description:'Original practice, not examination quotations. A complete sentence may teach several words; unique sentences and appearances are counted separately.',stats,sentences:selected,byWord};
const outputs={
  'assets/data/authored-scenarios.js':'"use strict";\n// Generated by research/build_authored_scenarios.cjs.\nconst GSAT_AUTHORED_SCENARIOS = '+JSON.stringify(data)+';\n',
  'research/authored_scenario_coverage.json':JSON.stringify({stats,remaining},null,2)+'\n',
};
for(const [name,content] of Object.entries(outputs)){
  const filename=path.join(root,name);
  if(process.argv.includes('--check')){if(!fs.existsSync(filename)||fs.readFileSync(filename,'utf8')!==content)throw Error(`Stale generated file: ${name}`);}
  else fs.writeFileSync(filename,content);
}
console.log(JSON.stringify(stats));
