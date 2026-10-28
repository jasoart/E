#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),context=vm.createContext({console,URL,localStorage:{getItem:()=>null},document:{getElementById:()=>({})}});
for(const name of ['js/config','data/vocabulary','data/collocations','data/learning','data/builtin-study','data/exam-notebook','data/vocabulary-enrichment','data/authored-scenarios','js/exam-notes','js/state','js/builtin','js/examples'])vm.runInContext(fs.readFileSync(path.join(root,'assets',name+'.js'),'utf8'),context);
const {createDifficultyResolver}=require('./scenario_difficulty.cjs'),resolver=createDifficultyResolver(context);
const data=JSON.parse(vm.runInContext('JSON.stringify(GSAT_AUTHORED_SCENARIOS)',context)),unclassified=new Map(),violations=[];
let appearances=0,knownLevel6Violations=0,reviewedAdvancedViolations=0;
for(const entry of resolver.entries){
 const ids=data.byWord[entry.word]||[];
 if(ids.length<3||ids.length>data.stats.targetContextsPerWord)violations.push({word:entry.word,reason:'context count outside supported range'});
 for(const id of ids){
  const row=data.sentences[id],result=resolver.analyze(row.text,entry);appearances++;
  if(result.level6.length)knownLevel6Violations++;if(result.excluded.length)reviewedAdvancedViolations++;
  if(result.high.length)violations.push({word:entry.word,id,reason:'other known level6 or reviewed advanced term',tokens:result.high});
  for(const token of result.unknown){const item=unclassified.get(token)||{token,appearances:0,exampleWords:[]};item.appearances++;if(item.exampleWords.length<3&&!item.exampleWords.includes(entry.word))item.exampleWords.push(entry.word);unclassified.set(token,item);}
 }
}
const report={policy:'Target aliases and inflections are exempt. Other known level6 words and reviewed advanced surroundings are excluded. Basic grammar and transparent derivatives are recorded separately; unclassified tokens are not assigned an invented CEEC level.',stats:{words:resolver.entries.length,minimumContextsPerWord:data.stats.minimumContextsPerWord,targetContextsPerWord:data.stats.targetContextsPerWord,appearances,knownLevel6Violations,reviewedAdvancedViolations,unclassifiedDistinct:unclassified.size},violations,unclassified:[...unclassified.values()].sort((a,b)=>b.appearances-a.appearances||a.token.localeCompare(b.token))};
const filename=path.join(__dirname,'scenario_difficulty_audit.json'),output=JSON.stringify(report,null,2)+'\n';
if(violations.length)throw Error('Scenario difficulty violations: '+JSON.stringify(violations.slice(0,8)));
if(process.argv.includes('--check')){if(fs.readFileSync(filename,'utf8')!==output)throw Error('Stale scenario difficulty audit');}else fs.writeFileSync(filename,output);
console.log(JSON.stringify(report.stats));
