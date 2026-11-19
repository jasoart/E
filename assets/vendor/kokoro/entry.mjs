/* Application adapter. Upstream packages stay unmodified; model and voice downloads are pinned here. */
import { KokoroTTS } from "kokoro-js";
import { StyleTextToSpeech2Model, AutoTokenizer, Tensor, env } from "@huggingface/transformers";

const voiceCache = new Map();
async function loadVoice(url) {
  if (voiceCache.has(url)) return voiceCache.get(url);
  let cache;
  let response;
  try { cache = await caches.open("gsat-kokoro-pinned-voices-v1"); response = await cache.match(url); } catch {}
  if (!response) {
    response = await fetch(url);
    if (!response.ok) throw new Error(`Voice download failed (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength % 1024 || buffer.byteLength < 510 * 1024) throw new Error("Invalid Kokoro voice tensor");
  const voice = new Float32Array(buffer);
  if (voice.some(value => !Number.isFinite(value))) throw new Error("Invalid Kokoro voice values");
  if (cache) { try { await cache.put(url, new Response(buffer, { headers: response.headers })); } catch {} }
  voiceCache.set(url, voice);
  return voice;
}

export async function createLocalVoice(config, progress_callback) {
  const remote = config.source === "huggingface";
  env.allowRemoteModels = remote;
  env.allowLocalModels = !remote;
  env.useBrowserCache = true;
  env.localModelPath = new URL("../../models/", import.meta.url).href;
  env.backends.onnx.wasm.wasmPaths = new URL("./", import.meta.url).href;
  env.backends.onnx.wasm.numThreads = 1;
  env.backends.onnx.wasm.proxy = false;
  const modelId = remote ? config.modelId : "kokoro";
  const options = { dtype: config.dtype, device: "webgpu", progress_callback,
    ...(remote ? { revision: config.revision } : { local_files_only: true }) };
  const initialized = await Promise.allSettled([
    StyleTextToSpeech2Model.from_pretrained(modelId, options),
    AutoTokenizer.from_pretrained(modelId, { progress_callback,
      ...(remote ? { revision: config.revision } : { local_files_only: true }) }),
  ]);
  const failed = initialized.find(result => result.status === "rejected");
  if (failed) {
    if (initialized[0].status === "fulfilled") await initialized[0].value.dispose();
    throw failed.reason;
  }
  const [model, tokenizer] = initialized.map(result => result.value);
  const voiceURL = remote
    ? `https://huggingface.co/${config.modelId}/resolve/${config.revision}/voices/${config.voice}.bin`
    : new URL(`../../models/kokoro/voices/${config.voice}.bin`, import.meta.url).href;
  // Upstream kokoro-js 1.2.1 fetches voices from resolve/main. Replace that method with a pinned source.
  let voices;
  try { voices = await loadVoice(voiceURL); }
  catch (error) { await model.dispose(); throw error; }
  const tts = new KokoroTTS(model, tokenizer);
  tts.generate_from_ids = async (input_ids, { voice = config.voice, speed = 1 } = {}) => {
    if (voice !== config.voice) throw new Error("Only the configured local voice is available");
    const offset = 256 * Math.min(Math.max(input_ids.dims.at(-1) - 2, 0), 509);
    const style = new Tensor("float32", voices.slice(offset, offset + 256), [1, 256]);
    const { waveform } = await model({ input_ids, style, speed: new Tensor("float32", [speed], [1]) });
    return { audio: waveform.data, sampling_rate: 24000 };
  };
  tts.dispose = () => model.dispose();
  return tts;
}
