"use strict";

// Only a playback click may contact recording providers. Sentences stay on device.
const dictionaryRecordingCache = new Map();
const commonsRecordingCache = new Map();
const pronunciationIdleMessage = "單字：依所選來源取得公開錄音，無法取得時使用裝置英文語音；例句：裝置英文語音";
let pronunciationStatus = Object.freeze({ state: "idle", source: "none", message: pronunciationIdleMessage });
let pronunciationLookupController = null;
let pronunciationCancelPlayback = null;
let pronunciationCancelVoiceWait = null;
let pronunciationSpeechTimer = null;
let pronunciationPreferences = readPronunciationPreferences();

function sanitizePronunciationPreferences(value = {}) {
  return Object.freeze({
    source: ["auto", "gstatic", "dictionary", "commons", "device"].includes(value.source) ? value.source : "auto",
    accent: ["en-US", "en-GB"].includes(value.accent) ? value.accent : "en-US",
    rate: [0.7, 0.82, 1].includes(Number(value.rate)) ? Number(value.rate) : 0.82
  });
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
    const requested = pronunciationPreferences.accent.toLowerCase();
    return voices.find(voice => normalize(voice) === requested && voice.default) || voices.find(voice => normalize(voice) === requested) || voices.find(voice => voice.default) || voices[0] || null;
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
  utterance.rate = pronunciationPreferences.rate;
  const actualLanguage = String(voice.lang || "").replace(/_/g, "-");
  const requestedAccentMissing = actualLanguage.toLowerCase() !== pronunciationPreferences.accent.toLowerCase();
  const sourceLabel = `裝置本機英文語音 · ${voice.name || actualLanguage}${requestedAccentMissing ? `（未安裝所選口音，改用 ${actualLanguage}）` : ""}`;
  let finished = false;
  const finish = error => {
    if (finished || session !== state.audioSession) return;
    finished = true;
    utterance.onend = utterance.onerror = null;
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
// The user-selected static US filename pattern is a candidate, not a coverage guarantee.
// No metadata fetch, guessed regional filenames, or inferred recording license.
function gstaticPronunciationRecording(word) {
  if (!word || dictionaryLookupKey(word) !== word) return null;
  const audioUrl = PRONUNCIATION_CONFIG.gstaticEndpoint + encodeURIComponent(word) + "--_us_1.mp3";
  return Object.freeze({ audioUrl, sourceUrl: audioUrl, source: "gstatic",
    label: "Google 靜態字典音檔 · 美式", accent: "美式", accentCode: "en-US",
    licenseName: "", licenseUrl: "", attribution: "" });
}
function orderPronunciationRecordings(recordings) {
  const preferred = pronunciationPreferences.accent;
  const priority = item => item.accentCode === preferred ? 0 : item.accentCode ? 1 : 2;
  return [...new Map(recordings.map(item => [item.audioUrl, item])).values()].sort((a, b) => priority(a) - priority(b));
}
function recordingAccent(url) {
  const path = new URL(url).pathname;
  if (/(?:-us\.(?:mp3|ogg|oga|wav)$|\/En-us-)/i.test(path)) return { accent: "美式", accentCode: "en-US" };
  if (/(?:-uk\.(?:mp3|ogg|oga|wav)$|\/En-uk-)/i.test(path)) return { accent: "英式", accentCode: "en-GB" };
  return { accent: "", accentCode: "" };
}
function selectDictionaryRecordings(entries, word) {
  if (!Array.isArray(entries)) return [];
  const recordings = [];
  for (const entry of entries) {
    if (String(entry?.word || "").toLowerCase() !== word || !Array.isArray(entry.phonetics)) continue;
    for (const phonetic of entry.phonetics) {
      const audioUrl = safeDictionaryAudioUrl(phonetic?.audio);
      if (!audioUrl) continue;
      // A lexical entry's source/license does not establish the recording's license.
      const sourceUrl = safePronunciationSourceUrl(phonetic.sourceUrl) || audioUrl;
      const license = phonetic.license || {};
      const accent = recordingAccent(audioUrl);
      recordings.push(Object.freeze({ audioUrl, sourceUrl, licenseName: String(license.name || ""), licenseUrl: safePronunciationSourceUrl(license.url), source: "dictionary", label: `Free Dictionary API${new URL(audioUrl).hostname === "upload.wikimedia.org" ? " · Wikimedia 錄音" : " 公開錄音"}${accent.accent ? " · " + accent.accent : " · 口音未標示"}`, ...accent }));
    }
  }
  return orderPronunciationRecordings(recordings);
}
function selectDictionaryRecording(entries, word) { return selectDictionaryRecordings(entries, word)[0] || null; }
function commonsRecordingTitles(word) {
  // These are bounded metadata candidates, never fabricated audio URLs.
  if (dictionaryLookupKey(word) !== word) return [];
  return ["ogg", "mp3"].flatMap(extension => ["En-us-", "En-uk-", "En-"].map(prefix => `File:${prefix}${word}.${extension}`));
}
function plainRecordingAttribution(value) {
  return String(value || "").replace(/<[^>]*>/g, "").replace(/&(?:amp|quot|apos|lt|gt);/g, entity => ({ "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" })[entity]).replace(/\s+/g, " ").trim().slice(0, 400);
}
function openRecordingLicense(value) {
  const safe = safePronunciationSourceUrl(String(value || "").replace(/^\/\//, "https://"));
  if (!safe) return "";
  const url = new URL(safe);
  return url.hostname === "creativecommons.org" && !url.port && /^\/(?:licenses\/(?:by|by-sa)\/(?:1\.0|2\.0|2\.5|3\.0|4\.0)|publicdomain\/(?:zero|mark)\/1\.0)\/?$/.test(url.pathname) ? safe : "";
}
function selectCommonsRecordings(payload, word) {
  const expected = new Set(commonsRecordingTitles(word).map(title => title.toLowerCase()));
  const recordings = [];
  for (const page of Object.values(payload?.query?.pages || {})) {
    if (page?.ns !== 6 || !Number.isInteger(page.pageid) || page.pageid <= 0 || !expected.has(String(page.title || "").toLowerCase())) continue;
    for (const info of Array.isArray(page.imageinfo) ? page.imageinfo : []) {
      const audioUrl = safeDictionaryAudioUrl(info?.url);
      if (!audioUrl || new URL(audioUrl).hostname !== "upload.wikimedia.org" || info.mediatype !== "AUDIO" || !/^(?:audio\/(?:ogg|mpeg|mp3|wav|x-wav)|application\/ogg)$/.test(info.mime || "")) continue;
      let filename;
      try { filename = decodeURIComponent(new URL(audioUrl).pathname.split("/").pop()); } catch { continue; }
      if (`File:${filename}`.toLowerCase() !== page.title.toLowerCase()) continue;
      const sourceUrl = safePronunciationSourceUrl(info.descriptionurl);
      if (!sourceUrl || new URL(sourceUrl).hostname !== "commons.wikimedia.org" || new URL(sourceUrl).port || !new URL(sourceUrl).pathname.startsWith("/wiki/File:")) continue;
      let sourceTitle;
      try { sourceTitle = decodeURIComponent(new URL(sourceUrl).pathname.slice("/wiki/".length)); } catch { continue; }
      if (sourceTitle.toLowerCase() !== page.title.toLowerCase()) continue;
      const metadata = info.extmetadata || {};
      const licenseUrl = openRecordingLicense(metadata.LicenseUrl?.value);
      const licenseName = plainRecordingAttribution(metadata.LicenseShortName?.value);
      const attribution = plainRecordingAttribution(metadata.Artist?.value);
      // Only use independently fetched recordings with a verifiable open license.
      if (!licenseUrl || !licenseName || (/\/licenses\//.test(licenseUrl) && !attribution)) continue;
      const accent = recordingAccent(audioUrl);
      recordings.push(Object.freeze({ audioUrl, sourceUrl, licenseUrl, licenseName, attribution, title: page.title.slice(5), source: "commons", label: `Wikimedia Commons 公開錄音${accent.accent ? " · " + accent.accent : " · 口音未標示"}`, ...accent }));
    }
  }
  return orderPronunciationRecordings(recordings);
}
function pronunciationNow() {
  return typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
}
function pronunciationBudgetRemaining(deadline) {
  return deadline === undefined ? Infinity : Math.max(0, deadline - pronunciationNow());
}
async function fetchPronunciationMetadata(url, session, deadline) {
  const timeoutMs = Math.min(PRONUNCIATION_CONFIG.lookupTimeoutMs, pronunciationBudgetRemaining(deadline));
  if (timeoutMs <= 0) throw new Error("Pronunciation recording budget exhausted");
  const controller = new AbortController();
  pronunciationLookupController = controller;
  let timer, abortListener;
  try {
    const payload = await Promise.race([
      (async () => {
        const response = await fetch(url, { signal: controller.signal, credentials: "omit", redirect: "error", referrerPolicy: "no-referrer" });
        if (!response.ok) throw new Error("Pronunciation lookup unavailable");
        return response.json();
      })(),
      new Promise((_, reject) => {
        abortListener = () => reject(session === state.audioSession ? new Error("Pronunciation lookup timed out") : pronunciationCancelled());
        controller.signal.addEventListener("abort", abortListener, { once: true });
        timer = setTimeout(() => controller.abort(), timeoutMs);
      })
    ]);
    if (session !== state.audioSession) throw pronunciationCancelled();
    return payload;
  } finally {
    clearTimeout(timer);
    if (abortListener) controller.signal.removeEventListener("abort", abortListener);
    if (pronunciationLookupController === controller) pronunciationLookupController = null;
  }
}
async function lookupPronunciationRecordings(provider, word, session, deadline) {
  if (provider === "gstatic") {
    const recording = gstaticPronunciationRecording(word);
    return recording ? [recording] : [];
  }
  const cache = provider === "commons" ? commonsRecordingCache : dictionaryRecordingCache;
  if (cache.has(word)) {
    const records = cache.get(word);
    cache.delete(word); cache.set(word, records);
    return orderPronunciationRecordings(records);
  }
  let url = PRONUNCIATION_CONFIG.dictionaryEndpoint + encodeURIComponent(word);
  if (provider === "commons") {
    const endpoint = new URL(PRONUNCIATION_CONFIG.commonsEndpoint);
    for (const [key, value] of Object.entries({ action: "query", format: "json", origin: "*", prop: "imageinfo", iiprop: "url|mime|mediatype|extmetadata", iiextmetadatafilter: "LicenseShortName|LicenseUrl|Artist", titles: commonsRecordingTitles(word).join("|") })) endpoint.searchParams.set(key, value);
    url = endpoint.href;
  }
  const payload = await fetchPronunciationMetadata(url, session, deadline);
  const recordings = provider === "commons" ? selectCommonsRecordings(payload, word) : selectDictionaryRecordings(payload, word);
  if (recordings.length) {
    if (cache.size >= PRONUNCIATION_CONFIG.cacheSize) cache.delete(cache.keys().next().value);
    cache.set(word, recordings);
  }
  return recordings;
}
async function lookupDictionaryRecording(word, session) { return (await lookupPronunciationRecordings("dictionary", word, session))[0] || null; }
function playDictionaryPronunciation(recording, button, session, deadline) {
  if (pronunciationBudgetRemaining(deadline) <= 0) return Promise.reject(new Error("Pronunciation recording budget exhausted"));
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
      endTimer = setTimeout(() => finish(new Error("Dictionary recording stalled")), Math.min(PRONUNCIATION_CONFIG.audioEndTimeoutMs, pronunciationBudgetRemaining(deadline)));
    };
    const cancel = () => finish(pronunciationCancelled());
    const startTimer = setTimeout(() => finish(new Error("Dictionary playback timed out")), Math.min(PRONUNCIATION_CONFIG.audioStartTimeoutMs, pronunciationBudgetRemaining(deadline)));
    pronunciationCancelPlayback = cancel;
    state.currentAudio = audio;
    audio.preload = "none";
    audio.playbackRate = pronunciationPreferences.rate;
    audio.preservesPitch = true;
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
  if (pronunciationPreferences.source === "device" || !key || typeof window.Audio !== "function") {
    await playDevicePronunciation(text, button, session);
    return;
  }
  markPronunciationButton(button, true);
  const recordingDeadline = pronunciationNow() + PRONUNCIATION_CONFIG.recordingBudgetMs;
  const providers = pronunciationPreferences.source === "auto" ? ["gstatic", "dictionary", "commons"] : [pronunciationPreferences.source];
  const attempted = new Set();
  let attempts = 0;
  for (const provider of providers) {
    if (session !== state.audioSession) return;
    if (pronunciationBudgetRemaining(recordingDeadline) <= 0 || attempts >= PRONUNCIATION_CONFIG.maxRecordingAttempts) break;
    if (provider !== "gstatic" && (typeof fetch !== "function" || typeof AbortController !== "function")) continue;
    const label = provider === "gstatic" ? "Google 靜態字典音檔（美式）" : provider === "commons" ? "Wikimedia Commons" : "Free Dictionary API";
    announceLocalVoiceStatus({ state: "loading", message: `正在查詢 ${label} 公開錄音（免帳號、免 API 金鑰）` });
    try {
      const recordings = await lookupPronunciationRecordings(provider, key, session, recordingDeadline);
      if (session !== state.audioSession) return;
      // Reserve an attempt for each provider in automatic mode.
      const providerLimit = pronunciationPreferences.source === "auto" ? 1 : PRONUNCIATION_CONFIG.maxRecordingsPerProvider;
      for (const recording of recordings.slice(0, providerLimit)) {
        if (pronunciationBudgetRemaining(recordingDeadline) <= 0) break;
        if (attempted.has(recording.audioUrl) || attempts >= PRONUNCIATION_CONFIG.maxRecordingAttempts) continue;
        attempted.add(recording.audioUrl); attempts += 1;
        try {
          await playDictionaryPronunciation(recording, button, session, recordingDeadline);
          return;
        } catch (error) {
          if (session !== state.audioSession || error?.code === "cancelled") return;
          // Evict the whole provider entry: a future explicit click retries fresh metadata.
          if (provider !== "gstatic") (provider === "commons" ? commonsRecordingCache : dictionaryRecordingCache).delete(key);
        }
      }
    } catch (error) {
      if (session !== state.audioSession || error?.code === "cancelled") return;
    }
  }
  await playDevicePronunciation(text, button, session, "所選字典／公開錄音來源目前無可用錄音");
}
async function speakPronunciation(value, button) {
  const text = normalizedPronunciationText(value);
  if (!validPronunciationText(text)) return;
  stopPronunciation();
  await playDevicePronunciation(text, button, state.audioSession);
}
function playBrowserVoice(text, button) { return speakPronunciation(text, button); }
function speakSentence(text, button) { return speakPronunciation(text, button); }
