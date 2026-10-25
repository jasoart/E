'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),c=vm.createContext({console,localStorage:{getItem:()=>null},document:{getElementById:()=>({})}});
for(const f of ['js/config','data/vocabulary','data/collocations','data/learning','data/builtin-study','data/exam-notebook','data/vocabulary-enrichment','js/exam-notes','js/state','js/builtin','js/examples'])vm.runInContext(fs.readFileSync(path.join(root,'assets',f+'.js'),'utf8'),c);
const resolver=require('../research/scenario_difficulty.cjs').createDifficultyResolver(c);
test('only the actual target and its inflections are exempt from difficult surroundings',()=>{
 assert.deepEqual(resolver.analyze('The organizer helped students because the hall was full.','organizer').high,[]);
 assert.ok(resolver.analyze('The organizer helped students because the hall was full.','student').level6.includes('organizer'));
 assert.ok(resolver.analyze('The curator checked the plan before the class arrived.','plan').excluded.includes('curator'));
 assert.ok(resolver.analyze("The curator's plan helped the class learn.",'plan').excluded.includes('curator'));
});
test('basic grammar and transparent common forms are reviewed without inventing official levels',()=>{
 assert.equal(resolver.classifyToken('could').reviewed,true);assert.equal(resolver.classifyToken('could').level,0);
 assert.equal(resolver.classifyToken('carefully').reviewed,true);
 assert.equal(resolver.classifyToken('qzxqzx').level,0);assert.equal(resolver.classifyToken('qzxqzx').reviewed,undefined);
});
