"use strict";

// Media is requested only after an explicit click. Every audio URL belongs to Google.
const pronunciationIdleMessage = "Google 音檔：單字與例句皆按下播放後連線載入";
let pronunciationStatus = Object.freeze({ state: "idle", source: "none", message: pronunciationIdleMessage });
let pronunciationCancelPlayback = null;
let pronunciationPreferences = readPronunciationPreferences();
function sanitizePronunciationPreferences(value = {}) {
  return Object.freeze({ source: "google", accent: ["en-US", "en-GB"].includes(value.accent) ? value.accent : "en-US",
    rate: [0.7, 0.82, 1].includes(Number(value.rate)) ? Number(value.rate) : 0.82 });
}
function readPronunciationPreferences() {
  try { return sanitizePronunciationPreferences(JSON.parse(window.localStorage?.getItem(PRONUNCIATION_CONFIG.preferencesKey) || "{}") || {}); }
  catch { return sanitizePronunciationPreferences(); }
}
function getPronunciationPreferences() { return pronunciationPreferences; }
function setPronunciationPreferences(patch = {}) {
  pronunciationPreferences = sanitizePronunciationPreferences({ ...pronunciationPreferences, ...patch });
  try { window.localStorage?.setItem(PRONUNCIATION_CONFIG.preferencesKey, JSON.stringify(pronunciationPreferences)); } catch {}
  stopPronunciation();
  if (typeof CustomEvent === "function") document.dispatchEvent(new CustomEvent("pronunciationpreferenceschange", { detail: pronunciationPreferences }));
  return pronunciationPreferences;
}
function localVoiceStatus() { return pronunciationStatus; }
function announceLocalVoiceStatus(status) {
  pronunciationStatus = Object.freeze({ source: "none", sourceUrl: "", licenseName: "", licenseUrl: "", attribution: "", ...status });
  if (typeof CustomEvent === "function") document.dispatchEvent(new CustomEvent("localvoicestatus", { detail: pronunciationStatus }));
}
function markPronunciationButton(button, active) {
  if (!button) return;
  button.classList.toggle("speaking", active);
  button.setAttribute("aria-pressed", String(active));
}
function pronunciationCancelled() { const error = new Error("Pronunciation cancelled"); error.code = "cancelled"; return error; }
function stopPronunciation() {
  state.audioSession += 1;
  pronunciationCancelPlayback?.();
  pronunciationCancelPlayback = null;
  const audio = state.currentAudio;
  if (audio) { audio.onplaying = audio.onended = audio.onerror = null; try { audio.pause(); audio.removeAttribute("src"); audio.load(); } catch {} }
  state.currentAudio = null;
  document.querySelectorAll(".speaking").forEach(button => markPronunciationButton(button, false));
  announceLocalVoiceStatus({ state: "idle", message: pronunciationIdleMessage });
}
function safePronunciationSourceUrl(value) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : ""; }
  catch { return ""; }
}
function safeDictionaryAudioUrl(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:" || url.username || url.password || url.port) return "";
    if (url.hostname === "ssl.gstatic.com" && /^\/dictionary\/static\/sounds\/oxford\/[a-z'-]+--_us_1\.mp3$/.test(url.pathname)) return url.href;
    if (url.hostname === "translate.google.com" && url.pathname === "/translate_tts" && url.searchParams.get("client") === "tw-ob" && ["en-US", "en-GB"].includes(url.searchParams.get("tl"))) return url.href;
    return "";
  } catch { return ""; }
}
function dictionaryLookupKey(text) {
  const word = text.normalize("NFKC").toLowerCase().replace(/’/g, "'");
  return word.length <= 64 && /^[a-z]+(?:[-'][a-z]+)*$/.test(word) ? word : "";
}
function gstaticPronunciationRecording(word) {
  if (!word || dictionaryLookupKey(word) !== word) return null;
  const audioUrl = PRONUNCIATION_CONFIG.gstaticEndpoint + encodeURIComponent(word) + "--_us_1.mp3";
  return Object.freeze({ audioUrl, sourceUrl: audioUrl, source: "gstatic", label: "Google 靜態字典音檔 · 美式", accent: "美式", accentCode: "en-US" });
}
function googlePronunciationRecording(text) {
  const url = new URL(PRONUNCIATION_CONFIG.googleTtsEndpoint);
  for (const [key, value] of Object.entries({ ie: "UTF-8", client: "tw-ob", tl: pronunciationPreferences.accent, q: text })) url.searchParams.set(key, value);
  return { audioUrl: url.href, sourceUrl: url.href, source: "google", label: `Google 語音音檔 · ${pronunciationPreferences.accent === "en-GB" ? "英式" : "美式"}`, accentCode: pronunciationPreferences.accent };
}
function pronunciationChunks(text, limit = 180) {
  // Google TTS accepts short inputs. Split at word boundaries without dropping text.
  const chunks = []; let chunk = "";
  for (const token of text.split(/\s+/)) {
    if (token.length > limit) return [];
    if (chunk && chunk.length + token.length + 1 > limit) { chunks.push(chunk); chunk = token; }
    else chunk += (chunk ? " " : "") + token;
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}
function playDictionaryPronunciation(recording, button, session) {
  if (session !== state.audioSession) return Promise.reject(pronunciationCancelled());
  const audioUrl = safeDictionaryAudioUrl(recording?.audioUrl);
  if (!audioUrl) return Promise.reject(new Error("Unapproved audio source"));
  return new Promise((resolve, reject) => {
    const audio = new window.Audio(); let finished = false, started = false, endTimer;
    const finish = error => {
      if (finished) return; finished = true;
      clearTimeout(startTimer); clearTimeout(endTimer);
      audio.onplaying = audio.onended = audio.onerror = null;
      if (pronunciationCancelPlayback === cancel) pronunciationCancelPlayback = null;
      if (state.currentAudio === audio) state.currentAudio = null;
      try { audio.pause(); audio.removeAttribute("src"); audio.load(); } catch {}
      if (session === state.audioSession) markPronunciationButton(button, false);
      if (error) reject(error); else resolve();
    };
    const start = () => {
      if (finished || started) return;
      if (session !== state.audioSession) { finish(pronunciationCancelled()); return; }
      started = true; clearTimeout(startTimer); markPronunciationButton(button, true);
      announceLocalVoiceStatus({ state: "playing", ...recording, message: recording.label });
      endTimer = setTimeout(() => finish(new Error("Google audio stalled")), PRONUNCIATION_CONFIG.audioEndTimeoutMs);
    };
    const cancel = () => finish(pronunciationCancelled());
    const startTimer = setTimeout(() => finish(new Error("Google audio timed out")), PRONUNCIATION_CONFIG.audioStartTimeoutMs);
    pronunciationCancelPlayback = cancel; state.currentAudio = audio;
    audio.preload = "none"; audio.playbackRate = pronunciationPreferences.rate; audio.preservesPitch = true;
    audio.onplaying = start; audio.onended = () => finish(null); audio.onerror = () => finish(new Error("Google audio unavailable"));
    announceLocalVoiceStatus({ state: "loading", ...recording, message: `正在載入 ${recording.label}` });
    try { audio.src = audioUrl; Promise.resolve(audio.play()).then(start, finish); } catch (error) { finish(error); }
  });
}
function normalizedPronunciationText(value) { return String(value || "").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim(); }
function validPronunciationText(text) {
  if (text && text.length <= PRONUNCIATION_CONFIG.maxTextLength) return true;
  showToast(`每次請播放 1–${PRONUNCIATION_CONFIG.maxTextLength} 字元的單字或例句`); return false;
}
async function playGooglePronunciation(value, button, singleWord = false) {
  const text = normalizedPronunciationText(value);
  if (!validPronunciationText(text)) return;
  stopPronunciation(); const session = state.audioSession;
  const chunks = pronunciationChunks(text);
  if (typeof window.Audio !== "function" || !chunks.length) {
    const message = "此瀏覽器無法播放 Google 音檔，請換用支援音訊的瀏覽器";
    announceLocalVoiceStatus({ state: "unavailable", message }); showToast(message); return;
  }
  try {
    const key = singleWord && dictionaryLookupKey(text);
    if (key && pronunciationPreferences.accent === "en-US") {
      try { await playDictionaryPronunciation(gstaticPronunciationRecording(key), button, session); }
      catch (error) { if (error?.code === "cancelled" || session !== state.audioSession) return; await playDictionaryPronunciation(googlePronunciationRecording(text), button, session); }
    } else {
      for (const chunk of chunks) {
        if (session !== state.audioSession) return;
        await playDictionaryPronunciation(googlePronunciationRecording(chunk), button, session);
      }
    }
    if (session === state.audioSession) announceLocalVoiceStatus({ ...pronunciationStatus, state: "ready", message: `${pronunciationStatus.label} · 播放完畢` });
  } catch (error) {
    if (error?.code === "cancelled" || session !== state.audioSession) return;
    markPronunciationButton(button, false);
    const message = "Google 音檔暫時無法播放，請檢查網路後再按播放";
    announceLocalVoiceStatus({ state: "error", source: "google", message }); showToast(message);
  }
}
function speakWord(word, button) { return playGooglePronunciation(spokenForm(word), button, true); }
function speakPronunciation(text, button) { return playGooglePronunciation(text, button); }
function playBrowserVoice(text, button) { return speakPronunciation(text, button); }
function speakSentence(text, button) { return speakPronunciation(text, button); }
