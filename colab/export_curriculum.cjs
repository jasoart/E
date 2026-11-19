'use strict';
// Export the selected checkout's public learning data; never reads browser storage.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({});
for (const file of ['vocabulary.js', 'collocations.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/data', file), 'utf8'), context);
}
const data = vm.runInContext(`({
  schema_version: 1,
  vocabulary: VOCABULARY.map(entry => ({
    word: entry.word, level: entry.level, partOfSpeech: entry.partOfSpeech,
    meaning: entry.meaning
  })),
  lexical_levels: {...CEEC_LEVEL_BY_WORD},
  pattern_count: GSAT_COLLOCATION_GUIDE.reduce((sum, point) => sum + point.patterns.length, 0)
})`, context);
if (data.vocabulary.length !== 6012) throw new Error('Unexpected curriculum size; inspect source data.');
const destination = process.argv[2] || path.join(__dirname, 'data/gsat_curriculum.json');
fs.mkdirSync(path.dirname(path.resolve(destination)), {recursive: true});
fs.writeFileSync(destination, JSON.stringify(data, null, 2) + '\n');
console.log(`Exported ${data.vocabulary.length} vocabulary entries to ${destination}`);
