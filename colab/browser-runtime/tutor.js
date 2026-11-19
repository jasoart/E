/* Optional sentence generation. Existing search, favorite and review state is read only. */
(function (root) {
  "use strict";

  function validateSentence(text, entry, validators) {
    const tokens = validators.sentenceWords(text);
    const target = validators.containsTargetForm(text, entry.word);
    const complete = validators.likelyCompleteSentence(text, tokens);
    const coverage = validators.sentenceCeecCoverage(tokens);
    const collocation = validators.curatedCollocationCheck(text, entry.word);
    const problems = [];
    if (!target) problems.push("未包含目標字或其變化形");
    if (tokens.length < 8 || tokens.length > 24) problems.push(`長度 ${tokens.length} 字，目標為 8–24 字`);
    if (!complete) problems.push("句子完整性規則未通過");
    if (coverage.ratio < .85) problems.push("CEEC 詞彙覆蓋低於 85%");
    if (collocation.blocked) problems.push("出現詞典已標記的易錯搭配");
    if (/<[^>]*>|https?:\/\/|\[[^\]]+\]|\n\s*\n/.test(text)) problems.push("輸出含額外標記或說明");
    if (/[.!?]\s+[A-Z]/.test(text)) problems.push("輸出可能超過一句");
    return { passed: !problems.length, problems, wordCount: tokens.length, coverage: Math.round(coverage.ratio * 100), unknown: coverage.unknown || [] };
  }

  function createTutorController(options) {
    const core = options.core, doc = options.document;
    const nodes = Object.fromEntries(["tutorModelSource", "tutorLoad", "tutorStop", "tutorGenerate", "tutorTopic", "tutorGrammar", "tutorStatus", "tutorOutput", "tutorValidation", "tutorTarget", "tutorProgress"].map(id => [id, doc.getElementById(id)]));
    if (Object.values(nodes).some(node => !node)) return null;
    let worker = null, epoch = 0, nextId = 0, activeId = 0, mode = "idle", generationEntry = null;
    const setStatus = message => { nodes.tutorStatus.textContent = message; };
    const updateButtons = () => {
      const busy = mode === "loading" || mode === "generating";
      nodes.tutorLoad.disabled = busy;
      nodes.tutorModelSource.disabled = busy;
      nodes.tutorGenerate.disabled = mode !== "ready" || !options.getEntry();
      nodes.tutorStop.disabled = !worker;
      nodes.tutorTopic.disabled = mode === "generating";
      nodes.tutorGrammar.disabled = mode === "generating";
      nodes.tutorOutput.setAttribute("aria-busy", String(mode === "generating"));
    };
    const clearProgress = () => { nodes.tutorProgress.hidden = true; nodes.tutorProgress.removeAttribute("value"); };
    function release(message, clearOutput = false) {
      epoch++; activeId = 0;
      const previous = worker; worker = null;
      if (previous) previous.terminate();
      mode = "idle"; generationEntry = null;
      clearProgress();
      if (clearOutput) { nodes.tutorOutput.textContent = ""; nodes.tutorValidation.textContent = ""; }
      setStatus(message); updateButtons();
    }
    function refreshTarget() {
      const entry = options.getEntry();
      nodes.tutorTarget.textContent = entry ? `${entry.word} · ${entry.partOfSpeech || ""} · L${entry.level}` : "請先在詞典選擇單字";
      if (mode === "generating" && entry?.word !== generationEntry?.word) release("已切換單字，停止這次生成並釋放模型；請重新載入。", true);
      updateButtons();
    }
    function fail(error) {
      release(`載入或生成失敗：${String(error?.message || error).slice(0, 500)} 可修改模型位置後重試。`, mode === "generating");
    }
    function receive(message, owner, ownerEpoch) {
      if (worker !== owner || epoch !== ownerEpoch || message?.id !== activeId) return;
      if (message.type === "error") { fail(message.message); return; }
      if (message.type === "status") { setStatus(String(message.text || "")); return; }
      if (message.type === "progress" && mode === "loading") {
        const percent = Number(message.progress);
        const filename = String(message.file || "模型檔案").split("/").pop();
        nodes.tutorProgress.hidden = false;
        if (message.total > 0 && Number.isFinite(percent)) nodes.tutorProgress.value = Math.max(0, Math.min(100, percent));
        else nodes.tutorProgress.removeAttribute("value");
        const size = message.total > 0 ? `（${(message.loaded / 1048576).toFixed(1)} / ${(message.total / 1048576).toFixed(1)} MB）` : "";
        setStatus(`正在下載／準備 ${filename}${size}。可隨時停止。`); return;
      }
      if (message.type === "ready" && mode === "loading") {
        mode = "ready"; activeId = 0; clearProgress(); setStatus("q4 模型已載入；使用單執行緒 WASM，在此裝置生成。iPhone 13 的速度與穩定度仍需實機測試。"); updateButtons(); return;
      }
      if ((message.type === "token" || message.type === "result") && mode === "generating") {
        if (options.getEntry()?.word !== generationEntry?.word) { release("已切換單字，捨棄先前結果並釋放模型。", true); return; }
        // Model output is always plain text, including during streaming.
        nodes.tutorOutput.textContent = String(message.text || "").slice(0, core.LIMITS.outputCharacters);
        if (message.type === "result") {
          const result = validateSentence(nodes.tutorOutput.textContent, generationEntry, options.validators);
          nodes.tutorValidation.dataset.passed = String(result.passed);
          nodes.tutorValidation.textContent = `${result.passed ? "規則檢查通過" : "需重新生成或人工修訂"}：${result.wordCount} 字，CEEC 詞表覆蓋 ${result.coverage}%。${result.problems.length ? " " + result.problems.join("；") + "。" : ""}${result.unknown.length ? " 未收錄詞：" + result.unknown.join(", ") + "。" : ""}這是詞表與結構檢查，不能保證文法、詞義或指定句型正確。`;
          mode = "ready"; activeId = 0; generationEntry = null;
          setStatus(`完成：AI 自編例句，非學測真題。${message.contextTrimmed ? " 已縮短參考資訊以符合手機 token 上限。" : ""}`); updateButtons();
        }
      }
    }
    function load() {
      if (mode === "loading" || mode === "generating") return;
      let location;
      try { location = core.modelLocation(nodes.tutorModelSource.value, options.pageUrl); }
      catch (error) { setStatus(error.message); return; }
      release("準備載入模型…");
      try {
        const owner = new options.Worker(options.workerUrl, { type: "module", name: "gsat-danube-sentences" });
        worker = owner; const ownerEpoch = epoch;
        owner.onmessage = event => receive(event.data, owner, ownerEpoch);
        owner.onerror = event => { if (worker === owner && epoch === ownerEpoch) fail(event.message || "瀏覽器無法啟動模型 Worker；請使用新版 Safari 並檢查網路／CORS。"); };
        mode = "loading"; activeId = ++nextId;
        nodes.tutorOutput.textContent = ""; nodes.tutorValidation.textContent = "";
        nodes.tutorProgress.hidden = false; nodes.tutorProgress.removeAttribute("value");
        try { options.storage?.setItem(core.MODEL_SOURCE_KEY, location.source); } catch { /* Storage is optional. */ }
        setStatus("開始檢查與下載；只有這次點擊才會載入例句模型。"); updateButtons();
        owner.postMessage({ type: "load", id: activeId, source: location.source, pageUrl: options.pageUrl });
      } catch (error) { fail(error); }
    }
    function generate() {
      if (mode !== "ready" || !worker) return;
      const entry = options.getEntry();
      if (!entry) { refreshTarget(); return; }
      const patterns = (options.getPoints(entry) || []).flatMap(point => (point.patterns || []).map(pattern => Array.isArray(pattern) ? pattern[0] : "")).filter(Boolean).slice(0, 2);
      generationEntry = { ...entry }; mode = "generating"; activeId = ++nextId;
      nodes.tutorOutput.textContent = ""; nodes.tutorValidation.textContent = "";
      setStatus("正在此裝置生成英文例句…"); updateButtons();
      try { worker.postMessage({ type: "generate", id: activeId, context: core.normalizeContext({ ...entry, patterns, topic: nodes.tutorTopic.value, grammar_tag: nodes.tutorGrammar.value }) }); }
      catch (error) { fail(error); }
    }
    try { nodes.tutorModelSource.value = options.storage?.getItem(core.MODEL_SOURCE_KEY) || ""; } catch { /* Storage is optional. */ }
    nodes.tutorLoad.addEventListener("click", load);
    nodes.tutorGenerate.addEventListener("click", generate);
    nodes.tutorStop.addEventListener("click", () => release("已停止並釋放模型記憶體；瀏覽器下載快取可能仍保留，之後可重新載入。", mode === "generating"));
    let observer = null;
    if (options.MutationObserver && doc.getElementById("wordDetail")) {
      observer = new options.MutationObserver(refreshTarget);
      observer.observe(doc.getElementById("wordDetail"), { childList: true });
    }
    const destroy = () => { observer?.disconnect(); release("已釋放模型記憶體。"); };
    options.addEventListener?.("pagehide", () => release("已釋放模型記憶體；可重新載入。", mode === "generating"));
    refreshTarget(); clearProgress();
    if (!options.Worker) { nodes.tutorLoad.disabled = true; setStatus("此瀏覽器不支援 Worker。請使用新版 Safari 或其他現代瀏覽器。"); }
    return { load, generate, refreshTarget, destroy, getMode: () => mode };
  }

  const api = { createTutorController, validateSentence };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GsatTutorController = api;
  if (typeof document !== "undefined" && root.GsatTutorCore) {
    let storage; try { storage = root.localStorage; } catch { /* Storage is optional. */ }
    const scriptUrl = document.currentScript?.src || new URL("./assets/js/tutor.js", document.baseURI).href;
    const controller = createTutorController({
      core: root.GsatTutorCore, document, storage, Worker: root.Worker, MutationObserver: root.MutationObserver,
      pageUrl: document.baseURI, workerUrl: new URL("./tutor-worker.js", scriptUrl).href,
      getEntry: () => typeof VOCABULARY !== "undefined" && typeof state !== "undefined" ? VOCABULARY[state.selectedIndex] : null,
      getPoints: entry => typeof getGsatPoints === "function" ? getGsatPoints(entry) : [],
      validators: { sentenceWords, containsTargetForm, likelyCompleteSentence, sentenceCeecCoverage, curatedCollocationCheck },
      addEventListener: (...args) => root.addEventListener(...args)
    });
    root.GsatSentenceTutor = controller;
  }
})(typeof globalThis !== "undefined" ? globalThis : self);
