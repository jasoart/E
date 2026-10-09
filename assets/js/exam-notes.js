"use strict";

// Keep the official table and its exact word strings intact. Supplemental words
// are appended at runtime; favorites and review continue to use the original IDs.
const GSAT_OFFICIAL_VOCABULARY_COUNT = VOCABULARY.length;
const EXAM_ORIGINAL_STUDY = new Map();
const EXAM_NOTEBOOK_BY_WORD = new Map();
const EXAM_NOTEBOOK_BY_ID = new Map();
function examNotebookKey(value) {
  return String(value || "").normalize("NFKC").toLowerCase().replace(/’/g,"'").replace(/\s+/g," ").trim();
}
function examNotebookAliases(value) {
  const word=examNotebookKey(value), values=[word];
  if(word==="neither adj./adv./pron./")values.push("neither");
  if(word==="sportsman/sportswoma n")values.push("sportswoman");
  if(word==="argue(argument)")values.push("argument");
  for(const variant of word.split("/")) {
    const part=variant.trim(), match=/^([^()]+)\(([^)]+)\)$/.exec(part);
    if(match) { values.push(match[1].trim()); if(match[2].includes(","))values.push(...match[2].split(",").map(item=>item.trim())); else values.push(match[1].trim()+match[2]); }
    else if(/^[a-z]+(?:[-'][a-z]+)*(?: [a-z]+)*$/.test(part))values.push(part);
  }
  return [...new Set(values)];
}
function getCuratedExamNotebook(entry) {
  const word=typeof entry==="string"?entry:entry?.word;
  for(const alias of examNotebookAliases(word))if(EXAM_NOTEBOOK_BY_WORD.has(alias))return EXAM_NOTEBOOK_BY_WORD.get(alias);
  return null;
}
function getExamNotebook(entry) {
  const word=typeof entry==="string"?entry:entry?.word;
  return EXAM_NOTEBOOK_BY_ID.get(word)||getCuratedExamNotebook(entry);
}
function getOriginalStudy(entry) { return EXAM_ORIGINAL_STUDY.get(typeof entry==="string"?entry:entry?.word)||null; }
function getExamEvidenceYears(entry) {
  // Keep legacy point citations and newly verified notebook citations searchable
  // together. The small index contains no excerpts and triggers no requests.
  const word=typeof entry==="string"?entry:entry?.word;
  const indexed=typeof GSAT_EXAM_EVIDENCE_INDEX!=="undefined"?GSAT_EXAM_EVIDENCE_INDEX.yearsByHeadword||{}:{};
  const years=typeof getGsatPoints==="function"&&entry&&typeof entry==="object"?getGsatPoints(entry).flatMap(point=>point.evidence||[]):[];
  for(const alias of examNotebookAliases(word))years.push(...(indexed[alias]||[]));
  return [...new Set(years.map(String))].sort((a,b)=>Number(a)-Number(b));
}
function notebookStats() {
  const entries=VOCABULARY.map(getExamNotebook).filter(Boolean);
  return {words:entries.length,listedWords:entries.length,curatedWords:VOCABULARY.filter(entry=>getCuratedExamNotebook(entry)).length,
    guidedWords:entries.filter(note=>note.provenance==="source-guided").length,
    examples:entries.reduce((sum,item)=>sum+(item.examples?.length||0),0),
    authoredExamples:entries.reduce((sum,item)=>sum+(item.examples||[]).filter(row=>row.source==="self-authored").length,0),
    collocations:entries.reduce((sum,item)=>sum+(item.collocations?.length||0),0),
    grammarPatterns:entries.reduce((sum,item)=>sum+(item.grammarPatterns?.length||0),0),supplemental:VOCABULARY.length-GSAT_OFFICIAL_VOCABULARY_COUNT};
}
if(typeof GSAT_EXAM_NOTEBOOK!=="undefined") {
  for(const [word,note] of Object.entries(GSAT_EXAM_NOTEBOOK.entries||{}))EXAM_NOTEBOOK_BY_WORD.set(examNotebookKey(word),note);
  for(const item of GSAT_EXAM_NOTEBOOK.supplemental||[]) {
    if(!item?.word||VOCABULARY.some(entry=>examNotebookKey(entry.word)===examNotebookKey(item.word)))continue;
    VOCABULARY.push({...item,level:6,supplemental:true,source:item.source||"本站補充詞彙；不列入大考中心原有 6,012 詞條"});
  }
  if(typeof BUILTIN_STUDY_DATA!=="undefined")for(const entry of VOCABULARY) {
    const note=getExamNotebook(entry);if(!note)continue;
    const original=BUILTIN_STUDY_DATA.entries[entry.word]||null;
    if(original)EXAM_ORIGINAL_STUDY.set(entry.word,original);
    BUILTIN_STUDY_DATA.entries[entry.word]={...original,
      plainMeaning:note.senses?.map(item=>item.meaning).filter(Boolean).join("；")||original?.plainMeaning||entry.meaning,
      examples:note.examples?.length?note.examples.map(item=>({...item,examStyle:true})):original?.examples||[],
      collocations:note.collocations?.map(item=>[item.en,item.zh,item.note||""])||original?.collocations||[],
      usageNote:note.usageNote||original?.usageNote||""};
  }
}

// V2 is available for every exact vocabulary ID. Curated writing and imported
// sentences keep separate provenance; no generated fallback is called an authored
// example, a verified synonym, an official frequency, or a new CEEC level.
function notebookSourceSenses(entry) {
  const raw=String(entry.meaning||""),pattern=/\b(n\. pl\.|vt\.|vi\.|adj\.|adv\.|prep\.|conj\.|pron\.|interj\.|art\.|num\.|aux\.|v\.|n\.|a\.)\s*/g;
  const matches=[...raw.matchAll(pattern)];
  if(!matches.length)return [{pos:entry.partOfSpeech||"詞性依原表",meaning:raw,usage:"對照下方兩句，先選出本句使用的字義，再觀察前後搭配。"}];
  return matches.map((match,index)=>({pos:match[1]==="a."?"adj.":match[1],
    meaning:raw.slice(match.index+match[0].length,matches[index+1]?.index??raw.length).replace(/^[；;\s]+|[；;\s]+$/g,""),
    usage:"依原釋義的詞性分段；專門義需配合實際語境核對。"})).filter(item=>item.meaning);
}
function notebookPosPrompt(entry) {
  const pos=String(entry.partOfSpeech||"");
  if(/v\./.test(pos))return "找出 [S] 誰做、[V] 做什麼；有 [O] 時指出對象。圈出動詞後的介系詞，並檢查時態與主被動。";
  if(/n\./.test(pos))return "找出包含目標詞的名詞片語，再判斷它作 [S]、[O] 或 [C]。觀察限定詞、數量與單複數，不以字尾猜可數性。";
  if(/adj\.|a\./.test(pos))return "找出目標詞修飾的名詞，或它是否在連綴動詞後作 [C]；再圈出程度詞及後接介系詞。";
  if(/adv\./.test(pos))return "指出目標詞修飾動作、形容詞，還是整個子句；觀察放置位置是否改變語氣或意思。";
  return "先找 [S] 與 [V]，再判斷目標詞如何連接或指向其他成分；用完整上下文核對關係。";
}
function notebookExampleGuide(entry,example) {
  const text=String(example.text||""),question=typeof builtinClozeQuestion==="function"?builtinClozeQuestion(entry,example):null;
  // The short window is quoted from the actual example, not generated prose.
  const slot=question?.masked.indexOf("________")??-1;
  const left=slot<0?"":(question.masked.slice(0,slot).match(/[A-Za-z]+(?:[-’'][A-Za-z]+)*/g)||[]).slice(-4).join(" ");
  const right=slot<0?"":(question.masked.slice(slot+8).match(/[A-Za-z]+(?:[-’'][A-Za-z]+)*/g)||[]).slice(0,4).join(" ");
  const evidenceWindow=question?`${left?"… "+left+" ":""}【${question.answer}】${right?" "+right+" …":""}`:"";
  const signals=[
    [/\b(?:although|even though|whereas|however|nevertheless)\b/i,"讓步／對比","哪兩項資訊形成對比？保留兩邊的主張，再檢查連接詞與標點。"],
    [/\b(?:because of|due to)\b/i,"原因片語","圈出原因片語與主句；because of／due to 後接名詞性成分。"],
    [/\bbecause\b/i,"原因與結果","分開指出原因及結果；不要把兩者的順序當作因果證明。"],
    [/\b(?:despite|in spite of)\b/i,"讓步片語","指出與預期不同的結果；despite／in spite of 後接名詞性成分或動名詞。"],
    [/\b(?:if|unless)\b/i,"條件／是否","判斷這裡提出條件，還是詢問／轉述是否；假設不等於已發生的事。"],
    [/\b(?:before|after|when|while|until)\b/i,"時間／對比線索","判斷後接名詞、動名詞或子句；while 還可能表對比，不能只見關鍵字就判句型。"],
    [/\b(?:may|might|could|some|often|usually)\b/i,"語氣與範圍","圈出限制程度或範圍的詞；改寫時不要把可能、部分或通常變成一定、全部。"],
  ];
  const signal=signals.find(([pattern])=>pattern.test(text));
  const topics=[[/\b(?:school|students?|teachers?|class|homework|exam|learn\w*)\b/i,"學校與學習"],
    [/\b(?:river|trees?|animals?|birds?|energy|water|pollution|climate|recycl\w*)\b/i,"自然與環境"],
    [/\b(?:health|hospital|doctor|sleep|exercise|patient|illness)\b/i,"健康與生活"],
    [/\b(?:work|job|office|business|company|money|bank|market)\b/i,"工作與社會"],
    [/\b(?:computer|online|internet|data|phone|research|science)\b/i,"科技與資訊"]];
  return {target:question?.answer||entry.word,evidenceWindow,prompt:notebookPosPrompt(entry),
    cue:signal?.[1]||"人物、動作與情境",evidence:signal?.[2]||"從本句找出支持這個字義的相鄰詞；中文對照用來核對整句，不把每個中文義都套入本句。",
    topic:example.topic&&!/未分類|原卡例句/.test(example.topic)?example.topic:topics.find(([pattern])=>pattern.test(text))?.[1]||"日常情境",
    transfer:`保留「${question?.answer||entry.word}」在本句的用法，改寫人物或事件；補上一個具體原因、結果或細節，再檢查意思是否成立。`};
}
function initializeAllWordNotebooks() {
  if(typeof BUILTIN_STUDY_DATA==="undefined")return;
  const relatives=new Map(),patterns=new Map();
  // Reuse explicit editorial family relationships; never infer family by prefix.
  for(const [head,note] of EXAM_NOTEBOOK_BY_WORD){
    const parent={word:head,pos:note.senses?.[0]?.pos||"",meaning:note.senses?.[0]?.meaning||""};
    const group=[parent,...(note.family||[])].filter(row=>row.word&&row.pos&&row.meaning);
    for(const member of group){
      const key=examNotebookKey(member.word),rows=relatives.get(key)||[];
      for(const other of group)if(examNotebookKey(other.word)!==key&&!rows.some(row=>row.word===other.word))rows.push({...other,sourceHeadword:head});
      relatives.set(key,rows);
    }
  }
  if(typeof GSAT_COLLOCATION_GUIDE!=="undefined")for(const point of GSAT_COLLOCATION_GUIDE){
    for(const key of point.keys||[]){
      const normalized=examNotebookKey(key),rows=patterns.get(normalized)||[];
      for(const [en,zh] of point.patterns||[])if(en&&zh&&!rows.some(row=>row.en.toLowerCase()===en.toLowerCase()))rows.push({en,zh,note:"原有搭配教材整理；是否出現在試卷須另看原文出處。"});
      patterns.set(normalized,rows);
    }
  }
  for(const entry of VOCABULARY){
    const curated=getCuratedExamNotebook(entry);
    if(curated){EXAM_NOTEBOOK_BY_ID.set(entry.word,curated);continue;}
    const study=BUILTIN_STUDY_DATA.entries[entry.word];if(!study)continue;
    const collocations=[];
    const add=row=>{if(row.en&&row.zh&&!/未附中文/.test(row.zh)&&!collocations.some(item=>item.en.toLowerCase()===row.en.toLowerCase()))collocations.push(row);};
    for(const [en,zh,note] of study.collocations||[])add({en,zh,note:note||""});
    for(const alias of examNotebookAliases(entry.word))for(const row of patterns.get(alias)||[])add(row);
    const family=[];
    for(const alias of examNotebookAliases(entry.word))for(const row of relatives.get(alias)||[])if(!family.some(item=>item.word===row.word))family.push(row);
    EXAM_NOTEBOOK_BY_ID.set(entry.word,{provenance:"source-guided",senses:notebookSourceSenses(entry),collocations,
      synonyms:[],idioms:[],family,examples:study.examples||[],
      usageNote:study.usageNote||entry.note||notebookPosPrompt(entry)});
  }
}
initializeAllWordNotebooks();
