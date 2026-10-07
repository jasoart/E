"use strict";

const BUILTIN_PRACTICE_KEY = "gsat-builtin-retrieval-v1";
const BUILTIN_IRREGULAR_FORMS = {
  arise:["arose","arisen"],awake:["awoke","awoken"],bear:["bore","borne","born"],become:["became"],bend:["bent"],
  bid:["bade","bidden"],bind:["bound"],bite:["bit","bitten"],bleed:["bled"],blow:["blew","blown"],catch:["caught"],
  cling:["clung"],creep:["crept"],deal:["dealt"],dig:["dug"],draw:["drew","drawn"],mean:["meant"],fisherman:["fishermen"],
  flee:["fled"],forbid:["forbade","forbidden"],forget:["forgot","forgotten"],forgive:["forgave","forgiven"],
  forsake:["forsook","forsaken"],freeze:["froze","frozen"],freshman:["freshmen"],grind:["ground"],hang:["hung"],
  hide:["hid","hidden"],kneel:["knelt"],leaf:["leaves"],lend:["lent"],mislead:["misled"],misunderstand:["misunderstood"],
  overcome:["overcame"],overhear:["overheard"],overtake:["overtook","overtaken"],overthrow:["overthrew","overthrown"],
  ox:["oxen"],panic:["panicked","panicking"],ride:["rode","ridden"],shake:["shook","shaken"],shine:["shone"],
  shoot:["shot"],shrink:["shrank","shrunk"],sing:["sang","sung"],sink:["sank","sunk"],slide:["slid"],spin:["spun"],
  spit:["spat"],spring:["sprang","sprung"],steal:["stole","stolen"],stick:["stuck"],sting:["stung"],stink:["stank","stunk"],
  stride:["strode","stridden"],strike:["struck","stricken"],strive:["strove","striven"],swear:["swore","sworn"],
  sweep:["swept"],swing:["swung"],tear:["tore","torn"],tell:["told"],throw:["threw","thrown"],
  undergo:["underwent","undergone"],undertake:["undertook","undertaken"],wake:["woke","woken"],weep:["wept"],
  wind:["wound"],withdraw:["withdrew","withdrawn"],withhold:["withheld"],good:["better","best"],bad:["worse","worst"],
};
function getBuiltinStudy(entry) {
  const word = typeof entry === "string" ? entry : entry?.word;
  if (typeof BUILTIN_STUDY_DATA === "undefined") return null;
  return Object.prototype.hasOwnProperty.call(BUILTIN_STUDY_DATA.entries || {}, word) ? BUILTIN_STUDY_DATA.entries[word] : null;
}
function builtinExampleResult(entry) {
  const study = getBuiltinStudy(entry);
  const examples = (study?.examples || []).filter(item => typeof item.text === "string" && item.text.trim()).map(item => ({
    ...item, sourceLabel: item.source === "uploaded-anki" ? "上傳教材" : item.source === "self-authored" ? "本站新編" : "來源待核對",
    wordCount: (item.text.match(/[A-Za-z]+(?:[-’'][A-Za-z]+)*/g) || []).length,
  }));
  return { examples, partsOfSpeech: [entry.partOfSpeech], selectionTier: "builtin", candidateCount: examples.length };
}
function builtinStudyStats() {
  const entries = typeof BUILTIN_STUDY_DATA === "undefined" ? {} : BUILTIN_STUDY_DATA.entries || {};
  const rows = VOCABULARY.map(entry => entries[entry.word]).filter(Boolean);
  return { words: rows.length, examples: rows.reduce((sum,row) => sum + (row.examples?.length || 0),0),
    collocations: rows.reduce((sum,row) => sum + (row.collocations?.length || 0),0) };
}
function builtinTargetAliases(word) {
  if (String(word) === "neither adj./adv./pron./") return ["neither"];
  if (String(word) === "sportsman/sportswoma n") return ["sportsman", "sportswoman"];
  const aliases = [];
  for (const variant of String(word || "").split("/")) {
    const part = variant.trim().replace(/’/g,"'");
    const match = /^([^()]+)\(([^)]+)\)$/.exec(part);
    if (match) {
      const stem = match[1].trim(), body = match[2];
      aliases.push(stem);
      if (body.includes(",")) aliases.push(...body.split(",").map(value=>value.trim()));
      else aliases.push(part === "argue(argument)" ? "argument" : stem + body);
    } else aliases.push(part);
  }
  return [...new Set(aliases.filter(value=>/^[\p{L}.]+(?:[-'][\p{L}.]+)*(?:\s+[\p{L}.]+)*$/u.test(value)))];
}
function builtinClozeQuestion(entry, example) {
  const forms = builtinTargetAliases(entry.word).flatMap(alias => {
    const lower=alias.toLowerCase(), values=typeof wordForms === "function" && /^[a-z]+(?:[-'][a-z]+)*$/i.test(alias) ? [...wordForms(lower)] : [alias];
    values.push(...(BUILTIN_IRREGULAR_FORMS[lower]||[]));
    if(/adj\.|a\./.test(entry.partOfSpeech||"")&&/^[a-z]+$/.test(lower)){
      if(/[^aeiou]y$/.test(lower))values.push(lower.slice(0,-1)+"ier",lower.slice(0,-1)+"iest");
      else if(lower.endsWith("e"))values.push(lower+"r",lower+"st");
      else {values.push(lower+"er",lower+"est");if(/^[bcdfghjklmnpqrstvwxyz]*[aeiou][bcdfgklmnprst]$/.test(lower))values.push(lower+lower.slice(-1)+"er",lower+lower.slice(-1)+"est");}
    }
    return values;
  });
  if (!forms.length) return null;
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  // Unicode boundaries and a captured prefix work without Safari lookbehind.
  const expression = new RegExp("(^|[^\\p{L}\\p{N}_])(" + [...new Set(forms)].sort((a,b)=>b.length-a.length).map(escape).join("|") + ")(?=$|[^\\p{L}\\p{N}_])","iu");
  const text = example.text.replace(/’/g,"'"), match = expression.exec(text);
  if (!match) return null;
  const start = match.index + match[1].length;
  return { answer: match[2], masked: text.slice(0,start) + "________" + text.slice(start + match[2].length), text: example.text, translationZh: example.translationZh || "" };
}
function normalizeBuiltinAnswer(value) { return String(value || "").trim().replace(/’/g,"'").replace(/\s+/g," ").toLowerCase(); }
function checkBuiltinAnswer(question, answer) { return !!question && normalizeBuiltinAnswer(answer) === normalizeBuiltinAnswer(question.answer); }
function readBuiltinPractice() {
  try { const value = JSON.parse(localStorage.getItem(BUILTIN_PRACTICE_KEY) || "{}"); return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  catch { return {}; }
}
function builtinPracticeId(entry, index) {
  const example = builtinExampleResult(entry).examples[index];
  if (!example) return null;
  // A replacement/reordered sentence must not inherit an older sentence's score.
  return entry.word + "::" + example.source + "::" + encodeURIComponent(example.text);
}
function saveBuiltinAttempt(entry, index, correct) {
  const key = builtinPracticeId(entry, index);
  if (!key) return null;
  const progress = readBuiltinPractice();
  const old = progress[key] || {};
  progress[key] = { attempts: Number(old.attempts || 0) + 1, correct: Number(old.correct || 0) + Number(correct),
    needsRetry: !correct, lastAttempt: new Date().toISOString() };
  try { localStorage.setItem(BUILTIN_PRACTICE_KEY, JSON.stringify(progress)); } catch { showToast("此瀏覽器暫時無法儲存練習紀錄"); }
  return progress[key];
}
function renderBuiltinPractice(entry, index = 0) {
  const host = byId("builtinPractice"); if (!host) return;
  const examples = builtinExampleResult(entry).examples;
  if (!examples.length) { host.innerHTML = '<p class="card-empty">內建教材尚未就緒。</p>'; return; }
  const current = index % examples.length, example = examples[current], question = builtinClozeQuestion(entry, example);
  if (!question) { host.innerHTML = '<p class="card-empty">此句沒有可核對的目標詞形，請閱讀例句。</p>'; return; }
  host.innerHTML = `<p class="practice-kicker">主動回想 · 第 ${current+1} / ${examples.length} 句</p><p id="builtinClozePrompt" lang="en">${escapeHtml(question.masked)}</p><p>${escapeHtml(question.translationZh)}</p><label for="builtinClozeInput">填回句中的完整詞形</label><div class="builtin-answer-row"><input id="builtinClozeInput" type="text" autocomplete="off" autocapitalize="none" spellcheck="false"><button id="builtinClozeCheck" type="button">核對答案</button><button id="builtinClozeRetry" type="button" hidden>訂正後重答</button><button id="builtinClozeNext" type="button" hidden>下一句</button></div><p id="builtinClozeFeedback" role="status" aria-live="polite"></p><p class="card-note">先回想再核對；答錯會顯示訂正，重新作答才完成。紀錄只存在此瀏覽器。</p>`;
  const input = byId("builtinClozeInput"), check = byId("builtinClozeCheck"), retry = byId("builtinClozeRetry"), next = byId("builtinClozeNext"), feedback = byId("builtinClozeFeedback");
  const submit = () => {
    if (check.disabled) return;
    if (!input.value.trim()) { feedback.textContent = "請先填入答案。"; input.focus(); return; }
    const correct = checkBuiltinAnswer(question, input.value); saveBuiltinAttempt(entry,current,correct);
    feedback.dataset.correct = String(correct); check.disabled = true; input.disabled = true;
    feedback.textContent = correct ? "答對了。請再讀一次完整句，留意詞形與搭配。" : `本句答案是 ${question.answer}。${example.grammar || "請留意句中的詞形與搭配。"} 看完訂正後，按「訂正後重答」。`;
    retry.hidden = correct; next.hidden = !correct;
  };
  check.addEventListener("click",submit); input.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();submit();}});
  retry.addEventListener("click",()=>{input.disabled=false;input.value="";check.disabled=false;retry.hidden=true;feedback.textContent="請重新回想，填入本句需要的詞形。";delete feedback.dataset.correct;input.focus();});
  next.addEventListener("click",()=>renderBuiltinPractice(entry,current+1));
}
