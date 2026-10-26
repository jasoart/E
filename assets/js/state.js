"use strict";

const SEARCH_FIELD_CACHE = new WeakMap();
const BM25_DOC_CACHE = new WeakMap();
const BM25_INDEX = {ready:false,df:new Map(),avgLength:1};
const state = {query:"", levels:new Set(LEVELS), favorites:new Set(readFavorites()), favoritesOnly:false, collocationsOnly:false, examOnly:false, examYear:"all", reviewOnly:false, category:"全部", selectedIndex:-1, filtered:[], page:1, currentAudio:null, audioSession:0,searchFeedback:readSearchFeedback(),practice:readPracticeStats(),recentSearches:readRecentSearches(),review:readReviewQueue(),suggestionIndex:-1};
const byId = id => document.getElementById(id);
const searchInput=byId("searchInput"), clearSearch=byId("clearSearch"), searchKey=byId("searchKey"), searchSuggestions=byId("searchSuggestions"), wordList=byId("wordList"), wordDetail=byId("wordDetail"), pagination=byId("pagination"), pageButtons=byId("pageButtons");

function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function safeExternalUrl(value){try{const url=new URL(String(value||""));return url.protocol==="https:"?url.href:""}catch{return""}}
function spokenForm(word){
  const aliases=typeof builtinTargetAliases==="function"?builtinTargetAliases(word):[];
  return String(aliases[0]||String(word).split(/[/(]/)[0]).normalize("NFKC").replace(/[^\p{L}\p{N}'.-]+/gu," ").trim();
}
function apiLookupWord(word){return String(word).split(/[/(]/)[0].replace(/’/g,"'").replace(/\./g,"").replace(/[^A-Za-z'-]/g," ").trim();}
function normalizeCeecWord(word){return String(word||"").normalize("NFKC").toLowerCase().replace(/’/g,"'").replace(/\./g,"").replace(/\s+/g," ").trim()}
function normalizeSearchValue(value){return String(value||"").normalize("NFKC").toLowerCase().replace(/’/g,"'").replace(/[^a-z0-9\u3400-\u9fff'-]+/gi," ").replace(/\s+/g," ").trim()}
function readFavorites(){try{const value=JSON.parse(localStorage.getItem(FAVORITES_KEY)||"[]");return Array.isArray(value)?value.filter(item=>typeof item==="string"):[]}catch{return []}}
function saveFavorites(){try{localStorage.setItem(FAVORITES_KEY,JSON.stringify([...state.favorites]))}catch{showToast("此瀏覽器無法儲存收藏")}}
function storedObject(value){return value!==null&&typeof value==="object"&&!Array.isArray(value)}
function ownStoredValue(object,key){return storedObject(object)&&Object.prototype.hasOwnProperty.call(object,key)?object[key]:undefined}
function readStoredJson(key){try{return JSON.parse(localStorage.getItem(key)||"null")}catch{return null}}
function storedCounter(value,max=1000000000){return Number.isSafeInteger(value)&&value>=0?Math.min(max,value):0}
function feedbackCounts(value){
  const counts=Object.create(null);if(!storedObject(value))return counts;
  for(const [word,count] of Object.entries(value))if(word&&Number.isSafeInteger(count)&&count>=0)counts[word]=Math.min(12,count);
  return counts;
}
function readSearchFeedback(){
  const value=readStoredJson(SEARCH_FEEDBACK_KEY),feedback=Object.create(null);if(!storedObject(value))return feedback;
  for(const [query,record] of Object.entries(value)){
    const key=normalizeSearchValue(query),counts=feedbackCounts(record);if(!key||!Object.keys(counts).length)continue;
    const current=feedback[key]||(feedback[key]=Object.create(null));
    for(const [word,count] of Object.entries(counts))current[word]=Math.max(current[word]||0,count);
  }
  for(const key of Object.keys(feedback).slice(0,-40))delete feedback[key];
  return feedback;
}
function practiceCounters(value){const total=storedCounter(ownStoredValue(value,"total"));return{correct:Math.min(total,storedCounter(ownStoredValue(value,"correct"))),total}}
function readPracticeStats(){return practiceCounters(readStoredJson(PRACTICE_KEY))}
function readRecentSearches(){const value=readStoredJson(RECENT_SEARCH_KEY);return Array.isArray(value)?value.filter(item=>typeof item==="string"&&item.trim()).slice(0,8):[]}
function saveRecentSearch(query){query=String(query||"").trim();if(query.length<2)return;state.recentSearches=[query,...state.recentSearches.filter(item=>normalizeSearchValue(item)!==normalizeSearchValue(query))].slice(0,8);try{localStorage.setItem(RECENT_SEARCH_KEY,JSON.stringify(state.recentSearches))}catch{}}
function storedDateKey(value){
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const [year,month,day]=value.split("-").map(Number);if(year<1||month<1||month>12||day<1||day>31)return false;
  const date=new Date(0);date.setUTCFullYear(year,month-1,day);date.setUTCHours(12,0,0,0);
  return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day;
}
function reviewStage(value){return Number.isSafeInteger(value)?Math.max(0,Math.min(6,value)):0}
function readReviewQueue(){
  const value=readStoredJson(REVIEW_KEY),queue=Object.create(null);if(!storedObject(value))return queue;
  for(const [word,record] of Object.entries(value)){
    if(!word||!storedObject(record)||!storedDateKey(record.due))continue;
    // Retain legacy/unknown IDs, their due dates and extra metadata. A damaged
    // stage is recoverable; never generate a NaN interval from stored input.
    const item={...record,stage:reviewStage(record.stage)};
    if(!storedDateKey(item.last))delete item.last;
    if(item.rating!=="again"&&item.rating!=="good")delete item.rating;
    queue[word]=item;
  }
  return queue;
}
function saveReviewQueue(){try{localStorage.setItem(REVIEW_KEY,JSON.stringify(state.review))}catch{showToast("此瀏覽器無法儲存複習進度")}}
function localDateKey(date=new Date()){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,"0"),d=String(date.getDate()).padStart(2,"0");return`${y}-${m}-${d}`}
function addDaysKey(days){const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()+days);return localDateKey(date)}
function reviewInfo(word){const item=ownStoredValue(state.review,word);return storedObject(item)&&storedDateKey(item.due)?item:null}
function isReviewDue(word){const item=reviewInfo(word);return!!item&&item.due<=localDateKey()}
function dueReviewCount(){return VOCABULARY.reduce((sum,entry)=>sum+(isReviewDue(entry.word)?1:0),0)}
function markReview(word,rating){const intervals=[1,3,7,14,30,60,120],current=reviewInfo(word)||{stage:0};let stage=reviewStage(current.stage);if(rating==="again")stage=Math.max(0,stage-1);else stage=Math.min(intervals.length-1,stage+1);const days=rating==="again"?1:intervals[stage];state.review[word]={stage,due:addDaysKey(days),last:localDateKey(),rating};saveReviewQueue();updateReviewCount();showToast(rating==="again"?"已排到明天再複習":"已安排下一次複習");return state.review[word]}
function updateReviewCount(){const count=dueReviewCount();const target=byId("reviewCount");if(target)target.textContent=count?String(count):""}
function savePracticeStats(){state.practice=practiceCounters(state.practice);try{localStorage.setItem(PRACTICE_KEY,JSON.stringify(state.practice))}catch{}}
function recordSearchFeedback(query,word){
  const key=normalizeSearchValue(query);if(!key||typeof word!=="string"||!word)return;
  SEARCH_RESULT_CACHE.delete(key);
  const current=feedbackCounts(ownStoredValue(state.searchFeedback,key));current[word]=Math.min(12,(current[word]||0)+1);
  state.searchFeedback[key]=current;
  for(const expired of Object.keys(state.searchFeedback).slice(0,-40)){delete state.searchFeedback[expired];SEARCH_RESULT_CACHE.delete(expired)}
  try{localStorage.setItem(SEARCH_FEEDBACK_KEY,JSON.stringify(state.searchFeedback))}catch{}
}
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
