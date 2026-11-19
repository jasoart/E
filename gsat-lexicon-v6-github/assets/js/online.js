"use strict";

// Each panel renders as soon as its own data arrives. Slow providers never
// hold up dictionary audio, example text, synonyms, or the local definition.
async function loadOnlineData(entry, index, retry = false) {
  const word = apiLookupWord(entry.word).toLowerCase(); if (!word) return;
  const cacheKey = word + "|" + normalizeCeecWord(entry.word);
  const request = ++state.onlineRequest;
  state.onlineController?.abort();
  const controller = new AbortController(), signal = controller.signal;
  state.onlineController = controller;
  const current = () => !signal.aborted && request === state.onlineRequest && state.selectedIndex === index;
  const cached = state.onlineCache.get(cacheKey);
  if (!retry && cached?.complete && cached.cachedAt > Date.now() - 1800000 && !Object.values(cached.errors).some(Boolean)) {
    showOnlineResult(cached, entry, index); return;
  }
  const result = {
    dictionary: emptyDictionaryResult(), examples: rankExampleCandidates(entry),
    synonyms: emptyCeecSuggestions(), collocations: emptyCeecSuggestions(), translation: "",
    errors: {}, complete: false
  };
  state.onlineCache.delete(cacheKey); state.onlineCache.set(cacheKey, result);
  while (state.onlineCache.size > 60) state.onlineCache.delete(state.onlineCache.keys().next().value);
  const sourceData = { wiktionary: emptyExampleSource(), freeDictionary: emptyExampleSource(), tatoeba: emptyExampleSource() };
  const rank = () => rankExampleCandidates(entry, sourceData.wiktionary, sourceData.freeDictionary, sourceData.tatoeba, result.dictionary);
  const paintExamples = () => {
    result.examples = rank();
    if (current() && result.examples.selectionTier !== "emergency") showExampleResult(result.examples, entry, index);
  };
  if (cached) showOnlineResult(cached, entry, index);
  else if (result.examples.selectionTier !== "emergency") showExampleResult(result.examples, entry, index);
  if (current()) {
    byId("onlineStatus").textContent = navigator.onLine === false ? "目前離線，正在讀取已儲存的資料…" : "正在補充線上資料，各區塊會陸續顯示…";
    byId("onlineRetry").hidden = true;
  }
  const get = (url, priority = 1, timeout = 4200) => fetchJson(url, signal, timeout, { priority, force: retry });
  const task = async (key, fn) => {
    try { await fn(); }
    catch (error) { if (error?.name !== "AbortError") result.errors[key] = true; }
  };
  let backupPromise, audioPromise;
  const backupExamples = () => backupPromise ||= Promise.all([
    task("freeDictionary", async () => {
      const response = await get(API_ENDPOINTS.freeDictionary + encodeURIComponent(word), 1, 3500);
      result.errors.freeDictionary = response.error;
      sourceData.freeDictionary = parseFreeDictionaryPayload(response.payload, entry.word); paintExamples();
    }),
    task("wiktionary", async () => {
      const response = await get(API_ENDPOINTS.wiktionary + encodeURIComponent(word), 1, 3500);
      result.errors.wiktionary = response.error;
      sourceData.wiktionary = parseWiktionaryPayload(response.payload, entry.word); paintExamples();
    })
  ]);
  const dictionaryTask = task("dictionary", async () => {
    const response = await get(API_ENDPOINTS.dictionary + encodeURIComponent(word), 0);
    result.errors.dictionary = response.error;
    const parsed = parseDictionaryPayload(response.payload);
    parsed.audioCandidates = rankAudioCandidates([...parsed.audioCandidates, ...result.dictionary.audioCandidates]);
    Object.assign(result.dictionary, parsed);
    if (current()) showDictionaryResult(result.dictionary, entry, index, response.error);
    paintExamples();
    if (current() && !parsed.audioCandidates.length) {
      audioPromise = task("wiktionaryAudio", () => loadExtraAudio(entry, index, result, signal, current));
    }
  });
  const tatoebaTask = task("tatoeba", async () => {
    const response = await get(tatoebaUrl(word), 0);
    result.errors.tatoeba = response.error;
    sourceData.tatoeba = parseTatoebaPayload(response.payload, entry.word); paintExamples();
  });
  const synonymTask = task("synonyms", async () => {
    const response = await get(datamuseUrl({rel_syn:word,md:"p",max:40}), 2, 3500);
    result.errors.synonyms = response.error;
    result.synonyms = parseSynonyms(response.payload, word);
    if (current()) showSynonymsResult(result.synonyms, index, response.error);
  });
  const collocationTask = task("collocations", async () => {
    const payloads = { before: null, after: null };
    await Promise.all([["before","rel_bgb"],["after","rel_bga"]].map(async ([direction, parameter]) => {
      const response = await get(datamuseUrl({[parameter]:word,md:"p",max:80}), 3, 3500);
      payloads[direction] = response.payload;
      result.errors.collocations = Boolean(result.errors.collocations || response.error);
      result.collocations = parseCorpusCollocations(payloads.before, payloads.after, entry);
      if (current()) showCollocationsResult(result.collocations, entry, index, result.errors.collocations);
    }));
  });
  // Hedge only when the first providers have not produced two suitable examples.
  const hedge = setTimeout(() => { if (current() && result.examples.examples.filter(e=>e.eligible).length < 2) void backupExamples(); }, 650);
  signal.addEventListener("abort", () => clearTimeout(hedge), {once:true});
  try {
    await Promise.all([dictionaryTask, tatoebaTask]);
    clearTimeout(hedge); if (!current()) return;
    if (result.examples.examples.filter(e=>e.eligible).length < 2) await backupExamples();
    else if (backupPromise) await backupPromise;
    if (!current()) return;
    result.examples = rank(); showExampleResult(result.examples, entry, index);
    const translationTask = task("exampleTranslation", async () => {
      const translated = await translateQualifiedExamples(result.examples, signal, output => {
        result.examples = output; if (current()) showExampleResult(output, entry, index);
      });
      result.examples = translated.result; result.errors.exampleTranslation = translated.error;
    });
    await Promise.all([synonymTask, collocationTask, audioPromise, translationTask]);
    if (!current()) return;
    result.complete = true; result.cachedAt = Date.now();
    showOnlineResult(result, entry, index);
  } finally { clearTimeout(hedge); }
}

async function loadExtraAudio(entry, index, result, signal, current) {
  const extra = await fetchWiktionaryAudio(apiLookupWord(entry.word).toLowerCase(), signal);
  result.errors.wiktionaryAudio = Boolean(extra.error);
  result.dictionary.audioCandidates = rankAudioCandidates([...result.dictionary.audioCandidates, ...(extra.candidates || [])]);
  if (current()) showDictionaryResult(result.dictionary, entry, index, extra.error);
}

async function requestMoreAudio(entry, index, button) {
  const key = apiLookupWord(entry.word).toLowerCase() + "|" + normalizeCeecWord(entry.word), result = state.onlineCache.get(key);
  if (!result) return;
  const signal = state.onlineController?.signal;
  button.disabled = true; button.textContent = "載入口音中…";
  try { await loadExtraAudio(entry, index, result, signal, () => !signal?.aborted && state.selectedIndex === index); }
  catch (error) { if (error?.name !== "AbortError") showToast("暫時無法取得更多口音"); }
  finally { if (button.isConnected) {button.disabled=false;button.textContent="更多口音";} }
}

async function requestWordTranslation(entry, index, button) {
  const signal = state.onlineController?.signal;
  button.disabled = true; button.textContent = "翻譯中…";
  try {
    const response = await fetchJson(googleTranslationUrl(apiLookupWord(entry.word)), signal, 3000);
    if (signal?.aborted || state.selectedIndex !== index) return;
    const value = parseTranslationPayload(response.payload);
    const result = state.onlineCache.get(apiLookupWord(entry.word).toLowerCase()+"|"+normalizeCeecWord(entry.word));
    if (result) result.translation = value;
    showTranslationResult(value, index, response.error);
  } catch (error) { if (error?.name !== "AbortError") showTranslationResult("",index,true); }
  finally { if (button.isConnected) {button.disabled=false;button.textContent="補充翻譯";} }
}
