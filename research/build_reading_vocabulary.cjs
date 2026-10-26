#!/usr/bin/env node
'use strict';
// Reading evidence is a word inventory, never a copy of the uploaded passages.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const readJson = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const corpus = readJson('research/reading_corpus_manifest.json');
const editorial = readJson('research/reading_editorial.json');
const context = vm.createContext({console, localStorage:{getItem:()=>null}, document:{getElementById:()=>({})}});
for (const file of ['js/config','data/vocabulary','data/collocations','data/learning','data/builtin-study',
  'data/exam-notebook','data/vocabulary-enrichment','data/authored-scenarios','js/exam-notes','js/state','js/builtin']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'assets', file + '.js'), 'utf8'), context);
}
const vocabulary = JSON.parse(vm.runInContext(`JSON.stringify(VOCABULARY.map(entry=>({
  word:entry.word,level:entry.level,partOfSpeech:entry.partOfSpeech,meaning:entry.meaning,
  aliases:builtinTargetAliases(entry.word),inflections:getNotebookInflections(entry)
})))`, context));
const normalize = value => String(value).normalize('NFKC').replace(/’/g, "'").toLowerCase();
const singleWord = value => /^[a-z]+(?:[-'][a-z]+)*$/.test(value);
const stop = new Set(('a an the and or but if then so as at by for from in into of on to with without '+
  'is are am was were be been being do does did have has had it its this that these those '+
  'i you he she we they my your his her our their me us them not no can could will would '+
  'shall should may might must than which who whom whose what when where why how '+
  'all some any each such there here other others another both either neither one two '+
  'first second third also very more most much many few less least several own only even '+
  'every everyone everything anyone anything someone something nobody nothing yes').split(/\s+/));
const byWord = new Map(vocabulary.map(entry => [entry.word, entry]));
const formIndex = new Map();
function addForm(form, entry, kind) {
  const key = normalize(form);
  if (!singleWord(key) || stop.has(key)) return;
  if (!formIndex.has(key)) formIndex.set(key, new Map());
  const existing = formIndex.get(key).get(entry.word);
  if (!existing || kind === 'exact') formIndex.get(key).set(entry.word, {entry, kind});
}
for (const entry of vocabulary) {
  for (const alias of entry.aliases) addForm(alias, entry, 'exact');
  for (const row of entry.inflections) {
    // Keep complete listed forms. Never tokenize explanatory English/IPA as words.
    for (const alternative of row.value.split('/')) {
      const form = alternative.replace(/（[^）]*）|\([^)]*\)/g, '').trim();
      if (singleWord(normalize(form))) addForm(form, entry, 'inflection');
    }
  }
}
const passageIndex = new Map(corpus.passages.map(passage => [passage.id, passage]));
const curatedByPassage = new Map(),reviewedFormsByPassage=new Map();
for (const [word, note] of Object.entries(editorial)) {
  if (!byWord.has(word)) throw Error('Unknown editorial vocabulary ID: ' + word);
  if (!note.readingSense?.trim() || !note.note?.trim() || !Array.isArray(note.passageIds) || !note.passageIds.length) {
    throw Error('Incomplete reading editorial: ' + word);
  }
  for (const id of note.passageIds) {
    if (!passageIndex.has(id)) throw Error('Unknown editorial passage: ' + id + ' / ' + word);
    if (!curatedByPassage.has(id)) curatedByPassage.set(id, new Set());
    curatedByPassage.get(id).add(word);
  }
  for (const pair of note.collocations || []) {
    if (!Array.isArray(pair) || pair.length !== 2 || pair.some(value => typeof value !== 'string' || !value.trim())) {
      throw Error('Invalid teaching collocation: ' + word);
    }
  }
  for(const form of note.reviewedForms||[]) {
    const normalized=normalize(form);
    if(!singleWord(normalized))throw Error('Invalid reviewed inflection: '+word);
    const support=note.passageIds.filter(id=>passageIndex.get(id).tokens.some(token=>normalize(token.form)===normalized));
    if(!support.length)throw Error('Reviewed inflection absent from its source bodies: '+word+' / '+form);
    for(const id of support) {
      if(!reviewedFormsByPassage.has(id))reviewedFormsByPassage.set(id,new Map());
      const map=reviewedFormsByPassage.get(id);
      if(map.has(normalized)&&map.get(normalized).entry.word!==word)throw Error('Conflicting reviewed form: '+form);
      map.set(normalized,{entry:byWord.get(word),kind:'inflection'});
    }
  }
}
const collected = new Map(), ambiguous = [], unmatched = new Map();
function collectMatch(candidate, token, passage, component) {
  const {entry,kind}=candidate;
  if(entry.level<2&&!editorial[entry.word])return;
  if(!passage.pdfPages.includes(token.pdfPage)||!Number.isSafeInteger(token.count)||token.count<1)throw Error('Invalid source inventory token');
  const record=collected.get(entry.word)||{occurrences:[]};
  const row={passageId:passage.id,form:token.form,pdfPage:token.pdfPage,printedPage:token.pdfPage-1,
    matchKind:component?'compound':kind,count:token.count};
  if(component)row.component=component;
  if(!record.occurrences.some(item=>item.passageId===row.passageId&&item.pdfPage===row.pdfPage&&item.form===row.form))record.occurrences.push(row);
  collected.set(entry.word,record);
}
for (const passage of corpus.passages) {
  for (const token of passage.tokens) {
    const form = normalize(token.form);
    if (stop.has(form) || !singleWord(form)) continue;
    const reviewedForm=reviewedFormsByPassage.get(passage.id)?.get(form);
    let candidates = reviewedForm?[reviewedForm]:[...(formIndex.get(form)?.values() || [])];
    if (candidates.length > 1) {
      // A reviewed passage-specific sense can disambiguate a homograph. Otherwise
      // leave it out instead of silently choosing found/find, left/leave, etc.
      const reviewed = candidates.filter(item => curatedByPassage.get(passage.id)?.has(item.entry.word));
      if (reviewed.length === 1) candidates = reviewed;
      else { ambiguous.push({passageId:passage.id,form:token.form,candidates:candidates.map(item=>item.entry.word)}); candidates=[]; }
    }
    // Only an explicit editorial review can map a compound component to a
    // headword. Preserve the complete printed token and label this separately.
    if(form.includes('-'))for(const component of form.split('-')) {
      const reviewed=[...(formIndex.get(component)?.values()||[])].filter(item=>curatedByPassage.get(passage.id)?.has(item.entry.word));
      if(reviewed.length===1)collectMatch(reviewed[0],token,passage,component);
    }
    if (!candidates.length) {
      unmatched.set(form, (unmatched.get(form) || 0) + (token.count || 1)); continue;
    }
    collectMatch(candidates[0],token,passage);
  }
}
const entries = {},editorialProblems=[];
for (const word of [...collected.keys()].sort((a,b)=>a.localeCompare(b,'en'))) {
  const record = collected.get(word), note = editorial[word];
  const ids = [...new Set(record.occurrences.map(row => row.passageId))];
  const passages = ids.map(id => passageIndex.get(id));
  const years = [...new Set(passages.map(row=>row.year))].sort((a,b)=>a-b);
  const topics = [...new Set(passages.map(row=>row.topicId))].sort();
  const priority = years.length >= 2 ? 'cross-year' : ids.length >= 2 || note ? 'passage-core' : 'topic';
  entries[word] = {years,topics,priority,passageCount:ids.length,occurrences:record.occurrences};
  if (note) {
    const unsupported = note.passageIds.filter(id => !ids.includes(id));
    if (unsupported.length) editorialProblems.push(word + ' / ' + unsupported.join(', '));
    Object.assign(entries[word], {readingSense:note.readingSense,collocations:note.collocations || [],note:note.note,
      editorialPassageIds:note.passageIds});
  }
}
for (const word of Object.keys(editorial)) if (!entries[word]) editorialProblems.push(word+' / no body evidence');
if(editorialProblems.length)throw Error('Editorial words not verified in listed bodies:\n'+editorialProblems.join('\n'));
const supplementalFile=path.join(root,'research/reading_supplemental.json');
const supplementalSource=fs.existsSync(supplementalFile)?readJson('research/reading_supplemental.json'):{},supplemental={};
const originalAliases=new Set(vocabulary.flatMap(entry=>entry.aliases.map(normalize)));
for(const word of Object.keys(supplementalSource).sort((a,b)=>a.localeCompare(b,'en'))) {
  const note=supplementalSource[word];
  if(!singleWord(normalize(word))||originalAliases.has(normalize(word))||byWord.has(word))throw Error('Supplement duplicates an existing vocabulary ID/alias: '+word);
  if(!note.pos?.trim()||!note.meaningZh?.trim()||!note.note?.trim()||!note.forms?.length||!note.passageIds?.length)throw Error('Incomplete reading supplement: '+word);
  const occurrences=[];
  for(const id of note.passageIds) {
    const passage=passageIndex.get(id);if(!passage)throw Error('Unknown supplemental passage: '+id);
    const matches=passage.tokens.filter(token=>note.forms.some(form=>normalize(form)===normalize(token.form)));
    if(!matches.length)throw Error('Supplement has no reviewed form in body: '+word+' / '+id);
    for(const token of matches)occurrences.push({passageId:id,form:token.form,pdfPage:token.pdfPage,printedPage:token.pdfPage-1,
      matchKind:normalize(token.form)===normalize(word)?'exact':'inflection',count:token.count});
  }
  for(const form of note.forms)if(!occurrences.some(row=>normalize(row.form)===normalize(form)))throw Error('Unobserved supplemental form: '+word+' / '+form);
  const ids=[...new Set(occurrences.map(row=>row.passageId))],support=ids.map(id=>passageIndex.get(id));
  const years=[...new Set(support.map(row=>row.year))].sort((a,b)=>a-b),topics=[...new Set(support.map(row=>row.topicId))].sort();
  supplemental[word]={pos:note.pos,meaningZh:note.meaningZh,note:note.note,years,topics,priority:years.length>=2?'cross-year':'topic',passageCount:ids.length,occurrences};
}
const passages = corpus.passages.map(({id,year,section,questionRange,pdfPages,printedPages,topicId,titleZh})=>
  ({id,year,section,questionRange,pdfPages,printedPages,topicId,titleZh}));
const output = {schemaVersion:1,description:'111–115 passage-body word evidence and edited reading guidance; not a prediction of future examination questions.',
  sources:corpus.sources,topics:corpus.topics,passages,entries,supplemental,
  stats:{words:Object.keys(entries).length,passages:passages.length,years:[...new Set(passages.map(row=>row.year))].sort((a,b)=>a-b),
    curatedWords:Object.keys(editorial).length,supplementalWords:Object.keys(supplemental).length,crossYearWords:Object.values(entries).filter(row=>row.years.length>=2).length,
    sourceKind:'passage-body',unresolvedForms:ambiguous.length}};
const content='"use strict";\n// Generated by research/build_reading_vocabulary.cjs; uploaded PDF text is not bundled.\nconst GSAT_READING_VOCABULARY = '+JSON.stringify(output)+';\n';
const target=path.join(root,'assets/data/reading-vocabulary.js');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target,'utf8')!==content) throw Error('Stale generated reading vocabulary');
} else fs.writeFileSync(target,content);
const reportArg=process.argv.indexOf('--report-path');
if (reportArg>=0) fs.writeFileSync(process.argv[reportArg+1],JSON.stringify({ambiguous,unmatched:[...unmatched].sort((a,b)=>b[1]-a[1]),selected:Object.keys(entries)},null,2));
console.log(JSON.stringify(output.stats));
