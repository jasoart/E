"use strict";

function searchFields(entry){
  if(SEARCH_FIELD_CACHE.has(entry))return SEARCH_FIELD_CACHE.get(entry);
  const points=getGsatPoints(entry),study=typeof getBuiltinStudy==="function"?getBuiltinStudy(entry):null,notebook=typeof getExamNotebook==="function"?getExamNotebook(entry):null,word=normalizeSearchValue(entry.word),aliases=[...new Set([word,...(String(entry.word||"").match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g)||[]).map(normalizeSearchValue),...points.flatMap(point=>point.keys).map(normalizeSearchValue),...[...(notebook?.family||[]),...(notebook?.forms||[])].map(item=>normalizeSearchValue(item.word))].filter(Boolean))];
  const pattern=normalizeSearchValue([...points.flatMap(point=>point.patterns.flat()),...(study?.collocations||[]).flat(),...(notebook?.grammarPatterns||[]).flatMap(item=>[item.en,item.zh,item.note])].join(" ")),meaning=normalizeSearchValue([entry.meaning,study?.plainMeaning,study?.ankiMeaning,...(notebook?.senses||[]).map(item=>item.meaning)].filter(Boolean).join(" ")),notes=normalizeSearchValue([entry.collocations,entry.note,...(notebook?.senses||[]).flatMap(item=>[item.pos,item.usage]),...(notebook?.synonyms||[]).flatMap(item=>[item.en,item.zh,item.note]),...(notebook?.idioms||[]).flatMap(item=>[item.en,item.zh,item.note]),...[...(notebook?.family||[]),...(notebook?.forms||[])].flatMap(item=>[item.word,item.pos,item.meaning]),...(study?.examples||[]).flatMap(item=>[item.text,item.translationZh,item.grammar,item.writingTip]),study?.usageNote,...points.map(point=>point.trap),...points.map(point=>point.category),...points.map(point=>point.priority),...points.flatMap(point=>point.patternNotes),...points.map(point=>[...new Set(point.patternReferences.flat().map(ref=>ref.year+" "+ref.location))].join(" ")),...points.map(point=>(point.evidence||[]).join(" "))].join(" "));
  const fields={word,aliases,pattern,meaning,notes,all:normalizeSearchValue([word,aliases.join(" "),pattern,meaning,notes].join(" "))};SEARCH_FIELD_CACHE.set(entry,fields);return fields;
}
function tokenizeSearch(value){const normalized=normalizeSearchValue(value),tokens=normalized.match(/[a-z0-9]+(?:[-'][a-z0-9]+)*|[\u3400-\u9fff]+/gi)||[],result=[];for(const token of tokens){result.push(token);if(/[\u3400-\u9fff]/.test(token)&&token.length>2){for(let i=0;i<token.length-1;i++)result.push(token.slice(i,i+2))}}return result}
// Postings keep BM25 work proportional to matching documents. Field construction is
// shared with lexical search; idle warm-up yields after ~4 ms (one document minimum).
const BM25_POSTINGS=new Map(),SEARCH_WORD_INDEX=new Map();
let bm25Cursor=0,bm25Total=0,bm25WarmScheduled=false;
function buildBm25Chunk(limit,deadline){
  const end=Math.min(VOCABULARY.length,bm25Cursor+limit),started=performance.now(),first=bm25Cursor;
  for(;bm25Cursor<end;bm25Cursor++){
    if(bm25Cursor>first&&deadline&&(performance.now()-started>=4||deadline.timeRemaining()<=1))break;
    const entry=VOCABULARY[bm25Cursor],tokens=tokenizeSearch(searchFields(entry).all),counts=new Map();
    for(const token of tokens)counts.set(token,(counts.get(token)||0)+1);
    BM25_DOC_CACHE.set(entry,{counts,length:Math.max(1,tokens.length)});bm25Total+=Math.max(1,tokens.length);
    if(!SEARCH_WORD_INDEX.has(entry.word))SEARCH_WORD_INDEX.set(entry.word,bm25Cursor);
    for(const token of counts.keys()){
      BM25_INDEX.df.set(token,(BM25_INDEX.df.get(token)||0)+1);
      // Most terms occur in only one entry. Keep a single integer until a term
      // needs a list, avoiding an array allocation for every rare Chinese chunk.
      const postings=BM25_POSTINGS.get(token);
      if(postings===undefined)BM25_POSTINGS.set(token,bm25Cursor);
      else if(typeof postings==="number")BM25_POSTINGS.set(token,[postings,bm25Cursor]);
      else postings.push(bm25Cursor);
    }
  }
  if(bm25Cursor===VOCABULARY.length){BM25_INDEX.avgLength=bm25Total/Math.max(1,VOCABULARY.length);BM25_INDEX.ready=true}
}
function ensureBm25Index(){if(!BM25_INDEX.ready)buildBm25Chunk(VOCABULARY.length)}
function warmSearchIndex(deadline){
  if(BM25_INDEX.ready)return;
  buildBm25Chunk(120,deadline||{timeRemaining:()=>4});
  if(!BM25_INDEX.ready&&!bm25WarmScheduled){
    bm25WarmScheduled=true;
    const resume=nextDeadline=>{bm25WarmScheduled=false;warmSearchIndex(nextDeadline)};
    if(typeof window.scheduler?.postTask === "function"){
      // Native priorities let user input precede bounded background indexing.
      // Feature detection retains idle/timer support on older browsers.
      try { window.scheduler.postTask(()=>resume(),{priority:"background"}).catch(()=>setTimeout(resume,24)); }
      catch { setTimeout(resume,24); }
    }
    else if(window.requestIdleCallback)window.requestIdleCallback(resume,{timeout:800});
    else setTimeout(resume,24);
  }
}
function bm25Ranking(terms){
  if(!terms.length)return[];ensureBm25Index();
  const scores=new Float64Array(VOCABULARY.length),N=VOCABULARY.length,k1=1.25,b=.72;
  for(const term of terms){
    const postings=BM25_POSTINGS.get(term);if(postings===undefined)continue;
    const df=BM25_INDEX.df.get(term)||0,idf=Math.log(1+(N-df+.5)/(df+.5));
    const addScore=index=>{
      const doc=BM25_DOC_CACHE.get(VOCABULARY[index]),tf=doc.counts.get(term);
      scores[index]+=idf*(tf*(k1+1))/(tf+k1*(1-b+b*doc.length/BM25_INDEX.avgLength));
    };
    if(typeof postings==="number")addScore(postings);else for(const index of postings)addScore(index);
  }
  const ranking=[];
  // Original document order is retained for stable ties in reciprocal-rank fusion.
  for(let index=0;index<scores.length;index++)if(scores[index]>0)ranking.push({entry:VOCABULARY[index],index,score:scores[index]});
  return ranking;
}
function expandedQueryTerms(query){const normalized=normalizeSearchValue(query),terms=tokenizeSearch(normalized),conceptTerms=[];for(const concept of SEARCH_CONCEPTS){if(concept.triggers.some(trigger=>{const t=normalizeSearchValue(trigger);return normalized===t||normalized.length>=2&&normalized.includes(t)||(/[\u3400-\u9fff]/.test(normalized)||normalized.length>=4)&&t.includes(normalized)})){for(const term of concept.terms)conceptTerms.push(...tokenizeSearch(term))}}return{base:[...new Set(terms)],expanded:[...new Set([...terms,...conceptTerms])],hasConcept:conceptTerms.length>0}}
function bm25Score(entry,terms){if(!terms.length)return 0;ensureBm25Index();const doc=BM25_DOC_CACHE.get(entry),N=VOCABULARY.length,k1=1.25,b=.72;let score=0;for(const term of terms){const tf=doc.counts.get(term)||0;if(!tf)continue;const df=BM25_INDEX.df.get(term)||0,idf=Math.log(1+(N-df+.5)/(df+.5));score+=idf*(tf*(k1+1))/(tf+k1*(1-b+b*doc.length/BM25_INDEX.avgLength))}return score}
function conceptScore(entry,queryInfo){if(!queryInfo.hasConcept)return 0;const haystack=searchFields(entry).all;let score=0;for(const term of queryInfo.expanded){if(haystack.includes(term))score+=term.length>4?2:1}return score}
let FUZZY_ROWS=[new Uint16Array(32),new Uint16Array(32),new Uint16Array(32)];
function boundedDamerauLevenshtein(a,b,limit=2){
  a=String(a||"");b=String(b||"");if(a===b)return 0;
  const overflow=limit+1;
  if(!a||!b)return Math.min(overflow,Math.max(a.length,b.length));
  if(Math.abs(a.length-b.length)>limit)return overflow;
  // Three rows retain adjacent-transposition (optimal string alignment) semantics;
  // cells outside the edit-distance band cannot produce a distance <= limit.
  if(FUZZY_ROWS[0].length<=b.length)FUZZY_ROWS=Array.from({length:3},()=>new Uint16Array(b.length+1));
  let [previousPrevious,previous,current]=FUZZY_ROWS;
  previousPrevious.fill(overflow,0,b.length+1);previous.fill(overflow,0,b.length+1);
  for(let j=0;j<=Math.min(b.length,limit);j++)previous[j]=j;
  for(let i=1;i<=a.length;i++){
    current.fill(overflow,0,b.length+1);current[0]=Math.min(i,overflow);
    let rowMin=overflow;
    for(let j=Math.max(1,i-limit);j<=Math.min(b.length,i+limit);j++){
      const cost=a[i-1]===b[j-1]?0:1;
      let value=Math.min(previous[j]+1,current[j-1]+1,previous[j-1]+cost);
      if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])value=Math.min(value,previousPrevious[j-2]+1);
      current[j]=Math.min(value,overflow);rowMin=Math.min(rowMin,value);
    }
    if(rowMin>limit)return overflow;
    const recycled=previousPrevious;previousPrevious=previous;previous=current;current=recycled;
  }
  return Math.min(previous[b.length],overflow);
}
function scoreSearchEntry(entry,rawQuery){
  const query=normalizeSearchValue(rawQuery);
  return scoreSearchFields(searchFields(entry),query,query.split(" ").filter(Boolean),/^[a-z'-]+$/i.test(query));
}
function scoreSearchFields(fields,query,terms,englishOnly){
  if(!query)return{score:0,reason:""};
  if(fields.word===query)return{score:1000,reason:"完全相符"};
  if(fields.aliases.some(alias=>alias===query))return{score:940,reason:"字族相符"};
  if(fields.word.startsWith(query))return{score:820,reason:"開頭相符"};
  if(fields.aliases.some(alias=>alias.startsWith(query)))return{score:760,reason:"字族開頭"};
  if(fields.pattern.includes(query))return{score:720+Math.min(20,query.length),reason:"句型考點"};
  if(fields.notes.includes(query))return{score:610,reason:"搭配／提醒"};
  if(fields.meaning.includes(query))return{score:540+Math.min(30,query.length),reason:"中文釋義"};
  if(terms.length>1&&terms.every(term=>fields.all.includes(term)))return{score:380+terms.length*12,reason:"多詞命中"};
  if(terms.length===1&&fields.all.includes(query))return{score:330,reason:"內容相符"};
  if(englishOnly&&terms.length===1&&query.length>=4){const limit=query.length<=6?1:2,wordDistance=boundedDamerauLevenshtein(query,fields.word,limit);if(wordDistance<=limit)return{score:250-wordDistance*35,reason:`近似拼字 ${wordDistance} 處`};const aliasDistance=Math.min(...fields.aliases.filter(alias=>alias!==fields.word).map(alias=>boundedDamerauLevenshtein(query,alias,limit)),limit+1);if(aliasDistance<=limit)return{score:235-aliasDistance*30,reason:`近似字族 ${aliasDistance} 處`}}
  return null;
}
const SEARCH_RESULT_CACHE=new Map();
function hybridSearch(rawQuery){
  const cacheKey=normalizeSearchValue(rawQuery);if(SEARCH_RESULT_CACHE.has(cacheKey))return SEARCH_RESULT_CACHE.get(cacheKey);
  const results=computeHybridSearch(rawQuery);SEARCH_RESULT_CACHE.set(cacheKey,results);while(SEARCH_RESULT_CACHE.size>24)SEARCH_RESULT_CACHE.delete(SEARCH_RESULT_CACHE.keys().next().value);return results;
}
function computeHybridSearch(rawQuery){
  const query=normalizeSearchValue(rawQuery),queryInfo=expandedQueryTerms(query),terms=query.split(" ").filter(Boolean),englishOnly=/^[a-z'-]+$/i.test(query),lexical=[],sparse=bm25Ranking(queryInfo.expanded),conceptual=[];
  VOCABULARY.forEach((entry,index)=>{const direct=scoreSearchFields(searchFields(entry),query,terms,englishOnly);if(direct)lexical.push({entry,index,score:direct.score,reason:direct.reason});const semantic=conceptScore(entry,queryInfo);if(semantic>0)conceptual.push({entry,index,score:semantic})});
  lexical.sort((a,b)=>b.score-a.score);sparse.sort((a,b)=>b.score-a.score);conceptual.sort((a,b)=>b.score-a.score);
  const fused=new Map(),lexicalByIndex=new Map(lexical.map(item=>[item.index,item]));
  const addRanking=(items,weight,channel)=>items.slice(0,350).forEach((item,rank)=>{const record=fused.get(item.index)||{entry:item.entry,index:item.index,score:0,channels:new Set()};record.score+=weight/(60+rank+1);record.channels.add(channel);fused.set(item.index,record)});
  addRanking(lexical,1.75,"字面");addRanking(sparse,1,"BM25");if(queryInfo.hasConcept)addRanking(conceptual,1.2,"概念");
  lexical.slice(0,30).forEach(item=>{const record=fused.get(item.index);if(record&&item.score>=1000)record.score+=.09;else if(record&&item.score>=940)record.score+=.025});
  const feedback=state.searchFeedback[query]||{};Object.entries(feedback).sort((a,b)=>b[1]-a[1]).forEach(([word,count],rank)=>{if(!BM25_INDEX.ready)ensureBm25Index();const index=SEARCH_WORD_INDEX.get(word);if(index===undefined)return;const record=fused.get(index)||{entry:VOCABULARY[index],index,score:0,channels:new Set()};record.score+=Math.min(1.15,.7+Number(count)*.06)/(60+rank+1);record.channels.add("本機偏好");fused.set(index,record)});
  return[...fused.values()].map(record=>{const direct=lexicalByIndex.get(record.index),reason=direct&&direct.reason?direct.reason:record.channels.has("概念")?"概念擴展":record.channels.has("BM25")?"BM25 相關":"本機偏好";return{entry:record.entry,index:record.index,match:{score:record.score,reason,channels:[...record.channels]}}}).sort((a,b)=>b.match.score-a.match.score||a.entry.level-b.entry.level||a.entry.word.localeCompare(b.entry.word));
}
