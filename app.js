"use strict";

wordList.addEventListener("click",event=>{const row=event.target.closest(".row");if(row)selectEntry(Number(row.dataset.index),true)});
pageButtons.addEventListener("click",event=>{const button=event.target.closest(".page-button[data-page]");if(button&&!button.disabled)goToPage(button.dataset.page)});
aiSearchButton.addEventListener("click",runAiSearch);
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
byId("examTab").addEventListener("click",()=>setListMode("exam"));
byId("collocationTab").addEventListener("click",()=>setListMode("collocations"));
byId("reviewTab").addEventListener("click",()=>setListMode("review"));
byId("favoriteTab").addEventListener("click",()=>setListMode("favorites"));
byId("quickSearches").addEventListener("click",event=>{const button=event.target.closest(".query-chip");if(!button)return;searchInput.value=button.dataset.query||"";state.query=searchInput.value;clearSearch.hidden=!state.query;searchKey.hidden=!!state.query;applyFilters();saveRecentSearch(state.query);renderSuggestions();searchInput.focus()});
document.addEventListener("keydown",event=>{if((event.key==="k"||event.key==="K")&&(event.metaKey||event.ctrlKey)){event.preventDefault();searchInput.focus();renderSuggestions()}if(event.key==="/"&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){event.preventDefault();searchInput.focus();renderSuggestions()}if(event.key==="Escape"&&document.activeElement===searchInput){searchInput.value="";state.query="";applyFilters();searchInput.blur()}});
byId("commandButton").addEventListener("click",()=>{searchInput.focus();renderSuggestions()});
if("speechSynthesis" in window)window.speechSynthesis.getVoices();

buildLevelFilters();buildCategoryFilters();buildExamYearFilters();byId("totalCount").textContent=VOCABULARY.length.toLocaleString();byId("collocationCount").textContent=GSAT_COLLOCATION_GUIDE.length.toLocaleString();byId("collocationTabCount").textContent=GSAT_COLLOCATION_GUIDE.length.toLocaleString();const examCount=GSAT_EXAM_COLLOCATIONS.length;byId("examPointCount").textContent=examCount.toLocaleString();byId("examTabCount").textContent=examCount.toLocaleString();updateReviewCount();
state.selectedIndex=Math.max(0,VOCABULARY.findIndex(entry=>entry.word==="challenge"));
applyFilters();selectEntry(state.selectedIndex);setupDaily();

setupFavoriteBackup();setTimeout(warmSearchIndex,100);
byId("bootStatus").hidden=true;
