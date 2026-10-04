"use strict";
// Compatibility entry point: built-in learning never contacts a remote service.
async function loadOnlineData(entry,index){if(state.selectedIndex===index)showExampleResult(builtinExampleResult(entry),entry,index);}
