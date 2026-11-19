"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {environment} = require("../tools/benchmark_search.cjs");
const {createDifficultyResolver} = require("../research/scenario_difficulty.cjs");

test("Five papers have individually reviewed alternatives, linked word forms and bilingual examples", () => {
  const env = environment();
  const runFile = name => env.run(fs.readFileSync(path.join(__dirname, "../assets", name), "utf8"));
  runFile("data/exam-vocabulary.js");
  runFile("js/paper-vocabulary.js");
  runFile("js/examples.js");
  const papers = env.run("GSAT_VOCABULARY_PAPERS");
  assert.equal(env.run("typeof GSAT_PAPER_LESSONS"), "undefined");
  runFile("data/paper-lessons.js");
  const lessons = env.run("GSAT_PAPER_LESSONS");
  const dictionary = new Set(env.run("VOCABULARY.map(entry=>entry.word)"));
  const classify = createDifficultyResolver(env.context).classifyToken;
  const keys = {"111":"BACAACBDDB","112":"ACCBDDBAAD","113":"BABBDCDCAB","114":"CAACCDDABA","115":"BCBADACBCD"};
  assert.deepEqual(Object.keys(papers), Object.keys(keys));
  assert.equal(Object.keys(lessons).length, 50);
  const examples = new Set(), explanations = new Set(), printed = new Map();

  function checkExample(example, max) {
    assert.ok(!examples.has(example.en), example.en);
    examples.add(example.en);
    assert.match(example.zh, /[\u3400-\u9fff]/);
    const words = example.en.toLowerCase().match(/[a-z]+(?:[-'][a-z]+)*/g);
    const focus = example.focus.toLowerCase();
    assert.ok(words.length >= 15 && words.length <= max, example.en);
    assert.ok(words.includes(focus), example.en);
    for (const word of words.filter(w => w !== focus)) {
      const info = classify(word);
      assert.ok(info.level > 0 && info.level <= 5 || info.reviewed, word+" in "+example.en);
    }
  }
  for (const [year, paper] of Object.entries(papers)) {
    assert.match(paper.answerUrl, /^https:\/\/www\.ceec\.edu\.tw\/.+\.pdf$/i);
    assert.equal(paper.questions.length, 10);
    for (const [i, item] of paper.questions.entries()) {
      const answer = "ABCD"[item.answer], lesson = lessons[year+"-"+(i+1)];
      assert.equal(answer, keys[year][i]);
      assert.equal(new Set(item.options.map(o=>o.form)).size, 4);
      assert.equal(lesson.examples.length, 3);
      assert.deepEqual(Object.keys(lesson.alternatives),[..."ABCD"].filter(c=>c!==answer));
      lesson.examples.forEach((example, rank) => checkExample(example, rank===0?25:30));
      item.options.forEach((option, index) => {
        const letter = "ABCD"[index], form = option.form.toLowerCase();
        assert.ok(dictionary.has(option.entry), option.entry);
        assert.ok(["entry", "inflection", "family"].includes(option.relation));
        assert.match(option.zh, /[\u3400-\u9fff]/);
        assert.ok(option.pos);
        if (!printed.has(form)) printed.set(form,new Set());
        printed.get(form).add(option.entry);
        if (letter === answer) {
          assert.ok(lesson.examples.some(row => row.focus.toLowerCase()===form));
        } else {
          const alt = lesson.alternatives[letter];
          assert.match(alt.why, /[\u3400-\u9fff]/);
          assert.ok(!explanations.has(alt.why));
          explanations.add(alt.why);
          checkExample({...alt, focus: form}, 25);
        }
      });
    }
  }
  assert.equal(examples.size, 300);
  assert.equal(explanations.size, 150);
  assert.equal(printed.size, 199);
  assert.equal(env.run("[...paperReferences.values()].reduce((count,hits)=>count+hits.length,0)"), 200);
  for (const [form, entries] of printed) {
    env.context.paperForm = form.toUpperCase();
    const first = env.run("hybridSearch(paperForm)[0]");
    assert.ok(entries.has(first.entry.word), form+" first matched "+first.entry.word);
  }
  for(const [form, lemma] of [["optionally","optional"],["consequently","consequent"]]){
    env.context.paperForm=form;
    env.run('state.searchFeedback[paperForm] = {option:30, consequence:30}');
    const first=env.run("computeHybridSearch(paperForm)[0]");
    assert.equal(first.entry.word, lemma);
    assert.equal(first.match.reason,"試卷詞形相符");
  }
});
