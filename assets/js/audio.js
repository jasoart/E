"use strict";

// Only a playback click may contact the public dictionary. Sentences stay on device.
const dictionaryRecordingCache = new Map();
const pronunciationIdleMessage = "單字：公開字典錄音，無法取得時使用裝置英文語音；例句：裝置英文語音";
let pronunciationStatus = Object.freeze({ state: "idle", source: "none", message: pronunciationIdleMessage });
let pronunciationLookupController = null;
let pronunciationCancelPlayback = null;
let pronunciationCancelVoiceWait = null;
let pronunciationSpeechTimer = null;

function localVoiceStatus() { return pronunciationStatus; }
function announceLocalVoiceStatus(status) {
  pronunciationStatus = Object.freeze({ source: "none", sourceUrl: "", licenseName: "", licenseUrl: "", ...status });
  if (typeof CustomEvent === "function") document.dispatchEvent(new CustomEvent("localvoicestatus", { detail: pronunciationStatus }));
}
function markPronunciationButton(button, active) {
  if (!button) return;
  button.classList.toggle("speaking", active);
  button.setAttribute("aria-pressed", String(active));
}
function pronunciationCancelled() {
  const error = new Error("Pronunciation cancelled");
  error.code = "cancelled";
  return error;
}
function stopPronunciation() {
  state.audioSession += 1;
  pronunciationLookupController?.abort();
  pronunciationLookupController = null;
  pronunciationCancelPlayback?.();
  pronunciationCancelPlayback = null;
  pronunciationCancelVoiceWait?.();
  pronunciationCancelVoiceWait = null;
  clearTimeout(pronunciationSpeechTimer);
  pronunciationSpeechTimer = null;
  const audio = state.currentAudio;
  if (audio) {
    audio.onplaying = audio.onended = audio.onerror = null;
    try { audio.pause(); audio.removeAttribute("src"); audio.load(); } catch {}
  }
  state.currentAudio = null;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  document.querySelectorAll(".speaking").forEach(button => markPronunciationButton(button, false));
  announceLocalVoiceStatus({ state: "idle", message: pronunciationIdleMessage });
}
function localEnglishVoice() {
  try {
    const normalize = voice => String(voice.lang || "").replace(/_/g, "-").toLowerCase();
    const voices = window.speechSynthesis.getVoices().filter(voice => voice.localService === true && /^en(?:-|$)/.test(normalize(voice)));
    return voices.find(voice => normalize(voice) === "en-us") || voices[0] || null;
  } catch { return null; }
}
function waitForLocalEnglishVoice() {
  const voice = localEnglishVoice();
  if (voice) return Promise.resolve(voice);
  return new Promise(resolve => {
    const synthesis = window.speechSynthesis;
    let finished = false;
    const finish = result => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      synthesis.removeEventListener?.("voiceschanged", changed);
      if (pronunciationCancelVoiceWait === cancel) pronunciationCancelVoiceWait = null;
      resolve(result);
    };
    const changed = () => { const available = localEnglishVoice(); if (available) finish(available); };
    const cancel = () => finish(null);
    const timer = setTimeout(() => finish(localEnglishVoice()), PRONUNCIATION_CONFIG.voiceWaitMs);
    pronunciationCancelVoiceWait = cancel;
    synthesis.addEventListener?.("voiceschanged", changed);
    changed();
  });
}
async function playDevicePronunciation(text, button, session, reason = "") {
  if (session !== state.audioSession) return;
  markPronunciationButton(button, false);
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    const message = `${reason ? reason + "；" : ""}此瀏覽器不支援裝置語音，可開啟下方權威字典查詢發音`;
    announceLocalVoiceStatus({ state: "unavailable", message });
    showToast(message);
    return;
  }
  announceLocalVoiceStatus({ state: "loading", source: "device", message: `${reason ? reason + "；" : ""}正在準備裝置本機英文語音` });
  const voice = await waitForLocalEnglishVoice();
  if (session !== state.audioSession) return;
  if (!voice) {
    const message = `${reason ? reason + "；" : ""}尚未找到本機英文聲線，請在裝置設定下載英文語音，或開啟下方權威字典`;
    announceLocalVoiceStatus({ state: "unavailable", message });
    showToast(message);
    return;
  }
  const utterance = new window.SpeechSynthesisUtterance(text);
  utterance.lang = voice.lang;
  utterance.voice = voice;
  utterance.rate = 0.82;
  const sourceLabel = `裝置本機英文語音 · ${voice.name || voice.lang}`;
  const finish = error => {
    if (session !== state.audioSession) return;
    clearTimeout(pronunciationSpeechTimer);
    pronunciationSpeechTimer = null;
    markPronunciationButton(button, false);
    const failed = error && error.error !== "canceled" && error.error !== "interrupted";
    announceLocalVoiceStatus({ state: failed ? "error" : "ready", source: "device", message: failed ? `${sourceLabel} · 播放失敗，請重試或查詢權威字典` : `${sourceLabel} · 播放完畢` });
    if (failed) showToast("裝置英文語音播放失敗，請重試或在裝置設定檢查英文聲線");
  };
  utterance.onend = () => finish(null);
  utterance.onerror = finish;
  try {
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    markPronunciationButton(button, true);
    announceLocalVoiceStatus({ state: "playing", source: "device", message: `${reason ? reason + "；" : ""}${sourceLabel}` });
    pronunciationSpeechTimer = setTimeout(() => {
      if (session !== state.audioSession) return;
      finish({ error: "timeout" });
      // Prevent a late cancel event from overwriting the timeout explanation.
      utterance.onend = utterance.onerror = null;
      window.speechSynthesis.cancel();
    }, Math.max(PRONUNCIATION_CONFIG.speechTimeoutMs, text.length * 160));
    window.speechSynthesis.speak(utterance);
  } catch { finish({ error: "synthesis-failed" }); }
}
function safePronunciationSourceUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
}
function safeDictionaryAudioUrl(value) {
  try {
    const url = new URL(String(value || "").replace(/^\/\//, "https://"));
    return url.protocol === "https:" && !url.username && !url.password && !url.port && PRONUNCIATION_CONFIG.audioHosts.includes(url.hostname) ? url.href : "";
  } catch { return ""; }
}
function dictionaryLookupKey(text) {
  const word = text.normalize("NFKC").toLowerCase().replace(/’/g, "'");
  return word.length <= 64 && /^[a-z]+(?:[-'][a-z]+)*$/.test(word) ? word : "";
}
function selectDictionaryRecording(entries, word) {
  if (!Array.isArray(entries)) return null;
  const recordings = [];
  for (const entry of entries) {
    if (String(entry?.word || "").toLowerCase() !== word || !Array.isArray(entry.phonetics)) continue;
    for (const phonetic of entry.phonetics) {
      const audioUrl = safeDictionaryAudioUrl(phonetic?.audio);
      if (!audioUrl) continue;
      // A lexical entry's source/license does not establish the recording's license.
      const sourceUrl = safePronunciationSourceUrl(phonetic.sourceUrl) || audioUrl;
      const license = phonetic.license || {};
      const accent = /-us\.(?:mp3|ogg|wav)(?:$|\?)/i.test(audioUrl) ? "美式" : /-uk\.(?:mp3|ogg|wav)(?:$|\?)/i.test(audioUrl) ? "英式" : "";
      recordings.push(Object.freeze({ audioUrl, sourceUrl, licenseName: String(license.name || ""), licenseUrl: safePronunciationSourceUrl(license.url), source: "dictionary", label: `${new URL(audioUrl).hostname === "upload.wikimedia.org" ? "Wikimedia 公開錄音" : "Free Dictionary API 公開錄音"}${accent ? " · " + accent : ""}`, accent }));
    }
  }
  recordings.sort((a, b) => (a.accent === "美式" ? 0 : a.accent === "英式" ? 1 : 2) - (b.accent === "美式" ? 0 : b.accent === "英式" ? 1 : 2));
  return recordings[0] || null;
}
async function lookupDictionaryRecording(word, session) {
  if (dictionaryRecordingCache.has(word)) return dictionaryRecordingCache.get(word);
  const controller = new AbortController();
  pronunciationLookupController = controller;
  let timer, abortListener;
  try {
    const recording = await Promise.race([
      (async () => {
        const response = await fetch(PRONUNCIATION_CONFIG.dictionaryEndpoint + encodeURIComponent(word), { signal: controller.signal, credentials: "omit", redirect: "error", referrerPolicy: "no-referrer" });
        if (!response.ok) throw new Error("Dictionary lookup unavailable");
        return selectDictionaryRecording(await response.json(), word);
      })(),
      new Promise((_, reject) => {
        abortListener = () => reject(session === state.audioSession ? new Error("Dictionary lookup timed out") : pronunciationCancelled());
        controller.signal.addEventListener("abort", abortListener, { once: true });
        timer = setTimeout(() => controller.abort(), PRONUNCIATION_CONFIG.lookupTimeoutMs);
      })
    ]);
    if (session !== state.audioSession) throw pronunciationCancelled();
    if (recording) {
      if (dictionaryRecordingCache.size >= PRONUNCIATION_CONFIG.cacheSize) dictionaryRecordingCache.delete(dictionaryRecordingCache.keys().next().value);
      dictionaryRecordingCache.set(word, recording);
    }
    return recording;
  } finally {
    clearTimeout(timer);
    if (abortListener) controller.signal.removeEventListener("abort", abortListener);
    if (pronunciationLookupController === controller) pronunciationLookupController = null;
  }
}
function playDictionaryPronunciation(recording, button, session) {
  return new Promise((resolve, reject) => {
    const audio = new window.Audio();
    let finished = false, started = false;
    let endTimer;
    const finish = error => {
      if (finished) return;
      finished = true;
      clearTimeout(startTimer);
      clearTimeout(endTimer);
      audio.onplaying = audio.onended = audio.onerror = null;
      if (pronunciationCancelPlayback === cancel) pronunciationCancelPlayback = null;
      if (state.currentAudio === audio) state.currentAudio = null;
      try { audio.pause(); audio.removeAttribute("src"); audio.load(); } catch {}
      if (session === state.audioSession) markPronunciationButton(button, false);
      if (error) reject(error);
      else {
        if (session === state.audioSession) announceLocalVoiceStatus({ state: "ready", ...recording, message: `${recording.label} · 播放完畢` });
        resolve();
      }
    };
    const start = () => {
      if (finished || started) return;
      if (session !== state.audioSession) { finish(pronunciationCancelled()); return; }
      started = true;
      clearTimeout(startTimer);
      markPronunciationButton(button, true);
      announceLocalVoiceStatus({ state: "playing", ...recording, message: recording.label });
      endTimer = setTimeout(() => finish(new Error("Dictionary recording stalled")), PRONUNCIATION_CONFIG.audioEndTimeoutMs);
    };
    const cancel = () => finish(pronunciationCancelled());
    const startTimer = setTimeout(() => finish(new Error("Dictionary playback timed out")), PRONUNCIATION_CONFIG.audioStartTimeoutMs);
    pronunciationCancelPlayback = cancel;
    state.currentAudio = audio;
    audio.preload = "none";
    audio.onplaying = start;
    audio.onended = () => finish(null);
    audio.onerror = () => finish(new Error("Dictionary recording unavailable"));
    announceLocalVoiceStatus({ state: "loading", ...recording, message: `正在載入 ${recording.label}` });
    try {
      audio.src = recording.audioUrl;
      Promise.resolve(audio.play()).then(start, error => finish(error));
    } catch (error) { finish(error); }
  });
}
function normalizedPronunciationText(value) {
  return String(value || "").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
}
function validPronunciationText(text) {
  if (text && text.length <= PRONUNCIATION_CONFIG.maxTextLength) return true;
  showToast(`每次請播放 1–${PRONUNCIATION_CONFIG.maxTextLength} 字元的單字或例句`);
  return false;
}
async function speakWord(word, button) {
  const text = normalizedPronunciationText(spokenForm(word));
  if (!validPronunciationText(text)) return;
  stopPronunciation();
  const session = state.audioSession;
  const key = dictionaryLookupKey(text);
  if (!key || typeof fetch !== "function" || typeof window.Audio !== "function" || typeof AbortController !== "function") {
    await playDevicePronunciation(text, button, session);
    return;
  }
  markPronunciationButton(button, true);
  announceLocalVoiceStatus({ state: "loading", message: "正在查詢公開字典錄音（免帳號、免 API 金鑰）" });
  try {
    const recording = await lookupDictionaryRecording(key, session);
    if (session !== state.audioSession) return;
    if (!recording) { await playDevicePronunciation(text, button, session, "字典未提供可用錄音"); return; }
    await playDictionaryPronunciation(recording, button, session);
  } catch (error) {
    if (session !== state.audioSession || error?.code === "cancelled") return;
    await playDevicePronunciation(text, button, session, "字典錄音暫時無法播放");
  }
}
async function speakPronunciation(value, button) {
  const text = normalizedPronunciationText(value);
  if (!validPronunciationText(text)) return;
  stopPronunciation();
  await playDevicePronunciation(text, button, state.audioSession);
}
function playBrowserVoice(text, button) { return speakPronunciation(text, button); }
function speakSentence(text, button) { return speakPronunciation(text, button); }
