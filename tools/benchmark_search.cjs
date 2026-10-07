'use strict';
// Run: node --expose-gc tools/benchmark_search.cjs [--compare-ref <git-ref>]
// Uses the same released data for both search implementations. No network/dependencies.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {performance} = require('node:perf_hooks');
const {execFileSync, spawnSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const root = path.resolve(__dirname, '..');
const files = ['js/config.js', 'data/vocabulary.js', 'data/collocations.js', 'data/learning.js', 'data/builtin-study.js', 'data/exam-notebook.js', 'js/exam-notes.js', 'js/state.js', 'js/builtin.js'];
const queries = ['challenge', 'elbow', 'exacerbate', 'responsive', 'integration', '導致', '規律運動', '公開露面', '氣候', '陪伴', 'give rise to', 'add fuel to the fire', 'responsive to', 'tight schedule', 'take precedence over', 'challnege', 'enviroment', 'responsvie', 'compainonship', 'become aware', 'exacerbation', 'integral', 'a', 're', 'unlikelysearchterm'];
function environment(searchSource, overrides = {}, snapshot) {
  const node = {addEventListener() {}, classList: {add() {}, remove() {}}};
  const context = {console, performance, setTimeout, clearTimeout, localStorage: {getItem: () => null, setItem() {}}, document: {getElementById: () => node}, ...overrides};
  context.window = context;
  vm.createContext(context);
  const run = source => vm.runInContext(source, context);
  for (const file of files) run(snapshot?.[file] ?? fs.readFileSync(path.join(root, 'assets', file), 'utf8'));
  run(searchSource || fs.readFileSync(path.join(root, 'assets/js/search.js'), 'utf8'));
  return {run, context};
}
function percentile(values, p) { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.ceil(p * sorted.length) - 1]; }
function rounded(n) { return Math.round(n * 100) / 100; }
function measure(source, snapshot) {
  const e = environment(source, {}, snapshot);
  global.gc?.();
  const before = process.memoryUsage().heapUsed;
  let start = performance.now();
  e.run('ensureBm25Index()');
  const indexMs = performance.now() - start;
  global.gc?.();
  const indexHeapMiB = (process.memoryUsage().heapUsed - before) / 1048576;
  e.context.queryBatch = queries;
  e.run('for(const query of queryBatch) computeHybridSearch(query)'); // engine warm-up, no result cache
  const times = [], byQuery = Object.fromEntries(queries.map(q => [q, []]));
  for (let round = 0; round < 7; round++) {
    // Rotate order to reduce first/last-query and garbage-collection bias.
    for (let offset = 0; offset < queries.length; offset++) {
      const q = queries[(offset + round * 3) % queries.length];
      e.context.benchmarkQuery = q;
      start = performance.now(); e.run('computeHybridSearch(benchmarkQuery)');
      const elapsed = performance.now() - start;
      times.push(elapsed); byQuery[q].push(elapsed);
    }
  }
  e.run('hybridSearch("challenge")');
  start = performance.now();
  e.run('for(let i=0;i<1000;i++) hybridSearch("challenge")');
  const cachedBatchMs = performance.now() - start;
  const result = {words: e.run('VOCABULARY.length'), indexMs: rounded(indexMs), indexHeapMiB: rounded(indexHeapMiB), uncachedQuerySamples: times.length, uncachedMedianMs: rounded(percentile(times, .5)), uncachedP95Ms: rounded(percentile(times, .95)), cached1000Ms: rounded(cachedBatchMs), queryMedianMs: Object.fromEntries(Object.entries(byQuery).map(([q, t]) => [q, rounded(percentile(t, .5))]))};
  return result;
}
if (require.main === module) {
  if (process.argv.includes('--measure-snapshot')) {
    const input = JSON.parse(fs.readFileSync(0, 'utf8'));
    console.log(JSON.stringify(measure(input.source, input.snapshot)));
    process.exit(0);
  }
  const arg = process.argv.indexOf('--compare-ref');
  const baseline = arg >= 0 ? execFileSync('git', ['show', `${process.argv[arg + 1]}:assets/js/search.js`], {cwd: root, encoding: 'utf8'}) : null;
  const snapshot = Object.fromEntries(files.map(file => [file, fs.readFileSync(path.join(root, 'assets', file), 'utf8')]));
  const isolated = source => {
    // Separate V8 heaps prevent collection of a prior VM from distorting memory
    // deltas. Both children receive the exact same material snapshot, even if
    // another editor changes a data file during the measurement.
    const child = spawnSync(process.execPath, ['--expose-gc', __filename, '--measure-snapshot'], {input: JSON.stringify({source, snapshot}), encoding: 'utf8', maxBuffer: 1024 * 1024});
    if (child.error) throw child.error;
    if (child.status !== 0) throw new Error(child.stderr || `Benchmark child exited ${child.status}`);
    return JSON.parse(child.stdout);
  };
  const result = {node: process.version, rounds: 7, isolatedProcesses: true, gcExposed: true, materialSha256: createHash('sha256').update(JSON.stringify(snapshot)).digest('hex')};
  if (baseline) result.baseline = isolated(baseline);
  result.current = isolated(fs.readFileSync(path.join(root, 'assets/js/search.js'), 'utf8'));
  console.log(JSON.stringify(result, null, 2));
}
module.exports = {environment, queries};
