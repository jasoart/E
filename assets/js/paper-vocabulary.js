"use strict";

const PAPER_LETTERS = "ABCD";
const PAPER_EXAMPLE_LABELS = ["詞彙語境", "詞形與句構", "閱讀與寫作"];
const paperReferences = new Map();
const paperEntriesByForm = new Map();
for (const [year, paper] of Object.entries(GSAT_VOCABULARY_PAPERS)) {
  paper.questions.forEach((question, index) => {
    question.options.forEach((option, choice) => {
      const form = option.form.toLowerCase();
      if (!paperEntriesByForm.has(form)) paperEntriesByForm.set(form, new Set());
      paperEntriesByForm.get(form).add(option.entry);
      if (!paperReferences.has(option.entry)) paperReferences.set(option.entry, []);
      paperReferences.get(option.entry).push({year, number: index + 1, choice, option});
    });
  });
}

function paperQuestionPath(year, number, choice = "") {
  const params = new URLSearchParams(window.location.search);
  params.set("paper", year);
  params.set("q", number);
  if (choice) params.set("choice", choice);
  else params.delete("choice");
  return "?" + params.toString() + (choice ? "#wordDetail" : "#paperVocabulary");
}

function renderPaperReferences(entry) {
  const hits = paperReferences.get(entry.word);
  if (!hits) return "";
  const links = hits.map(({year, number, choice, option}) =>
    `<a data-paper-link href="${escapeHtml(paperQuestionPath(year, number))}">${year} 學年度第 ${number} 題 · ${PAPER_LETTERS[choice]} <span lang="en">${escapeHtml(option.form)}</span></a>`
  ).join("");
  return `<section class="paper-references"><h3>歷屆詞彙題出處</h3><nav aria-label="查閱這個詞形的選項">${links}</nav></section>`;
}

function paperExampleText(example) {
  const pattern = new RegExp("\\b(" + escapeRegExp(example.focus) + "|although|because|unless|until|while|so that|but)\\b", "gi");
  return example.en.split(pattern).map((part, i) => {
    const safe = escapeHtml(part);
    if (i % 2 === 0) return safe;
    return part.toLowerCase() === example.focus.toLowerCase() ? `<strong>${safe}</strong>` : `<em>${safe}</em>`;
  }).join("");
}

// A classic script also works when the complete site is opened from disk.
let paperLessonsRequest;
function loadPaperLessons(src) {
  if (typeof GSAT_PAPER_LESSONS !== "undefined") return Promise.resolve(GSAT_PAPER_LESSONS);
  if (!paperLessonsRequest) {
    paperLessonsRequest = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const fail = () => {
        script.remove();
        paperLessonsRequest = undefined;
        reject(new Error("Paper lessons could not be loaded"));
      };
      script.onload = () => {
        if (typeof GSAT_PAPER_LESSONS === "undefined") fail();
        else resolve(GSAT_PAPER_LESSONS);
      };
      script.onerror = fail;
      script.src = src;
      document.head.appendChild(script);
    });
  }
  return paperLessonsRequest;
}

function renderPaperExample(example) {
  return `<p lang="en">${paperExampleText(example)}</p><p>${escapeHtml(example.zh)}</p>`;
}

function renderPaperLesson(lesson, question, choice) {
  if (choice !== "answer") {
    const index = PAPER_LETTERS.indexOf(choice);
    const form = question.options[index].form;
    const example = index === question.answer
      ? lesson.examples.find(row => row.focus.toLowerCase() === form.toLowerCase()) || lesson.examples[0]
      : {...lesson.alternatives[choice], focus: form};
    return renderPaperExample(example);
  }
  const correctExamples = lesson.examples.map((example, i) =>
    `<li><small>${PAPER_EXAMPLE_LABELS[i]}</small>${renderPaperExample(example)}</li>`).join("");
  const comparisons = question.options.map((option, i) => {
    if (i === question.answer) return "";
    const letter = PAPER_LETTERS[i];
    return `<li><strong>${letter} <span lang="en">${escapeHtml(option.form)}</span></strong>
      <p>${escapeHtml(lesson.alternatives[letter].why)}</p></li>`;
  }).join("");
  return `<h4>其餘三個選項為什麼不合題意？</h4><ul class="paper-comparisons">${comparisons}</ul>
    <h4>正解的三種用法 · 本站自編</h4><ol class="paper-examples">${correctExamples}</ol>`;
}

function setupPaperVocabulary() {
  const panel = byId("paperVocabulary");
  if (!panel) return;
  const yearSelect = byId("paperYear"), numberSelect = byId("paperNumber");
  const content = byId("paperContent");
  const years = Object.keys(GSAT_VOCABULARY_PAPERS).sort((a, b) => Number(b) - Number(a));
  for (const year of years) yearSelect.add(new Option(year + " 學年度", year));

  function showQuestion(year, number) {
    const paper = GSAT_VOCABULARY_PAPERS[year], question = paper.questions[number - 1];
    yearSelect.value = year;
    if (numberSelect.options.length !== paper.questions.length) {
      numberSelect.replaceChildren();
      paper.questions.forEach((_, i) => numberSelect.add(new Option("第 " + (i + 1) + " 題", String(i + 1))));
    }
    numberSelect.value = String(number);
    const options = question.options.map((option, i) => {
      const label = {entry: "查詞條", inflection: "查原形", family: "查同字族"}[option.relation];
      const letter = PAPER_LETTERS[i];
      return `<li><span class="paper-letter">${PAPER_LETTERS[i]}</span><div><strong lang="en">${escapeHtml(option.form)}</strong>
        <p><abbr>${escapeHtml(option.pos)}</abbr> ${escapeHtml(option.zh)}</p>
        <a data-paper-link href="${escapeHtml(paperQuestionPath(year, number, PAPER_LETTERS[i]))}" aria-label="${label} ${escapeHtml(option.entry)}">${label} <span lang="en">${escapeHtml(option.entry)}</span></a>
        <details class="paper-option-example" data-lesson-choice="${letter}"><summary aria-label="看 ${escapeHtml(option.form)} 的雙語例句">看雙語例句</summary>
          <div data-lesson-body></div></details></div></li>`;
    }).join("");
    const correct = question.options[question.answer];
    content.innerHTML = `<h3>${year} 學年度詞彙題 · 第 ${number} 題</h3><ol class="paper-options" aria-label="四個選項">${options}</ol>
      <details class="paper-answer" data-lesson-choice="answer"><summary>看答案、選項辨析與搭配</summary>
      <p><strong>大考中心答案 · ${PAPER_LETTERS[question.answer]} <span lang="en">${escapeHtml(correct.form)}</span></strong></p>
      <p><span lang="en" class="paper-phrase">${escapeHtml(question.phrase)}</span> ${escapeHtml(question.clue)}</p>
      <div data-lesson-body></div></details>
      <nav class="paper-sources" aria-label="本題來源與連結"><a href="${escapeHtml(paper.answerUrl)}" target="_blank" rel="noreferrer">大考中心正式答案（PDF）</a><a href="https://www.ceec.edu.tw/xmfile?xsmsid=0J052424829869345634" target="_blank" rel="noreferrer">查原卷（卷面第 1 頁）</a><a href="${escapeHtml(paperQuestionPath(year, number))}">本題連結</a></nav>`;
  }

  async function showLesson(details) {
    const body = details.querySelector("[data-lesson-body]");
    if (!body || body.dataset.ready || body.getAttribute("aria-busy") === "true") return;
    const year = yearSelect.value, number = Number(numberSelect.value);
    const question = GSAT_VOCABULARY_PAPERS[year].questions[number - 1];
    body.setAttribute("aria-busy", "true");
    body.textContent = "正在載入例句…";
    try {
      const lessons = await loadPaperLessons(panel.dataset.lessonsSrc);
      if (!details.isConnected) return;
      body.innerHTML = renderPaperLesson(lessons[year + "-" + number], question, details.dataset.lessonChoice);
      body.dataset.ready = "true";
    } catch {
      if (details.isConnected) body.innerHTML = '<p>例句暫時未載入。 <button type="button" data-retry-lesson>重新載入</button></p>';
    } finally {
      body.removeAttribute("aria-busy");
    }
  }
  content.addEventListener("toggle", event => {
    const details = event.target;
    if (details.open && details.matches("details[data-lesson-choice]")) showLesson(details);
  }, true);
  content.addEventListener("click", event => {
    const button = event.target.closest("[data-retry-lesson]");
    if (button) showLesson(button.closest("details[data-lesson-choice]"));
  });

  function readLocation(moveFocus) {
    const url = new URL(window.location.href);
    const requestedYear = url.searchParams.get("paper");
    const year = years.includes(requestedYear) ? requestedYear : years[0];
    const requestedNumber = Number(url.searchParams.get("q"));
    const paper = GSAT_VOCABULARY_PAPERS[year];
    const number = Number.isInteger(requestedNumber) && paper.questions[requestedNumber - 1] ? requestedNumber : 1;
    const choice = url.searchParams.get("choice");
    const index = choice && /^[ABCD]$/.test(choice) ? PAPER_LETTERS.indexOf(choice) : -1;
    const showWord = index >= 0 && url.hash === "#wordDetail";
    showQuestion(year, number);
    if (requestedYear || url.hash === "#paperVocabulary") panel.open = true;
    if (showWord) {
      const id = paper.questions[number - 1].options[index].entry;
      const wordIndex = VOCABULARY.findIndex(entry => entry.word === id);
      if (wordIndex >= 0) selectEntry(wordIndex);
      wordDetail.focus({preventScroll: true});
      wordDetail.scrollIntoView({block: "start", behavior: "instant"});
    } else if (moveFocus && url.hash === "#paperVocabulary") {
      yearSelect.focus({preventScroll: true});
      panel.scrollIntoView({block: "start", behavior: "instant"});
    }
  }

  function changeQuestion(number) {
    const year = yearSelect.value;
    showQuestion(year, number);
    history.replaceState(history.state, "", paperQuestionPath(year, number));
  }
  yearSelect.addEventListener("change", () => changeQuestion(1));
  numberSelect.addEventListener("change", () => changeQuestion(Number(numberSelect.value)));
  document.addEventListener("click", event => {
    const link = event.target.closest("a[data-paper-link]");
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (link.href !== window.location.href) history.pushState(null, "", link.href);
    readLocation(true);
  });
  window.addEventListener("popstate", () => readLocation(true));
  readLocation(false);
}
