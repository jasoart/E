"use strict";

// Keep the official table and its exact word strings intact. Supplemental words
// are appended at runtime; favorites and review continue to use the original IDs.
const GSAT_OFFICIAL_VOCABULARY_COUNT = VOCABULARY.length;
const EXAM_ORIGINAL_STUDY = new Map();
const EXAM_NOTEBOOK_BY_WORD = new Map();
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
function getExamNotebook(entry) {
  const word=typeof entry==="string"?entry:entry?.word;
  for(const alias of examNotebookAliases(word))if(EXAM_NOTEBOOK_BY_WORD.has(alias))return EXAM_NOTEBOOK_BY_WORD.get(alias);
  return null;
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
  const entries=typeof GSAT_EXAM_NOTEBOOK==="undefined"?[]:Object.values(GSAT_EXAM_NOTEBOOK.entries||{});
  return {words:entries.length,listedWords:VOCABULARY.filter(entry=>getExamNotebook(entry)).length,examples:entries.reduce((sum,item)=>sum+(item.examples?.length||0),0),collocations:entries.reduce((sum,item)=>sum+(item.collocations?.length||0),0),supplemental:VOCABULARY.length-GSAT_OFFICIAL_VOCABULARY_COUNT};
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
