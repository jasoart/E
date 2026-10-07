"use strict";

// One short session over curated chunks. Scheduling stays in the existing review
// queue: these records describe attempts, never an estimated memory probability.
const RETRIEVAL_PROGRESS_KEY = "gsat-notebook-retrieval-v1";
const RETRIEVAL_RECORD_LIMIT = 512;
const RETRIEVAL_STORAGE_LIMIT = 512 * 1024;
const RETRIEVAL_HOST_CLEANUP = new WeakMap();

function retrievalDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function retrievalText(value, limit) {
  return typeof value === "string" && value.trim() && value.length <= limit ? value.trim() : "";
}
function retrievalQuestionId(question) {
  return JSON.stringify([question.word, question.chunk, question.meaning]);
}
function readRetrievalProgress() {
  try {
    const raw = localStorage.getItem(RETRIEVAL_PROGRESS_KEY);
    if (!raw || raw.length > RETRIEVAL_STORAGE_LIMIT) return [];
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !Array.isArray(value.records)) return [];
    const records = new Map();
    for (const row of value.records.slice(-RETRIEVAL_RECORD_LIMIT)) {
      if (!row || typeof row !== "object") continue;
      const word = retrievalText(row.word, 100), chunk = retrievalText(row.chunk, 240), meaning = retrievalText(row.meaning, 240);
      if (!word || !chunk || !meaning || !["again", "good"].includes(row.result)) continue;
      if (!Number.isSafeInteger(row.attempts) || row.attempts < 1 || row.attempts > 10000) continue;
      if (!Number.isSafeInteger(row.updatedAt) || row.updatedAt < 0 || row.updatedAt > 8640000000000000) continue;
      if (typeof row.lastDay !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.lastDay)) continue;
      const [year, month, day] = row.lastDay.split("-").map(Number), date = new Date(year, month - 1, day, 12);
      if (retrievalDay(date) !== row.lastDay) continue;
      const record = {word, chunk, meaning, attempts: row.attempts, result: row.result, lastDay: row.lastDay, updatedAt: row.updatedAt};
      records.set(retrievalQuestionId(record), record);
    }
    return [...records.values()];
  } catch { return []; }
}
function saveRetrievalAttempt(question, result, now = new Date()) {
  if (!["again", "good"].includes(result) || !Number.isFinite(now.getTime())) return false;
  const word = retrievalText(question?.word, 100), chunk = retrievalText(question?.chunk, 240), meaning = retrievalText(question?.meaning, 240);
  if (!word || !chunk || !meaning) return false;
  const id = retrievalQuestionId({word, chunk, meaning}), records = readRetrievalProgress();
  const previous = records.find(row => retrievalQuestionId(row) === id);
  const updated = records.filter(row => retrievalQuestionId(row) !== id);
  updated.push({word, chunk, meaning, attempts: Math.min(10000, (previous?.attempts || 0) + 1), result,
    lastDay: retrievalDay(now), updatedAt: now.getTime()});
  const payload = JSON.stringify({version: 1, records: updated.slice(-RETRIEVAL_RECORD_LIMIT)});
  if (payload.length > RETRIEVAL_STORAGE_LIMIT) return false;
  try { localStorage.setItem(RETRIEVAL_PROGRESS_KEY, payload); return true; }
  catch { return false; }
}
function retrievalQuestions(entry, progress = readRetrievalProgress()) {
  const note = typeof getExamNotebook === "function" ? getExamNotebook(entry) : null;
  const word = retrievalText(entry?.word, 100);
  if (!word) return [];
  const records = new Map(progress.map(row => [retrievalQuestionId(row), row])), seen = new Set();
  return (note?.collocations || []).map((row, index) => {
    const question = {word, chunk: retrievalText(row.en, 240), meaning: retrievalText(row.zh, 240),
      note: retrievalText(row.note, 600), index};
    question.id = retrievalQuestionId(question);
    return question;
  }).filter(question => {
    if (!question.chunk || !question.meaning || seen.has(question.id)) return false;
    seen.add(question.id); return true;
  }).sort((a, b) => {
    const first = records.get(a.id), second = records.get(b.id);
    const priority = row => row?.result === "again" ? 0 : !row ? 1 : 2;
    return priority(first) - priority(second) || (first?.updatedAt || 0) - (second?.updatedAt || 0) || a.index - b.index;
  }).slice(0, 3);
}

function renderRetrievalPractice(entry, host = document.getElementById("retrievalPractice")) {
  if (!host) return;
  // A caller can re-render this host while a question is open. Restore the old
  // sections before constructing a new session, including their prior state.
  RETRIEVAL_HOST_CLEANUP.get(host)?.();
  RETRIEVAL_HOST_CLEANUP.delete(host);
  const initial = retrievalQuestions(entry);
  host.hidden = !initial.length;
  if (!initial.length) { host.innerHTML = ""; delete host.dataset.phase; return; }
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"}[char]));
  const find = selector => host.querySelector(selector);
  const detail = host.closest?.(".detail") || document.getElementById("wordDetail");
  let concealed = [], tasks = [], cursor = 0, phase = "idle", hadAgain = false, saved = true;
  const restore = () => {
    for (const item of concealed) {
      item.node.hidden = item.hidden;
      if (item.marker === null) item.node.removeAttribute("data-retrieval-concealed");
      else item.node.setAttribute("data-retrieval-concealed", item.marker);
    }
    concealed = [];
  };
  RETRIEVAL_HOST_CLEANUP.set(host, () => { phase = "disposed"; restore(); });
  const conceal = () => {
    const selector = ".notebook-field,.notebook-evidence,.notebook-archive,.notebook-legacy-points,.builtin-practice,.builtin-writing,.notebook-navigation,.review-actions";
    concealed = Array.from(detail?.querySelectorAll(selector) || []).map(node => ({node, hidden: node.hidden, marker: node.getAttribute("data-retrieval-concealed")}));
    for (const {node} of concealed) { node.hidden = true; node.setAttribute("data-retrieval-concealed", "true"); }
  };
  const focus = selector => find(selector)?.focus();
  const listen = (selector, event, callback) => find(selector)?.addEventListener(event, callback);
  const message = () => saved ? "" : '<p class="retrieval-storage-note" role="status">此瀏覽器無法儲存本次練習紀錄；仍可完成回想。</p>';
  const stop = () => { if (phase === "disposed") return; restore(); renderIdle(); focus(".retrieval-start"); };
  const exitButton = '<button type="button" class="retrieval-exit">結束回想，閱讀筆記</button>';

  function bindExit() {
    listen(".retrieval-exit", "click", stop);
    // Kept on this widget, so changing words cannot leave document listeners behind.
    listen(".retrieval-session", "keydown", event => {
      if (event.key === "Escape" && !event.isComposing) { event.preventDefault(); stop(); }
    });
  }
  function renderIdle() {
    phase = "idle"; host.dataset.phase = phase;
    host.innerHTML = `<h3>先回想，再看筆記</h3><p>用 ${initial.length} 個中文提示回想完整英文搭配。想不起來也可以直接核對，再練一次。</p><button type="button" class="retrieval-start">開始搭配回想</button><p class="retrieval-note">回想時暫時收起下方教材；按 Esc 或結束按鈕即可返回。</p>`;
    listen(".retrieval-start", "click", () => {
      if (phase !== "idle") return;
      tasks = retrievalQuestions(entry).map(question => ({question, retry: false}));
      cursor = 0; hadAgain = false; saved = true;
      conceal(); renderPrompt();
    });
  }
  function renderPrompt() {
    phase = "prompt"; host.dataset.phase = phase;
    const task = tasks[cursor], question = task.question;
    host.innerHTML = `<div class="retrieval-session"><p class="retrieval-kicker">${task.retry ? "訂正後再回想" : `搭配回想 ${cursor + 1} / ${initial.length}`}</p><h3 id="retrievalPrompt">${escape(question.meaning)}</h3><p>請用 <strong lang="en">${escape(question.word)}</strong> 寫出一個符合意思的完整搭配。</p><form class="retrieval-form"><label for="retrievalAnswer">你的英文搭配</label><input id="retrievalAnswer" type="text" maxlength="240" autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="retrievalPrompt retrievalPromptNote"><div class="retrieval-actions"><button type="submit" class="retrieval-reveal">核對參考搭配</button><button type="button" class="retrieval-forgot">想不起來，先訂正</button>${exitButton}</div><p class="retrieval-feedback" role="status" aria-live="polite"></p></form><p class="retrieval-note" id="retrievalPromptNote">先嘗試回想；教材搭配可能有其他合理寫法。</p>${message()}</div>`;
    listen(".retrieval-form", "submit", event => {
      event.preventDefault();
      if (phase !== "prompt") return;
      const answer = find("#retrievalAnswer").value.trim();
      if (!answer) { find(".retrieval-feedback").textContent = "請先寫下想到的搭配，或選擇「想不起來，先訂正」。"; focus("#retrievalAnswer"); return; }
      renderAnswer(task, answer, false);
    });
    listen("#retrievalAnswer", "keydown", event => { if (event.key === "Enter" && event.isComposing) event.preventDefault(); });
    listen(".retrieval-forgot", "click", () => { if (phase === "prompt") renderAnswer(task, "", true); });
    bindExit(); focus("#retrievalAnswer");
  }
  function renderAnswer(task, answer, forgot) {
    phase = "revealed"; host.dataset.phase = phase;
    const question = task.question;
    host.innerHTML = `<div class="retrieval-session"><h3 class="retrieval-answer-heading" tabindex="-1">核對完整搭配</h3>${answer ? `<p>你的回想：<span lang="en">${escape(answer)}</span></p>` : "<p>先看訂正，再嘗試自行回想。</p>"}<p class="retrieval-reference" lang="en">${escape(question.chunk)}</p><p>${escape(question.meaning)}</p>${question.note ? `<p>${escape(question.note)}</p>` : ""}<p class="retrieval-note">按意思、介系詞與完整搭配核對；其他自然寫法也可能合理。看過答案才想起來，請選「還不熟」。</p><div class="retrieval-actions"><button type="button" class="retrieval-again">還不熟，再練</button><button type="button" class="retrieval-good" ${forgot ? "disabled" : ""}>這次回想到了</button>${exitButton}</div></div>`;
    const rate = result => {
      if (phase !== "revealed" || task !== tasks[cursor] || (forgot && result === "good")) return;
      phase = "rated";
      if (result === "again") { hadAgain = true; if (!task.retry) tasks.push({question, retry: true}); }
      saved = saveRetrievalAttempt(question, result) && saved;
      cursor += 1;
      if (cursor < tasks.length) renderPrompt(); else renderComplete();
    };
    listen(".retrieval-again", "click", () => rate("again"));
    listen(".retrieval-good", "click", () => rate("good"));
    bindExit(); focus(".retrieval-answer-heading");
  }
  function renderComplete() {
    phase = "complete"; host.dataset.phase = phase; restore();
    host.innerHTML = `<div class="retrieval-session"><h3 class="retrieval-complete-heading" tabindex="-1">完成 ${initial.length} 個搭配的回想</h3><p>${hadAgain ? "有搭配需要提示，建議明天再試。" : "這次能回想起來；隔一段時間再試，確認是否仍記得。"}</p><div class="retrieval-actions"><button type="button" class="retrieval-schedule-again">明天再複習</button><button type="button" class="retrieval-schedule-good">安排下次複習</button>${exitButton}</div><p class="retrieval-schedule-status" role="status" aria-live="polite">可選擇加入現有的單字複習清單。</p><p class="retrieval-note">練習次數與自評只記在此瀏覽器；輸入的英文不儲存。完成回想不代表已長期記住。</p>${message()}</div>`;
    const schedule = rating => {
      if (phase !== "complete" || typeof markReview !== "function") return;
      phase = "scheduled"; host.dataset.phase = phase;
      const item = markReview(entry.word, rating);
      find(".retrieval-schedule-again").disabled = true;
      find(".retrieval-schedule-good").disabled = true;
      find(".retrieval-schedule-status").textContent = `已安排此單字於 ${item.due} 複習。`;
      const status = document.getElementById("reviewStatus");
      if (status) status.textContent = `下次 ${item.due}`;
    };
    listen(".retrieval-schedule-again", "click", () => schedule("again"));
    listen(".retrieval-schedule-good", "click", () => schedule("good"));
    bindExit(); focus(".retrieval-complete-heading");
  }
  renderIdle();
}
