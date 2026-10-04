const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
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
function audioEnvironment(voices = [{ name: 'Local English', lang: 'en-US', localService: true }]) {
  const spoken = [], notices = [], sources = [], events = [];
  const button = { isConnected: true, classes: new Set(), setAttribute() {}, classList: { toggle(name, active) { if (active) button.classes.add(name); else button.classes.delete(name); } } };
  class AudioContext {
    state = 'running'; destination = {};
    resume() { events.push('resume'); return Promise.resolve(); }
    createBuffer() { return { copyToChannel() {} }; }
    createBufferSource() { const source = { connect() {}, disconnect() {}, start() { events.push('play'); }, stop() { events.push('stop'); } }; sources.push(source); return source; }
  }
  const context = vm.createContext({ state: { audioSession: 0 }, window: { AudioContext, SpeechSynthesisUtterance: function(text) { this.text = text; }, speechSynthesis: { getVoices: () => voices, cancel() {}, speak: utterance => spoken.push(utterance), addEventListener() {}, removeEventListener() {} } },
    document: { querySelectorAll: () => [button], documentElement: { dataset: {} }, dispatchEvent() {} },
    showToast: text => notices.push(text), spokenForm: word => word, setTimeout: fn => { queueMicrotask(fn); return 1; }, clearTimeout() {}, console });
  vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../assets/js/audio.js'), 'utf8'), context);
  return { context, button, spoken, notices, sources, events, run: code => vm.runInContext(code, context) };
}
test('word and sentence playback use a local English voice without external audio requests', async () => {
  const e = audioEnvironment(); e.context.button = e.button;
  await e.run("speakWord('study', button)"); await e.run("speakSentence('Students should compare reliable sources.', button)");
  assert.deepEqual(e.spoken.map(item => item.text), ['study', 'Students should compare reliable sources.']);
  assert.ok(e.spoken.every(item => item.voice.localService));
  const source = fs.readFileSync(path.resolve(__dirname, '../assets/js/audio.js'), 'utf8');
  assert.ok(!source.includes('audio.src')); assert.ok(!/fetch\(|https?:\/\//.test(source));
});
test('browser fallback rejects remote English voices', async () => {
  const e = audioEnvironment([{ name: 'Cloud voice', lang: 'en-US', localService: false }]);
  await e.run("speakWord('study')"); assert.equal(e.spoken.length, 0); assert.match(e.notices[0], /本機英文聲線/);
});
test('a stale GPU synthesis cannot play after switching words or stopping', async () => {
  const e = audioEnvironment(); const gate = deferred(); e.context.mockEngine = { ready: true, cancel() {}, generate: async () => { e.events.push('generate'); await gate.promise; return { samples: new Float32Array([.1]), sampleRate: 24000 }; } }; e.context.button = e.button;
  e.run('localVoiceEngine = mockEngine'); const work = e.run("speakSentence('An old sentence.', button)");
  await tick(); e.run('stopPronunciation()'); gate.resolve(); await work;
  assert.deepEqual(e.events, ['resume', 'generate']); assert.equal(e.sources.length, 0);
});
test('audio is unlocked during the click before inference, and stop disconnects playback', async () => {
  const e = audioEnvironment(); e.context.mockEngine = { ready: true, cancel() {}, generate: async () => { e.events.push('generate'); return { samples: new Float32Array([.1]), sampleRate: 24000 }; } }; e.context.button = e.button;
  e.run('localVoiceEngine = mockEngine'); await e.run("speakSentence('A current sentence.', button)");
  assert.deepEqual(e.events, ['resume', 'generate', 'play']); e.run('stopPronunciation()'); assert.equal(e.events.at(-1), 'stop');
});
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
