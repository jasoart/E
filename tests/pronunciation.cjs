const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const tick = () => new Promise(resolve => setImmediate(resolve));
const source = fs.readFileSync(path.resolve(__dirname, '../assets/js/audio.js'), 'utf8');
const config = fs.readFileSync(path.resolve(__dirname, '../assets/js/config.js'), 'utf8');
const localVoice = { name: 'Installed US English', lang: 'en-US', localService: true };
const recording = (word, extra = {}) => [{ word, phonetics: [{ audio: `https://api.dictionaryapi.dev/media/pronunciations/en/${word}-us.mp3`, sourceUrl: `https://commons.wikimedia.org/wiki/File:En-us-${word}.ogg`, license: { name: 'CC BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/' }, ...extra }] }];
function button() {
  const item = { classes: new Set(), attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } };
  item.classList = { toggle(name, active) { active ? item.classes.add(name) : item.classes.delete(name); } };
  return item;
}
function environment(options = {}) {
  const requests = [], audio = [], spoken = [], notices = [], statuses = [], timers = new Map(), listeners = new Map();
  let timerId = 0, voices = options.voices || [localVoice], cancelled = 0;
  const buttons = [button(), button()];
  class FakeAudio {
    constructor() { audio.push(this); this.pauseCount = 0; this.playCount = 0; }
    pause() { this.pauseCount++; }
    removeAttribute(name) { if (name === 'src') this.src = ''; }
    load() { this.loaded = true; }
    play() {
      this.playCount++;
      if (options.audioMode === 'reject') return Promise.reject(new Error('Media unavailable'));
      if (options.audioMode === 'hang') return new Promise(() => {});
      queueMicrotask(() => {
        this.onplaying?.();
        if (options.audioMode === 'error-after-start') queueMicrotask(() => this.onerror?.());
        else if (options.audioMode !== 'stall') queueMicrotask(() => this.onended?.());
      });
      return Promise.resolve();
    }
  }
  const synthesis = {
    getVoices() { return voices; },
    cancel() { cancelled++; },
    speak(utterance) { if (options.speechThrows) throw new Error('Speech unavailable'); spoken.push(utterance); },
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name, fn) { if (listeners.get(name) === fn) listeners.delete(name); },
  };
  const window = { Audio: FakeAudio, SpeechSynthesisUtterance: function(text) { this.text = text; }, speechSynthesis: synthesis };
  if (options.noSpeech) { delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; }
  if (options.noAudio) delete window.Audio;
  const context = vm.createContext({ window, URL, AbortController, state: { audioSession: 0, currentAudio: null },
    fetch: async (url, init) => {
      requests.push({ url, init });
      if (options.fetch) return options.fetch(url, init);
      return { ok: true, json: async () => recording(decodeURIComponent(url.split('/').at(-1))) };
    },
    document: { querySelectorAll: () => buttons, dispatchEvent: event => statuses.push(event.detail) },
    CustomEvent: function(type, detail) { this.type = type; this.detail = detail.detail; },
    showToast: text => notices.push(text), spokenForm: word => String(word).split('/')[0],
    setTimeout: (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id; }, clearTimeout: id => timers.delete(id), console,
  });
  vm.runInContext(config, context); vm.runInContext(source, context);
  const run = code => vm.runInContext(code, context);
  context.primaryButton = buttons[0]; context.otherButton = buttons[1];
  return { context, requests, audio, spoken, notices, statuses, timers, listeners, buttons, run,
    setVoices(value) { voices = value; },
    voicesChanged() { listeners.get('voiceschanged')?.(); },
    runTimers(delay) { for (const [id, timer] of [...timers]) if (timer.delay === delay) { timers.delete(id); timer.fn(); } },
    cancelled: () => cancelled,
  };
}

test('loading the pronunciation runtime never fetches, creates media, or loads a model', () => {
  const e = environment();
  assert.equal(e.requests.length, 0); assert.equal(e.audio.length, 0); assert.equal(e.spoken.length, 0);
  assert.equal(e.run('localVoiceStatus().state'), 'idle');
  assert.ok(!/import\(|local-tts|WebGPU|huggingface/.test(source));
});
test('a clicked word plays the US dictionary recording and exposes its real attribution', async () => {
  const e = environment({ fetch: async () => ({ ok: true, json: async () => [{ word: 'study', phonetics: [
    { audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/study-uk.mp3' }, ...recording('study')[0].phonetics,
  ] }] }) });
  await e.run("speakWord('study', primaryButton)");
  assert.equal(e.requests.length, 1); assert.match(e.requests[0].url, /\/entries\/en\/study$/);
  assert.equal(e.requests[0].init.credentials, 'omit'); assert.equal(e.requests[0].init.redirect, 'error');
  assert.equal(e.audio.length, 1); assert.equal(e.audio[0].playCount, 1); assert.equal(e.spoken.length, 0);
  const playing = e.statuses.find(status => status.state === 'playing');
  assert.equal(playing.source, 'dictionary'); assert.match(playing.audioUrl, /study-us\.mp3$/);
  assert.match(playing.sourceUrl, /commons.wikimedia.org/); assert.equal(playing.licenseName, 'CC BY-SA 3.0');
  assert.equal(e.run('localVoiceStatus().state'), 'ready'); assert.equal(e.buttons[0].attributes['aria-pressed'], 'false');
  assert.equal(e.run('state.currentAudio'), null); assert.equal(e.timers.size, 0);
});
test('repeated explicit clicks reuse bounded recording metadata without background audio downloads', async () => {
  const e = environment();
  await e.run("speakWord('study', primaryButton)"); await e.run("speakWord('study', primaryButton)");
  assert.equal(e.requests.length, 1); assert.equal(e.audio.length, 2);
  e.run("for(let n=0;n<PRONUNCIATION_CONFIG.cacheSize;n++)dictionaryRecordingCache.set('fixture'+n,{})");
  await e.run("speakWord('challenge', primaryButton)");
  assert.equal(e.run("dictionaryRecordingCache.has('study')"), false);
});
test('a lexical entry license is never presented as the recording license', async () => {
  const e = environment({ fetch: async () => ({ ok: true, json: async () => [{ word: 'study', license: { name: 'Data license', url: 'https://creativecommons.org/licenses/by-sa/3.0/' }, sourceUrls: ['https://en.wiktionary.org/wiki/study'], phonetics: [{ audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/study-us.mp3' }] }] }) });
  await e.run("speakWord('study', primaryButton)");
  const status = e.run('localVoiceStatus()');
  assert.equal(status.licenseName, ''); assert.equal(status.licenseUrl, '');
  assert.equal(status.sourceUrl, status.audioUrl);
});
test('phrases and complete sentences use only an installed English voice', async () => {
  const e = environment();
  await e.run("speakWord('tight schedule', primaryButton)");
  await e.run("speakSentence('Pets can provide companionship during difficult times.', otherButton)");
  assert.deepEqual(e.spoken.map(item => item.text), ['tight schedule', 'Pets can provide companionship during difficult times.']);
  assert.ok(e.spoken.every(item => item.voice.localService && item.rate === 0.82));
  assert.equal(e.requests.length, 0); assert.equal(e.audio.length, 0);
  assert.equal(e.run('localVoiceStatus().source'), 'device');
  e.spoken.at(-1).onend(); assert.equal(e.buttons[1].attributes['aria-pressed'], 'false');
});
test('network, JSON, absent recordings, wrong headwords and untrusted media fail over to the device', async () => {
  const failures = [
    async () => { throw new Error('Offline'); },
    async () => ({ ok: false }),
    async () => ({ ok: true, json: async () => { throw new Error('Invalid JSON'); } }),
    async () => ({ ok: true, json: async () => [{ word: 'study', phonetics: [] }] }),
    async () => ({ ok: true, json: async () => recording('unrelated') }),
    async () => ({ ok: true, json: async () => recording('study', { audio: 'https://untrusted.example/study.mp3' }) }),
  ];
  for (const fetch of failures) {
    const e = environment({ fetch }); await e.run("speakWord('study', primaryButton)");
    assert.equal(e.audio.length, 0); assert.equal(e.spoken.length, 1); assert.equal(e.spoken[0].text, 'study');
    assert.equal(e.run('localVoiceStatus().source'), 'device'); assert.match(e.run('localVoiceStatus().message'), /字典/);
    assert.equal(e.run('localVoiceStatus().sourceUrl'), ''); e.run('stopPronunciation()');
  }
});
test('audio URL checks accept only HTTPS allowlisted hosts without embedded credentials', () => {
  const e = environment();
  for (const url of ['http://api.dictionaryapi.dev/audio.mp3', 'javascript:alert(1)', 'https://api.dictionaryapi.dev.evil.example/audio.mp3', 'https://user:password@api.dictionaryapi.dev/audio.mp3', 'https://api.dictionaryapi.dev:444/audio.mp3']) {
    e.context.url = url; assert.equal(e.run('safeDictionaryAudioUrl(url)'), '');
  }
  assert.equal(e.run("safeDictionaryAudioUrl('//upload.wikimedia.org/example.ogg')"), 'https://upload.wikimedia.org/example.ogg');
});
test('a hanging lookup times out, aborts the request, and falls back once', async () => {
  const e = environment({ fetch: async () => new Promise(() => {}) });
  const work = e.run("speakWord('study', primaryButton)"); await tick(); e.runTimers(3500); await work;
  assert.equal(e.requests[0].init.signal.aborted, true); assert.equal(e.spoken.length, 1); assert.equal(e.audio.length, 0);
  e.run('stopPronunciation()'); assert.equal(e.timers.size, 0);
});
test('rejected, hanging and stalled recording playback release media and fall back once', async () => {
  for (const audioMode of ['reject', 'hang', 'stall', 'error-after-start']) {
    const e = environment({ audioMode }); const work = e.run("speakWord('study', primaryButton)");
    await tick(); if (audioMode === 'hang') e.runTimers(5000); if (audioMode === 'stall') e.runTimers(18000); await work;
    assert.equal(e.spoken.length, 1, audioMode); assert.equal(e.run('state.currentAudio'), null);
    assert.ok(e.audio[0].pauseCount > 0); assert.equal(e.audio[0].src, '');
    assert.equal(e.run('localVoiceStatus().source'), 'device'); e.run('stopPronunciation()');
  }
});
test('switching words while lookup is pending aborts and discards stale recordings', async () => {
  let deliver;
  const e = environment({ fetch: async url => url.endsWith('/old') ? new Promise(resolve => { deliver = resolve; }) : { ok: true, json: async () => recording('current') } });
  const old = e.run("speakWord('old', primaryButton)"); await tick();
  await e.run("speakWord('current', otherButton)"); await old;
  assert.equal(e.requests[0].init.signal.aborted, true);
  deliver({ ok: true, json: async () => recording('old') }); await tick();
  assert.equal(e.audio.length, 1); assert.equal(e.spoken.length, 0);
  assert.match(e.statuses.find(status => status.state === 'playing').audioUrl, /current-us/);
  assert.equal(e.buttons[0].attributes['aria-pressed'], 'false');
});
test('stop releases a pending media player and prevents late play events and device fallback', async () => {
  const e = environment({ audioMode: 'hang' }); const work = e.run("speakWord('study', primaryButton)"); await tick();
  const stalePlaying = e.audio[0].onplaying; e.run('stopPronunciation()'); await work; stalePlaying();
  assert.equal(e.spoken.length, 0); assert.equal(e.run('state.currentAudio'), null);
  assert.equal(e.run('localVoiceStatus().state'), 'idle'); assert.equal(e.buttons[0].attributes['aria-pressed'], 'false');
  assert.equal(e.timers.size, 0);
});
test('late local voices are discovered without selecting a remote or non-English default voice', async () => {
  const e = environment({ voices: [{ name: 'Cloud English', lang: 'en-US', localService: false }, { name: 'Chinese', lang: 'zh-TW', localService: true }] });
  const work = e.run("speakSentence('Communication can prevent conflict.', primaryButton)"); await tick();
  e.voicesChanged(); assert.equal(e.spoken.length, 0); assert.equal(e.listeners.size, 1);
  e.setVoices([localVoice]); e.voicesChanged(); await work;
  assert.equal(e.spoken.length, 1); assert.equal(e.spoken[0].voice, localVoice); assert.equal(e.listeners.size, 0);
});
test('missing local voices and unsupported speech produce an informative unavailable state', async () => {
  const missing = environment({ noAudio: true, voices: [{ lang: 'en-US', localService: false }] });
  const work = missing.run("speakWord('study', primaryButton)"); await tick(); missing.runTimers(1200); await work;
  assert.equal(missing.spoken.length, 0); assert.match(missing.notices[0], /本機英文聲線/);
  assert.equal(missing.run('localVoiceStatus().state'), 'unavailable');
  const unsupported = environment({ noSpeech: true, noAudio: true }); await unsupported.run("speakWord('study', primaryButton)");
  assert.equal(unsupported.run('localVoiceStatus().state'), 'unavailable'); assert.match(unsupported.notices[0], /不支援裝置語音/);
});
test('dictionary recordings still play when browser speech synthesis is unsupported', async () => {
  const e = environment({ noSpeech: true }); await e.run("speakWord('study', primaryButton)");
  assert.equal(e.audio.length, 1); assert.equal(e.run('localVoiceStatus().source'), 'dictionary');
});
test('stopping while voices load prevents a later utterance, including a stale event', async () => {
  const e = environment({ voices: [] }); const work = e.run("speakSentence('An old sentence.', primaryButton)"); await tick();
  const staleChanged = e.listeners.get('voiceschanged'); e.run('stopPronunciation()'); await work;
  e.setVoices([localVoice]); staleChanged(); assert.equal(e.spoken.length, 0); assert.equal(e.timers.size, 0);
});
test('speech errors clear button state; stale completion cannot clear a newer active word', async () => {
  const e = environment({ noAudio: true }); await e.run("speakWord('old', primaryButton)");
  const old = e.spoken[0]; await e.run("speakWord('current', otherButton)"); old.onerror({ error: 'synthesis-failed' });
  assert.equal(e.buttons[1].attributes['aria-pressed'], 'true'); assert.equal(e.notices.length, 0);
  e.spoken[1].onerror({ error: 'synthesis-failed' }); assert.equal(e.buttons[1].attributes['aria-pressed'], 'false');
  assert.equal(e.run('localVoiceStatus().state'), 'error'); assert.equal(e.notices.length, 1);
});
test('speech watchdog and synchronous speech errors report failure without hanging buttons', async () => {
  const stalled = environment({ noAudio: true }); await stalled.run("speakWord('study', primaryButton)"); stalled.runTimers(30000);
  assert.equal(stalled.run('localVoiceStatus().state'), 'error'); assert.equal(stalled.buttons[0].attributes['aria-pressed'], 'false');
  const broken = environment({ noAudio: true, speechThrows: true }); await broken.run("speakWord('study', primaryButton)");
  assert.equal(broken.run('localVoiceStatus().state'), 'error'); assert.equal(broken.buttons[0].attributes['aria-pressed'], 'false');
});
test('empty and oversized input cannot fetch audio or cancel currently playing audio', async () => {
  const e = environment(); await e.run("speakWord('', primaryButton)"); await e.run("speakSentence('x'.repeat(601), primaryButton)");
  assert.equal(e.requests.length, 0); assert.equal(e.audio.length, 0); assert.equal(e.spoken.length, 0);
  assert.equal(e.run('state.audioSession'), 0); assert.equal(e.notices.length, 2);
});
