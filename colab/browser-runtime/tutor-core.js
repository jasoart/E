/* Shared browser/worker helpers; no model is loaded by this file. */
(function (root) {
  "use strict";
  const LIMITS = Object.freeze({ inputTokens: 384, newTokens: 96, outputCharacters: 2000 });
  const LIBRARY_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";
  const MODEL_SOURCE_KEY = "gsat-danube-example-model-v1";
  const SYSTEM_PROMPT = "You write accurate English example sentences for Taiwanese GSAT learners. Return only one sentence, with no explanation, translation, or list.";
  const GRAMMAR = Object.freeze({
    auto: "Choose a suitable simple or complex sentence structure.",
    contextual_collocation: "Use a natural collocation in a familiar context.",
    adverbial_cause_time: "Use a cause or time adverbial clause (because, since, when, or after).",
    concession_contrast: "Use a concession or contrast connector (although, while, or however).",
    relative_clause: "Use a relative clause (who, which, or that).",
    passive_voice: "Use a natural passive construction.",
    participial_modifier: "Use a natural participial phrase.",
    noun_clause_reporting: "Use a reporting verb followed by a noun clause (that or whether).",
    purpose_result: "Use a purpose or result construction (so that, in order to, or so...that).",
    comparison_degree: "Use a natural comparison or degree construction.",
    conditional_modal: "Use a conditional clause or a modal verb.",
    discourse_linking: "Use a suitable discourse connector to link ideas within one sentence.",
    perfect_tense: "Use a natural present or past perfect construction."
  });
  const clean = (value, length) => String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, length);

  function modelLocation(value, pageUrl) {
    const source = String(value ?? "").trim();
    if (!source || source.length > 1024) throw Error("請填入 Colab 匯出的模型目錄或 Hugging Face 模型 ID。");
    if (/^[a-zA-Z0-9][\w.-]*\/[a-zA-Z0-9][\w.-]*$/.test(source)) {
      return { source, kind: "repository", modelId: source, baseUrl: `https://huggingface.co/${source}/resolve/main/` };
    }
    const relative = /^(\.\/|\.\.\/|\/(?!\/))/.test(source);
    if (!relative && !/^https:\/\//i.test(source)) throw Error("模型位置限同網站路徑（以 ./ 或 / 開頭）、公開 HTTPS 目錄或 owner/model ID。");
    let url, page;
    try { page = new URL(pageUrl); url = new URL(source, page); } catch { throw Error("模型位置不是有效網址。"); }
    if (url.username || url.password || url.search || url.hash) throw Error("請使用不含帳密、查詢參數或片段的公開模型目錄。");
    if (relative ? url.origin !== page.origin : url.protocol !== "https:") throw Error("模型目錄必須位於同網站或使用 HTTPS。");
    if (!/^https?:$/.test(url.protocol)) throw Error("請透過 HTTP(S) 網站使用此功能。");
    if (!relative && /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])/.test(url.hostname)) throw Error("請使用公開 HTTPS 模型目錄。");
    url.pathname = url.pathname.replace(/\/+$/, "") + "/";
    return { source, kind: "directory", modelId: "gsat-danube-runtime", baseUrl: url.href };
  }

  function validateManifest(manifest) {
    if (!manifest || manifest.schema_version !== 1 || manifest.runtime !== "transformers.js" || manifest.dtype !== "q4" || manifest.device !== "wasm") {
      throw Error("runtime-manifest.json 必須是本筆記本匯出的 schema 1 / Transformers.js / q4 / WASM 格式。");
    }
    const input = manifest.max_input_tokens, output = manifest.max_new_tokens;
    if (!Number.isInteger(input) || input < 64 || input > LIMITS.inputTokens || !Number.isInteger(output) || output < 1 || output > LIMITS.newTokens) {
      throw Error("模型的輸入／輸出上限不符合手機執行設定（最多 384／96 tokens）。");
    }
    if (!Array.isArray(manifest.model_files) || !manifest.model_files.includes("onnx/model_q4.onnx")) {
      throw Error("模型缺少 onnx/model_q4.onnx；請先在 Colab 完成 ONNX q4 匯出。");
    }
    for (const path of manifest.model_files) {
      if (typeof path !== "string" || !/^onnx\/[\w.-]+$/.test(path) || path.includes("..")) throw Error("模型檔案清單含無效路徑。");
    }
    return { maxInputTokens: input, maxNewTokens: output, modelFiles: [...manifest.model_files] };
  }

  function normalizeContext(context = {}) {
    return {
      word: clean(context.word, 80).split("/")[0].replace(/\([^)]*\)/g, "").trim(), partOfSpeech: clean(context.partOfSpeech, 40), meaning: clean(context.meaning, 120),
      level: Math.min(6, Math.max(5, Number(context.level) || 5)),
      patterns: (Array.isArray(context.patterns) ? context.patterns : []).slice(0, 2).map(value => clean(value, 100)).filter(Boolean),
      topic: clean(context.topic, 100),
      grammar_tag: Object.hasOwn(GRAMMAR, context.grammar_tag) ? context.grammar_tag : "auto"
    };
  }

  function buildMessages(context) {
    const item = normalizeContext(context);
    if (!item.word) throw Error("請先在詞典選擇要造句的單字。");
    // Danube's official chat template accepts alternating user/assistant roles
    // and explicitly rejects a system role. Training uses this same user text.
    return [{ role: "user", content: `${SYSTEM_PROMPT}\n\nWrite one natural English sentence of 8 to 24 words using "${item.word}".\nPart of speech: ${item.partOfSpeech}. Meaning: ${item.meaning}.\nKeep the vocabulary within CEEC levels 1 to ${item.level}.\nUseful collocations: ${item.patterns.join("; ") || "(none supplied)"}.\nTopic: ${item.topic || "a familiar school, daily life, or social situation"}.\nGrammar: ${GRAMMAR[item.grammar_tag]}\nUse the target in a complete sentence. Return the English sentence only.` }];
  }

  function generatedText(output) {
    const first = Array.isArray(output) ? output[0] : output;
    const text = first?.generated_text;
    if (typeof text === "string") return text.trim().slice(0, LIMITS.outputCharacters);
    if (Array.isArray(text)) {
      const last = [...text].reverse().find(message => message?.role === "assistant" && typeof message.content === "string");
      if (last) return last.content.trim().slice(0, LIMITS.outputCharacters);
    }
    throw Error("模型沒有回傳可讀的英文例句，請重試。");
  }

  const api = Object.freeze({ LIMITS, LIBRARY_URL, MODEL_SOURCE_KEY, SYSTEM_PROMPT, GRAMMAR, clean, modelLocation, validateManifest, normalizeContext, buildMessages, generatedText });
  root.GsatTutorCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : self);
