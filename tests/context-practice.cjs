'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function environment(){
 const nodes={diagnosticCategory:{value:''},diagnosticLength:{value:'10'}};
 const context=vm.createContext({localStorage:{getItem:()=>null},byId:id=>nodes[id],shuffled:list=>[...list].reverse()});
 for(const name of ['assets/data/context-practice.js','assets/js/diagnostics.js'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,'..',name),'utf8'),context);
 return{context,nodes,run:source=>vm.runInContext(source,context)};
}
test('question bank has unique stable IDs, complete bilingual feedback and valid distinct choices',()=>{
 const e=environment(),questions=e.run('GSAT_DIAG_QUESTIONS');
 assert.equal(questions.length,59);assert.equal(new Set(questions.map(q=>q.id)).size,59);
 for(const q of questions){
  assert.match(q.id,/^ctx-\d{3}$/);assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);
  assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);
  assert.match(q.prompt,/[A-Za-z]/);assert.match(q.zh,/[\u3400-\u9fff]/);assert.match(q.explanation,/[\u3400-\u9fff]/);
 }
 assert.equal(questions[0].id,'ctx-001');assert.match(questions[0].prompt,/air pollution/);
 assert.equal(questions[34].id,'ctx-035');assert.match(questions[34].prompt,/reducing food waste/);
 for(const category of ['熟詞偏義','介系詞與搭配','詞性轉換','語境替換','寫作句型'])assert.ok(questions.some(q=>q.category===category));
});
test('short sessions interleave categories without duplication; all mode retains the entire pool',()=>{
 const e=environment();
 const short=e.run('buildDiagnosticSession(GSAT_DIAG_QUESTIONS,10)');
 assert.equal(short.length,10);assert.equal(new Set(short.map(q=>q.id)).size,10);
 assert.equal(new Set(short.map(q=>q.category)).size,10);
 assert.equal(e.run('buildDiagnosticSession(GSAT_DIAG_QUESTIONS,999).length'),59);
 assert.equal(e.run('buildDiagnosticSession([],10).length'),0);
});
test('category and wrong-answer filters intersect without removing old mistakes',()=>{
 const e=environment();e.run("gsatMistakes['ctx-001']={times:2};gsatMistakes['ctx-048']={times:1}");
 assert.equal(e.run('diagnosticQuestionPool(true).length'),2);
 e.nodes.diagnosticCategory.value='詞性轉換';
 assert.equal(e.run('diagnosticQuestionPool(true).length'),1);
 assert.equal(e.run('diagnosticQuestionPool(true)[0].id'),'ctx-048');
 assert.equal(e.run('diagnosticWrongCount()'),2);
 assert.equal(e.run('diagnosticQuestionPool(false).length'),6);
});
