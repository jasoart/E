'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const coach = require('../assets/js/local-coach.js');

// Solve (I - d P^T) r = (1-d) v directly. This is independent of the
// iterative implementation and makes personalized dangling redistribution visible.
function stationarySolution(weights, damping, prior) {
  const n = weights.length;
  const transition = weights.map(row => {
    const total = row.reduce((sum, value) => sum + value, 0);
    return total ? row.map(value => value / total) : prior;
  });
  const system = prior.map((value, row) => [
    ...prior.map((_, column) => (row === column ? 1 : 0) - damping * transition[column][row]),
    (1 - damping) * value,
  ]);
  for (let column = 0; column < n; column++) {
    let pivot = column;
    for (let row = column + 1; row < n; row++) if (Math.abs(system[row][column]) > Math.abs(system[pivot][column])) pivot = row;
    [system[column], system[pivot]] = [system[pivot], system[column]];
    const scale = system[column][column];
    assert.ok(Math.abs(scale) > 1e-12, 'The independent linear system must be nonsingular');
    for (let j = column; j <= n; j++) system[column][j] /= scale;
    for (let row = 0; row < n; row++) if (row !== column) {
      const factor = system[row][column];
      for (let j = column; j <= n; j++) system[row][j] -= factor * system[column][j];
    }
  }
  return system.map(row => row[n]);
}

function closeVector(actual, expected, tolerance = 1e-8) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => {
    assert.ok(Number.isFinite(value) && value >= 0, `Probability ${index} must be finite and nonnegative`);
    assert.ok(Math.abs(value - expected[index]) <= tolerance, `${index}: ${value} != ${expected[index]}`);
  });
  if (actual.length) assert.ok(Math.abs(actual.reduce((sum, value) => sum + value, 0) - 1) < 1e-8);
}

test('personalized PageRank agrees with a direct stationary solution including dangling mass', () => {
  const weights = [[0, 2, 1], [1, 0, 0], [0, 0, 0]], prior = [.2, .3, .5];
  const expected = stationarySolution(weights, .85, prior);
  closeVector(coach.pageRank(weights, .85, 1e-12, 1000, prior), expected);
  closeVector(coach.pageRank(weights, .85, 1e-12, 1000), stationarySolution(weights, .85, [1/3, 1/3, 1/3]));
  const permutation = [2, 0, 1];
  const permuted = weights.map((_, i) => permutation.map(j => weights[permutation[i]][j]));
  closeVector(coach.pageRank(permuted, .85, 1e-12, 1000, permutation.map(i => prior[i])), permutation.map(i => expected[i]));
});

test('PageRank safely normalizes invalid and extremely large personalization weights', () => {
  const dangling = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const prior of [undefined, [], [0, 0, 0], [NaN, -2, Infinity]]) {
    closeVector(coach.pageRank(dangling, .85, 1e-12, 1000, prior), [1/3, 1/3, 1/3]);
  }
  closeVector(coach.pageRank(dangling, .85, 1e-12, 1000, [Infinity, 3, -1]), [0, 1, 0]);
  closeVector(coach.pageRank(dangling, .85, 1e-12, 1000, [1e308, 1e308, 0]), [.5, .5, 0]);
  closeVector(coach.pageRank([[0, 1], [1, 0]], 0, 1e-12, 100, [3, 1]), [.75, .25]);
  closeVector(coach.pageRank([[0, 1], [1, 0]], .85, 1e-12, 0, [3, 1]), [.75, .25]);
  assert.deepEqual(coach.pageRank([], .85, 1e-12, 100, [1]), []);
  assert.deepEqual(coach.pageRank([[0]], .85, 1e-12, 100, [0]), [1]);
});

test('keyword personalization and cooccurrence use original positions including stopwords', () => {
  // alpha occurs at positions 1 and 5, beta at 3, gamma at 8. The original
  // four-position lookahead creates alpha-beta twice and alpha-gamma once.
  // Compressing stopwords would incorrectly create a beta-gamma edge.
  const ranked = coach.keywordRank('alpha the beta the alpha the and gamma');
  const priorWeights = [1 + 1/5, 1/3, 1/8], total = priorWeights.reduce((sum, value) => sum + value, 0);
  const expected = stationarySolution([[0, 2, 1], [2, 0, 0], [1, 0, 0]], .85, priorWeights.map(value => value / total));
  const order = ['alpha', 'beta', 'gamma'];
  closeVector(order.map(word => ranked.find(item => item.word === word).score), expected, 1e-6);
  assert.deepEqual(Object.fromEntries(ranked.map(item => [item.word, item.count])), {alpha: 2, beta: 1, gamma: 1});
  assert.deepEqual(coach.keywordRank('the '.repeat(1200) + 'alpha'), [], 'The input cap counts original tokens, including stopwords');
  assert.deepEqual(coach.keywordRank('alpha beta gamma', 0), []);
});

test('example MMR keeps relevant variety while suppressing exact and near duplicate text', () => {
  const a = {id: 'main', text: 'Clean energy protects people and supports local communities.', translationZh: '潔淨能源保護人們並支持在地社區。'};
  const duplicate = {...a, id: 'duplicate'};
  const similar = {id: 'similar', text: 'Clean energy protects people and supports nearby communities.', translationZh: '潔淨能源保護人們並支持附近社區。'};
  const different = {id: 'different', text: 'Clean energy creates jobs through wind projects in coastal towns.', translationZh: '潔淨能源透過沿海城鎮的風力計畫創造工作。'};
  const unrelated = {id: 'unrelated', text: 'Readers visit the library.'};
  const pool = [a, duplicate, similar, different, unrelated];
  const before = JSON.stringify(pool);
  const chosen = coach.rankExamples('clean energy', pool, 2);
  assert.deepEqual(chosen.map(item => item.id), ['main', 'different']);
  assert.deepEqual(coach.rankExamples('clean energy', pool, 2).map(item => item.id), chosen.map(item => item.id));
  const all = coach.rankExamples('clean energy', pool, 20);
  assert.equal(all.filter(item => item.text === a.text).length, 1);
  assert.ok(all.every(item => item.relevance > 0 && item.id !== 'unrelated'));
  assert.ok(all.every(item => pool.some(original => original.text === item.text && original.translationZh === item.translationZh)));
  assert.equal(JSON.stringify(pool), before, 'Reranking must not mutate the supplied study records');
});

test('example relevance includes Chinese context and zero-signal fallback retains input order', () => {
  const reading = {id: 'reading', text: 'Students visit the library.', topic: '閱讀', translationZh: '學生到圖書館閱讀。'};
  const climate = {id: 'climate', text: 'Families prepare for changing weather.', topic: '氣候變遷', translationZh: '家庭為變化的天氣作準備。'};
  const weather = {id: 'weather', text: 'Communities protect their homes.', topic: '社區', translationZh: '社區面對氣候變遷並保護家園。'};
  const pool = [reading, climate, weather];
  const matched = coach.rankExamples('氣候變遷 weather', pool, 3);
  assert.equal(matched[0].id, 'climate');
  assert.ok(matched.some(item => item.id === 'weather'));
  assert.ok(!matched.some(item => item.id === 'reading'));
  assert.deepEqual(coach.rankExamples('沒有命中', pool, 3).map(item => item.id), ['reading', 'climate', 'weather']);
  assert.deepEqual(coach.rankExamples('', pool, 2).map(item => item.id), ['reading', 'climate']);
  assert.deepEqual(coach.rankExamples('climate', pool, 0), []);
  assert.deepEqual(coach.rankExamples('climate', pool, -1), []);
});

test('summary selection respects limits, source wording, source order and duplicate suppression', () => {
  const original = ['Clean energy supports local communities.', 'Clean energy supports local communities.', 'Coastal families invest in wind projects.', 'Libraries provide useful books.'];
  const text = original.join(' ');
  const results = coach.sentenceRank(text, 3);
  assert.equal(new Set(results.map(item => item.text)).size, results.length);
  assert.equal(results.length, 3);
  assert.ok(results.every(item => original[item.index] === item.text));
  assert.ok(results.every((item, index) => index === 0 || item.index > results[index - 1].index));
  assert.deepEqual(coach.sentenceRank(text, 3), results, 'The same source must produce the same extractive summary');
  assert.deepEqual(coach.sentenceRank(text, 0), []);
  assert.deepEqual(coach.sentenceRank(text, -1), []);
  assert.deepEqual(coach.sentenceRank('The and of.'), []);
  const disconnected = 'Alpha. Beta. Gamma.';
  assert.deepEqual(coach.sentenceRank(disconnected, 2).map(item => item.text), ['Alpha.', 'Beta.']);
});
