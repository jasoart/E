"use strict";

// API responses live in their own database. Learning records stay in the
// original localStorage keys. Failed/aborted requests are never persisted.
const ApiClient = (() => {
  const memory = new Map(), pending = new Map(), queue = [], hosts = new Map();
  const cooldown = new Map();
  const MAX_MEMORY = 180, MAX_DISK = 300, MAX_ACTIVE = 6, MAX_HOST = 2;
  let active = 0, dbPromise;
  const aborted = () => new DOMException("Request cancelled", "AbortError");
  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(resolve => {
      if (!("indexedDB" in globalThis)) return resolve(null);
      let done = false;
      const finish = value => { if (!done) { done = true; clearTimeout(timer); resolve(value); } else if (value) value.close(); };
      const timer = setTimeout(() => finish(null), 300);
      try {
        const request = indexedDB.open("gsat-online-cache-v5", 1);
        request.onupgradeneeded = () => {
          const store = request.result.createObjectStore("responses", { keyPath: "key" });
          store.createIndex("savedAt", "savedAt");
        };
        request.onsuccess = () => finish(request.result);
        request.onerror = request.onblocked = () => finish(null);
      } catch { finish(null); }
    });
    return dbPromise;
  }
  function remember(record) {
    memory.delete(record.key); memory.set(record.key, record);
    while (memory.size > MAX_MEMORY) memory.delete(memory.keys().next().value);
  }
  async function readCache(key) {
    const local = memory.get(key);
    if (local && local.expiresAt > Date.now()) { remember(local); return local.result; }
    const db = await openDb();
    if (!db) return null;
    return new Promise(resolve => {
      const timer = setTimeout(() => resolve(null), 100);
      try {
        const request = db.transaction("responses").objectStore("responses").get(key);
        request.onsuccess = () => {
          clearTimeout(timer);
          const record = request.result;
          if (record && record.expiresAt > Date.now()) { remember(record); resolve(record.result); }
          else resolve(null);
        };
        request.onerror = () => { clearTimeout(timer); resolve(null); };
      } catch { clearTimeout(timer); resolve(null); }
    });
  }
  async function writeCache(key, result, ttl) {
    const record = { key, result, savedAt: Date.now(), expiresAt: Date.now() + ttl };
    remember(record);
    try {
      // Avoid letting a single unusual API response consume the whole quota.
      if (JSON.stringify(record).length > 400000) return;
      const db = await openDb(); if (!db) return;
      const tx = db.transaction("responses", "readwrite"), store = tx.objectStore("responses");
      store.put(record);
      const count = store.count();
      count.onsuccess = () => {
        let excess = count.result - MAX_DISK;
        if (excess <= 0) return;
        const cursor = store.index("savedAt").openCursor();
        cursor.onsuccess = () => { const item = cursor.result; if (item && excess-- > 0) { item.delete(); item.continue(); } };
      };
      tx.onerror = () => {}; // Quota failure does not touch favorites.
    } catch { /* Memory cache remains usable in private/restricted browsers. */ }
  }
  function ttlFor(url, result) {
    if (result.status === 404) return 5 * 60 * 1000;
    if (url.includes("translate.googleapis.com")) return 30 * 86400000;
    return url.includes("datamuse") ? 86400000 : 7 * 86400000;
  }
  function pump() {
    queue.sort((a, b) => a.priority - b.priority);
    for (let i = 0; i < queue.length;) {
      const job = queue[i];
      if (job.controller.signal.aborted) { queue.splice(i, 1); job.reject(aborted()); continue; }
      if (active >= MAX_ACTIVE) break;
      if ((hosts.get(job.host) || 0) >= MAX_HOST) { i++; continue; }
      queue.splice(i, 1); active++; hosts.set(job.host, (hosts.get(job.host) || 0) + 1);
      execute(job).then(job.resolve, job.reject).finally(() => {
        active--; hosts.set(job.host, hosts.get(job.host) - 1); pump();
      });
    }
  }
  async function execute(job) {
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; job.controller.abort(); }, job.timeoutMs);
    try {
      const response = await fetch(job.url, {
        headers: { Accept: "application/json" }, signal: job.controller.signal,
        credentials: "omit", referrerPolicy: "no-referrer"
      });
      if (response.status === 429 || response.status === 503) {
        const retry = response.headers.get("Retry-After");
        const delay = Number.isFinite(Number(retry)) && retry !== null ? Number(retry) * 1000 : Date.parse(retry) - Date.now();
        cooldown.set(job.host, Date.now() + Math.min(60000, Math.max(5000, delay || 15000)));
      }
      if (response.status === 404) return { payload: null, error: false, status: 404 };
      if (!response.ok) return { payload: null, error: true, status: response.status };
      if (!/json/i.test(response.headers.get("content-type") || "")) return { payload: null, error: true, status: response.status };
      return { payload: await response.json(), error: false, status: response.status };
    } catch (error) {
      if (job.controller.signal.aborted && !timedOut) throw aborted();
      return { payload: null, error: true, timeout: timedOut, status: 0 };
    } finally { clearTimeout(timer); }
  }
  function subscribe(job, signal) {
    job.readers++;
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (fn, value) => {
        if (settled) return; settled = true;
        signal?.removeEventListener("abort", cancel); job.readers--;
        if (!job.readers && !job.done) {
          job.controller.abort();
          if (pending.get(job.url) === job) pending.delete(job.url);
          pump();
        }
        fn(value);
      };
      const cancel = () => finish(reject, aborted());
      if (signal?.aborted) return cancel();
      signal?.addEventListener("abort", cancel, { once: true });
      job.promise.then(result => finish(resolve, result), error => finish(reject, error));
    });
  }
  async function get(url, signal, timeoutMs = 4200, options = {}) {
    if (signal?.aborted) throw aborted();
    if (!options.force) {
      const hit = await readCache(url);
      if (signal?.aborted) throw aborted();
      if (hit) return { ...hit, cached: true };
    }
    const host = new URL(url).host;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return {payload:null,error:true,status:0,offline:true};
    if ((cooldown.get(host) || 0) > Date.now()) return { payload: null, error: true, status: 429, cooldown: true };
    let job = pending.get(url);
    if (!job) {
      job = { url, host, timeoutMs, priority: options.priority ?? 1, controller: new AbortController(), readers: 0, done: false };
      const work = new Promise((resolve, reject) => { job.resolve = resolve; job.reject = reject; });
      job.promise = work.then(result => {
        if (!result.error && !job.controller.signal.aborted) void writeCache(url, result, ttlFor(url, result));
        return result;
      }).finally(() => { job.done = true; if (pending.get(url) === job) pending.delete(url); });
      pending.set(url, job); queue.push(job);
    }
    const result = subscribe(job, signal); pump(); return result;
  }
  return { get };
})();

function fetchJson(url, signal, timeoutMs = 4200, options = {}) {
  return ApiClient.get(url, signal, timeoutMs, options);
}
