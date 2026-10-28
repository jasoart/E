#!/usr/bin/env node
'use strict';
// Index actual original sentences across words; never synthesize a sentence by
// inserting a target into a generic frame or relabel an imported Anki example.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const MIN_CONTEXTS=3, TARGET_CONTEXTS=11;
const ctx=vm.createContext({console,localStorage:{getItem:()=>null},document:{getElementById:()=>({})}});
for(const name of ['js/config','data/vocabulary','data/collocations','data/learning','data/builtin-study','data/exam-notebook','data/vocabulary-enrichment','js/exam-notes','js/state','js/builtin','js/examples'])
  vm.runInContext(fs.readFileSync(path.join(root,'assets',name+'.js'),'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
const difficulty=require('./scenario_difficulty.cjs').createDifficultyResolver(ctx);
const raw=run('Object.values(BUILTIN_STUDY_DATA.entries).flatMap(x=>x.examples||[])');
const originals=run('VOCABULARY.flatMap(e=>(getOriginalStudy(e)||getBuiltinStudy(e))?.examples||[])');
const normalize=s=>s.replace(/\s+/g,' ').trim().toLowerCase();
const imported=new Set(originals.filter(x=>x.source==='uploaded-anki').map(x=>normalize(x.text)));
const sourceFiles=['authored_scenarios.txt',...fs.readdirSync(path.join(root,'research')).filter(name=>/^scenario-batch-.*\.txt$/.test(name)).sort()];
const fresh=sourceFiles.flatMap(sourceFile=>fs.readFileSync(path.join(root,'research',sourceFile),'utf8').split(/\r?\n/).flatMap((line,index)=>{
  if(!line.trim()||line.startsWith('#'))return [];
  const fields=line.split('|').map(x=>x.trim());
  if(fields.length!==5||fields.some(x=>!x))throw Error(`${sourceFile}:${index+1}: expected five nonempty editorial fields`);
  const [text,translationZh,grammar,writingTip,topic]=fields;
  const count=(text.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g)||[]).length;
  if(count<12||count>45)throw Error(`${sourceFile}:${index+1}: unsuitable length ${count}`);
  if(!/[。！？]$/.test(translationZh)||!/[.!?]$/.test(text))throw Error(`${sourceFile}:${index+1}: unfinished sentence`);
  if(imported.has(normalize(text)))throw Error(`${sourceFile}:${index+1}: identical to imported material`);
  return [{text,translationZh,grammar,writingTip,topic,source:'self-authored',editorialOrigin:'original-scenarios'}];
}));
const pool=new Map();
if(new Set(fresh.map(row=>normalize(row.text))).size!==fresh.length)
  throw Error('The original writing source contains duplicate sentences');
for(const example of [...fresh,...raw.filter(x=>x.source==='self-authored')]){
  const text=example.text,words=(text.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g)||[]).length;
  if(words<15||words>30||!example.translationZh||!example.grammar||!example.writingTip||imported.has(normalize(text)))continue;
  const key=normalize(text);if(pool.has(key))continue;
  const id='s'+crypto.createHash('sha256').update(text).digest('hex').slice(0,12);
  pool.set(key,{...example,id,source:'self-authored',examStyle:true,sharedScenario:true,
    editorialOrigin:example.editorialOrigin||'existing-authored-notes'});
}
const sentences=Object.fromEntries([...pool.values()].map(x=>[x.id,x]));
ctx.pool=[...pool.values()];
// Compile once per headword, then match real aliases/inflections at boundaries.
const entries=JSON.parse(run(`JSON.stringify(VOCABULARY.map(entry=>({word:entry.word,partOfSpeech:entry.partOfSpeech,curated:!!getCuratedExamNotebook(entry),forms:[...new Set(builtinTargetAliases(entry.word).flatMap(alias=>[...wordForms(alias.toLowerCase()),...(BUILTIN_IRREGULAR_FORMS[alias.toLowerCase()]||[])]))]})))`));
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const assignments=entries.map(entry=>{
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
  const cleanCandidates=candidates.map(row=>({row,assessment:difficulty.analyze(row.text,entry.word)})).filter(item=>!item.assessment.high.length&&ctx.builtinClozeQuestion(entry,item.row)).sort((a,b)=>a.assessment.unknown.length-b.assessment.unknown.length).map(item=>item.row);
  const first=cleanCandidates.find(x=>/\b(?:because|although|despite|but|whereas|however|so that|therefore|since)\b/i.test(x.text))||cleanCandidates[0];
  const second=cleanCandidates.find(x=>x!==first&&x.topic!==first?.topic)||cleanCandidates[1];
  const third=cleanCandidates.find(x=>x!==first&&x!==second&&x.topic!==first?.topic&&x.topic!==second?.topic)||cleanCandidates.find(x=>x!==first&&x!==second);
  // Preserve the original three in order, so existing practice IDs and familiar
  // cards remain stable. Prefer underrepresented topics for additional contexts.
  const chosen=[first,second,third].filter(Boolean), chosenIds=new Set(chosen.map(row=>row.id));
  const topicCounts=new Map();
  for(const row of chosen)topicCounts.set(row.topic,(topicCounts.get(row.topic)||0)+1);
  while(chosen.length<TARGET_CONTEXTS){
    let best=null;
    for(const row of cleanCandidates){
      if(chosenIds.has(row.id))continue;
      if(!best||(topicCounts.get(row.topic)||0)<(topicCounts.get(best.topic)||0))best=row;
    }
    if(!best)break;
    chosen.push(best);chosenIds.add(best.id);topicCounts.set(best.topic,(topicCounts.get(best.topic)||0)+1);
  }
  return {word:entry.word,curated:entry.curated,ids:chosen.map(row=>row.id)};
});
const byWord={},remaining=[];
for(const row of assignments){
  if(row.ids.length>=MIN_CONTEXTS)byWord[row.word]=row.ids;
  if(row.ids.length<TARGET_CONTEXTS)remaining.push({word:row.word,availableOriginalContexts:row.ids.length,missingContexts:TARGET_CONTEXTS-row.ids.length});
}
// A build-time matcher must agree with the actual recall matcher, not just with
// a looser candidate index. This also protects slash and parenthesized IDs.
ctx.assignments=byWord;ctx.sentences=sentences;
const mismatches=run(`VOCABULARY.flatMap(e=>(assignments[e.word]||[]).filter(id=>!builtinClozeQuestion(e,sentences[id])).map(id=>e.word+': '+id))`);
if(mismatches.length)throw Error(mismatches.join('\n'));
const used=new Set(Object.values(byWord).flat()),selected=Object.fromEntries([...used].sort().map(id=>[id,sentences[id]]));
const stats={minimumContextsPerWord:MIN_CONTEXTS,targetContextsPerWord:TARGET_CONTEXTS,newlyWrittenSentences:fresh.length,sharedWords:assignments.filter(x=>!x.curated&&x.ids.length>=MIN_CONTEXTS).length,completedWords:assignments.filter(x=>x.ids.length>=TARGET_CONTEXTS).length,sharedSentenceAppearances:Object.values(byWord).reduce((sum,ids)=>sum+ids.length,0),
  uniqueSharedSentences:used.size,curatedWords:assignments.filter(x=>x.curated).length,remainingWords:remaining.length,missingContexts:remaining.reduce((sum,row)=>sum+row.missingContexts,0),totalWords:assignments.length};
const data={description:'Original practice, not examination quotations. Each word retains at least three distinct 15–30-word contexts, with a target of eleven when the existing corpus supports it. Other known level6 and reviewed advanced surroundings are excluded. A sentence may teach several words, so unique sentences and appearances are counted separately.',stats,sentences:selected,byWord};
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
