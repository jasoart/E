/* A separate worker owns the model so Stop can immediately release its memory. */
(function (root) {
  "use strict";
  function createTutorWorkerRuntime(options) {
    let core = options.core, generator = null, manifest = null, busy = false;
    const post = options.postMessage;
    const send = (id, type, payload = {}) => post({ id, type, ...payload });

    async function dispose() {
      const previous = generator;
      generator = null; manifest = null;
      if (previous?.dispose) await previous.dispose();
    }

    function fitContext(context, tokenizer, limit) {
      const item = core.normalizeContext(context);
      let messages, ids, trimmed = false;
      for (let step = 0; step < 7; step++) {
        messages = core.buildMessages(item);
        ids = tokenizer.apply_chat_template(messages, { add_generation_prompt: true, tokenize: true, return_tensor: false, truncation: false });
        const length = Array.isArray(ids?.[0]) ? ids[0].length : ids?.length;
        if (!Number.isInteger(length)) throw Error("無法計算輸入長度；請檢查模型 tokenizer 與 chat template。");
        if (length <= limit) return { messages, inputTokens: length, contextTrimmed: trimmed };
        trimmed = true;
        if (step === 0) item.patterns = item.patterns.slice(0, 1);
        else if (step === 1) item.meaning = item.meaning.slice(0, 40);
        else if (step === 2) item.topic = item.topic.slice(0, 30);
        else if (step === 3) item.patterns = [];
        else if (step === 4) { item.meaning = ""; item.topic = ""; }
        else if (step === 5) item.partOfSpeech = "";
      }
      throw Error("這個詞條的輸入仍超過手機長度上限；請改選較短的單字。");
    }

    async function receive(message) {
      const { id, type } = message || {};
      if (!Number.isSafeInteger(id) || id < 1) return;
      if (busy) { send(id, "error", { message: "模型正在處理上一個請求。" }); return; }
      busy = true;
      try {
        if (!core) core = await options.loadCore();
        if (type === "load") {
          await dispose();
          // Revalidate inside the worker; no arbitrary library URL comes from the UI.
          const location = core.modelLocation(message.source, message.pageUrl);
          send(id, "status", { text: "正在檢查模型匯出格式…" });
          const response = await options.fetch(new URL("runtime-manifest.json", location.baseUrl).href, { credentials: "omit", referrerPolicy: "no-referrer" });
          if (!response.ok) throw Error("找不到 runtime-manifest.json。原始 Danube 權重不能直接在瀏覽器執行；請填入 Colab 匯出的 q4 模型位置。");
          manifest = core.validateManifest(await response.json());
          send(id, "status", { text: "正在載入推論程式與 q4 模型；首次下載可能需要數分鐘…" });
          const library = await options.importTransformers(core.LIBRARY_URL);
          library.env.allowLocalModels = false;
          library.env.allowRemoteModels = true;
          if (location.kind === "directory") {
            library.env.remoteHost = location.baseUrl;
            library.env.remotePathTemplate = "";
          } else {
            library.env.remoteHost = "https://huggingface.co/";
            library.env.remotePathTemplate = "{model}/resolve/{revision}/";
          }
          // Safari does not need SharedArrayBuffer or cross-origin isolation.
          library.env.backends.onnx.wasm.numThreads = 1;
          library.env.backends.onnx.wasm.proxy = false;
          generator = await library.pipeline("text-generation", location.modelId, {
            dtype: "q4", device: "wasm",
            progress_callback: progress => send(id, "progress", {
              file: core.clean(progress.file, 180), status: core.clean(progress.status, 30),
              loaded: Number(progress.loaded) || 0, total: Number(progress.total) || 0,
              progress: Math.max(0, Math.min(100, Number(progress.progress) || 0))
            })
          });
          if (typeof generator.tokenizer?.apply_chat_template !== "function" || !generator.tokenizer.chat_template) {
            throw Error("模型缺少可用的 chat template；請保留原始 tokenizer 設定後重新匯出。");
          }
          generator.tokenizer.model_max_length = manifest.maxInputTokens;
          generator.tokenizer.truncation_side = "left";
          send(id, "ready", { device: "wasm", dtype: "q4" });
        } else if (type === "generate") {
          if (!generator || !manifest) throw Error("請先載入 q4 模型。");
          const fitted = fitContext(message.context, generator.tokenizer, manifest.maxInputTokens);
          let partial = "";
          const library = await options.importTransformers(core.LIBRARY_URL);
          const streamer = new library.TextStreamer(generator.tokenizer, {
            skip_prompt: true, skip_special_tokens: true,
            callback_function: text => {
              partial = (partial + text).slice(0, core.LIMITS.outputCharacters);
              send(id, "token", { text: partial });
            }
          });
          send(id, "status", { text: "正在此裝置生成英文例句…" });
          const output = await generator(fitted.messages, {
            max_new_tokens: manifest.maxNewTokens, do_sample: false,
            repetition_penalty: 1.1, return_full_text: false, streamer
          });
          const text = core.generatedText(output);
          if (!text) throw Error("模型回傳空白內容，請再試一次。");
          send(id, "result", { text, inputTokens: fitted.inputTokens, contextTrimmed: fitted.contextTrimmed });
        } else if (type === "dispose") {
          await dispose(); send(id, "disposed");
        } else throw Error("不支援的模型請求。");
      } catch (error) {
        try { await dispose(); } catch { /* Worker termination is the final cleanup. */ }
        send(id, "error", { message: String(error?.message || error).slice(0, 500) });
      } finally { busy = false; }
    }
    return { receive, dispose };
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { createTutorWorkerRuntime };
  if (typeof self !== "undefined" && typeof document === "undefined") {
    const runtime = createTutorWorkerRuntime({
      postMessage: message => self.postMessage(message), fetch: (...args) => fetch(...args),
      loadCore: async () => { await import("./tutor-core.js"); return self.GsatTutorCore; },
      importTransformers: url => import(url)
    });
    self.onmessage = event => { void runtime.receive(event.data); };
  }
})(typeof globalThis !== "undefined" ? globalThis : self);
