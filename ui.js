"use strict";

function getVisibleGsatPoints(entry){
  const query=normalizeSearchValue(state.query);
  return getGsatPoints(entry).filter(point=>(!state.examOnly||(point.evidence.length&&(state.examYear==="all"||point.evidence.includes(state.examYear))))&&(!state.collocationsOnly||state.category==="全部"||point.category===state.category)).sort((a,b)=>{
    const match=point=>query&&point.patterns.some(([form,meaning])=>normalizeSearchValue(form+" "+meaning).includes(query))?1:0;
    return match(b)-match(a)||Number(!!b.evidence.length)-Number(!!a.evidence.length);
  });
}
function renderPatternReferences(references){
  if(!references.length)return '<small class="pattern-kind">延伸句型 · 未附逐句出處</small>';
  const years=[...new Set(references.map(ref=>ref.year))].join("、");
  return `<details class="pattern-references"><summary>查看原文 · ${escapeHtml(years)} 年 · ${references.length} 筆出處</summary>${references.map(ref=>`<div class="reference-item"><p><strong>${escapeHtml(ref.year)} 年｜${escapeHtml(ref.location)}</strong><span class="reference-role ${ref.role==="option"?"option":""}">${ref.role==="option"?"選項用語 · 非答案標記":ref.role==="stem"?"題幹用語":"本文用語"}</span></p><blockquote lang="en">…${escapeHtml(ref.quote)}…</blockquote><small>試卷第 ${Number(ref.printedPage)} 頁／PDF 第 ${Number(ref.pdfPage)} 頁 · ${escapeHtml(ref.filename)}</small></div>`).join("")}</details>`;
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
  return `<p class="point-summary">此詞符合 ${points.length} 組考點 · 句型為用法整理，原文保留在下方出處。</p>${first}${remaining}<div class="collocation-practice" id="collocationPractice" hidden></div><p class="exam-source">EXAM 表示此詞相關考點含已核對來源。英文句型可能經原形化或加入 N／V-ing 等代號；原文摘錄保持試卷文字。選項用語不代表正解，紀錄筆數不代表出題頻率。沒有逐句出處的原版內容保留為延伸學習。</p>`;
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
function setListMode(mode){state.favoritesOnly=mode==="favorites";state.collocationsOnly=mode==="collocations";state.examOnly=mode==="exam";state.reviewOnly=mode==="review";for(const [id,value] of [["allTab","all"],["examTab","exam"],["collocationTab","collocations"],["reviewTab","review"],["favoriteTab","favorites"]])byId(id).classList.toggle("on",mode===value);byId("categoryFilters").hidden=!state.collocationsOnly;byId("examYearFilters").hidden=!state.examOnly;applyFilters();refreshCollocationPanel()}

function applyFilters(resetPage=true){
  const needle=normalizeSearchValue(state.query);
  if(state.aiMode&&state.aiQuery!==needle)disableAiMode("搜尋內容已變更；已切回本機混合搜尋。")
  const ranked=needle?(state.aiMode&&state.aiQuery===needle?state.aiRanking:hybridSearch(needle)):VOCABULARY.map((entry,index)=>({entry,index,match:{score:0,reason:"",channels:[]}}));
  state.filtered=ranked.filter(({entry})=>state.levels.has(Number(entry.level))).filter(({entry})=>!state.favoritesOnly||state.favorites.has(entry.word)).filter(({entry})=>!state.examOnly||getGsatPoints(entry).some(point=>Array.isArray(point.evidence)&&point.evidence.length&&(state.examYear==="all"||point.evidence.includes(state.examYear)))).filter(({entry})=>!state.reviewOnly||isReviewDue(entry.word)).filter(({entry})=>!state.collocationsOnly||getGsatPoints(entry).some(point=>state.category==="全部"||(point.category||"核心辨析")===state.category));
  if(!needle)state.filtered.sort((a,b)=>state.reviewOnly?String(reviewInfo(a.entry.word)?.due||"").localeCompare(String(reviewInfo(b.entry.word)?.due||""))||a.entry.word.localeCompare(b.entry.word):state.examOnly?(getGsatPoints(b.entry).filter(point=>point.evidence?.length).length-getGsatPoints(a.entry).filter(point=>point.evidence?.length).length)||a.entry.word.localeCompare(b.entry.word):state.collocationsOnly?(getGsatPoints(b.entry).some(point=>point.priority==="必熟")?1:0)-(getGsatPoints(a.entry).some(point=>point.priority==="必熟")?1:0)||a.entry.word.localeCompare(b.entry.word):a.entry.word.localeCompare(b.entry.word));
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
  byId("resultLabel").textContent=state.aiMode?"AI 語意搜尋結果":state.query?"混合搜尋結果":state.favoritesOnly?"我的收藏":state.reviewOnly?"今日到期複習":state.examOnly?`${state.examYear==="all"?"111–115":state.examYear} 真題搭配`:state.collocationsOnly?(state.category==="全部"?"搭配考點詞彙":state.category):"官方詞彙表";
  byId("sortHint").textContent=state.aiMode?"MiniLM 語意＋混合搜尋":state.query?"字面＋BM25＋概念＋真題":state.reviewOnly?"到期日優先":state.examOnly?"真題證據優先":state.collocationsOnly?"必熟優先":"";
  byId("favoriteCount").textContent=state.favorites.size?String(state.favorites.size):"";
  const totalPages=Math.max(1,Math.ceil(state.filtered.length/PAGE_SIZE));state.page=Math.min(Math.max(1,state.page),totalPages);const start=(state.page-1)*PAGE_SIZE,end=Math.min(state.filtered.length,start+PAGE_SIZE),rows=state.filtered.slice(start,end);
  if(!rows.length){wordList.innerHTML='<div class="empty"><div><strong>找不到符合的詞彙</strong><p>試試其他拼法、中文關鍵字，或開啟更多級別。</p></div></div>';pagination.hidden=true;return}
  wordList.innerHTML=rows.map(({entry,index,match})=>`<button class="row level-row-${entry.level} ${state.selectedIndex===index?"selected":""}" type="button" data-index="${index}"><span class="dot l${entry.level}">${entry.level}</span><span class="row-copy"><span class="row-title"><strong>${escapeHtml(entry.word)}</strong>${getGsatPoints(entry).some(point=>point.evidence?.length)?'<span class="row-exam">EXAM</span>':""}${isReviewDue(entry.word)?'<span class="row-due">DUE</span>':""}${state.query&&match&&match.reason?`<span class="search-match">${escapeHtml(match.reason)}</span>`:""}</span><small>${escapeHtml(entry.partOfSpeech)} · ${escapeHtml(entry.meaning)}</small></span><span class="arrow" aria-hidden="true">→</span></button>`).join("");
  renderPagination(totalPages,start,end);
}

function goToPage(page){const totalPages=Math.max(1,Math.ceil(state.filtered.length/PAGE_SIZE));state.page=Math.min(Math.max(1,Number(page)||1),totalPages);renderList();wordList.scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})}

function selectEntry(index,scroll=false){
  const entry=VOCABULARY[index];if(!entry)return;if(scroll&&state.query)recordSearchFeedback(state.query,entry.word);state.selectedIndex=index;renderDetail(entry,index);renderList();
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

function renderDetail(entry,index){
  stopPronunciation();
  const saved=state.favorites.has(entry.word),review=reviewInfo(entry.word),reviewText=review?`下次 ${escapeHtml(review.due)}`:"尚未排程";
  const example=`<section class="example" id="exampleCard"><p class="kicker">📖 多來源例句 · V5 品質排序</p><div class="filter-legend" aria-label="例句評分維度"><span>🎯 目標字＋完整句</span><span>📚 CEEC 詞彙覆蓋</span><span>🔗 語境／搭配線索</span><span>🗣️ 來源多樣與真人音訊</span></div><div class="example-list loading" id="exampleResults"><p class="example-loading">正在彙整、去重、檢查詞彙覆蓋與搭配，再排序候選例句…</p></div><p id="exampleMeta">先顯示例句，再補上翻譯；分數為規則評估，並非文法正確率</p></section>`;
  const hasPoints=collocationPracticeCandidates(entry).length>0;
  const learning=`<div class="learning-grid"><section class="study-card exam-points"><div class="exam-point-header"><div><p class="kicker">🔥 搭配考點 · 111–115 真題擴充</p><p class="card-note">可搜尋中文概念或完整句型 · ${GSAT_COLLOCATION_GUIDE.length} 組、${GSAT_COLLOCATION_STATS.patterns} 條句型 · ${GSAT_COLLOCATION_STATS.verifiedPatterns} 條附已核對出處</p></div><button class="practice-button" id="practiceButton" type="button" ${hasPoints?"":"hidden"}>立即考一題</button></div><div id="collocationContent">${renderGsatPoint(entry)}</div></section><section class="study-card cloze"><p class="kicker">🎯 克漏字近義詞替換</p><p class="card-note">WordNet 近義候選 × 大考中心 1～6 級 · 最多 5 個；替換前仍需核對詞義與詞性</p><div class="chips" id="synonymChips"><p class="card-empty">正在比對大考中心白名單…</p></div></section><section class="study-card collocation"><p class="kicker">✍️ 語料庫搭配候選與信心</p><p class="card-note">語料頻率＋詞性方向＋CEEC 級別＋精選句型校正 · 最多 6 組；請以「高」信心優先</p><div class="chips" id="collocationChips"><p class="card-empty">正在評估學測範圍內的前後搭配…</p></div></section></div>`;
  wordDetail.className=`detail theme-l${entry.level}`;
  wordDetail.innerHTML=`<div class="topline"><span class="badge">LEVEL ${entry.level}</span><span>${levelName(entry.level)}</span><div class="review-actions"><span class="review-status" id="reviewStatus">${reviewText}</span><button class="review-button again" id="reviewAgain" type="button">再複習</button><button class="review-button good" id="reviewGood" type="button">記住了</button></div><button class="favorite ${saved?"saved":""}" id="favoriteButton" type="button">${saved?"★ 已收藏":"☆ 收藏"}</button></div><div class="title-row"><div><h2>${escapeHtml(entry.word)}</h2><p class="phonetic"><em id="primaryPos">${escapeHtml(entry.partOfSpeech)}</em><span id="apiPhonetic">${escapeHtml(entry.pronunciation||"音標未收錄")}</span><span class="phonetic-source" id="phoneticSource">OFFLINE</span></p><div class="pos-chips" id="posChips"><span class="pos-chip">${escapeHtml(entry.partOfSpeech)}</span></div><p class="audio-status loading" id="audioStatus">正在彙整美式、英式與其他真人發音…</p><div class="pronunciation-options" id="pronunciationOptions" aria-label="可用真人發音"></div><button class="accent-choice" id="moreAudioButton" type="button">更多口音</button></div><button class="speak" id="speakButton" type="button" aria-label="播放 ${escapeHtml(entry.word)} 的發音"><span>🔊</span><small id="speakSource">真人優先</small></button></div><section class="definition"><p class="kicker">🇹🇼 繁體中文釋義</p><h3>${escapeHtml(entry.meaning)}</h3><p class="translation-live"><span>線上補充</span><strong id="translationText">已提供內建釋義，可按需補充翻譯</strong><button id="translationFetch" class="accent-choice" type="button">補充翻譯</button><a id="translationLink" href="${escapeHtml(googleTranslatePage(entry.word))}" target="_blank" rel="noreferrer">開啟翻譯</a></p></section>${renderExamProfile(entry)}${example}${learning}<div class="twocol"><section><p class="kicker">詞表內建搭配</p><p>${escapeHtml(entry.collocations||"尚未補充常用搭配")}</p></section><section><p class="kicker">易錯提醒</p><p>${escapeHtml(entry.note||"尚未補充易錯提醒")}</p></section></div><div class="service-actions"><span id="onlineStatus">正在載入線上學習資料…</span><button id="onlineRetry" type="button" hidden>重新載入線上資料</button></div><p class="source">${escapeHtml(entry.source)}</p>`;
  byId("favoriteButton").addEventListener("click",()=>toggleFavorite(entry.word,index));
  byId("reviewAgain").addEventListener("click",()=>{const item=markReview(entry.word,"again");byId("reviewStatus").textContent=`下次 ${item.due}`;if(state.reviewOnly)applyFilters()});
  byId("reviewGood").addEventListener("click",()=>{const item=markReview(entry.word,"good");byId("reviewStatus").textContent=`下次 ${item.due}`;if(state.reviewOnly)applyFilters()});
  byId("speakButton").addEventListener("click",event=>speakWord(entry.word,event.currentTarget));
  byId("onlineRetry").addEventListener("click",()=>loadOnlineData(entry,index,true));
  byId("practiceButton").addEventListener("click",()=>startCollocationPractice(entry));
  byId("translationFetch").addEventListener("click",event=>requestWordTranslation(entry,index,event.currentTarget));
  byId("moreAudioButton").addEventListener("click",event=>requestMoreAudio(entry,index,event.currentTarget));
  syncFavoriteButton();
  void loadOnlineData(entry,index);
}
function showDictionaryResult(result,entry,index,error=false){
  if(state.selectedIndex!==index)return;
  const phonetic=byId("apiPhonetic"),phoneticSource=byId("phoneticSource"),button=byId("speakButton"),source=byId("speakSource"),status=byId("audioStatus"),options=byId("pronunciationOptions");if(!phonetic||!phoneticSource||!button||!source||!status||!options)return;
  phonetic.textContent=result&&result.phonetic?result.phonetic:(entry.pronunciation||"音標未收錄");phoneticSource.textContent=result&&result.phonetic?"DICTIONARY API":"OFFLINE";
  const candidates=result&&result.audioCandidates||[];
  if(candidates.length){const preferred=candidates[0];source.textContent=preferred.accent;button.title=`播放 ${preferred.accent} ${preferred.format} 真人發音`;status.className="audio-status ready";status.textContent=`${candidates.length} 組可播放真人發音 · 預設 ${preferred.accent} ${preferred.format}`;options.innerHTML=candidates.slice(0,4).map((candidate,position)=>`<button class="accent-choice" type="button" data-audio-index="${position}" title="${escapeHtml(candidate.source)}">${escapeHtml(candidate.accent)} · ${escapeHtml(candidate.format)}</button>`).join("");options.querySelectorAll("button").forEach(option=>option.addEventListener("click",event=>{const candidate=candidates[Number(event.currentTarget.dataset.audioIndex)];if(candidate)playAudioCandidates([candidate],entry.word,event.currentTarget,true)}));return}
  source.textContent="系統";button.title="使用 iPhone／iPad 內建英文語音";status.className="audio-status fallback";status.textContent=error?"真人音源暫時無法連線 · 點按使用裝置英文語音":"未收錄可播放真人音檔 · 點按使用裝置英文語音";options.innerHTML="";
}

function renderGsatExampleCard(example,rank) {
  if(example.isEmergency)return `<article class="fallback-example"><strong>暫無合格例句</strong><p>${escapeHtml(example.text)}</p></article>`;
  const tags=(example.reasons||[]).map(reason=>`<span class="filter-tag">${escapeHtml(reason)}</span>`).join("");
  const safeSource=safeExternalUrl(example.sourceUrl),safeAudio=safeExternalUrl(example.audioAttributionUrl);
  const source=safeSource?`<a href="${escapeHtml(safeSource)}" target="_blank" rel="noreferrer">${escapeHtml(example.source)}</a>`:escapeHtml(example.source||"來源未標示");
  const author=example.audioAuthor?(safeAudio?`<a href="${escapeHtml(safeAudio)}" target="_blank" rel="noreferrer">錄音 ${escapeHtml(example.audioAuthor)}</a>`:`錄音 ${escapeHtml(example.audioAuthor)}`):"";
  const translation=example.translationZh?`<strong>${escapeHtml(example.translationSource||"Google 翻譯")}</strong>${escapeHtml(example.translationZh)}`:example.translationPending?"繁中翻譯載入中…":example.selectionTier==="gold"?"翻譯服務暫時無法使用，仍可閱讀英文例句。":"此句未達精選分數，供參考，未送出翻譯。";
  return `<article class="gold-example" data-example-index="${rank-1}"><div class="gold-head"><span class="gold-rank">${example.selectionTier==="gold"?`精選例句 #${rank}`:"參考例句"}</span><strong class="gold-score" title="規則評分，並非文法正確率">${example.score} 分</strong></div><blockquote>${escapeHtml(example.text)}</blockquote><p class="example-translation">${translation}</p><div class="filter-tags">${tags}</div><div class="example-tools">${example.audioUrl?'<button class="example-tool example-audio" type="button">▶ 真人例句</button>':""}<button class="example-tool example-cloze" type="button">遮字練習</button><button class="example-tool example-copy" type="button">複製例句</button></div><span class="example-source">${source}${example.sentenceLicense?` (${escapeHtml(example.sentenceLicense)})`:""} · ${example.wordCount} words · CEEC 覆蓋 ${Math.round(example.ceecCoverage*100)}%${author?` · ${author} ${escapeHtml(example.audioLicense||"")}`:""}</span></article>`;
}
function escapeRegExp(value){return String(value||"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}
function clozeSentence(text,word) {
  const patterns=targetVariants(word).map(parts=>parts.map(part=>"(?:"+[...wordForms(part)].map(escapeRegExp).sort((a,b)=>b.length-a.length).join("|")+")").join("\\s+"));
  return patterns.length?String(text).replace(/’/g,"'").replace(new RegExp("\\b(?:"+patterns.join("|")+")\\b","gi"),"________"):text;
}
async function copyText(value){try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(value);else{const area=document.createElement("textarea");area.value=value;area.setAttribute("readonly","");area.style.position="fixed";area.style.opacity="0";document.body.appendChild(area);area.select();document.execCommand("copy");area.remove()}showToast("例句已複製")}catch{showToast("無法複製，請長按例句選取")}}
function showExampleResult(result,entry,index,error=false){
  if(state.selectedIndex!==index)return;
  const posHost=byId("posChips"),primaryPos=byId("primaryPos"),host=byId("exampleResults"),meta=byId("exampleMeta");if(!posHost||!primaryPos||!host||!meta)return;
  const parts=result&&result.partsOfSpeech&&result.partsOfSpeech.length?result.partsOfSpeech:[entry.partOfSpeech];primaryPos.textContent=parts.join(" / ");posHost.innerHTML=parts.map(part=>`<span class="pos-chip">${escapeHtml(part)}</span>`).join("");host.classList.remove("loading");
  const examples=result&&result.examples&&result.examples.length?result.examples:[emergencyExample(entry)];const oldExamples=host._examples||[],masked=new Set([...host.querySelectorAll(".example-cloze.active")].map(button=>oldExamples[Number(button.closest(".gold-example").dataset.exampleIndex)]?.text));host._examples=examples;host.innerHTML=examples.map((example,position)=>renderGsatExampleCard(example,position+1)).join("");
  host.querySelectorAll(".gold-example").forEach(card=>{const position=Number(card.dataset.exampleIndex),example=examples[position],quote=card.querySelector("blockquote"),cloze=card.querySelector(".example-cloze"),copy=card.querySelector(".example-copy"),audio=card.querySelector(".example-audio");if(masked.has(example.text)){cloze.classList.add("active");cloze.textContent="顯示答案";quote.textContent=clozeSentence(example.text,entry.word)}cloze.addEventListener("click",()=>{const active=cloze.classList.toggle("active");quote.textContent=active?clozeSentence(example.text,entry.word):example.text;cloze.textContent=active?"顯示答案":"遮字練習"});copy.addEventListener("click",()=>copyText(example.text));if(audio)audio.addEventListener("click",()=>{const candidate=audioCandidate(example.audioUrl,"真人例句","Tatoeba",example.audioAttributionUrl);if(candidate)playAudioCandidates([candidate],example.text,audio,true)})});
  if(result.selectionTier==="gold"){const translated=examples.filter(example=>example.translationZh).length;meta.textContent=`${result.algorithmVersion||CURRENT_EXAM_MODEL.version}：${result.candidateCount} 句候選 → ${result.qualifiedCount} 句通過（${result.rejectedCount||0} 句未通過）→ 顯示 ${examples.length} 句；已有繁中翻譯 ${translated} 句。`}
  else if(result.selectionTier==="fallback")meta.textContent=`${result.algorithmVersion||CURRENT_EXAM_MODEL.version}：${result.candidateCount} 句候選未達門檻；僅顯示通過基本結構與搭配檢查的參考句，不送翻譯。`;
  else meta.textContent=error?"線上句庫暫時受限；保留內建釋義與搭配考點。":"尚無通過基本品質檢查的例句；可參考內建釋義與搭配考點。";
}

function ceecFilterSummary(result){const rejected=Number(result&&result.rejectedCount||0),blocked=Number(result&&result.blockedCount||0);return rejected||blocked?`<p class="ceec-filter-status"><strong>CEEC＋易錯規則 ✓</strong>${rejected?` 已隱藏 ${rejected} 個超綱候選`:""}${blocked?`${rejected?"；":" 已"}排除 ${blocked} 個易錯組合`:""}</p>`:`<p class="ceec-filter-status"><strong>CEEC 白名單 ✓</strong> 顯示詞皆在官方 1～6 級範圍</p>`}
function showSynonymsResult(result,index,error=false){
  if(state.selectedIndex!==index)return;const host=byId("synonymChips");if(!host)return;
  const items=result&&result.items||[];host.innerHTML=items.length?items.map(item=>`<span class="word-chip synonym">${escapeHtml(item.word)}<span class="ceec-level level-${item.level}">L${item.level}</span></span>`).join("")+ceecFilterSummary(result):`<p class="card-empty">${error?"Datamuse 暫時無法連線。":result&&result.candidateCount?"Datamuse 候選均不在大考中心 1～6 級詞表內，已全部隱藏。":"沒有找到適合的替換詞。"}</p>`;
}
function showCollocationsResult(result,entry,index,error=false){
  if(state.selectedIndex!==index)return;const host=byId("collocationChips");if(!host)return;
  const items=result&&result.items||[];host.innerHTML=items.length?items.map(item=>`<span class="word-chip collocation" title="${escapeHtml((item.reasons||[]).join(" · "))}"><strong>${escapeHtml(item.phrase)}</strong><span class="collocation-confidence confidence-${escapeHtml(item.confidence||"explore")}">${escapeHtml(item.confidenceLabel||"探索")}</span><span class="ceec-level level-${item.level}">L${item.level}</span></span>`).join("")+ceecFilterSummary(result):`<p class="card-empty">${error?"Datamuse 暫時無法連線。":result&&result.candidateCount?"候選未通過 CEEC 白名單與易錯搭配規則。":"沒有找到可信度足夠的前後搭配。"}</p>`;
}
function showTranslationResult(value,index,error=false){
  if(state.selectedIndex!==index)return;const host=byId("translationText");if(!host)return;
  host.textContent=value||(error?"免金鑰路徑目前受限；已保留上方內建繁中":"Google 未回傳翻譯；已保留上方內建繁中");
}
function showOnlineResult(result,entry,index){
  showDictionaryResult(result.dictionary,entry,index,result.errors.dictionary||result.errors.wiktionaryAudio);
  showExampleResult(result.examples,entry,index,result.errors.dictionary&&result.errors.wiktionary&&result.errors.freeDictionary&&result.errors.tatoeba);
  showSynonymsResult(result.synonyms,index,result.errors.synonyms);
  showCollocationsResult(result.collocations,entry,index,result.errors.collocations);
  if(result.translation || result.errors.translation)showTranslationResult(result.translation,index,result.errors.translation);
  if(state.selectedIndex!==index)return;const status=byId("onlineStatus"),retry=byId("onlineRetry"),errors=Object.values(result.errors).filter(Boolean).length;if(status)status.textContent=errors?"部分免金鑰服務受限；離線資料與備援仍可使用":"線上學習資料已更新";if(retry)retry.hidden=!errors;
}

function hideSuggestions(){searchSuggestions.hidden=true;searchInput.setAttribute("aria-expanded","false");state.suggestionIndex=-1}
function showSuggestions(){searchSuggestions.hidden=false;searchInput.setAttribute("aria-expanded","true")}
function suggestionItems(){return[...searchSuggestions.querySelectorAll(".suggestion")]}
function setSuggestionIndex(next){const items=suggestionItems();if(!items.length){state.suggestionIndex=-1;return}state.suggestionIndex=(next+items.length)%items.length;items.forEach((item,index)=>{item.classList.toggle("active",index===state.suggestionIndex);item.setAttribute("aria-selected",String(index===state.suggestionIndex))});items[state.suggestionIndex].scrollIntoView({block:"nearest"})}
function renderSuggestions(){const query=String(searchInput.value||"").trim();if(document.activeElement!==searchInput){hideSuggestions();return}if(query.length<1){if(!state.recentSearches.length){hideSuggestions();return}searchSuggestions.innerHTML=`<div class="suggestion-section">最近搜尋</div>${state.recentSearches.slice(0,6).map((value,index)=>`<button type="button" class="suggestion" role="option" aria-selected="false" data-query="${escapeHtml(value)}"><span class="dot l3">↺</span><span class="suggestion-copy"><strong>${escapeHtml(value)}</strong><small>本機最近搜尋</small></span><span class="suggestion-reason">RECENT</span></button>`).join("")}`;showSuggestions();return}const results=hybridSearch(query).filter(({entry})=>state.levels.has(Number(entry.level))).slice(0,7);if(!results.length){searchSuggestions.innerHTML='<p class="suggestion-empty">沒有建議；可繼續輸入中文概念或完整片語。</p>';showSuggestions();return}searchSuggestions.innerHTML=results.map(({entry,index,match})=>`<button type="button" class="suggestion" role="option" aria-selected="false" data-index="${index}"><span class="dot l${entry.level}">${entry.level}</span><span class="suggestion-copy"><strong>${escapeHtml(entry.word)}</strong><small>${escapeHtml(entry.meaning)}${getGsatPoints(entry).some(point=>point.evidence?.length)?" · 111–115 真題":""}</small></span><span class="suggestion-reason">${escapeHtml(match.reason||"相關")}</span></button>`).join("");showSuggestions()}
function acceptSuggestion(button){if(!button)return;if(button.dataset.query){searchInput.value=button.dataset.query;state.query=searchInput.value;saveRecentSearch(state.query);clearSearch.hidden=false;searchKey.hidden=true;applyFilters();renderSuggestions();return}const index=Number(button.dataset.index);if(Number.isFinite(index)){const entry=VOCABULARY[index];searchInput.value=entry.word;state.query=entry.word;saveRecentSearch(entry.word);clearSearch.hidden=false;searchKey.hidden=true;applyFilters();selectEntry(index,true);hideSuggestions()}}

function setupDaily(){const enriched=VOCABULARY.filter(entry=>entry.example);const pool=enriched.length?enriched:VOCABULARY;const now=new Date(),seed=Number(`${now.getFullYear()}${now.getMonth()+1}${now.getDate()}`),entry=pool[seed%pool.length],index=VOCABULARY.indexOf(entry);const button=byId("dailyButton");button.innerHTML=`<span class="dot l${entry.level}">${entry.level}</span><strong>${escapeHtml(entry.word)}</strong><small>${escapeHtml(entry.meaning)}</small><span class="arrow">→</span>`;button.addEventListener("click",()=>selectEntry(index,true))}
