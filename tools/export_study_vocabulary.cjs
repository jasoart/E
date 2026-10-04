"use strict";
// Trusted repository data only. Never evaluate scripts from an uploaded deck.
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const output = process.argv[2];
if (!output) throw new Error("Usage: node tools/export_study_vocabulary.cjs /tmp/site-vocabulary.json");
const source = fs.readFileSync(path.resolve(__dirname, "../assets/data/vocabulary.js"), "utf8");
const context = vm.createContext({});
vm.runInContext(source, context, { timeout: 5000 });
const vocabulary = vm.runInContext("VOCABULARY", context);
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(output, JSON.stringify(vocabulary, null, 2) + "\n");
console.log(`Exported ${vocabulary.length} original vocabulary entries.`);
