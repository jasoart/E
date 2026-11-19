/* Kokoro speech is synthesized on the device. No text is sent to a TTS service. */
export const LOCAL_VOICE_CONFIG = Object.freeze({
  modelId: "onnx-community/Kokoro-82M-v1.0-ONNX",
  revision: "1939ad2a8e416c0acfeecc08a694d14ef25f2231",
  dtype: "fp32",
  device: "webgpu",
  voice: "af_heart",
  modelBytes: 325532232,
  maxCharacters: 600,
});

export class LocalVoiceError extends Error {
  constructor(code, message) { super(message); this.name = "LocalVoiceError"; this.code = code; }
}

export class LocalVoiceEngine {
  constructor({ navigator = globalThis.navigator, secureContext = globalThis.isSecureContext,
    loadRuntime = () => import("../vendor/kokoro/kokoro.bundle.mjs"), source = "huggingface", onStatus = () => {} } = {}) {
    this.navigator = navigator;
    this.secureContext = secureContext;
    this.loadRuntime = loadRuntime;
    this.source = source;
    this.onStatus = onStatus;
    this.runtime = null;
    this.pendingLoad = null;
    this.sequence = 0;
    this.queue = Promise.resolve();
    this.status = Object.freeze({ state: "idle", message: "裝置英文語音 · 可選擇載入本機 WebGPU 語音", progress: 0 });
  }
  update(state, message, progress = 0) {
    this.status = Object.freeze({ state, message, progress, device: LOCAL_VOICE_CONFIG.device, dtype: LOCAL_VOICE_CONFIG.dtype });
    this.onStatus(this.status);
  }
  get ready() { return this.status.state === "ready" && Boolean(this.runtime); }
  // initialize() is only called by the explicit download button, never on page load or a word selection.
  async initialize() {
    if (this.ready) return this.status;
    if (this.pendingLoad) return this.pendingLoad;
    this.pendingLoad = this.initializeOnce().finally(() => { this.pendingLoad = null; });
    return this.pendingLoad;
  }
  async initializeOnce() {
    try {
      this.update("checking", "正在檢查這台裝置的 WebGPU…");
      if (!this.secureContext || !this.navigator?.gpu?.requestAdapter) {
        throw new LocalVoiceError("unsupported", "此瀏覽器未提供 WebGPU；使用裝置英文語音");
      }
      let adapter;
      try { adapter = await this.navigator.gpu.requestAdapter(); }
      catch { throw new LocalVoiceError("unsupported", "無法取得 WebGPU 顯示卡；使用裝置英文語音"); }
      if (!adapter) throw new LocalVoiceError("unsupported", "此裝置沒有可用的 WebGPU 顯示卡；使用裝置英文語音");
      if (!["huggingface", "site"].includes(this.source)) throw new LocalVoiceError("configuration", "本機語音來源設定無效");
      this.update("loading", "正在載入本機語音 · 首次模型約 326 MB");
      const runtimeModule = await this.loadRuntime();
      this.runtime = await runtimeModule.createLocalVoice({ ...LOCAL_VOICE_CONFIG, source: this.source }, event => {
        if (event?.status === "progress") {
          const progress = Math.max(0, Math.min(100, Number(event.progress) || 0));
          this.update("loading", `本機語音下載中 · ${Math.round(progress)}%`, progress);
        }
      });
      if (!this.runtime || typeof this.runtime.generate !== "function") throw new Error("Missing local speech runtime");
      this.update("ready", "Kokoro 本機 WebGPU 語音已就緒", 100);
      return this.status;
    } catch (error) {
      this.runtime = null;
      const unsupported = error?.code === "unsupported";
      this.update(unsupported ? "unsupported" : "error", unsupported ? error.message : "本機語音載入失敗；可重試或使用裝置英文語音");
      throw error;
    }
  }
  cancel() { this.sequence += 1; }
  async generate(text, { speed = 0.9 } = {}) {
    if (!this.ready) throw new LocalVoiceError("not-ready", "請先載入本機語音，或使用裝置英文語音");
    const input = String(text || "").replace(/\s+/g, " ").trim();
    if (!input || input.length > LOCAL_VOICE_CONFIG.maxCharacters) {
      throw new LocalVoiceError("input", "每次請播放 1–600 字元的單字或例句");
    }
    if (!Number.isFinite(speed) || speed < 0.5 || speed > 1.5) throw new LocalVoiceError("input", "語速設定無效");
    const ticket = ++this.sequence;
    const work = this.queue.catch(() => {}).then(async () => {
      if (ticket !== this.sequence) throw new LocalVoiceError("cancelled", "已停止播放");
      const audio = await this.runtime.generate(input, { voice: LOCAL_VOICE_CONFIG.voice, speed });
      if (ticket !== this.sequence) throw new LocalVoiceError("cancelled", "已停止播放");
      const samples = audio?.audio;
      const sampleRate = Number(audio?.sampling_rate);
      if (!(samples instanceof Float32Array) || !samples.length || sampleRate !== 24000 || samples.some(value => !Number.isFinite(value))) {
        throw new LocalVoiceError("output", "語音輸出格式無效");
      }
      return { samples, sampleRate };
    }).catch(error => {
      if (error?.code !== "cancelled") {
        const runtime = this.runtime;
        this.runtime = null;
        this.update("error", "本機語音推論失敗；可重試載入或使用裝置英文語音");
        try { Promise.resolve(runtime?.dispose?.()).catch(() => {}); } catch {}
      }
      throw error;
    });
    this.queue = work;
    return work;
  }
}
