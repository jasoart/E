/* Original browser algorithms; no downloaded language model or network calls. */
"use strict";
(function (root) {
  const STOP = new Set("a an the and or but if then so as at by for from in into of on to with without is are am was were be been being do does did have has had it its this that these those i you he she we they my your his her our their me us them not no can could will would shall should may might must very also than which who whom whose what when where why how all some any each much more most such there here".split(" "));
  function tokens(text) {
    return String(text || "").replace(/’/g, "'").toLowerCase().match(/[a-z]+(?:[-'][a-z]+)*/g) || [];
  }
  function contentTokens(text) { return tokens(text).filter(t => t.length > 2 && !STOP.has(t)); }
  function splitSentences(text) {
    // Abbreviations/decimals are protected, then restored. This is sentence
    // segmentation for extraction, not a grammatical parser.
    const protectedText = String(text || "").trim().replace(/[\r\n]+/g, " ")
      .replace(/\b(?:Mr|Mrs|Ms|Dr|Prof|St|vs|etc)\./gi, s => s.replace(/\./g, "\uE000"))
      .replace(/\b(?:e\.g\.|i\.e\.)/gi, s => s.replace(/\./g, "\uE000"))
      .replace(/(\d)\.(?=\d)/g, "$1\uE000");
    return (protectedText.match(/[^.!?\n]+(?:[.!?]+["')\]]*|$)/g) || [])
      .map(s => s.replace(/\uE000/g, ".").trim()).filter(Boolean).slice(0, 80);
  }
  function pageRank(weights, damping = .85, tolerance = 1e-7, maxIterations = 100, personalization) {
    const n = weights.length;
    if (!n) return [];
    const positive = value => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0;
    damping = Number.isFinite(Number(damping)) ? Math.max(0, Math.min(1, Number(damping))) : .85;
    tolerance = Number.isFinite(Number(tolerance)) ? Math.max(0, Number(tolerance)) : 1e-7;
    maxIterations = Number.isFinite(Number(maxIterations)) ? Math.max(0, Math.floor(Number(maxIterations))) : 100;
    let prior = Array.from({length: n}, (_, i) => positive(personalization?.[i]));
    const scale = Math.max(...prior);
    if (scale) {
      // Scale before summing so even large finite weights normalize safely.
      prior = prior.map(value => value / scale);
      const total = prior.reduce((sum, value) => sum + value, 0);
      prior = prior.map(value => value / total);
    } else prior.fill(1 / n);
    // Normalize nonzero transitions once, then iterate only actual edges.
    const edges = weights.map(row => {
      const values = Array.from({length: n}, (_, j) => positive(row?.[j]));
      const maximum = Math.max(...values);
      if (!maximum) return [];
      const scaled = values.map(value => value / maximum), total = scaled.reduce((sum, value) => sum + value, 0);
      return scaled.flatMap((value, j) => value ? [[j, value / total]] : []);
    });
    let rank = prior.slice();
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const dangling = rank.reduce((sum, r, i) => sum + (!edges[i].length ? r : 0), 0);
      const next = prior.map(value => ((1 - damping) + damping * dangling) * value);
      for (let i = 0; i < n; i++) for (const [j, probability] of edges[i]) next[j] += damping * rank[i] * probability;
      const difference = next.reduce((sum, r, i) => sum + Math.abs(r - rank[i]), 0);
      rank = next;
      if (difference < tolerance) break;
    }
    return rank;
  }
  function keywordRank(text, limit = 8) {
    const words = tokens(text).slice(0, 1200), frequency = new Map(), positionWeight = new Map();
    words.forEach((word, index) => {
      if (word.length <= 2 || STOP.has(word)) return;
      frequency.set(word, (frequency.get(word) || 0) + 1);
      positionWeight.set(word, (positionWeight.get(word) || 0) + 1 / (index + 1));
    });
    const nodes = [...frequency.keys()].sort((a, b) => frequency.get(b) - frequency.get(a) || a.localeCompare(b)).slice(0, 100);
    const positions = new Map(nodes.map((word, index) => [word, index]));
    const weights = nodes.map(() => Array(nodes.length).fill(0));
    for (let i = 0; i < words.length; i++) for (let j = i + 1; j < Math.min(words.length, i + 5); j++) {
      const a = positions.get(words[i]), b = positions.get(words[j]);
      if (a === undefined || b === undefined || a === b) continue;
      weights[a][b]++; weights[b][a]++;
    }
    // PositionRank-inspired word ranking: sum inverse original token positions.
    // Stop words keep their offsets/window slots; no POS/keyphrase parser is used.
    const rank = pageRank(weights, .85, 1e-7, 100, nodes.map(word => positionWeight.get(word)));
    return nodes.map((word, i) => ({ word, score: rank[i], count: frequency.get(word) }))
      .sort((a, b) => b.score - a.score || b.count - a.count || a.word.localeCompare(b.word)).slice(0, resultLimit(limit, nodes.length));
  }
  function resultLimit(limit, size) { return Math.max(0, Math.min(size, Math.floor(Number(limit) || 0))); }
  function cosineSimilarity(left, right, leftNorm, rightNorm) {
    if (!leftNorm || !rightNorm) return 0;
    let dot = 0;
    for (const [word, value] of left) dot += value * (right.get(word) || 0);
    return Math.max(0, Math.min(1, dot / (leftNorm * rightNorm)));
  }
  function mmrSelect(items, limit, relevance, similarity, lambda) {
    const count = resultLimit(limit, items.length);
    if (!count) return [];
    lambda = Number.isFinite(Number(lambda)) ? Math.max(0, Math.min(1, Number(lambda))) : .7;
    const scores = items.map(relevance), maximum = Math.max(...scores);
    const selected = [], used = new Set(), redundancy = Array(items.length).fill(0);
    while (selected.length < count) {
      let best = -1, bestScore = -Infinity;
      for (let i = 0; i < items.length; i++) if (!used.has(i)) {
        // Normalize relevance to the same [0,1] range as cosine redundancy.
        // The first choice always has the strongest relevance, even at lambda=0.
        const score = selected.length ? lambda * (maximum ? scores[i] / maximum : 0) - (1 - lambda) * redundancy[i] : scores[i];
        if (score > bestScore) { best = i; bestScore = score; }
      }
      used.add(best); selected.push(items[best]);
      // Incremental maximum avoids recomputing similarity to earlier choices.
      for (let i = 0; i < items.length; i++) if (!used.has(i)) redundancy[i] = Math.max(redundancy[i], similarity(items[i], items[best]));
    }
    return selected;
  }
  function sentenceRank(text, limit = 3, lambda = .7) {
    const sentences = splitSentences(text), df = new Map();
    const documents = sentences.map(sentence => {
      const counts = new Map(); contentTokens(sentence).forEach(word => counts.set(word, (counts.get(word) || 0) + 1));
      for (const word of counts.keys()) df.set(word, (df.get(word) || 0) + 1);
      return counts;
    });
    const vectors = documents.map(counts => new Map([...counts].map(([word, count]) => [word, (1 + Math.log(count)) * (1 + Math.log((sentences.length + 1) / ((df.get(word) || 0) + 1)))])));
    const norms = vectors.map(v => Math.sqrt([...v.values()].reduce((sum, x) => sum + x * x, 0)));
    const weights = sentences.map(() => Array(sentences.length).fill(0));
    for (let i = 0; i < sentences.length; i++) for (let j = i + 1; j < sentences.length; j++) {
      const score = cosineSimilarity(vectors[i], vectors[j], norms[i], norms[j]);
      weights[i][j] = score; weights[j][i] = score;
    }
    const scores = pageRank(weights), seen = new Set();
    const candidates = sentences.map((text, index) => ({ text, index, score: scores[index] })).filter(item => {
      const key = tokens(item.text).join(" ");
      if (seen.has(key) || !documents[item.index].size) return false;
      seen.add(key); return true;
    });
    const selected = mmrSelect(candidates, limit, item => item.score, (a, b) => weights[a.index][b.index], lambda);
    return selected.sort((a, b) => a.index - b.index);
  }
  const RULES = [
    { id: "discuss", test: /\bdiscuss(?:es|ed|ing)?\s+about\b/i, message: "discuss 直接接受詞：discuss the issue；若用 discussion，才可接 about／of。" },
    { id: "despite", test: /\bdespite\s+of\b/i, message: "通常用 despite + 名詞／V-ing，或 in spite of；避免 despite of。" },
    { id: "although", test: /\b(?:although|though)\b[^.!?]*,\s*but\b/i, message: "同一句的讓步主從句通常選 although… 或 …but…，不要把兩種連接方式直接疊在一起。" },
    { id: "because", test: /\bbecause\b[^.!?]*,\s*so\b/i, message: "同一句直接連接原因與結果時，通常選 because… 或 …so…；先檢查兩者是否重複連接相同兩子句。" },
    { id: "uncountable", test: /\b(?:informations|advices|equipments)\b/i, message: "一般語境中 information、advice、equipment 為不可數名詞。可寫 pieces of information／advice／equipment。" },
    { id: "comparative", test: /\b(?:more\s+better|more\s+worse|most\s+best)\b/i, message: "better／worse／best 已有比較或最高級意義，通常不再加 more／most。" },
    { id: "people", test: /\bpeople\s+(?:is|was)\b/i, message: "people 表示『人們』時，通常用 people are／were；特殊用法如『民族』須另查語境。" },
    { id: "capable", test: /\bcapable\s+to\s+[a-z]+\b/i, message: "能力通常用 be capable of + 名詞／V-ing，或 be able to + 原形動詞。" },
    { id: "depend", test: /\bdepend(?:s|ed|ing)?\s+of\b/i, message: "『取決於／依靠』用 depend on；檢查受詞是否為真正依賴的條件。" },
    { id: "married", test: /\b(?:get|got|be|is|was)\s+married\s+with\s+(?:him|her|a man|a woman)\b/i, message: "『與某人結婚』一般用 be／get married to someone；with 可能引出伴隨情況，需看完整語境。" }
  ];
  function writingFeedback(text) {
    text = String(text || "").slice(0, 6000);
    const sentences = splitSentences(text), words = tokens(text), paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    const warnings = RULES.filter(rule => rule.test.test(text)).map(rule => ({ id: rule.id, message: rule.message }));
    const connectors = [
      ["讓步／對比", /\b(?:although|though|however|nevertheless|whereas|while|in contrast)\b/i],
      ["因果", /\b(?:because|therefore|consequently|as a result|due to)\b/i],
      ["舉例", /\b(?:for example|for instance|such as)\b/i],
      ["條件", /\b(?:if|unless|provided that)\b/i]
    ].filter(([, regex]) => regex.test(text)).map(([label]) => label);
    return {
      wordCount: words.length, sentenceCount: sentences.length, paragraphCount: paragraphs.length,
      warnings, connectors, keywords: keywordRank(text), summary: sentenceRank(text),
      revisionQuestions: [
        "主張是否明確？讀者能否從主張看出你支持的立場？",
        "每個理由是否接上具體例子？例子與主張之間的關係是否說清楚？",
        "是否考慮限制或另一種觀點，再說明你的方案適用的條件？",
        "結尾是否回應主張並提出合理行動，而非只重複開頭？"
      ],
      scope: "規則只提示部分常見問題；重點句為原文抽取，須自行確認，不提供學測作文分數。"
    };
  }
  function rankExamples(query, candidates, limit = 4, lambda = .7) {
    const bilingualTerms = text => {
      const terms = contentTokens(text);
      for (const chunk of String(text || "").match(/[\u3400-\u9fff]+/g) || []) {
        terms.push(chunk);
        for (let i = 0; i + 1 < chunk.length; i++) terms.push(chunk.slice(i, i + 2));
      }
      return terms;
    };
    const q = new Set(bilingualTerms(query)), df = new Map(), records = candidates.map((record, originalIndex) => ({ ...record, originalIndex, terms: new Set(bilingualTerms(record.text + " " + (record.topic || "") + " " + (record.translationZh || ""))) }));
    records.forEach(record => record.terms.forEach(t => df.set(t, (df.get(t) || 0) + 1)));
    const scored = records.map(record => {
      let score = 0; q.forEach(t => { if (record.terms.has(t)) score += 1 + Math.log((records.length + 1) / ((df.get(t) || 0) + 1)); });
      return { ...record, relevance: score / Math.sqrt(Math.max(1, record.terms.size)) };
    });
    if (!scored.some(record => record.relevance > 0)) return scored.slice(0, resultLimit(limit, scored.length));
    // Gate on query evidence before diversity; novelty alone cannot promote an
    // unrelated example. For duplicate text keep the strongest original record.
    const unique = new Map();
    for (const record of scored) if (record.relevance > 0) {
      const normalized = String(record.text || "").normalize("NFKC").replace(/’/g, "'").toLowerCase();
      const key = (normalized.match(/[a-z]+(?:[-'][a-z]+)*|[\u3400-\u9fff]+/g) || [normalized]).join(" ");
      const previous = unique.get(key);
      if (!previous || record.relevance > previous.relevance) unique.set(key, record);
    }
    const eligible = [...unique.values()].sort((a, b) => a.originalIndex - b.originalIndex);
    const vectors = new Map(), norms = new Map();
    for (const record of eligible) {
      const vector = new Map([...record.terms].map(term => [term, 1 + Math.log((records.length + 1) / ((df.get(term) || 0) + 1))]));
      vectors.set(record, vector); norms.set(record, Math.sqrt([...vector.values()].reduce((sum, value) => sum + value * value, 0)));
    }
    return mmrSelect(eligible, limit, record => record.relevance, (a, b) => cosineSimilarity(vectors.get(a), vectors.get(b), norms.get(a), norms.get(b)), lambda);
  }
  function detectIntent(input) {
    const value = String(input || "").trim();
    // Ordered ELIZA-style keyword/decomposition rules, specialized for study.
    if (/^(?:搭配|片語|collocations?)\s*[:：]?\s*/i.test(value)) return { type: "collocation", query: value.replace(/^(?:搭配|片語|collocations?)\s*[:：]?\s*/i, "") };
    if (/^(?:文法|句型|grammar)\s*[:：]?\s*/i.test(value)) return { type: "grammar", query: value.replace(/^(?:文法|句型|grammar)\s*[:：]?\s*/i, "") };
    if (/^(?:作文|仿寫|writing)\s*[:：]?\s*/i.test(value)) return { type: "writing", query: value.replace(/^(?:作文|仿寫|writing)\s*[:：]?\s*/i, "") };
    if (/^(?:查|查字|例句|lookup|examples?)\s*[:：]?\s*/i.test(value)) return { type: "example", query: value.replace(/^(?:查字|查|例句|lookup|examples?)\s*[:：]?\s*/i, "") };
    return { type: "example", query: value };
  }
  function setup() {
    if (typeof document === "undefined") return;
    const input = document.getElementById("coachInput"), output = document.getElementById("coachOutput");
    if (!input || !output) return;
    const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
    const selected = () => typeof state !== "undefined" ? VOCABULARY[state.selectedIndex] : null;
    function lookup() {
      const intent = detectIntent(input.value), current = selected(), query = String(intent.query || current?.word || "").slice(0, 160);
      if (!query) { output.textContent = "先選一個單字，或輸入想查的字、搭配、中文主題。"; return; }
      const results = hybridSearch(query).slice(0, 12);
      if (!results.length) { output.textContent = "目前內建教材未找到符合結果。請換成單字、較短片語或中文主題。"; return; }
      const first = results[0].entry, study = getBuiltinStudy(first);
      const heading = `<p class="coach-result-title">${safe(first.word)} · ${safe(study.plainMeaning || first.meaning)}</p>`;
      if (intent.type === "collocation") {
        const rows = [...(study.collocations || []), ...getGsatPoints(first).flatMap(p => p.patterns)].slice(0, 16);
        output.innerHTML = heading + (rows.length ? `<ul>${rows.map(([en, zh, note]) => `<li><strong lang="en">${safe(en)}</strong> — ${safe(zh)}${note ? `<small>${safe(note)}</small>` : ""}</li>`).join("")}</ul>` : "<p>此詞沒有已整理搭配；可閱讀內建例句中的用法。</p>");
      } else {
        const pool = results.flatMap(({ entry }) => (getBuiltinStudy(entry).examples || []).map(example => ({ ...example, word: entry.word })));
        const examples = intent.type === "example" && results[0].match.reason !== "完全相符" ? rankExamples(query, pool) : (study.examples || []).map(e => ({ ...e, word: first.word }));
        output.innerHTML = heading + examples.slice(0, 4).map(example => `<article class="coach-example"><strong>${safe(example.word)} · ${example.source === "self-authored" ? "本站新編" : "上傳教材"}</strong><p lang="en">${safe(example.text)}</p><p>${safe(example.translationZh)}</p><small>${safe(intent.type === "grammar" ? example.grammar : example.writingTip || example.grammar)}</small></article>`).join("") + (intent.type === "writing" ? "<p>仿寫步驟：保留句型，換成自己的主張與情境；補上例證；再檢查時態、搭配與語意是否成立。</p>" : "");
      }
    }
    function analyze() {
      const value = input.value.trim(); if (!value) { output.textContent = "先貼上你自己的英文短文，再分析。"; return; }
      const result = writingFeedback(value);
      if (!result.wordCount) { output.textContent = "短文分析需要英文內容；中文主題請用「找搭配與例句」。"; return; }
      output.innerHTML = `<p class="coach-result-title">${result.wordCount} 詞 · ${result.sentenceCount} 個句段 · ${result.paragraphCount} 段</p><p>重點詞：${result.keywords.map(k => safe(k.word)).join(" · ") || "沒有足夠的內容詞"}</p><p>已出現的資訊關係線索：${safe(result.connectors.join("、") || "未辨識到；不必為增加標籤而硬加連接詞")}</p><h3>可以先檢查的用法</h3>${result.warnings.length ? `<ul>${result.warnings.map(w => `<li>${safe(w.message)}</li>`).join("")}</ul>` : "<p>目前未觸發已收錄的規則；仍需逐句檢查文法與意思。</p>"}<h3>原文重點句</h3>${result.summary.map(s => `<blockquote lang="en">${safe(s.text)}</blockquote>`).join("")}<h3>作文修訂提示</h3><ol>${result.revisionQuestions.map(q => `<li>${safe(q)}</li>`).join("")}</ol><p class="coach-scope">${safe(result.scope)}</p>`;
    }
    document.getElementById("coachLookup")?.addEventListener("click", lookup);
    document.getElementById("coachAnalyze")?.addEventListener("click", analyze);
    document.querySelectorAll("[data-coach-prompt]").forEach(button => button.addEventListener("click", () => { input.value = button.dataset.coachPrompt; lookup(); }));
  }
  const api = { tokens, splitSentences, pageRank, keywordRank, sentenceRank, writingFeedback, rankExamples, detectIntent, setup };
  root.LocalCoach = Object.freeze(api);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined") { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup); else setup(); }
})(typeof globalThis !== "undefined" ? globalThis : this);
