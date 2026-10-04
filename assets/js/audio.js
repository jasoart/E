"use strict";

let localVoiceEngine = null;
let localVoiceModulePromise = null;
let pronunciationContext = null;
let pronunciationSource = null;
let pronunciationStatus = Object.freeze({ state: "idle", message: "裝置英文語音 · 可選擇載入本機 WebGPU 語音", progress: 0 });

function localVoiceStatus() { return pronunciationStatus; }
function announceLocalVoiceStatus(status) {
  pronunciationStatus = status;
  if (typeof CustomEvent === "function") document.dispatchEvent(new CustomEvent("localvoicestatus", { detail: status }));
}
async function loadLocalVoice(button) {
  if (button) button.disabled = true;
  try {
    if (!localVoiceModulePromise) {
      localVoiceModulePromise = import("./local-tts.js").catch(error => { localVoiceModulePromise = null; throw error; });
    }
    const { LocalVoiceEngine } = await localVoiceModulePromise;
    if (!localVoiceEngine) localVoiceEngine = new LocalVoiceEngine({
      source: document.documentElement.dataset.localVoiceSource || "huggingface",
      onStatus: announceLocalVoiceStatus,
    });
    await localVoiceEngine.initialize();
    showToast("本機 WebGPU 語音已就緒；可播放單字與例句");
    return true;
  } catch (error) {
    if (!["unsupported", "error"].includes(pronunciationStatus.state)) announceLocalVoiceStatus({ state: "error", message: "本機語音載入失敗；可重試或使用裝置英文語音", progress: 0 });
    showToast(pronunciationStatus.message);
    return false;
  } finally {
    if (button && button.isConnected) button.disabled = false;
  }
}
function markPronunciationButton(button, active) {
  if (!button) return;
  button.classList.toggle("speaking", active);
  button.setAttribute("aria-pressed", String(active));
}
function stopPronunciation() {
  state.audioSession += 1;
  localVoiceEngine?.cancel();
  if (pronunciationSource) {
    pronunciationSource.onended = null;
    try { pronunciationSource.stop(); } catch {}
    try { pronunciationSource.disconnect(); } catch {}
    pronunciationSource = null;
  }
  state.currentAudio = null;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  document.querySelectorAll(".speaking").forEach(button => markPronunciationButton(button, false));
}
function localEnglishVoice() {
  const normalize = voice => String(voice.lang || "").replace(/_/g, "-").toLowerCase();
  const voices = window.speechSynthesis.getVoices().filter(voice => voice.localService === true && normalize(voice).startsWith("en"));
  return voices.find(voice => normalize(voice) === "en-us") || voices[0] || null;
}
async function waitForLocalEnglishVoice() {
  const voice = localEnglishVoice();
  if (voice) return voice;
  // Safari may populate voices after the first call. Never select a remote/default voice.
  await new Promise(resolve => {
    const synthesis = window.speechSynthesis;
    let timer;
    const finish = () => { clearTimeout(timer); synthesis.removeEventListener?.("voiceschanged", finish); resolve(); };
    synthesis.addEventListener?.("voiceschanged", finish, { once: true });
    timer = setTimeout(finish, 1200);
  });
  return localEnglishVoice();
}
async function playDevicePronunciation(text, button, session) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) { showToast("此瀏覽器不支援裝置語音"); return; }
  const voice = await waitForLocalEnglishVoice();
  if (session !== state.audioSession) return;
  if (!voice) { showToast("尚未找到本機英文聲線；請在裝置設定下載英文語音，或載入 WebGPU 語音"); return; }
  const utterance = new window.SpeechSynthesisUtterance(text);
  utterance.lang = voice.lang;
  utterance.voice = voice;
  utterance.rate = 0.82;
  const finish = () => { if (session === state.audioSession) markPronunciationButton(button, false); };
  utterance.onend = utterance.onerror = finish;
  if (window.speechSynthesis.paused) window.speechSynthesis.resume();
  markPronunciationButton(button, true);
  window.speechSynthesis.speak(utterance);
}
function pronunciationAudioContext() {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) throw new Error("Web Audio unavailable");
  if (!pronunciationContext || pronunciationContext.state === "closed") pronunciationContext = new Context();
  // Called synchronously during the playback click so iOS can unlock audio before inference.
  const resumed = pronunciationContext.resume();
  return { context: pronunciationContext, resumed };
}
async function speakPronunciation(value, button) {
  const text = String(value || "").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
  if (!text || text.length > 600) { showToast("每次請播放 1–600 字元的單字或例句"); return; }
  stopPronunciation();
  const session = state.audioSession;
  if (!localVoiceEngine?.ready) { await playDevicePronunciation(text, button, session); return; }
  let audioContext;
  try { audioContext = pronunciationAudioContext(); }
  catch { await playDevicePronunciation(text, button, session); return; }
  // Observe a rejected unlock promise immediately, before the longer synthesis operation.
  const unlock = Promise.resolve(audioContext.resumed).then(() => true, () => false);
  markPronunciationButton(button, true);
  try {
    const { samples, sampleRate } = await localVoiceEngine.generate(text);
    if (session !== state.audioSession) return;
    if (!await unlock || audioContext.context.state !== "running") throw new Error("Audio permission unavailable");
    const buffer = audioContext.context.createBuffer(1, samples.length, sampleRate);
    buffer.copyToChannel(samples, 0);
    const source = audioContext.context.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.context.destination);
    source.onended = () => {
      if (session !== state.audioSession) return;
      pronunciationSource = null;
      try { source.disconnect(); } catch {}
      markPronunciationButton(button, false);
    };
    pronunciationSource = source;
    source.start();
  } catch (error) {
    if (session !== state.audioSession || error?.code === "cancelled") return;
    markPronunciationButton(button, false);
    showToast("本機合成暫時失敗，改用裝置英文語音");
    await playDevicePronunciation(text, button, session);
  }
}
function playBrowserVoice(text, button) { return speakPronunciation(text, button); }
function speakWord(word, button) { return speakPronunciation(spokenForm(word), button); }
function speakSentence(text, button) { return speakPronunciation(text, button); }
