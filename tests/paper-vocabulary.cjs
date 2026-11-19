"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {environment} = require("../tools/benchmark_search.cjs");
const {createDifficultyResolver} = require("../research/scenario_difficulty.cjs");

test("Every printed option resolves to a dictionary card and every question has its final key and three bilingual examples", () => {
  const env = environment();
  const runFile = name => env.run(fs.readFileSync(path.join(__dirname, "../assets", name), "utf8"));
  runFile("data/exam-vocabulary.js");
  runFile("js/paper-vocabulary.js");
  runFile("js/examples.js");
  const dictionary = new Set(env.run("VOCABULARY.map(entry=>entry.word)"));
  const classify = createDifficultyResolver(env.context).classifyToken;
  const papers = env.run("GSAT_VOCABULARY_PAPERS");
  const keys = {"111":"BACAACBDDB","112":"ACCBDDBAAD","113":"BABBDCDCAB","114":"CAACCDDABA","115":"BCBADACBCD"};
  assert.deepEqual(Object.keys(papers), Object.keys(keys));
  const examples = new Set();
  for (const [year, paper] of Object.entries(papers)) {
    assert.match(paper.answerUrl, /^https:\/\/www\.ceec\.edu\.tw\/.+\.pdf$/i);
    assert.equal(paper.questions.length, 10);
    for (const [i, item] of paper.questions.entries()) {
      assert.equal("ABCD"[item.answer], keys[year][i]);
      assert.equal(item.options.length, 4);
      assert.equal(new Set(item.options.map(o=>o.form)).size, 4);
      for (const option of item.options) {
        assert.ok(dictionary.has(option.entry), option.entry);
        assert.ok(["entry", "inflection", "family"].includes(option.relation));
        assert.match(option.zh, /[\u3400-\u9fff]/);
        assert.ok(option.pos);
      }
      assert.equal(item.examples.length, 3);
      for (const [rank, example] of item.examples.entries()) {
        assert.ok(!examples.has(example.en));
        examples.add(example.en);
        assert.match(example.zh, /[\u3400-\u9fff]/);
        const words = example.en.match(/[a-z]+(?:[-'][a-z]+)*/gi);
        assert.ok(words.length >= 15 && words.length <= (rank === 0 ? 25 : 30), example.en);
        assert.ok(words.includes(example.focus));
        for (const word of words.filter(w => w !== example.focus)) {
          const info = classify(word);
          assert.ok(info.level > 0 && info.level <= 5 || info.reviewed, word+" in "+example.en);
        }
      }
    }
  }
  assert.equal(examples.size, 150);
  assert.equal(env.run("[...paperReferences.values()].reduce((count,hits)=>count+hits.length,0)"), 200);
  const option = env.run('searchFields(VOCABULARY.find(entry=>entry.word==="initial"))');
  assert.ok(option.aliases.includes("initially"));
  assert.ok(option.meaning.includes("起初"));
});
