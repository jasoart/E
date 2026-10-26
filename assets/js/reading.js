"use strict";

// Reading evidence is an overlay on exact vocabulary IDs. It never appends or
// renames a word, and it does not turn observed occurrences into predictions.
const READING_PRIORITY_LABELS={"cross-year":"跨年重點","passage-core":"篇章常用",topic:"主題詞彙"};
const READING_SECTION_LABELS={reading:"閱讀測驗",mixed:"混合題",structure:"篇章結構"};
let readingSourceCache=null,readingPassageCache=new Map(),readingTopicCache=new Map();
function readingVocabularyData(){
  return typeof GSAT_READING_VOCABULARY!=="undefined"&&GSAT_READING_VOCABULARY?.entries?GSAT_READING_VOCABULARY:null;
}
function refreshReadingMaps(){
  const data=readingVocabularyData();if(data===readingSourceCache)return;
  readingSourceCache=data;
  readingPassageCache=new Map((data?.passages||[]).map(passage=>[passage.id,passage]));
  readingTopicCache=new Map((data?.topics||[]).map(topic=>[topic.id,topic.label]));
}
function getReadingVocabulary(entry){
  const entries=readingVocabularyData()?.entries,word=typeof entry==="string"?entry:entry?.word;
  return entries&&Object.prototype.hasOwnProperty.call(entries,word)?entries[word]:null;
}
function getReadingYears(entry){return getReadingVocabulary(entry)?.years||[]}
function readingTopicLabel(id){refreshReadingMaps();return readingTopicCache.get(id)||String(id||"")}
function readingSectionLabel(section){return READING_SECTION_LABELS[section]||String(section||"")}
function readingPriorityLabel(priority){return READING_PRIORITY_LABELS[priority]||"閱讀詞彙"}
function readingFilterValue(filters,key){const value=filters?.[key];return value===undefined||value===null||value===""||value==="all"?null:String(value)}
function readingRecordOccurrences(record,filters){
  if(!record)return[];refreshReadingMaps();
  const year=readingFilterValue(filters,"readingYear"),topic=readingFilterValue(filters,"readingTopic"),section=readingFilterValue(filters,"readingSection");
  // Year, topic and section must all describe this same occurrence's passage.
  return(record.occurrences||[]).flatMap(occurrence=>{
    const passage=readingPassageCache.get(occurrence.passageId);if(!passage)return[];
    if(year&&String(passage.year)!==year||topic&&passage.topicId!==topic||section&&passage.section!==section)return[];
    return[{...occurrence,passage}];
  });
}
function getReadingOccurrences(entry,filters){return readingRecordOccurrences(getReadingVocabulary(entry),filters)}
function readingRecordMatches(record,filters){
  const priority=readingFilterValue(filters,"readingPriority");
  return!!record&&(!priority||record.priority===priority)&&readingRecordOccurrences(record,filters).length>0;
}
function readingEntryMatches(entry,filters){
  return readingRecordMatches(getReadingVocabulary(entry),filters);
}
function readingSearchText(entry){
  const record=getReadingVocabulary(entry);if(!record)return"";
  return[record.readingSense,record.note,...(record.topics||[]).map(readingTopicLabel),...(record.collocations||[]).flat()].filter(Boolean).join(" ");
}
function compareReadingRecords(a,b,firstWord=a?.word||"",secondWord=b?.word||""){
  const order={"cross-year":0,"passage-core":1,topic:2};
  return(order[a?.priority]??3)-(order[b?.priority]??3)||(b?.years?.length||0)-(a?.years?.length||0)||(b?.passageCount||0)-(a?.passageCount||0)||firstWord.localeCompare(secondWord);
}
function compareReadingEntries(first,second){return compareReadingRecords(getReadingVocabulary(first),getReadingVocabulary(second),first.word,second.word)}
function getReadingSupplementalEntries(filters,query=filters?.query||""){
  const normalize=value=>typeof normalizeSearchValue==="function"?normalizeSearchValue(value):String(value||"").toLowerCase().trim();
  const terms=normalize(query).split(/\s+/).filter(Boolean);
  return Object.entries(readingVocabularyData()?.supplemental||{}).map(([word,record])=>({...record,word})).filter(record=>{
    if(!readingRecordMatches(record,filters))return false;
    const text=normalize([record.word,record.pos,record.meaningZh,record.note,...(record.topics||[]).map(readingTopicLabel),...(record.occurrences||[]).map(row=>row.form)].join(" "));
    return terms.every(term=>text.includes(term));
  }).sort(compareReadingRecords);
}
function readingPageLabel(row){
  const printed=Number(row.printedPage),pdf=Number(row.pdfPage),parts=[];
  if(Number.isInteger(printed)&&printed>0)parts.push(`試卷第 ${printed} 頁`);
  if(Number.isInteger(pdf)&&pdf>0)parts.push(`PDF 第 ${pdf} 頁`);
  return parts.join("／");
}
function readingPassageLabel(passage){return`${passage.year} 年 · ${readingSectionLabel(passage.section)}${passage.questionRange?` ${passage.questionRange} 題`:""}`}
function readingHtml(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]))}
function groupReadingOccurrences(rows){
  const groups=new Map();
  for(const row of rows){
    const key=`${row.passageId}|${row.pdfPage}`,group=groups.get(key)||{...row,forms:new Set(),inflected:false,compound:false};
    group.forms.add(row.form);group.inflected||=row.matchKind==="inflection";group.compound||=row.matchKind==="compound";groups.set(key,group);
  }
  return[...groups.values()].sort((a,b)=>Number(b.passage.year)-Number(a.passage.year)||Number(a.pdfPage)-Number(b.pdfPage)||String(a.passageId).localeCompare(String(b.passageId)));
}
function readingReferenceHtml(row){
  return`<li><div><strong>${readingHtml(readingPassageLabel(row.passage))}</strong><span>${readingHtml(row.passage.titleZh||readingTopicLabel(row.passage.topicId))}</span></div><p>實際詞形：${[...row.forms].map(form=>`<code lang="en">${readingHtml(form)}</code>`).join("、")}${row.inflected?' <span class="reading-form-kind">含變化形</span>':""}${row.compound?' <span class="reading-form-kind">含複合詞成分</span>':""}</p><small>${readingHtml(readingPageLabel(row))}</small></li>`;
}
function renderReadingVocabulary(entry){
  const record=getReadingVocabulary(entry);if(!record)return"";
  const escape=readingHtml,references=groupReadingOccurrences(getReadingOccurrences(entry)),reference=readingReferenceHtml;
  const collocations=(record.collocations||[]).filter(row=>Array.isArray(row)&&row[0]&&row[1]);
  const reviewedPassages=(record.editorialPassageIds||[]).map(id=>readingPassageCache.get(id)).filter(Boolean);
  return`<section class="reading-vocabulary study-card notebook-field" id="readingVocabulary" aria-labelledby="readingVocabularyHeading"><div class="reading-card-heading"><h3 id="readingVocabularyHeading">111–115 閱讀詞彙</h3><span class="reading-priority">${escape(readingPriorityLabel(record.priority))}</span></div><p class="reading-card-meta">${escape((record.years||[]).join("、"))} 年 · ${Number(record.passageCount)||0} 個題組 · ${escape((record.topics||[]).map(readingTopicLabel).join("、"))}</p><h4>${record.readingSense?"閱讀語境義 · 本站整理":"原詞表釋義 · 配合題組語境判斷"}</h4><p class="reading-sense">${escape(record.readingSense||entry.meaning||"請對照上方詞義與實際閱讀語境。")}</p>${record.readingSense&&reviewedPassages.length?`<p class="reading-editorial-scope">語境義對照：${reviewedPassages.map(passage=>escape(readingPassageLabel(passage))).join("；")}。其他出處請另判字義。</p>`:""}${record.note?`<p class="reading-study-note">${escape(record.note)}</p>`:""}${collocations.length?`<h4>閱讀搭配 · 本站整理</h4><div class="reading-collocations">${collocations.map(([en,zh])=>`<p><code lang="en">${escape(en)}</code><span>${escape(zh)}</span></p>`).join("")}</div>`:""}<h4>題組與實際詞形</h4><ul class="reading-references">${references.slice(0,4).map(reference).join("")}</ul>${references.length>4?`<details class="reading-more"><summary>其餘 ${references.length-4} 筆出處</summary><ul class="reading-references">${references.slice(4).map(reference).join("")}</ul></details>`:""}<p class="card-note">此處記錄閱讀本文實際出現的詞形與位置；變化形不等於所有字族都曾出題。優先層級用於安排複習，不是未來出題機率。</p></section>`;
}
function renderReadingSupplementalEntries(entries,filters){
  const card=record=>{
    const references=groupReadingOccurrences(readingRecordOccurrences(record,filters));
    return`<article class="reading-supplemental-card" data-reading-word="${readingHtml(record.word)}"><div class="reading-supplemental-heading"><h4 lang="en">${readingHtml(record.word)}</h4><span>${readingHtml(record.pos||"詞性依語境")}</span></div><p class="reading-supplemental-meaning">${readingHtml(record.meaningZh)}</p>${record.note?`<p class="reading-supplemental-note">${readingHtml(record.note)}</p>`:""}<ul class="reading-references">${references.slice(0,2).map(readingReferenceHtml).join("")}</ul>${references.length>2?`<details class="reading-more"><summary>其餘 ${references.length-2} 筆出處</summary><ul class="reading-references">${references.slice(2).map(readingReferenceHtml).join("")}</ul></details>`:""}</article>`;
  };
  if(!entries.length)return'<p class="reading-supplemental-empty">這組條件沒有題材補充詞；可調整搜尋、年度、主題或題型。</p>';
  return`<div class="reading-supplemental-grid">${entries.slice(0,12).map(card).join("")}</div>${entries.length>12?`<details class="reading-supplemental-more"><summary>其餘 ${entries.length-12} 個補充詞</summary><div class="reading-supplemental-grid">${entries.slice(12).map(card).join("")}</div></details>`:""}`;
}
function selectReadingMatch(){
  if(!state.readingOnly||!state.filtered.length||state.filtered.some(row=>row.index===state.selectedIndex))return;
  if(typeof selectEntry==="function")selectEntry(state.filtered[0].index);
}
function updateReadingFilterStatus(){
  if(typeof document==="undefined")return;
  const target=document.getElementById("readingFilterStatus"),button=document.getElementById("exportReadingVocabulary"),data=readingVocabularyData();
  const discovery=!state.readingOnly&&String(state.query||"").trim()?getReadingSupplementalEntries({query:state.query}):[];
  const notice=document.getElementById("readingSearchNotice"),noticeText=document.getElementById("readingSearchNoticeText");
  if(notice)notice.hidden=!discovery.length;
  if(noticeText&&discovery.length)noticeText.textContent=`閱讀題材補充詞另有 ${discovery.length} 個符合搜尋的結果。`;
  if(!state.readingOnly){if(button)button.disabled=true;return}
  const supplemental=getReadingSupplementalEntries(state),supplementalHost=document.getElementById("readingSupplemental"),supplementalCount=document.getElementById("readingSupplementalCount"),supplementalContent=document.getElementById("readingSupplementalContent");
  if(button)button.disabled=!state.filtered.length&&!supplemental.length;
  if(target)target.textContent=`目前 ${state.filtered.length.toLocaleString()} 個既有詞條與 ${supplemental.length} 個題材補充詞符合篩選；共整理 ${Number(data?.stats?.words||0).toLocaleString()} 個既有詞條、${Number(data?.stats?.passages||data?.passages?.length||0)} 個題組。級別篩選只套用於既有詞條。`;
  if(supplementalHost)supplementalHost.hidden=!Object.keys(data?.supplemental||{}).length;
  if(supplementalCount)supplementalCount.textContent=String(supplemental.length);
  if(supplementalContent)supplementalContent.innerHTML=renderReadingSupplementalEntries(supplemental,state);
}
function readingCsvText(rows,filters){
  const cell=value=>{let text=String(value??"");if(/^[=+\-@\t\r]/.test(text))text="'"+text;return'"'+text.replace(/"/g,'""')+'"'};
  const table=[["詞條類型","詞條","詞性","原詞表釋義","閱讀語境義（本站整理）","補充釋義（本站整理）","語境義對照題組","閱讀優先層級","年份","主題","題組","實際詞形","頁碼"]];
  const append=(entry,record,supplemental)=>{
    const occurrences=readingRecordOccurrences(record,filters),passages=[...new Map(occurrences.map(item=>[item.passage.id,item.passage])).values()];
    table.push([supplemental?"閱讀題材補充詞":"既有詞條",entry.word,supplemental?record.pos:entry.partOfSpeech,supplemental?"":entry.meaning,supplemental?"":record.readingSense||"",supplemental?record.meaningZh:"",(record.editorialPassageIds||[]).map(id=>readingPassageCache.get(id)).filter(Boolean).map(readingPassageLabel).join("；"),readingPriorityLabel(record.priority),[...new Set(passages.map(item=>item.year))].join("、"),[...new Set(passages.map(item=>readingTopicLabel(item.topicId)))].join("、"),passages.map(readingPassageLabel).join("；"),[...new Set(occurrences.map(item=>item.form))].join("、"),[...new Set(occurrences.map(item=>`${item.passage.year} 年 ${readingPageLabel(item)}`))].join("；")]);
  };
  for(const row of rows||[]){
    const entry=row.entry||row,record=getReadingVocabulary(entry);if(record&&readingEntryMatches(entry,filters))append(entry,record,false);
  }
  for(const record of getReadingSupplementalEntries(filters))append(record,record,true);
  return"\uFEFF"+table.map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
}
function exportReadingVocabulary(){
  if(!state.readingOnly||!state.filtered.length&&!getReadingSupplementalEntries(state).length)return false;
  if(typeof Blob!=="function"||typeof URL==="undefined"||typeof URL.createObjectURL!=="function"){if(typeof showToast==="function")showToast("此瀏覽器無法建立下載檔案");return false}
  const url=URL.createObjectURL(new Blob([readingCsvText(state.filtered,state)],{type:"text/csv;charset=utf-8"})),link=document.createElement("a");
  link.href=url;link.download="gsat-reading-vocabulary.csv";document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);return true;
}
function setupReadingVocabulary(){
  const data=readingVocabularyData(),tab=document.getElementById("readingTab"),count=document.getElementById("readingTabCount");
  if(tab)tab.hidden=!data;
  if(count)count.textContent=Number(data?.stats?.words||0).toLocaleString();
  state.readingOnly=false;state.readingYear="all";state.readingTopic="all";state.readingPriority="all";state.readingSection="all";
  const fill=(id,options)=>{const control=document.getElementById(id);if(control)control.innerHTML=options.map(([value,label])=>`<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("")};
  fill("readingYear",[["all","全部年度"],...[...new Set((data?.sources||[]).map(item=>String(item.year)))].sort().map(year=>[year,`${year} 年`])]);
  fill("readingTopic",[["all","全部主題"],...(data?.topics||[]).map(topic=>[topic.id,topic.label])]);
  fill("readingPriority",[["all","全部閱讀詞彙"],...Object.entries(READING_PRIORITY_LABELS)]);
  fill("readingSection",[["all","全部題型"],...[...new Set((data?.passages||[]).map(item=>item.section))].map(section=>[section,readingSectionLabel(section)])]);
  tab?.addEventListener("click",()=>setListMode("reading"));
  for(const [id,key] of [["readingYear","readingYear"],["readingTopic","readingTopic"],["readingPriority","readingPriority"],["readingSection","readingSection"]])document.getElementById(id)?.addEventListener("change",event=>{state[key]=event.target.value;applyFilters();selectReadingMatch()});
  document.getElementById("exportReadingVocabulary")?.addEventListener("click",exportReadingVocabulary);
  document.getElementById("viewReadingSupplemental")?.addEventListener("click",()=>{
    for(const [id,key] of [["readingYear","readingYear"],["readingTopic","readingTopic"],["readingPriority","readingPriority"],["readingSection","readingSection"]]){
      state[key]="all";const control=document.getElementById(id);if(control)control.value="all";
    }
    setListMode("reading");
    const host=document.getElementById("readingSupplemental");if(host){host.open=true;host.scrollIntoView({block:"start"})}
  });
}
