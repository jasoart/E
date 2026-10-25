'use strict';
// CEEC table membership audit. Unknown is not the same as difficult; derivations
// and omitted basic grammar need separate review. Other known L6 and the reviewed
// advanced surroundings list are excluded; target forms remain exempt.
const vm=require('node:vm');
const excludedTerms=new Set(require('./scenario-difficulty-exclusions.json').words.split(/\s+/));
const reviewedBasic=new Set(require('./scenario-difficulty-basic.json').words.split(/\s+/));
function createDifficultyResolver(context){
 const data=JSON.parse(vm.runInContext(`JSON.stringify({entries:VOCABULARY.map(e=>({...e,forms:[...new Set(builtinTargetAliases(e.word).flatMap(a=>[...wordForms(a.toLowerCase()),...(BUILTIN_IRREGULAR_FORMS[a.toLowerCase()]||[])]))],inflections:getNotebookInflections(e)})),officialCount:GSAT_OFFICIAL_VOCABULARY_COUNT,levels:CEEC_LEVEL_BY_WORD})`,context));
 const levels=new Map(Object.entries(data.levels));
 const add=(form,level)=>{form=form.toLowerCase().replace(/’/g,"'");if(!/^[a-z]+(?:[-'][a-z]+)*$/.test(form))return;if(level<(levels.get(form)||99))levels.set(form,level);};
 for(const e of data.entries.slice(0,data.officialCount)){
  for(const form of e.forms)add(form,e.level);
  for(const row of e.inflections)for(const form of row.value.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g)||[])add(form,e.level);
 }
 const contractions={"can't":"can",cannot:'can',"couldn't":'could',"won't":'will',"wouldn't":'would',"shouldn't":'should',"mustn't":'must',"isn't":'be',"aren't":'be',"wasn't":'be',"weren't":'be',"hasn't":'have',"haven't":'have',"hadn't":'have',"doesn't":'do',"don't":'do',"didn't":'do',"i'm":'be',"you're":'be',"we're":'be',"they're":'be',"i've":'have',"we've":'have',"they've":'have'};
 const supplementary=new Set(data.entries.filter(e=>e.supplemental).flatMap(e=>e.forms));
 function classifyToken(token){
  let t=token.toLowerCase().replace(/’/g,"'");t=contractions[t]||t;
  if(levels.has(t))return {token:t,level:levels.get(t)};
  if(/'s$/.test(t)){const stem=t.slice(0,-2),result=classifyToken(stem);if(result.level||result.reviewed||result.excluded)return {...result,analysis:'possessive-or-contraction'};}
  if(supplementary.has(t))return {token:t,level:0,excluded:true};
  if([t,t.endsWith('s')?t.slice(0,-1):'',t.endsWith('es')?t.slice(0,-2):'',t.endsWith('ed')?t.slice(0,-2):'',t.endsWith('ing')?t.slice(0,-3):''].some(stem=>excludedTerms.has(stem)))return {token:t,level:0,excluded:true};
  if(reviewedBasic.has(t))return {token:t,level:0,reviewed:true,analysis:'reviewed-basic'};
  const bases=[];
  if(t.endsWith('ly'))bases.push(t.slice(0,-2),t.endsWith('ily')?t.slice(0,-3)+'y':'',t.endsWith('ly')?t.slice(0,-1)+'e':'');
  if(t.endsWith('ness'))bases.push(t.slice(0,-4),t.endsWith('iness')?t.slice(0,-5)+'y':'');
  for(const prefix of ['un','re','non','in','im','ir','il','dis'])if(t.startsWith(prefix))bases.push(t.slice(prefix.length));
  const occupation=t.endsWith('s')?t.slice(0,-1):t;
  if(occupation.endsWith('er')){const base=occupation.slice(0,-2);bases.push(base,base+'e',/([a-z])\1$/.test(base)?base.slice(0,-1):'');}
  if(bases.some(base=>levels.has(base)&&levels.get(base)<=5))return {token:t,level:0,reviewed:true,analysis:'transparent-derivation'};
  if(t.includes('-')){const parts=t.split('-').map(classifyToken);if(parts.every(p=>p.level>0||p.reviewed))return {token:t,level:Math.max(...parts.map(p=>p.level)),reviewed:parts.every(p=>p.reviewed||p.level>0),analysis:'hyphenated-components',parts};}
  return {token:t,level:0};
 }
 const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),byWord=new Map(data.entries.map(e=>[e.word,e])),expressions=new Map();
 function analyze(text,entry){
  const word=typeof entry==='string'?entry:entry.word,e=byWord.get(word)||entry;
  let re=expressions.get(word);if(!re){re=new RegExp('(^|[^\\p{L}\\p{N}_])(?:'+e.forms.map(esc).sort((a,b)=>b.length-a.length).join('|')+')(?=$|[^\\p{L}\\p{N}_])','giu');expressions.set(word,re);}
  re.lastIndex=0;const masked=text.replace(re,'$1 '),tokens=masked.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').match(/[A-Za-z]+(?:[-’'][A-Za-z]+)*/g)||[],classified=tokens.map(classifyToken);
  return {level6:[...new Set(classified.filter(x=>x.level===6).map(x=>x.token))],excluded:[...new Set(classified.filter(x=>x.excluded).map(x=>x.token))],high:[...new Set(classified.filter(x=>x.level===6||x.excluded).map(x=>x.token))],unknown:[...new Set(classified.filter(x=>!x.level&&!x.reviewed&&!x.excluded).map(x=>x.token))]};
 }
 return {entries:data.entries,officialCount:data.officialCount,levels,classifyToken,analyze};
}
module.exports={createDifficultyResolver};
