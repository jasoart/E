"use strict";

function getAudioElement(){
  if(state.audioElement)return state.audioElement;const audio=document.createElement("audio");audio.id="sharedPronunciationPlayer";audio.preload="none";audio.hidden=true;audio.setAttribute("playsinline","");audio.setAttribute("webkit-playsinline","");document.body.appendChild(audio);state.audioElement=audio;return audio;
}
function stopPronunciation(){
  state.audioSession++;const audio=state.currentAudio;state.currentAudio=null;if(audio){audio.onerror=null;audio.onended=null;audio.pause();try{audio.currentTime=0}catch{}}
  if("speechSynthesis" in window)window.speechSynthesis.cancel();
  document.querySelectorAll(".speaking").forEach(button=>button.classList.remove("speaking"));
}
function playBrowserVoice(text,button,notice=true){
  stopPronunciation();
  if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){showToast("此瀏覽器不支援語音發音");return}
  const utterance=new SpeechSynthesisUtterance(String(text||"").replace(/[“”]/g,'"'));utterance.lang="en-US";utterance.rate=.82;
  const voices=window.speechSynthesis.getVoices(),english=voice=>String(voice.lang||"").replace("_","-").toLowerCase();const voice=voices.find(v=>v.localService&&english(v)==="en-us")||voices.find(v=>english(v)==="en-us")||voices.find(v=>english(v).startsWith("en"));if(voice)utterance.voice=voice;
  if(button){button.classList.add("speaking");utterance.onend=utterance.onerror=()=>button.classList.remove("speaking")}
  if(window.speechSynthesis.paused)window.speechSynthesis.resume();window.speechSynthesis.speak(utterance);if(notice)showToast("真人音檔不可用，已切換裝置英文語音");
}
function playAudioCandidates(candidates,fallbackText,button,notice=true){
  const playable=rankAudioCandidates(candidates);if(!playable.length){playBrowserVoice(fallbackText,button,notice);return}
  stopPronunciation();const audio=getAudioElement(),session=state.audioSession;state.currentAudio=audio;if(button)button.classList.add("speaking");let position=0,attempt=0;
  const finish=()=>{if(session!==state.audioSession)return;state.currentAudio=null;audio.onerror=null;audio.onended=null;if(button&&button.isConnected)button.classList.remove("speaking")};
  const tryNext=()=>{if(session!==state.audioSession)return;if(position>=playable.length){finish();playBrowserVoice(fallbackText,button,notice);return}const candidate=playable[position++],token=++attempt;let failed=false;const fail=()=>{if(failed||token!==attempt||session!==state.audioSession)return;failed=true;tryNext()};audio.onerror=fail;audio.onended=finish;audio.src=candidate.url;audio.load();const promise=audio.play();if(promise&&typeof promise.catch==="function")promise.catch(fail)};
  tryNext();
}
function speakWord(word,button){
  const lookup=apiLookupWord(word).toLowerCase(),key=lookup+"|"+normalizeCeecWord(word),online=state.onlineCache.get(key),dictionary=online&&online.dictionary;
  if(dictionary&&dictionary.audioCandidates&&dictionary.audioCandidates.length){playAudioCandidates(dictionary.audioCandidates,spokenForm(word),button,true);return}
  playBrowserVoice(spokenForm(word),button,false);
}
