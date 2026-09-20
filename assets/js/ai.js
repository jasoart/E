"use strict";

function setAiStatus(message){if(aiSearchStatus)aiSearchStatus.textContent=message}
function syncAiButton(){if(!aiSearchButton)return;aiSearchButton.disabled=state.aiBusy;aiSearchButton.classList.toggle("active",state.aiMode);aiSearchButton.setAttribute("aria-pressed",String(state.aiMode));aiSearchButton.textContent=state.aiBusy?"AI 處理中…":state.aiMode?"關閉 AI，返回一般搜尋":"啟用 AI 語意搜尋"}
function disableAiMode(message="已切回本機混合搜尋。"){
  if(!state.aiMode)return;state.aiMode=false;syncAiButton();setAiStatus(message);
}
function openAiIndexDb(){
  return new Promise((resolve,reject)=>{if(!("indexedDB" in window)){reject(new Error("IndexedDB unavailable"));return}const request=indexedDB.open("gsat-ai-search-v1",1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains("indexes"))request.result.createObjectStore("indexes")};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error("IndexedDB error"))});
}
async function readAiIndex(){
  try{const db=await openAiIndexDb();return await new Promise((resolve,reject)=>{const transaction=db.transaction("indexes","readonly"),request=transaction.objectStore("indexes").get(AI_INDEX_KEY);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error)}).finally(()=>db.close())}catch{return null}
}
async function saveAiIndex(vectors,dimensions){
  try{const db=await openAiIndexDb();await new Promise((resolve,reject)=>{const transaction=db.transaction("indexes","readwrite");transaction.objectStore("indexes").put({count:VOCABULARY.length,dimensions,buffer:vectors.buffer.slice(0),createdAt:Date.now()},AI_INDEX_KEY);transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error)});db.close()}catch{}
}
function aiEntryText(entry){
  const patterns=getGsatPoints(entry).flatMap(point=>point.patterns.map(pattern=>pattern.join(" means "))).join("; ");return[String(entry.word||""),String(entry.partOfSpeech||""),String(entry.meaning||""),String(entry.collocations||""),String(entry.note||""),patterns].filter(Boolean).join(". ").slice(0,900);
}
async function loadAiExtractor(){
  if(state.aiExtractor)return state.aiExtractor;setAiStatus("正在下載 MiniLM 多語模型；首次使用時間取決於網路速度…");const module=await import(AI_LIBRARY_URL);const progress_callback=progress=>{if(progress&&Number.isFinite(progress.progress))setAiStatus(`正在下載開源模型 ${Math.round(progress.progress)}%…`)};
  try{state.aiExtractor=await module.pipeline("feature-extraction",AI_MODEL_ID,{device:"wasm",dtype:"q8",progress_callback})}catch{state.aiExtractor=await module.pipeline("feature-extraction",AI_MODEL_ID,{device:"wasm",progress_callback})}return state.aiExtractor;
}
async function ensureAiIndex(){
  if(state.aiVectors&&state.aiVectorSize)return;const stored=await readAiIndex();if(stored&&stored.count===VOCABULARY.length&&stored.dimensions>0&&stored.buffer){const vectors=new Float32Array(stored.buffer);if(vectors.length===stored.count*stored.dimensions){state.aiVectors=vectors;state.aiVectorSize=stored.dimensions;setAiStatus("已載入本機 AI 語意索引。");return}}
  const extractor=await loadAiExtractor(),chunkSize=64;let vectors=null,dimensions=0;
  for(let start=0;start<VOCABULARY.length;start+=chunkSize){const batch=VOCABULARY.slice(start,start+chunkSize).map(aiEntryText),output=await extractor(batch,{pooling:"mean",normalize:true}),data=output.data,rows=batch.length;dimensions=Number(output.dims&&output.dims[output.dims.length-1])||Math.floor(data.length/rows);if(!vectors)vectors=new Float32Array(VOCABULARY.length*dimensions);vectors.set(data,start*dimensions);const done=Math.min(VOCABULARY.length,start+rows);setAiStatus(`正在建立本機語意索引 ${done.toLocaleString()} / ${VOCABULARY.length.toLocaleString()}…`);await new Promise(resolve=>setTimeout(resolve,0))}
  state.aiVectors=vectors;state.aiVectorSize=dimensions;setAiStatus("語意索引完成，正在儲存到瀏覽器快取…");await saveAiIndex(vectors,dimensions);
}
async function aiSemanticSearch(query){
  const extractor=await loadAiExtractor();await ensureAiIndex();const output=await extractor(String(query),{pooling:"mean",normalize:true}),queryVector=output.data,dimensions=state.aiVectorSize,hybridRanks=new Map(hybridSearch(query).slice(0,350).map((item,rank)=>[item.index,{rank,reason:item.match.reason}])),ranked=[];
  for(let index=0;index<VOCABULARY.length;index++){let similarity=0,offset=index*dimensions;for(let dimension=0;dimension<dimensions;dimension++)similarity+=queryVector[dimension]*state.aiVectors[offset+dimension];const hybrid=hybridRanks.get(index);let bonus=0;if(hybrid){if(hybrid.rank===0)bonus=.2;else if(hybrid.rank<30)bonus=.12;else if(hybrid.rank<120)bonus=.06}const score=similarity+bonus,reason=hybrid&&hybrid.rank<8?hybrid.reason:"AI 語意";ranked.push({entry:VOCABULARY[index],index,match:{score,semantic:similarity,reason,channels:["MiniLM 語意",...(hybrid?["混合搜尋"]:[])]}})}
  ranked.sort((a,b)=>b.match.score-a.match.score||a.entry.level-b.entry.level||a.entry.word.localeCompare(b.entry.word));const strong=ranked.filter(item=>item.match.semantic>=.28);return(strong.length>=120?strong:ranked.slice(0,240)).slice(0,1200);
}
async function runAiSearch(){
  const query=String(searchInput.value||"").trim();if(!query){showToast("請先輸入想找的單字、中文概念或句子");searchInput.focus();return}if(state.aiMode&&state.aiQuery===normalizeSearchValue(query)){disableAiMode();applyFilters();return}
  state.aiBusy=true;syncAiButton();hideSuggestions();saveRecentSearch(query);
  try{const ranking=await aiSemanticSearch(query);if(normalizeSearchValue(state.query)!==normalizeSearchValue(query)){setAiStatus("搜尋內容已變更；AI 結果未套用。");return}state.aiQuery=normalizeSearchValue(query);state.aiRanking=ranking;state.aiMode=true;state.page=1;applyFilters();setAiStatus(`AI 已依語意排序 ${ranking.length.toLocaleString()} 筆候選；點按按鈕可切回一般搜尋。`)}catch(error){state.aiMode=false;setAiStatus("AI 模型暫時無法載入，已保留原本的離線混合搜尋。");showToast("AI 載入失敗，已切回一般搜尋");applyFilters()}finally{state.aiBusy=false;syncAiButton()}
}
