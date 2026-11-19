const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createHash } = require('node:crypto');
const modulePromise = import(pathToFileURL(path.resolve(__dirname, '../assets/js/local-tts.js')).href);
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
function setup(options = {}) {
  const events = [], calls = [];
  const runtime = options.runtime || { generate: async text => { calls.push(text); return { audio: new Float32Array([0, .1, -.1]), sampling_rate: 24000 }; } };
  return { events, calls, runtime, options: {
    navigator: { gpu: { requestAdapter: async () => ({}) } }, secureContext: true,
    loadRuntime: async () => ({ createLocalVoice: async (config, progress) => { events.push(config); progress({ status: 'progress', progress: 50 }); return runtime; } }),
    onStatus: status => events.push(status), ...options,
  } };
}
test('page construction and not-ready playback never download speech assets', async () => {
  const { LocalVoiceEngine } = await modulePromise;
  let requested = 0;
  const engine = new LocalVoiceEngine({ navigator: { gpu: { requestAdapter: () => { requested++; } } }, loadRuntime: () => { requested++; } });
  assert.equal(engine.status.state, 'idle');
  await assert.rejects(engine.generate('study'), error => error.code === 'not-ready');
  assert.equal(requested, 0);
});
test('insecure contexts and missing or null GPU adapters fail before loading the bundle', async () => {
  const { LocalVoiceEngine } = await modulePromise;
  for (const options of [{ secureContext: false }, { navigator: {} }, { navigator: { gpu: { requestAdapter: async () => null } } }, { navigator: { gpu: { requestAdapter: async () => { throw new Error('GPU denied'); } } } }]) {
    let imports = 0;
    const engine = new LocalVoiceEngine({ secureContext: true, navigator: { gpu: { requestAdapter: async () => ({}) } }, ...options, loadRuntime: async () => { imports++; } });
    await assert.rejects(engine.initialize(), error => error.code === 'unsupported');
    assert.equal(engine.status.state, 'unsupported');
    assert.equal(imports, 0);
  }
});
test('explicit initialization is shared, pins the official fp32 model, and reports ready', async () => {
  const { LocalVoiceEngine, LOCAL_VOICE_CONFIG } = await modulePromise;
  const gate = deferred(); let imports = 0;
  const { options, events, runtime } = setup({ loadRuntime: async () => { imports++; await gate.promise; return { createLocalVoice: async config => { events.push(config); return runtime; } }; } });
  const engine = new LocalVoiceEngine(options);
  const first = engine.initialize(), second = engine.initialize(); gate.resolve();
  await Promise.all([first, second]);
  assert.equal(imports, 1); assert.equal(engine.ready, true);
  assert.equal(events.find(event => event.modelId).revision, LOCAL_VOICE_CONFIG.revision);
  assert.equal(LOCAL_VOICE_CONFIG.dtype, 'fp32'); assert.equal(LOCAL_VOICE_CONFIG.device, 'webgpu');
  assert.equal((await engine.generate('Schools should protect personal data.')).sampleRate, 24000);
});
test('a failed load can be retried and never appears ready', async () => {
  const { LocalVoiceEngine } = await modulePromise;
  let attempts = 0; const { options, runtime } = setup({ loadRuntime: async () => { if (!attempts++) throw new Error('download failed'); return { createLocalVoice: async () => runtime }; } });
  const engine = new LocalVoiceEngine(options);
  await assert.rejects(engine.initialize()); assert.equal(engine.ready, false); assert.equal(engine.status.state, 'error');
  await engine.initialize(); assert.equal(engine.ready, true);
});
test('stopping an in-flight synthesis discards its PCM output', async () => {
  const { LocalVoiceEngine } = await modulePromise;
  const gate = deferred(); const { options } = setup({ runtime: { generate: async () => { await gate.promise; return { audio: new Float32Array([.1]), sampling_rate: 24000 }; } } });
  const engine = new LocalVoiceEngine(options); await engine.initialize();
  const work = engine.generate('Stop this sentence.'); await tick(); engine.cancel(); gate.resolve();
  await assert.rejects(work, error => error.code === 'cancelled');
});
test('rapid sentence changes serialize inference and skip superseded queued requests', async () => {
  const { LocalVoiceEngine } = await modulePromise;
  const gate = deferred(); const calls = [];
  const { options } = setup({ runtime: { generate: async text => { calls.push(text); if (text === 'first') await gate.promise; return { audio: new Float32Array([.1]), sampling_rate: 24000 }; } } });
  const engine = new LocalVoiceEngine(options); await engine.initialize();
  const first = engine.generate('first').catch(error => error.code); await tick();
  const second = engine.generate('second').catch(error => error.code); const third = engine.generate('third'); gate.resolve();
  assert.equal(await first, 'cancelled'); assert.equal(await second, 'cancelled'); assert.ok((await third).samples.length);
  assert.deepEqual(calls, ['first', 'third']);
});
test('input limits and malformed PCM do not reach audio playback', async () => {
  const { LocalVoiceEngine } = await modulePromise;
  const { options, calls } = setup(); const engine = new LocalVoiceEngine(options); await engine.initialize();
  await assert.rejects(engine.generate('x'.repeat(601)), error => error.code === 'input');
  await assert.rejects(engine.generate(''), error => error.code === 'input');
  await assert.rejects(engine.generate('study', { speed: 2 }), error => error.code === 'input'); assert.equal(calls.length, 0);
  for (const audio of [{ audio: new Float32Array([NaN]), sampling_rate: 24000 }, { audio: [], sampling_rate: 24000 }, { audio: new Float32Array([0]), sampling_rate: 16000 }]) {
    const { options } = setup({ runtime: { generate: async () => audio } }); const invalid = new LocalVoiceEngine(options); await invalid.initialize();
    await assert.rejects(invalid.generate('study'), error => error.code === 'output');
  }
});
// Current application playback, cancellation and offline fallback are exercised
// in pronunciation.cjs. These tests retain the archived LocalVoiceEngine checks.
test('the shipped speech runtime artifacts match their recorded byte counts and SHA-256 hashes', () => {
  const directory = path.resolve(__dirname, '../assets/vendor/kokoro');
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'runtime-manifest.json'), 'utf8'));
  for (const artifact of manifest.files) {
    const buffer = fs.readFileSync(path.join(directory, artifact.name));
    assert.equal(buffer.length, artifact.bytes, artifact.name);
    assert.equal(createHash('sha256').update(buffer).digest('hex'), artifact.sha256, artifact.name);
  }
  assert.ok(manifest.files.some(artifact => artifact.name.endsWith('.jsep.wasm')));
});
