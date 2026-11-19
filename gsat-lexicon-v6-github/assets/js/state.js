"use strict";

const SEARCH_FIELD_CACHE = new WeakMap();
const BM25_DOC_CACHE = new WeakMap();
const BM25_INDEX = {ready:false,df:new Map(),avgLength:1};
const state = {query:"", levels:new Set(LEVELS), favorites:new Set(readFavorites()), favoritesOnly:false, collocationsOnly:false, examOnly:false, examYear:"all", reviewOnly:false, category:"全部", selectedIndex:-1, filtered:[], page:1, aiMode:false, aiQuery:"", aiRanking:[], aiBusy:false, aiExtractor:null, aiVectors:null, aiVectorSize:0, onlineCache:new Map(), onlineRequest:0, onlineController:null, currentAudio:null, audioElement:null, audioSession:0,searchFeedback:readSearchFeedback(),practice:readPracticeStats(),recentSearches:readRecentSearches(),review:readReviewQueue(),suggestionIndex:-1};
const byId = id => document.getElementById(id);
const searchInput=byId("searchInput"), clearSearch=byId("clearSearch"), searchKey=byId("searchKey"), searchSuggestions=byId("searchSuggestions"), wordList=byId("wordList"), wordDetail=byId("wordDetail"), pagination=byId("pagination"), pageButtons=byId("pageButtons"), aiSearchButton=byId("aiSearchButton"), aiSearchStatus=byId("aiSearchStatus");

function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function safeExternalUrl(value){try{const url=new URL(String(value||""));return url.protocol==="https:"?url.href:""}catch{return""}}
function spokenForm(word){return String(word).split(/[/(]/)[0].replace(/[^A-Za-z'-]/g," ").trim();}
function apiLookupWord(word){return String(word).split(/[/(]/)[0].replace(/’/g,"'").replace(/\./g,"").replace(/[^A-Za-z'-]/g," ").trim();}
function normalizeCeecWord(word){return String(word||"").normalize("NFKC").toLowerCase().replace(/’/g,"'").replace(/\./g,"").replace(/\s+/g," ").trim()}
function normalizeSearchValue(value){return String(value||"").normalize("NFKC").toLowerCase().replace(/’/g,"'").replace(/[^a-z0-9\u3400-\u9fff'-]+/gi," ").replace(/\s+/g," ").trim()}
function readFavorites(){try{const value=JSON.parse(localStorage.getItem(FAVORITES_KEY)||"[]");return Array.isArray(value)?value.filter(item=>typeof item==="string"):[]}catch{return []}}
function saveFavorites(){try{localStorage.setItem(FAVORITES_KEY,JSON.stringify([...state.favorites]))}catch{showToast("此瀏覽器無法儲存收藏")}}
function readSearchFeedback(){try{const value=JSON.parse(localStorage.getItem(SEARCH_FEEDBACK_KEY)||"{}");return value&&typeof value==="object"&&!Array.isArray(value)?value:{}}catch{return{}}}
function readPracticeStats(){try{return JSON.parse(localStorage.getItem(PRACTICE_KEY)||'{"correct":0,"total":0}')}catch{return{correct:0,total:0}}}
function readRecentSearches(){try{const value=JSON.parse(localStorage.getItem(RECENT_SEARCH_KEY)||"[]");return Array.isArray(value)?value.slice(0,8):[]}catch{return[]}}
function saveRecentSearch(query){query=String(query||"").trim();if(query.length<2)return;state.recentSearches=[query,...state.recentSearches.filter(item=>normalizeSearchValue(item)!==normalizeSearchValue(query))].slice(0,8);try{localStorage.setItem(RECENT_SEARCH_KEY,JSON.stringify(state.recentSearches))}catch{}}
function readReviewQueue(){try{const value=JSON.parse(localStorage.getItem(REVIEW_KEY)||"{}");return value&&typeof value==="object"&&!Array.isArray(value)?value:{}}catch{return{}}}
function saveReviewQueue(){try{localStorage.setItem(REVIEW_KEY,JSON.stringify(state.review))}catch{showToast("此瀏覽器無法儲存複習進度")}}
function localDateKey(date=new Date()){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,"0"),d=String(date.getDate()).padStart(2,"0");return`${y}-${m}-${d}`}
function addDaysKey(days){const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()+days);return localDateKey(date)}
function reviewInfo(word){return state.review[word]||null}
function isReviewDue(word){const item=reviewInfo(word);return!!item&&String(item.due||"")<=localDateKey()}
function dueReviewCount(){return VOCABULARY.reduce((sum,entry)=>sum+(isReviewDue(entry.word)?1:0),0)}
function markReview(word,rating){const intervals=[1,3,7,14,30,60,120],current=reviewInfo(word)||{stage:0};let stage=Number(current.stage||0);if(rating==="again")stage=Math.max(0,stage-1);else stage=Math.min(intervals.length-1,stage+1);const days=rating==="again"?1:intervals[stage];state.review[word]={stage,due:addDaysKey(days),last:localDateKey(),rating};saveReviewQueue();updateReviewCount();showToast(rating==="again"?"已排到明天再複習":"已安排下一次複習");return state.review[word]}
function updateReviewCount(){const count=dueReviewCount();const target=byId("reviewCount");if(target)target.textContent=count?String(count):""}
function savePracticeStats(){try{localStorage.setItem(PRACTICE_KEY,JSON.stringify(state.practice))}catch{}}
function recordSearchFeedback(query,word){const key=normalizeSearchValue(query);if(!key||!word)return;SEARCH_RESULT_CACHE.clear();const current=state.searchFeedback[key]||{};current[word]=Math.min(12,Number(current[word]||0)+1);state.searchFeedback[key]=current;const keys=Object.keys(state.searchFeedback);if(keys.length>40)delete state.searchFeedback[keys[0]];try{localStorage.setItem(SEARCH_FEEDBACK_KEY,JSON.stringify(state.searchFeedback))}catch{}}
function showToast(message){const toast=byId("toast");toast.textContent=message;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),1800)}
function levelName(level){return level<=2?"基礎核心":level<=4?"學測主力":level===5?"核心進階":"語境延伸"}
const GSAT_ENTRY_POINT_CACHE=new WeakMap();
function getGsatPoints(entry){
  if(entry&&GSAT_ENTRY_POINT_CACHE.has(entry))return GSAT_ENTRY_POINT_CACHE.get(entry);
  const candidates=[normalizeCeecWord(apiLookupWord(entry&&entry.word)),...(String(entry&&entry.word||"").toLowerCase().match(/[a-z]+/g)||[])];
  const points=[];for(const key of candidates){for(const point of GSAT_POINTS_BY_WORD.get(key)||[]){if(!points.includes(point))points.push(point)}}if(entry&&typeof entry==="object")GSAT_ENTRY_POINT_CACHE.set(entry,points);return points;
}
function getGsatPoint(entry){return getGsatPoints(entry)[0]||null}
function gsatPointSearchText(entry){return getGsatPoints(entry).flatMap(point=>[...point.keys,...point.patterns.flat(),point.trap,...point.patternNotes,point.category,point.priority,(point.evidence||[]).join(" ")]).join(" ").toLowerCase()}
