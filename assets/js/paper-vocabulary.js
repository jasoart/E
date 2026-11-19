"use strict";

const PAPER_LETTERS = "ABCD";
const PAPER_EXAMPLE_LABELS = ["詞彙語境", "詞形與句構", "閱讀與寫作"];
const paperReferences = new Map();
for (const [year, paper] of Object.entries(GSAT_VOCABULARY_PAPERS)) {
  paper.questions.forEach((question, index) => {
    question.options.forEach((option, choice) => {
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

function setupPaperVocabulary() {
  const panel = byId("paperVocabulary");
  if (!panel) return;
  const yearSelect = byId("paperYear"), numberSelect = byId("paperNumber");
  const content = byId("paperContent");
  const years = Object.keys(GSAT_VOCABULARY_PAPERS).sort((a, b) => Number(b) - Number(a));
  for (const year of years) yearSelect.add(new Option(year + " 學年度", year));

  function showQuestion(year, number) {
    const paper = GSAT_VOCABULARY_PAPERS[year], question = paper.questions[number - 1];
    if (yearSelect.value !== year || !numberSelect.options.length) {
      yearSelect.value = year;
      numberSelect.replaceChildren();
      paper.questions.forEach((_, i) => numberSelect.add(new Option("第 " + (i + 1) + " 題", String(i + 1))));
    }
    numberSelect.value = String(number);
    const options = question.options.map((option, i) => {
      const label = {entry: "查詞條", inflection: "查原形", family: "查同字族"}[option.relation];
      return `<li><span class="paper-letter">${PAPER_LETTERS[i]}</span><div><strong lang="en">${escapeHtml(option.form)}</strong>
        <p><abbr>${escapeHtml(option.pos)}</abbr> ${escapeHtml(option.zh)}</p>
        <a data-paper-link href="${escapeHtml(paperQuestionPath(year, number, PAPER_LETTERS[i]))}" aria-label="${label} ${escapeHtml(option.entry)}">${label} <span lang="en">${escapeHtml(option.entry)}</span></a></div></li>`;
    }).join("");
    const examples = question.examples.map((example, i) => `<li><small>${PAPER_EXAMPLE_LABELS[i]}</small>
      <p lang="en">${paperExampleText(example)}</p><p>${escapeHtml(example.zh)}</p></li>`).join("");
    const correct = question.options[question.answer];
    content.innerHTML = `<h3>${year} 學年度詞彙題 · 第 ${number} 題</h3><ol class="paper-options" aria-label="四個選項">${options}</ol>
      <details class="paper-answer"><summary>看答案、搭配與自編例句</summary>
      <p><strong>大考中心答案 · ${PAPER_LETTERS[question.answer]} <span lang="en">${escapeHtml(correct.form)}</span></strong></p>
      <p><span lang="en" class="paper-phrase">${escapeHtml(question.phrase)}</span> ${escapeHtml(question.clue)}</p>
      <h4>本站自編雙語例句</h4><ol class="paper-examples">${examples}</ol></details>
      <nav class="paper-sources" aria-label="本題來源與連結"><a href="${escapeHtml(paper.answerUrl)}" target="_blank" rel="noreferrer">大考中心正式答案（PDF）</a><a href="https://www.ceec.edu.tw/xmfile?xsmsid=0J052424829869345634" target="_blank" rel="noreferrer">查原卷（卷面第 1 頁）</a><a href="${escapeHtml(paperQuestionPath(year, number))}">本題連結</a></nav>`;
  }

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
