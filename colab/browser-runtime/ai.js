"use strict";
// Legacy names are retained as local algorithm wrappers; no model is imported.
function disableAiMode(){state.aiMode=false;}
function aiEntryText(entry){const study=getBuiltinStudy(entry);return [entry.word,entry.meaning,study?.plainMeaning,study?.ankiMeaning,...(study?.collocations||[]).flat()].filter(Boolean).join(" ");}
async function runAiSearch(){state.aiMode=false;state.query=searchInput.value;applyFilters();}
function setAiStatus(){}
function syncAiButton(){}
