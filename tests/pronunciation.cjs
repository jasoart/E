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
const commonsRecording = (word, accent = 'us') => ({ query: { pages: { 42: { pageid: 42, ns: 6, title: `File:En-${accent}-${word}.ogg`, imageinfo: [{
  url: `https://upload.wikimedia.org/wikipedia/commons/a/ab/En-${accent}-${word}.ogg`,
  descriptionurl: `https://commons.wikimedia.org/wiki/File:En-${accent}-${word}.ogg`, mime: 'application/ogg', mediatype: 'AUDIO',
  extmetadata: { LicenseShortName: { value: 'CC BY-SA 3.0' }, LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/3.0/' }, Artist: { value: '<a href="/wiki/User:Reader">Example Reader</a>' } }
}] } } } });
function button() {
  const item = { classes: new Set(), attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } };
  item.classList = { toggle(name, active) { active ? item.classes.add(name) : item.classes.delete(name); } };
  return item;
}
function environment(options = {}) {
  const requests = [], audio = [], spoken = [], notices = [], statuses = [], timers = new Map(), listeners = new Map();
  let timerId = 0, nowMs = 0, voices = options.voices || [localVoice], cancelled = 0;
  const buttons = [button(), button()];
  class FakeAudio {
    constructor() { audio.push(this); this.pauseCount = 0; this.playCount = 0; }
    pause() { this.pauseCount++; }
    removeAttribute(name) { if (name === 'src') this.src = ''; }
    load() { this.loaded = true; }
    play() {
      this.playCount++;
      if (options.failGstatic && this.src.includes('ssl.gstatic.com')) return Promise.reject(new Error('Static file missing'));
      if (options.audioResult) return options.audioResult(this, audio.length);
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
  // Existing metadata-provider tests select dictionary explicitly; default-provider tests opt into empty storage.
  const stored = options.storedPreferences ?? (options.auto ? null : JSON.stringify({source: 'dictionary'}));
  const storage = new Map(stored ? [['gsat-pronunciation-preferences-v1', stored]] : []);
  const window = { Audio: FakeAudio, SpeechSynthesisUtterance: function(text) { this.text = text; }, speechSynthesis: synthesis,
    localStorage: { getItem: key => storage.get(key), setItem(key, value) { if (options.storageThrows) throw new Error('Storage denied'); storage.set(key, value); } } };
  if (options.noSpeech) { delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; }
  if (options.noAudio) delete window.Audio;
  const context = vm.createContext({ window, URL, AbortController, Date: class extends Date { static now() { return nowMs; } }, state: { audioSession: 0, currentAudio: null },
    fetch: async (url, init) => {
      requests.push({ url, init });
      if (options.fetch) return options.fetch(url, init);
      if (url.startsWith('https://commons.wikimedia.org/')) return { ok: true, json: async () => ({ query: { pages: {} } }) };
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
  return { context, requests, audio, spoken, notices, statuses, timers, listeners, buttons, storage, run,
    setVoices(value) { voices = value; },
    voicesChanged() { listeners.get('voiceschanged')?.(); },
    runTimers(delay) { nowMs += delay; for (const [id, timer] of [...timers]) if (timer.delay === delay) { timers.delete(id); timer.fn(); } },
    cancelled: () => cancelled,
  };
}

test('startup creates no media, fetches nothing, and never loads speech engines',()=>{
 const e=environment();assert.equal(e.audio.length,0);assert.equal(e.requests.length,0);assert.equal(e.spoken.length,0);
 assert.doesNotMatch(source,/speechSynthesis|SpeechSynthesisUtterance|import\(|dictionaryapi|wikimedia|local-tts/);
});
test('single US words first use Google dictionary media with no inferred license',async()=>{
 const e=environment();await e.run("speakWord('challenge',primaryButton)");
 assert.equal(e.audio.length,1);assert.equal(e.requests.length,0);assert.equal(e.spoken.length,0);
 const status=e.run('localVoiceStatus()');assert.equal(status.source,'gstatic');
 assert.equal(status.audioUrl,'https://ssl.gstatic.com/dictionary/static/sounds/oxford/challenge--_us_1.mp3');
 assert.equal(status.sourceUrl,status.audioUrl);assert.equal(status.licenseName,'');assert.equal(status.state,'ready');assert.equal(e.timers.size,0);
});
test('missing Google dictionary media falls back only to Google TTS media',async()=>{
 const e=environment({failGstatic:true});await e.run("speakWord('study',primaryButton)");
 assert.equal(e.audio.length,2);const status=e.run('localVoiceStatus()');assert.equal(status.source,'google');
 const url=new URL(status.audioUrl);assert.equal(url.hostname,'translate.google.com');assert.equal(url.searchParams.get('q'),'study');
 assert.equal(e.requests.length,0);assert.equal(e.spoken.length,0);assert.equal(e.timers.size,0);
});
test('sentences and phrases use Google audio with all text preserved across short chunks',async()=>{
 const e=environment();const text=Array(25).fill('Students compare several useful examples before writing their own sentences.').join(' ');
 e.context.text=text.slice(0,580);await e.run('speakSentence(text,primaryButton)');
 assert.ok(e.audio.length>1);assert.ok(e.statuses.filter(s=>s.audioUrl).every(s=>new URL(s.audioUrl).hostname==='translate.google.com'));
 const chunks=e.statuses.filter(s=>s.state==='playing').map(s=>new URL(s.audioUrl).searchParams.get('q'));
 assert.equal(chunks.join(' '),e.context.text.trim());assert.ok(chunks.every(x=>x.length<=180));assert.equal(e.spoken.length,0);
});
test('old provider preferences migrate to Google while retaining accent and speed',async()=>{
 for(const source of ['auto','device','dictionary','commons','gstatic']){
  const e=environment({storedPreferences:JSON.stringify({source,accent:'en-GB',rate:0.7})});
  assert.equal(e.run('getPronunciationPreferences().source'),'google');
  await e.run("speakWord('study',primaryButton)");
  assert.equal(e.audio.length,1);const status=e.run('localVoiceStatus()');const url=new URL(status.audioUrl);
  assert.equal(url.hostname,'translate.google.com');assert.equal(url.searchParams.get('tl'),'en-GB');assert.equal(e.audio[0].playbackRate,0.7);
 }
});
test('a network/media failure finishes with a visible error and no non-Google fallback',async()=>{
 const e=environment({audioMode:'reject'});await e.run("speakWord('study',primaryButton)");
 assert.equal(e.audio.length,2);assert.equal(e.run('localVoiceStatus().state'),'error');assert.match(e.notices[0],/Google/);
 assert.equal(e.spoken.length,0);assert.equal(e.requests.length,0);assert.equal(e.buttons[0].attributes['aria-pressed'],'false');assert.equal(e.timers.size,0);
});
test('stopping a stalled request cancels the player and prevents late fallback',async()=>{
 const e=environment({audioMode:'hang'});const work=e.run("speakWord('study',primaryButton)");await tick();
 const stale=e.audio[0];e.run('stopPronunciation()');await work;
 assert.ok(stale.pauseCount>0);assert.equal(stale.src,'');assert.equal(e.audio.length,1);assert.equal(e.timers.size,0);assert.equal(e.run('localVoiceStatus().state'),'idle');
});
test('switching words cancels previous media and cannot repaint the new status',async()=>{
 const e=environment({audioResult:(audio,n)=>n===1?new Promise(()=>{}):Promise.resolve().then(()=>queueMicrotask(()=>audio.onended?.()))});
 const first=e.run("speakWord('study',primaryButton)");await tick();const old=e.audio[0];
 const second=e.run("speakWord('learn',otherButton)");await Promise.all([first,second]);
 assert.ok(old.pauseCount>0);assert.equal(e.run('localVoiceStatus().state'),'ready');assert.match(e.run('localVoiceStatus().audioUrl'),/learn--/);assert.equal(e.timers.size,0);
});
test('media start and end timeouts clear every timer and expose failures',async()=>{
 for(const mode of ['hang','stall']){
  const e=environment({audioMode:mode});const work=e.run("speakSentence('A useful sentence for listening practice.',primaryButton)");await tick();
  e.runTimers(mode==='hang'?5000:45000);await work;assert.equal(e.run('localVoiceStatus().state'),'error');assert.equal(e.timers.size,0);
 }
});
test('unapproved URLs cannot reach the audio constructor',async()=>{
 const e=environment();for(const url of ['http://ssl.gstatic.com/test.mp3','https://ssl.gstatic.com.evil.example/dictionary/static/sounds/oxford/study--_us_1.mp3','https://user:password@ssl.gstatic.com/dictionary/static/sounds/oxford/study--_us_1.mp3','https://upload.wikimedia.org/test.ogg','https://translate.google.com/other','https://translate.google.com/translate_tts?client=evil&tl=en-US&q=study']){
  e.context.url=url;await assert.rejects(e.run('playDictionaryPronunciation({audioUrl:url},primaryButton,state.audioSession)'));
 }
 assert.equal(e.audio.length,0);
});
test('unsupported browsers and excessive inputs report limits without a request',async()=>{
 const e=environment({noAudio:true});await e.run("speakWord('study',primaryButton)");assert.equal(e.run('localVoiceStatus().state'),'unavailable');
 const valid=environment();await valid.run('speakSentence("x".repeat(601),primaryButton)');assert.equal(valid.audio.length,0);assert.match(valid.notices[0],/600/);
});
