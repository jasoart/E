"use strict";

function getVisibleGsatPoints(entry){
  const query=normalizeSearchValue(state.query);
  return getGsatPoints(entry).filter(point=>(!state.examOnly||(point.evidence.length&&(state.examYear==="all"||point.evidence.includes(state.examYear))))&&(!state.collocationsOnly||state.category==="全部"||point.category===state.category)).sort((a,b)=>{
    const match=point=>query&&point.patterns.some(([form,meaning])=>normalizeSearchValue(form+" "+meaning).includes(query))?1:0;
    return match(b)-match(a)||Number(!!b.evidence.length)-Number(!!a.evidence.length);
  });
}
// Small citation metadata stays local; the original quotation text is fetched only on expansion.
let gsatSourcePromise=null;
function renderPatternReferences(references){
  if(!references.length)return '<small class="pattern-kind">自編延伸／原有整理 · 未附逐句真題出處</small>';
  const years=[...new Set(references.map(ref=>ref.year))].join("、");
  return `<details class="pattern-references"><summary>展開並載入原文 · ${escapeHtml(years)} 年 · ${references.length} 筆出處</summary><div class="reference-items">${references.map(ref=>`<div class="reference-item"><p><strong>${escapeHtml(ref.year)} 年｜${escapeHtml(ref.location)}</strong><span class="reference-role ${ref.role==="option"?"option":""}">${ref.role==="option"?"選項用語 · 非答案標記":ref.role==="stem"?"題幹用語":"本文用語"}</span></p><blockquote lang="en" data-source-id="${escapeHtml(ref.detailId||"")}">${escapeHtml(ref.quote||"點開後載入原文摘錄…")}</blockquote><small>試卷第 ${Number(ref.printedPage)} 頁／PDF 第 ${Number(ref.pdfPage)} 頁 · ${escapeHtml(ref.filename)}</small></div>`).join("")}</div></details>`;
}
async function loadPatternReferenceDetails(details){
  if(!details.open||!details.querySelector('[data-source-id]'))return;
  const quotes=[...details.querySelectorAll('[data-source-id]')];
  if(!quotes.some(node=>node.dataset.sourceId))return;
  if(!gsatSourcePromise)gsatSourcePromise=fetch('./assets/data/reference-details.json',{cache:'force-cache'}).then(response=>{if(!response.ok)throw Error('HTTP '+response.status);return response.json()}).catch(error=>{gsatSourcePromise=null;throw error});
  try{const library=await gsatSourcePromise;if(!details.isConnected)return;
    quotes.forEach(node=>{const item=library[node.dataset.sourceId];node.textContent=item?'…'+item.quote+'…':'找不到原文紀錄，請查 SOURCE_GUIDE.md';delete node.dataset.sourceId;});
  }catch{quotes.forEach(node=>{node.textContent='來源暫時無法載入，請確認已將 assets/data/reference-details.json 一併上傳。';});}
}

function renderPointGroup(point){
  const patterns=point.patterns.map(([form,meaning],index)=>{
    const references=visiblePatternReferences(point,index),note=point.patternNotes[index];
    if(state.examOnly&&!references.length)return "";
    return `<div class="exam-pattern"><code lang="en">${escapeHtml(form)}</code><span>${escapeHtml(meaning)}</span><div class="pattern-source">${renderPatternReferences(references)}${note&&note!==point.trap?`<p class="pattern-note"><strong>用法：</strong>${escapeHtml(note)}</p>`:""}</div></div>`;
  }).join("");
  const years=state.examOnly&&state.examYear!=="all"?point.evidence.filter(year=>year===state.examYear):point.evidence;
  const evidence=years.length?`<span class="point-evidence">${escapeHtml(years.join(" · "))} 已核對</span>`:"";
  return `<section class="point-group"><div class="point-meta"><span class="point-category">${escapeHtml(point.category)}</span><span class="point-priority">${escapeHtml(point.priority)}</span>${evidence}</div><div class="exam-point-list">${patterns}</div><p class="exam-trap"><strong>用法提醒：</strong>${escapeHtml(point.trap)}</p></section>`;
}
function renderGsatPoint(entry){
  const points=getVisibleGsatPoints(entry);
  if(!points.length)return `<p class="card-empty">${getGsatPoints(entry).length?"此詞沒有符合目前年度或分類的考點，可切換到「全部」查看。":`此詞尚未列入 ${GSAT_COLLOCATION_GUIDE.length} 組精選考點；可參考下方詞表搭配。`}</p>`;
  const first=points.slice(0,6).map(renderPointGroup).join(""),remaining=points.length>6?`<details class="more-points"><summary>展開其餘 ${points.length-6} 組考點</summary>${points.slice(6).map(renderPointGroup).join("")}</details>`:"";
  return `<p class="point-summary">此詞符合 ${points.length} 組考點 · 自編延伸與真題來源分開標示；原文只在展開時下載。</p>${first}${remaining}<div class="collocation-practice" id="collocationPractice" hidden></div><p class="exam-source">EXAM 表示此詞相關考點含已核對來源；自編延伸不等同歷年考題。英文句型可能經原形化或加入 N／V-ing 等代號；原文摘錄保持試卷文字。選項用語不代表正解，紀錄筆數不代表出題頻率。沒有逐句出處的原版內容保留為延伸學習。</p>`;
}
function refreshCollocationPanel(){
  const entry=VOCABULARY[state.selectedIndex],host=byId("collocationContent"),button=byId("practiceButton");
  if(!entry||!host)return;
  host.innerHTML=renderGsatPoint(entry);
  if(button)button.hidden=!collocationPracticeCandidates(entry).length;
}
function visiblePatternReferences(point,index){
  return (point.patternReferences[index]||[]).filter(ref=>!state.examOnly||state.examYear==="all"||ref.year===state.examYear);
}
function buildExamYearFilters(){
  const host=byId("examYearFilters");
  host.innerHTML='<span class="filter-label">年度</span>'+["all","111","112","113","114","115"].map(year=>`<button type="button" class="category-btn ${year===state.examYear?"on":""}" data-year="${year}" aria-pressed="${year===state.examYear}">${year==="all"?"全部年度":year+" 年"}</button>`).join("");
  host.addEventListener("click",event=>{
    const button=event.target.closest("[data-year]");if(!button)return;
    state.examYear=button.dataset.year;
    host.querySelectorAll("[data-year]").forEach(item=>{const on=item.dataset.year===state.examYear;item.classList.toggle("on",on);item.setAttribute("aria-pressed",String(on))});
    applyFilters();refreshCollocationPanel();
  });
}
function renderExamProfile(entry){
  const point=getGsatPoint(entry),pos=String(entry.partOfSpeech||"").toLowerCase(),modes=["語境選字"];
  if(point)modes.push("介系詞／搭配辨錯");
  if(/v\.|n\.|adj\.|a\./.test(pos))modes.push("字形與詞性轉換");
  if(/adv\.|conj\.|prep\./.test(pos))modes.push("篇章轉承與連貫");else modes.push("克漏字／選填");
  if(/v\.|n\.|adj\.|a\./.test(pos))modes.push("中譯英／作文應用");
  const priority=entry.level<=2?"基礎核心｜先做到秒懂":entry.level<=4?"學測主力｜多義與語境":entry.level===5?"主要範圍｜精準搭配":"延伸詞彙｜靠語境推論";
  let action;if(point)action="先讀精選句型與介系詞 → 用自己的情境造一句 → 回看易錯欄做辨錯。";else if(/v\./.test(pos))action="一起確認及物／不及物、介系詞、時態與常接的名詞，避免只背中文。";else if(/n\./.test(pos))action="一起記可數性、單複數、常搭動詞與介系詞，再放入完整句。";else if(/adj\.|a\./.test(pos))action="一起記修飾名詞或作表語、常接介系詞，以及 -ed／-ing 的語意差異。";else action="先判斷它在篇章中表達的關係，再用前後句驗證，不只做逐字翻譯。";
  const scope=entry.level<=5?"官方主要詞彙範圍":"官方允許少量延伸字；重點是由上下文推義";
  return`<section class="exam-profile"><div class="profile-head"><span class="profile-priority">${escapeHtml(priority)}</span><strong>這個字可能怎麼考？</strong></div><div class="profile-modes">${[...new Set(modes)].map(mode=>`<span class="profile-mode">${escapeHtml(mode)}</span>`).join("")}</div><p class="profile-action"><strong>智慧複習：</strong>${escapeHtml(action)}</p><p class="profile-source">${escapeHtml(scope)} · 依 ${CURRENT_EXAM_MODEL.version} 能力模型產生，不代表單字實際出題機率。</p></section>`;
}

function buildLevelFilters(){
  const host=byId("levelFilters");
  LEVELS.forEach(level=>{const button=document.createElement("button");button.type="button";button.className="level-btn on";button.dataset.level=String(level);button.textContent=`L${level}`;button.setAttribute("aria-pressed","true");button.addEventListener("click",()=>{
    if(state.levels.has(level)){if(state.levels.size===1){state.levels=new Set(LEVELS)}else state.levels.delete(level)}else state.levels.add(level);
    syncLevelButtons();applyFilters();
  });host.appendChild(button)});
}
function syncLevelButtons(){document.querySelectorAll(".level-btn").forEach(button=>{const on=state.levels.has(Number(button.dataset.level));button.classList.toggle("on",on);button.setAttribute("aria-pressed",String(on))})}
function buildCategoryFilters(){const host=byId("categoryFilters"),categories=["全部",...new Set(GSAT_COLLOCATION_GUIDE.map(point=>point.category||"核心辨析"))];host.innerHTML=categories.map(category=>`<button type="button" class="category-btn ${category==="全部"?"on":""}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("");host.addEventListener("click",event=>{const button=event.target.closest(".category-btn");if(!button)return;state.category=button.dataset.category||"全部";host.querySelectorAll(".category-btn").forEach(item=>item.classList.toggle("on",item===button));applyFilters();refreshCollocationPanel()})}
function setListMode(mode){state.favoritesOnly=mode==="favorites";state.collocationsOnly=mode==="collocations";state.examOnly=mode==="exam";state.reviewOnly=mode==="review";state.notebookOnly=mode==="notebook";for(const [id,value] of [["allTab","all"],["notebookTab","notebook"],["examTab","exam"],["collocationTab","collocations"],["reviewTab","review"],["favoriteTab","favorites"]])byId(id).classList.toggle("on",mode===value);byId("categoryFilters").hidden=!state.collocationsOnly;byId("examYearFilters").hidden=!state.examOnly;applyFilters();refreshCollocationPanel()}

function applyFilters(resetPage=true){
  const needle=normalizeSearchValue(state.query);
  const ranked=needle?(hybridSearch(needle)):VOCABULARY.map((entry,index)=>({entry,index,match:{score:0,reason:"",channels:[]}}));
  state.filtered=ranked.filter(({entry})=>state.levels.has(Number(entry.level))).filter(({entry})=>!state.favoritesOnly||state.favorites.has(entry.word)).filter(({entry})=>!state.examOnly||getExamEvidenceYears(entry).some(year=>state.examYear==="all"||year===state.examYear)).filter(({entry})=>!state.reviewOnly||isReviewDue(entry.word)).filter(({entry})=>!state.notebookOnly||(typeof getExamNotebook==="function"&&getExamNotebook(entry))).filter(({entry})=>!state.collocationsOnly||(state.category==="全部"&&getBuiltinStudy(entry)?.collocations?.length)||getGsatPoints(entry).some(point=>state.category==="全部"||(point.category||"核心辨析")===state.category));
  if(!needle)state.filtered.sort((a,b)=>state.reviewOnly?String(reviewInfo(a.entry.word)?.due||"").localeCompare(String(reviewInfo(b.entry.word)?.due||""))||a.entry.word.localeCompare(b.entry.word):state.examOnly?(getExamEvidenceYears(b.entry).length-getExamEvidenceYears(a.entry).length)||a.entry.word.localeCompare(b.entry.word):state.collocationsOnly?(getGsatPoints(b.entry).some(point=>point.priority==="必熟")?1:0)-(getGsatPoints(a.entry).some(point=>point.priority==="必熟")?1:0)||a.entry.word.localeCompare(b.entry.word):a.entry.word.localeCompare(b.entry.word));
  if(resetPage)state.page=1;
  renderList();
}

function paginationItems(current,total){
  if(total<=7)return Array.from({length:total},(_,index)=>index+1);const pages=new Set([1,total,current-1,current,current+1]);if(current<=4)[2,3,4,5].forEach(page=>pages.add(page));if(current>=total-3)[total-4,total-3,total-2,total-1].forEach(page=>pages.add(page));const ordered=[...pages].filter(page=>page>=1&&page<=total).sort((a,b)=>a-b),result=[];ordered.forEach((page,index)=>{if(index&&page-ordered[index-1]>1)result.push("…");result.push(page)});return result;
}
function renderPagination(totalPages,start,end){
  pagination.hidden=false;byId("moreHint").textContent=`第 ${start+1}–${end} 筆，共 ${state.filtered.length.toLocaleString()} 筆 · 每頁 ${PAGE_SIZE} 筆`;
  const items=paginationItems(state.page,totalPages),button=(label,page,disabled=false,current=false,ariaLabel="")=>`<button class="page-button ${current?"current":""}" type="button" data-page="${page}" ${disabled?"disabled":""} ${current?'aria-current="page"':""} ${ariaLabel?`aria-label="${ariaLabel}"`:""}>${label}</button>`;
  pageButtons.innerHTML=button("‹",state.page-1,state.page===1,false,"上一頁")+items.map(item=>item==="…"?'<span class="page-ellipsis" aria-hidden="true">…</span>':button(item,item,false,item===state.page,`第 ${item} 頁`)).join("")+button("›",state.page+1,state.page===totalPages,false,"下一頁");
}
function renderList(){
  byId("resultCount").textContent=state.filtered.length.toLocaleString();
  byId("resultLabel").textContent=state.query?"詞彙搜尋結果":state.notebookOnly?"五欄新編筆記":state.favoritesOnly?"我的收藏":state.reviewOnly?"今日到期複習":state.examOnly?`${state.examYear==="all"?"111–115":state.examYear} 真題搭配`:state.collocationsOnly?(state.category==="全部"?"搭配考點詞彙":state.category):"官方詞表＋補充詞彙";
  byId("sortHint").textContent=state.query?"字詞、字義與用法":state.reviewOnly?"到期日優先":state.examOnly?"真題證據優先":state.collocationsOnly?"必熟優先":"";
  byId("favoriteCount").textContent=state.favorites.size?String(state.favorites.size):"";
  const totalPages=Math.max(1,Math.ceil(state.filtered.length/PAGE_SIZE));state.page=Math.min(Math.max(1,state.page),totalPages);const start=(state.page-1)*PAGE_SIZE,end=Math.min(state.filtered.length,start+PAGE_SIZE),rows=state.filtered.slice(start,end);
  if(!rows.length){wordList.innerHTML='<div class="empty"><div><strong>找不到符合的詞彙</strong><p>試試其他拼法、中文關鍵字，或開啟更多級別。</p></div></div>';pagination.hidden=true;return}
  wordList.innerHTML=rows.map(({entry,index,match})=>`<button class="row level-row-${entry.level} ${state.selectedIndex===index?"selected":""}" type="button" data-index="${index}"><span class="dot l${entry.level}">${entry.supplemental?"＋":entry.level}</span><span class="row-copy"><span class="row-title"><strong>${escapeHtml(entry.word)}</strong>${entry.supplemental?'<span class="row-supplement">補充</span>':""}${typeof getExamNotebook==="function"&&getExamNotebook(entry)?'<span class="row-notebook">V2</span>':""}${getExamEvidenceYears(entry).length?'<span class="row-exam">EXAM</span>':""}${isReviewDue(entry.word)?'<span class="row-due">DUE</span>':""}${state.query&&match&&match.reason?`<span class="search-match">${escapeHtml(match.reason)}</span>`:""}</span><small>${escapeHtml(notebookPartOfSpeech(entry))} · ${escapeHtml(notebookShortMeaning(entry))}</small></span><span class="arrow" aria-hidden="true">→</span></button>`).join("");
  renderPagination(totalPages,start,end);
}

function goToPage(page){const totalPages=Math.max(1,Math.ceil(state.filtered.length/PAGE_SIZE));state.page=Math.min(Math.max(1,Number(page)||1),totalPages);renderList();wordList.scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})}

function selectEntry(index,scroll=false){
  const entry=VOCABULARY[index];if(!entry)return;if(typeof stopPronunciation==="function")stopPronunciation();if(scroll&&state.query)recordSearchFeedback(state.query,entry.word);state.selectedIndex=index;renderDetail(entry,index);renderList();
  if(scroll&&innerWidth<920)wordDetail.scrollIntoView({behavior:"smooth",block:"start"});
}

function shuffled(values){const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}
function collocationPracticeCandidates(entry){
  const unique=new Map();
  for(const point of getVisibleGsatPoints(entry))for(const item of point.practice){
    if(state.examOnly&&!visiblePatternReferences(point,item.patternIndex).length)continue;
    const key=item.masked+"|"+item.answer;
    if(!unique.has(key))unique.set(key,{...item,point,form:point.patterns[item.patternIndex][0],meaning:point.patterns[item.patternIndex][1]});
  }
  return [...unique.values()];
}
function collocationQuestion(entry){
  const candidates=collocationPracticeCandidates(entry);
  if(!candidates.length)return null;
  const candidate=candidates[Math.floor(Math.random()*candidates.length)];
  return {...candidate,options:shuffled([candidate.answer,...candidate.distractors])};
}
function startCollocationPractice(entry){const host=byId("collocationPractice"),question=collocationQuestion(entry);if(!host||!question)return;host.dataset.answered="";host.hidden=false;host.innerHTML=`<p class="practice-kicker">句型練習 · 本站自編 · ${escapeHtml(question.point.category||"搭配")}</p><p class="practice-question">${escapeHtml(question.masked)}</p><p class="practice-meaning">${escapeHtml(question.meaning)}</p><div class="practice-options">${question.options.map(option=>`<button class="practice-option" type="button" data-answer="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join("")}</div><p class="practice-feedback">依中文語意選出正確搭配。累積：${Number(state.practice.correct||0)} / ${Number(state.practice.total||0)} 題答對。</p>`;host.scrollIntoView({behavior:"smooth",block:"nearest"});host.querySelector(".practice-options").addEventListener("click",event=>{const button=event.target.closest(".practice-option");if(!button||host.dataset.answered==="true")return;host.dataset.answered="true";const correct=button.dataset.answer===question.answer;state.practice.total=Number(state.practice.total||0)+1;if(correct)state.practice.correct=Number(state.practice.correct||0)+1;savePracticeStats();host.querySelectorAll(".practice-option").forEach(option=>{option.disabled=true;option.classList.toggle("correct",option.dataset.answer===question.answer);if(option===button&&!correct)option.classList.add("wrong")});host.querySelector(".practice-feedback").innerHTML=`<strong>${correct?"答對了":"再記一次"}：</strong>${escapeHtml(question.form)}＝${escapeHtml(question.meaning)}<br>累積 ${state.practice.correct} / ${state.practice.total} 題答對。`;const next=document.createElement("button");next.type="button";next.className="practice-next";next.textContent="再出一題 →";next.addEventListener("click",()=>startCollocationPractice(entry));host.appendChild(next)})}

function notebookPartOfSpeech(entry){
  const note=typeof getExamNotebook==="function"?getExamNotebook(entry):null;
  return note?.senses?.length?[...new Set(note.senses.map(item=>item.pos).filter(Boolean))].join(" / ")||entry.partOfSpeech:entry.partOfSpeech;
}
function notebookShortMeaning(entry){
  return (typeof getBuiltinStudy==="function"?getBuiltinStudy(entry)?.plainMeaning:null)||entry.meaning;
}
function renderNotebookSenses(entry,study,note){
  if(!note?.senses?.length)return `<h3>${escapeHtml(study?.plainMeaning||entry.meaning)}</h3><p class="card-note">原有釋意；尚未新增逐義用法整理。</p>`;
  return `<div class="notebook-senses">${note.senses.map(item=>`<div class="notebook-sense"><span class="sense-pos">${escapeHtml(item.pos)}</span><div><h3>${escapeHtml(item.meaning)}</h3>${item.usage?`<p>${escapeHtml(item.usage)}</p>`:""}</div></div>`).join("")}</div>`;
}
function highlightChunk(value){
  return String(value||"").split(/\b(to|for|of|with|on|in|at|by|from|into|about|as|over|under|through|against|upon|out|off|up)\b/gi).map(part=>/^(to|for|of|with|on|in|at|by|from|into|about|as|over|under|through|against|upon|out|off|up)$/i.test(part)?`<mark class="chunk-preposition">${escapeHtml(part)}</mark>`:escapeHtml(part)).join("");
}
function renderNotebookRelations(note){
  const group=(title,rows,kind)=>rows?.length?`<div class="notebook-relation-group"><h4>${title}</h4>${rows.map(item=>`<div class="notebook-relation ${kind}"><code lang="en">${escapeHtml(item.en)}</code><span>${escapeHtml(item.zh)}</span>${item.note?`<p>${escapeHtml(item.note)}</p>`:""}</div>`).join("")}</div>`:"";
  const content=group("近義字 · 對照語境",note?.synonyms,"synonym")+group("片語／慣用語 · 閱讀與作文替換",note?.idioms,"idiom");
  return content||'<p class="card-empty">此詞尚未新增核對的近義字與慣用語。</p>';
}
function renderNotebookFamily(note){
  if(!note?.family?.length)return '<p class="card-empty">此詞尚未新增核對的字族；不以拼字規則推造衍生字。</p>';
  return `<div class="notebook-family">${note.family.map(item=>`<div class="family-item"><code lang="en">${escapeHtml(item.word)}</code><span class="sense-pos">${escapeHtml(item.pos)}</span><span>${escapeHtml(item.meaning)}</span></div>`).join("")}</div><p class="card-note family-tip">先看空格前後的句型，再選詞性與字形；字族各字的字義與搭配仍需分開確認。</p>`;
}
function renderNotebookPhonetic(entry,note){
  const kk=note?.kk,url=kk?.sourceUrl&&safeExternalUrl(kk.sourceUrl);
  if(kk?.value&&url)return `<span>${escapeHtml(kk.value)}</span><a class="phonetic-source" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">KK · ${escapeHtml(kk.sourceLabel||"已核對來源")}</a>`;
  const rows=typeof GSAT_KK_PRONUNCIATION!=="undefined"?GSAT_KK_PRONUNCIATION.entries?.[entry.word]:null;
  if(rows?.length)return `<span>${escapeHtml(rows[0].value)}</span><span class="phonetic-source">KK 美式（CMUdict 轉寫）</span>`;
  return `<span>${escapeHtml(entry.pronunciation||"音標未收錄")}</span><span class="phonetic-source">原詞表音標 · KK 尚未收錄</span>`;
}
function renderPronunciationDetails(entry){
  const data=typeof GSAT_KK_PRONUNCIATION!=="undefined"?GSAT_KK_PRONUNCIATION:null,rows=data?.entries?.[entry.word]||[],url=data&&safeExternalUrl(data.sourceUrl);
  return `<details class="pronunciation-details"><summary>音標來源、其他讀音與原音標</summary>${rows.length?`<p>${escapeHtml(data.notation)}。本頁音標為美式音段轉寫，並非來源字典原刊的 KK 標記；未將多種讀音自行指定給詞性。</p><div class="pronunciation-variants">${rows.map(item=>`<span><strong lang="en">${escapeHtml(item.word)}</strong> ${escapeHtml(item.value)}</span>`).join("")}</div><p>${url?`<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(data.source)}</a> · `:""}<a href="./assets/data/cmudict.LICENSE.txt">授權說明</a></p>`:'<p>尚未收錄可轉寫的 KK 美式音段；可由下方字典連結核對發音。</p>'}<p>原詞表音標（原樣保留）：${escapeHtml(entry.pronunciation||"未收錄")}</p></details>`;
}
function renderNotebookArchive(entry,note){
  const original=typeof getOriginalStudy==="function"?getOriginalStudy(entry):null;
  if(!note?.examples?.length||!original?.examples?.length)return "";
  return `<details class="notebook-archive"><summary>原有與上傳教材例句（${original.examples.length} 句，備查）</summary><p class="card-note">主要練習已改用學測情境新編例句；以下保留原有資料與來源。</p>${original.examples.map(item=>`<article><span class="archive-source">${item.source==="uploaded-anki"?"上傳教材":item.source==="self-authored"?"本站原有新編":"原有例句 · 來源待核對"}</span><blockquote lang="en">${escapeHtml(item.text)}</blockquote><p>${escapeHtml(item.translationZh||"原句未附中文譯文")}</p></article>`).join("")}</details>`;
}
function renderNotebookSource(entry,note){
  return note?`<details class="notebook-evidence" data-evidence-word="${escapeHtml(entry.word)}"><summary>核對此詞在 111–115 上傳試卷的出處</summary><div class="notebook-evidence-items"><p class="card-note">展開後讀取本站試卷摘錄。</p></div></details>`:"";
}
let notebookEvidencePromise=null;
async function loadNotebookEvidence(details){
  if(!details.open||details.dataset.evidenceLoaded)return;
  const host=details.querySelector(".notebook-evidence-items");if(!host)return;
  if(!notebookEvidencePromise)notebookEvidencePromise=fetch('./assets/data/exam-evidence.json',{cache:'force-cache'}).then(response=>{if(!response.ok)throw Error('HTTP '+response.status);return response.json()}).catch(error=>{notebookEvidencePromise=null;throw error});
  try{
    const data=await notebookEvidencePromise;if(!details.isConnected)return;
    const aliases=typeof examNotebookAliases==="function"?examNotebookAliases(details.dataset.evidenceWord):[normalizeCeecWord(details.dataset.evidenceWord)];
    const records=(data.records||[]).filter(item=>(item.headwords||[item.headword]).some(word=>aliases.includes(normalizeCeecWord(word))));
    host.innerHTML=records.length?records.map(item=>`<article class="notebook-evidence-record"><p><strong>${escapeHtml(item.year)} 年 · ${escapeHtml(item.location||item.questionLabel)}</strong><span class="reference-role ${item.role==="option"?"option":""}">${item.role==="option"?"選項用語 · 非正解標記":item.role==="stem"?"題幹用語":"本文用語"}</span></p><blockquote lang="en">${escapeHtml(item.excerpt)}</blockquote>${item.pattern?`<p class="evidence-teaching-note"><strong>教學整理：</strong><code lang="en">${escapeHtml(item.pattern)}</code> · ${escapeHtml(item.meaningZh)}</p>`:""}${item.candidateOption?`<p class="evidence-teaching-note">對照選項：${escapeHtml(item.candidateOption)}（未核對官方答案）</p>`:""}${item.noteZh?`<p class="evidence-teaching-note">${escapeHtml(item.noteZh)}</p>`:""}<small>試卷第 ${Number(item.printedPage)} 頁／PDF 第 ${Number(item.pdfPage)} 頁 · ${escapeHtml(item.filename)}</small></article>`).join(""):'<p class="card-empty">目前新增的逐句核對紀錄未收錄此詞；可展開下方原有真題搭配，或查看試卷。新編例句不代表此詞曾是考題答案。</p>';
    details.dataset.evidenceLoaded="true";
  }catch{host.innerHTML='<p class="card-empty">試卷摘錄暫時無法載入，請確認已上傳 assets/data/exam-evidence.json；重新展開可重試。</p>';}
}
function renderDetail(entry,index){
  const saved=state.favorites.has(entry.word),study=getBuiltinStudy(entry),review=reviewInfo(entry.word),note=typeof getExamNotebook==="function"?getExamNotebook(entry):null;
  const word=encodeURIComponent(spokenForm(entry.word)),supplement=!!entry.supplemental;
  wordDetail.className=`detail theme-l${entry.level}`;
  wordDetail.innerHTML=`<div class="topline"><span class="badge">${supplement?"補充詞彙":`LEVEL ${entry.level}`}</span><span>${supplement?"原 6,012 詞條以外的學測延伸":levelName(entry.level)}</span><div class="review-actions"><span class="review-status" id="reviewStatus">${review?`下次 ${escapeHtml(review.due)}`:"尚未安排複習"}</span><button class="review-button again" id="reviewAgain" type="button">再複習</button><button class="review-button good" id="reviewGood" type="button">記住了</button></div><button class="favorite ${saved?"saved":""}" id="favoriteButton" type="button">${saved?"★ 已收藏":"☆ 收藏"}</button></div>
    <div class="title-row"><div><h2>${escapeHtml(entry.word)}</h2><p class="phonetic"><em id="primaryPos">${escapeHtml(notebookPartOfSpeech(entry))}</em>${renderNotebookPhonetic(entry,note)}</p>${renderPronunciationDetails(entry)}<p class="audio-status" id="audioStatus">${escapeHtml(typeof localVoiceStatus==="function"?localVoiceStatus().message:"裝置英文語音")}</p><a id="audioSourceLink" class="audio-source-link" target="_blank" rel="noopener noreferrer" hidden>錄音出處</a></div><button class="speak" id="speakButton" type="button" aria-label="播放 ${escapeHtml(entry.word)} 的發音"><span>🔊</span><small>字典發音</small></button></div>
    <div class="pronunciation-controls"><button class="accent-choice" id="stopLocalVoiceButton" type="button">停止發音</button><div><p>點按單字發音取得字典錄音；無可用錄音時使用裝置英文語音。例句使用裝置語音。</p><p class="dictionary-links">人工核對：<a href="https://dictionary.cambridge.org/dictionary/english/${word}" target="_blank" rel="noreferrer">Cambridge Dictionary</a><a href="https://www.merriam-webster.com/dictionary/${word}" target="_blank" rel="noreferrer">Merriam-Webster</a></p></div></div>
    <div class="notebook-intro"><p class="kicker">單字筆記 V2.0${note?" · 學測情境新編":" · 原有教材"}</p><p>${note?"從字義到搭配，再把同一用法放入自己的作文。":"此詞保留原有教材；新增的五欄筆記會標示在已整理詞條。"}</p><nav class="notebook-navigation" aria-label="單字筆記欄位"><a href="#notebookSenses">1 字義</a><a href="#notebookCollocations">2 搭配</a><a href="#notebookRelations">3 替換</a><a href="#notebookFamily">4 字族</a><a href="#exampleCard">5 情境句</a></nav></div>
    <section class="definition notebook-field" id="notebookSenses"><p class="kicker"><span class="notebook-number">01</span> 詞性與多重字義</p>${renderNotebookSenses(entry,study,note)}<details class="original-meaning"><summary>保留的原釋意${study?.ankiMeaning?"與上傳教材釋意":""}</summary><p>${escapeHtml(entry.meaning)}</p>${study?.ankiMeaning?`<p><strong>上傳教材：</strong>${escapeHtml(study.ankiMeaning)}</p>`:""}</details>${note?.usageNote?`<p class="notebook-usage-note"><strong>用法提醒：</strong>${escapeHtml(note.usageNote)}</p>`:""}</section>
    <section class="study-card notebook-field" id="notebookCollocations"><p class="kicker"><span class="notebook-number">02</span> 高頻搭配詞與介系詞</p><p class="card-note">以整個搭配記憶；標示的介系詞與副詞小詞一起練習。</p><div id="builtinCollocations">${renderBuiltinCollocations(study)}</div>${!note&&study?.usageNote?`<p>${escapeHtml(study.usageNote)}</p>`:""}</section>
    <section class="study-card notebook-field" id="notebookRelations"><p class="kicker"><span class="notebook-number">03</span> 同義字與進階慣用語</p>${renderNotebookRelations(note)}</section>
    <section class="study-card notebook-field" id="notebookFamily"><p class="kicker"><span class="notebook-number">04</span> 衍生字與詞性轉換</p>${renderNotebookFamily(note)}</section>
    <section class="example notebook-field" id="exampleCard"><p class="kicker"><span class="notebook-number">05</span> 實用句型與作文情境</p><div id="exampleResults" class="example-list"></div><p id="exampleMeta" class="card-note"></p></section>
    ${renderNotebookSource(entry,note)}${renderNotebookArchive(entry,note)}
    <section class="builtin-practice"><h3>遮字作答：先回想，再訂正</h3><div id="builtinPractice"></div></section>
    <details class="notebook-legacy-points"><summary>111–115 真題搭配與原有延伸</summary><section class="study-card exam-points"><div class="exam-point-header"><div><p class="kicker">真題出處與原有搭配</p><p class="card-note">原文、選項與自編延伸分別標示；紀錄數不代表出題頻率。</p></div><button class="practice-button" id="practiceButton" type="button" ${collocationPracticeCandidates(entry).length?"":"hidden"}>練習原有搭配</button></div><div id="collocationContent">${renderGsatPoint(entry)}</div></section></details>
    <section class="builtin-writing"><h3>作文仿寫：換成自己的情境</h3><p class="card-note">選一個例句，改寫人物、事件或立場，再核對目標詞的字義與搭配。</p><label for="builtinWritingInput">你的英文句子</label><textarea id="builtinWritingInput" rows="3" maxlength="1200" placeholder="用正在學的字，寫出自己的情境。"></textarea><button id="builtinWritingCheck" type="button">檢查可觀察的用字</button><p id="builtinWritingFeedback" role="status" aria-live="polite"></p></section>
    <details class="notebook-archive"><summary>原詞表搭配與易錯提醒</summary><div class="twocol"><section><p class="kicker">保留的詞表搭配</p><p>${escapeHtml(entry.collocations||"原詞表未收錄搭配")}</p></section><section><p class="kicker">原有易錯提醒</p><p>${escapeHtml(entry.note||"原詞表未收錄提醒")}</p></section></div></details><p class="source">${escapeHtml(entry.source)}</p>`;
  byId("favoriteButton").addEventListener("click",()=>toggleFavorite(entry.word,index));
  byId("reviewAgain").addEventListener("click",()=>{const item=markReview(entry.word,"again");byId("reviewStatus").textContent=`下次 ${item.due}`;if(state.reviewOnly)applyFilters()});
  byId("reviewGood").addEventListener("click",()=>{const item=markReview(entry.word,"good");byId("reviewStatus").textContent=`下次 ${item.due}`;if(state.reviewOnly)applyFilters()});
  byId("speakButton").addEventListener("click",event=>speakWord(entry.word,event.currentTarget));
  byId("stopLocalVoiceButton").addEventListener("click",stopPronunciation);
  byId("practiceButton").addEventListener("click",()=>startCollocationPractice(entry));
  byId("collocationContent").addEventListener("toggle",event=>{if(event.target?.matches?.("details.pattern-references"))loadPatternReferenceDetails(event.target)},true);
  wordDetail.querySelectorAll(".notebook-evidence").forEach(details=>details.addEventListener("toggle",()=>loadNotebookEvidence(details)));
  byId("builtinWritingCheck").addEventListener("click",()=>{
    const text=byId("builtinWritingInput").value.trim(),words=sentenceWords(text),matched=!!builtinClozeQuestion(entry,{text});
    const problems=[];if(!matched)problems.push("尚未找到目標詞或合理詞形");if(words.length<8)problems.push("目前較短，可補上人物、原因或具體結果");if(!/[.!?]$/.test(text))problems.push("檢查句末標點");
    byId("builtinWritingFeedback").textContent=problems.length?problems.join("；")+"。這些是形式提醒，請再檢查詞義與文法。":"已找到目標詞、句末標點與至少 8 個詞。請自行核對搭配、時態與邏輯，或請老師評閱。";
  });
  syncFavoriteButton();showExampleResult(builtinExampleResult(entry),entry,index);renderBuiltinPractice(entry);
}
function renderBuiltinCollocations(study){
  const rows=study?.collocations||[];
  return rows.length?rows.map(([en,zh,note])=>`<div class="builtin-collocation"><code lang="en">${highlightChunk(en)}</code><span>${escapeHtml(zh)}</span>${note?`<small>${escapeHtml(note)}</small>`:""}</div>`).join(""):'<p class="card-empty">內建搭配尚未就緒。</p>';
}
function renderGsatExampleCard(example,rank){
  return `<article class="gold-example builtin-example" data-example-index="${rank-1}"><div class="gold-head"><span class="gold-rank">例句 ${rank}</span><span class="builtin-source">${escapeHtml(example.examStyle?"仿學測自編":example.sourceLabel)}</span>${example.topic?`<span class="example-topic">${escapeHtml(example.topic)}</span>`:""}</div><blockquote lang="en">${escapeHtml(example.text)}</blockquote><p class="example-translation">${escapeHtml(example.translationZh||"此句未附中文譯文")}</p>${example.grammar?`<p class="builtin-analysis"><strong>文法與用法：</strong>${escapeHtml(example.grammar)}</p>`:""}${example.writingTip?`<p class="builtin-analysis"><strong>作文遷移：</strong>${escapeHtml(example.writingTip)}</p>`:""}<div class="example-tools"><button class="example-tool example-practice" type="button">用這句遮字作答</button><button class="example-tool example-audio" type="button">朗讀例句</button><button class="example-tool example-copy" type="button">複製例句</button></div></article>`;
}
function escapeRegExp(value){return String(value||"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}
function clozeSentence(text,word) {
  const patterns=targetVariants(word).map(parts=>parts.map(part=>"(?:"+[...wordForms(part)].map(escapeRegExp).sort((a,b)=>b.length-a.length).join("|")+")").join("\\s+"));
  return patterns.length?String(text).replace(/’/g,"'").replace(new RegExp("\\b(?:"+patterns.join("|")+")\\b","gi"),"________"):text;
}
async function copyText(value){try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(value);else{const area=document.createElement("textarea");area.value=value;area.setAttribute("readonly","");area.style.position="fixed";area.style.opacity="0";document.body.appendChild(area);area.select();document.execCommand("copy");area.remove()}showToast("例句已複製")}catch{showToast("無法複製，請長按例句選取")}}
function showExampleResult(result,entry,index){
  if(state.selectedIndex!==index)return;
  const host=byId("exampleResults"),meta=byId("exampleMeta");if(!host||!meta)return;
  const examples=result?.examples||[];host.innerHTML=examples.length?examples.map((item,n)=>renderGsatExampleCard(item,n+1)).join(""):'<p class="card-empty">內建例句資料尚未就緒。</p>';
  host.querySelectorAll(".builtin-example").forEach(card=>{const n=Number(card.dataset.exampleIndex),example=examples[n];card.querySelector(".example-practice").addEventListener("click",()=>{renderBuiltinPractice(entry,n);byId("builtinPractice").scrollIntoView({behavior:"smooth",block:"nearest"})});card.querySelector(".example-copy").addEventListener("click",()=>copyText(example.text));card.querySelector(".example-audio").addEventListener("click",event=>speakSentence(example.text,event.currentTarget));});
  const enhanced=typeof getExamNotebook==="function"&&getExamNotebook(entry)?.examples?.length;
  meta.textContent=enhanced?`本詞 ${examples.length} 句學測情境新編，附中文、句型與作文遷移；下方試卷摘錄另列出處。`:`本詞內建 ${examples.length} 句；「上傳教材」與「本站新編」依實際來源標示。`;
}
function showOnlineResult(result,entry,index){if(state.selectedIndex===index)showExampleResult(builtinExampleResult(entry),entry,index);}

function hideSuggestions(){searchSuggestions.hidden=true;searchInput.setAttribute("aria-expanded","false");state.suggestionIndex=-1}
function showSuggestions(){searchSuggestions.hidden=false;searchInput.setAttribute("aria-expanded","true")}
function suggestionItems(){return[...searchSuggestions.querySelectorAll(".suggestion")]}
function setSuggestionIndex(next){const items=suggestionItems();if(!items.length){state.suggestionIndex=-1;return}state.suggestionIndex=(next+items.length)%items.length;items.forEach((item,index)=>{item.classList.toggle("active",index===state.suggestionIndex);item.setAttribute("aria-selected",String(index===state.suggestionIndex))});items[state.suggestionIndex].scrollIntoView({block:"nearest"})}
function renderSuggestions(){const query=String(searchInput.value||"").trim();if(document.activeElement!==searchInput){hideSuggestions();return}if(query.length<1){if(!state.recentSearches.length){hideSuggestions();return}searchSuggestions.innerHTML=`<div class="suggestion-section">最近搜尋</div>${state.recentSearches.slice(0,6).map((value,index)=>`<button type="button" class="suggestion" role="option" aria-selected="false" data-query="${escapeHtml(value)}"><span class="dot l3">↺</span><span class="suggestion-copy"><strong>${escapeHtml(value)}</strong><small>本機最近搜尋</small></span><span class="suggestion-reason">RECENT</span></button>`).join("")}`;showSuggestions();return}const results=hybridSearch(query).filter(({entry})=>state.levels.has(Number(entry.level))).slice(0,7);if(!results.length){searchSuggestions.innerHTML='<p class="suggestion-empty">沒有建議；可繼續輸入中文概念或完整片語。</p>';showSuggestions();return}searchSuggestions.innerHTML=results.map(({entry,index,match})=>`<button type="button" class="suggestion" role="option" aria-selected="false" data-index="${index}"><span class="dot l${entry.level}">${entry.supplemental?"＋":entry.level}</span><span class="suggestion-copy"><strong>${escapeHtml(entry.word)}</strong><small>${escapeHtml(notebookShortMeaning(entry))}${getExamEvidenceYears(entry).length?" · 111–115 真題":""}</small></span><span class="suggestion-reason">${escapeHtml(match.reason||"相關")}</span></button>`).join("");showSuggestions()}
function acceptSuggestion(button){if(!button)return;if(button.dataset.query){searchInput.value=button.dataset.query;state.query=searchInput.value;saveRecentSearch(state.query);clearSearch.hidden=false;searchKey.hidden=true;applyFilters();renderSuggestions();return}const index=Number(button.dataset.index);if(Number.isFinite(index)){const entry=VOCABULARY[index];searchInput.value=entry.word;state.query=entry.word;saveRecentSearch(entry.word);clearSearch.hidden=false;searchKey.hidden=true;applyFilters();selectEntry(index,true);hideSuggestions()}}

function setupDaily(){const enriched=VOCABULARY.filter(entry=>getBuiltinStudy(entry)?.examples?.length);const pool=enriched.length?enriched:VOCABULARY;const now=new Date(),seed=Number(`${now.getFullYear()}${now.getMonth()+1}${now.getDate()}`),entry=pool[seed%pool.length],index=VOCABULARY.indexOf(entry);const button=byId("dailyButton");button.innerHTML=`<span class="dot l${entry.level}">${entry.supplemental?"＋":entry.level}</span><strong>${escapeHtml(entry.word)}</strong><small>${escapeHtml(getBuiltinStudy(entry)?.plainMeaning||entry.meaning)}</small><span class="arrow">→</span>`;button.addEventListener("click",()=>selectEntry(index,true))}
