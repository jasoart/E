'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),c=vm.createContext({console,URL,localStorage:{getItem:()=>null},document:{getElementById:()=>({})}});
for(const file of ['js/config','data/vocabulary','data/collocations','data/learning','data/builtin-study','data/exam-notebook','data/vocabulary-enrichment','data/authored-scenarios','js/exam-notes','js/state','js/builtin','js/search','js/examples','js/ui'])vm.runInContext(fs.readFileSync(path.join(root,'assets',file+'.js'),'utf8'),c);
const run=s=>vm.runInContext(s,c);
test('every exact vocabulary ID has readable upgraded information without changing its original level',()=>{
 assert.equal(run('Object.keys(GSAT_VOCABULARY_ENRICHMENT.entries).length'),6024);
 assert.equal(run(`VOCABULARY.every(e=>{const x=getVocabularyInformation(e);return x.commonMeaningZh&&x.pos&&x.teacherTip&&x.level===e.level&&notebookTeacherTip(e,getExamNotebook(e));})`),true);
 assert.equal(run('GSAT_VOCABULARY_ENRICHMENT.stats.withEnglishSenses'),5960);
});
test('corrected common meanings and rare historical meanings are visibly separated',()=>{
 assert.match(run(`getVocabularyInformation('koala').commonMeaningZh`),/無尾熊/);
 assert.match(run(`getVocabularyInformation('mall').commonMeaningZh`),/購物中心/);
 for(const word of ['koala','mall','fine','address']){
  c.word=word;const html=run(`(()=>{const e=VOCABULARY.find(e=>e.word===word);return renderNotebookSenses(e,getBuiltinStudy(e),getExamNotebook(e));})()`);
  assert.match(html,/學測常用義/);assert.match(html,/原詞表完整釋意/);
 }
 assert.match(run(`getVocabularyInformation('fine').commonMeaningZh`),/罰款/);
 assert.match(run(`getVocabularyInformation('fine').commonMeaningZh`),/優良/);
});
test('WordNet additions contain explicit families and sense-scoped synonym candidates',()=>{
 assert.ok(run(`getVocabularyInformation('teacher').family.some(row=>row.word==='teach'&&row.pos==='v.')`));
 assert.ok(run(`getVocabularyInformation('bank').dictionarySenses.some(row=>row.gloss.includes('body of water'))`));
 assert.equal(run(`Object.values(GSAT_VOCABULARY_ENRICHMENT.entries).every(row=>row.synonyms.every(s=>s.scope&&s.pos&&!s.zh))`),true);
});
test('sentence emphasis preserves punctuation and escapes supplied HTML',()=>{
 const html=run(`renderLearningSentence('Although <img src=x> looked useful, the plan was abandoned because it cost too much.',{word:'abandon'})`);
 assert.match(html,/<strong>Although<\/strong>/);assert.match(html,/<strong>abandoned<\/strong>/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);
});

test('common polysemy retains the correct POS and dictionary candidates do not borrow a different Chinese sense',()=>{
 assert.match(run("getVocabularyInformation('fall').commonMeaningZh"),/落下/);assert.match(run("getVocabularyInformation('plain').commonMeaningZh"),/清楚/);
 assert.match(run("getVocabularyInformation('sound').pos"),/v\./);
 for(const word of ['chili','batter','abstract','fair']){c.word=word;assert.equal(run('getExamNotebook(word).synonyms.every(row=>!row.scope)'),true);}
});
