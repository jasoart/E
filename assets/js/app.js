"use strict";

wordList.addEventListener("click",event=>{const row=event.target.closest(".row");if(row)selectEntry(Number(row.dataset.index),true)});
pageButtons.addEventListener("click",event=>{const button=event.target.closest(".page-button[data-page]");if(button&&!button.disabled)goToPage(button.dataset.page)});
let searchTimer,composing=false;
function flushSearch(){clearTimeout(searchTimer);searchTimer=null;state.query=searchInput.value;applyFilters();renderSuggestions();}
searchInput.addEventListener("compositionstart",()=>{composing=true;clearTimeout(searchTimer);});
searchInput.addEventListener("compositionend",()=>{composing=false;flushSearch();});
searchInput.addEventListener("input",()=>{state.query=searchInput.value;clearSearch.hidden=!state.query;searchKey.hidden=!!state.query;clearTimeout(searchTimer);if(!composing)searchTimer=setTimeout(flushSearch,90);});
searchInput.addEventListener("focus",renderSuggestions);
searchInput.addEventListener("keydown",event=>{if(event.isComposing)return;if(["Enter","ArrowDown","ArrowUp"].includes(event.key)){if(searchTimer)flushSearch();}if(event.key==="ArrowDown"){event.preventDefault();setSuggestionIndex(state.suggestionIndex+1)}else if(event.key==="ArrowUp"){event.preventDefault();setSuggestionIndex(state.suggestionIndex-1)}else if(event.key==="Enter"){const items=suggestionItems();if(state.suggestionIndex>=0&&items[state.suggestionIndex]){event.preventDefault();acceptSuggestion(items[state.suggestionIndex])}else if(state.query){saveRecentSearch(state.query);hideSuggestions()}}else if(event.key==="Escape")hideSuggestions()});
searchSuggestions.addEventListener("click",event=>acceptSuggestion(event.target.closest(".suggestion")));
document.addEventListener("click",event=>{if(!event.target.closest(".search-wrap"))hideSuggestions()});
clearSearch.addEventListener("click",()=>{searchInput.value="";state.query="";clearSearch.hidden=true;searchKey.hidden=false;applyFilters();searchInput.focus();renderSuggestions()});
byId("allTab").addEventListener("click",()=>setListMode("all"));
if(byId("notebookTab"))byId("notebookTab").addEventListener("click",()=>setListMode("notebook"));
byId("examTab").addEventListener("click",()=>setListMode("exam"));
byId("collocationTab").addEventListener("click",()=>setListMode("collocations"));
byId("reviewTab").addEventListener("click",()=>setListMode("review"));
byId("favoriteTab").addEventListener("click",()=>setListMode("favorites"));
byId("quickSearches").addEventListener("click",event=>{const button=event.target.closest(".query-chip");if(!button)return;searchInput.value=button.dataset.query||"";state.query=searchInput.value;clearSearch.hidden=!state.query;searchKey.hidden=!!state.query;applyFilters();saveRecentSearch(state.query);renderSuggestions();searchInput.focus()});
document.addEventListener("keydown",event=>{if((event.key==="k"||event.key==="K")&&(event.metaKey||event.ctrlKey)){event.preventDefault();searchInput.focus();renderSuggestions()}if(event.key==="/"&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){event.preventDefault();searchInput.focus();renderSuggestions()}if(event.key==="Escape"&&document.activeElement===searchInput){searchInput.value="";state.query="";applyFilters();searchInput.blur()}});
byId("commandButton").addEventListener("click",()=>{searchInput.focus();renderSuggestions()});
if("speechSynthesis" in window)window.speechSynthesis.getVoices();

const officialWordCount=typeof GSAT_OFFICIAL_VOCABULARY_COUNT==="number"?GSAT_OFFICIAL_VOCABULARY_COUNT:VOCABULARY.length;
buildLevelFilters();buildCategoryFilters();buildExamYearFilters();byId("totalCount").textContent=officialWordCount.toLocaleString();byId("collocationCount").textContent=GSAT_COLLOCATION_GUIDE.length.toLocaleString();byId("collocationTabCount").textContent=GSAT_COLLOCATION_GUIDE.length.toLocaleString();const examCount=GSAT_EXAM_COLLOCATIONS.length;byId("examPointCount").textContent=examCount.toLocaleString();byId("examTabCount").textContent=examCount.toLocaleString();updateReviewCount();
state.selectedIndex=Math.max(0,VOCABULARY.findIndex(entry=>entry.word==="challenge"));
applyFilters();selectEntry(state.selectedIndex);setupDaily();

setupFavoriteBackup();setTimeout(warmSearchIndex,100);
const builtinStats=builtinStudyStats();
const notebookCounts=typeof notebookStats==="function"?notebookStats():{words:0,examples:0,collocations:0,supplemental:Math.max(0,VOCABULARY.length-officialWordCount)};
for(const [id,value] of [["builtinWordCount",builtinStats.words],["builtinExampleCount",builtinStats.examples],["builtinCollocationCount",builtinStats.collocations]])if(byId(id))byId(id).textContent=value.toLocaleString();
for(const [id,value] of [["supplementalCount",notebookCounts.supplemental],["notebookWordCount",notebookCounts.words],["notebookTabCount",notebookCounts.listedWords??notebookCounts.words],["notebookCollocationCount",notebookCounts.collocations]])if(byId(id))byId(id).textContent=Number(value||0).toLocaleString();
if(byId("headerDataCount"))byId("headerDataCount").textContent=`${officialWordCount.toLocaleString()} 官方詞條 · ${notebookCounts.supplemental.toLocaleString()} 補充詞 · ${builtinStats.examples.toLocaleString()} 內建例句 · ${builtinStats.collocations.toLocaleString()} 內建搭配`;
document.addEventListener("localvoicestatus",event=>{
  const status=event.detail,host=byId("audioStatus"),sourceLink=byId("audioSourceLink");
  if(host){host.textContent=status.message;host.dataset.source=status.source||"none";}
  if(sourceLink){
    const url=status.source==="dictionary"?safePronunciationSourceUrl(status.sourceUrl):"";
    sourceLink.hidden=!url;
    if(url){sourceLink.href=url;sourceLink.textContent=`錄音出處${status.licenseName?" · "+status.licenseName:""}`;}
    else sourceLink.removeAttribute("href");
  }
});
byId("bootStatus").hidden=true;

setupDiagnostics();
