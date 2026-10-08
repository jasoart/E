'use strict';
// Run: node --test tests/regression.cjs (Node 20+). No third-party packages.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const files=['js/config.js','data/vocabulary.js','data/collocations.js','data/learning.js','data/builtin-study.js','js/exam-notes.js','js/state.js','js/builtin.js','js/search.js','js/examples.js','js/audio.js','js/ui.js','data/context-practice.js','js/diagnostics.js','js/favorites.js','js/online.js'];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function element(){const classes=new Set();return {textContent:'',innerHTML:'',hidden:false,value:'',dataset:{},style:{},children:[],isConnected:true,disabled:false,addEventListener(){},setAttribute(){},querySelectorAll(){return []},querySelector(){return element()},appendChild(el){this.children.push(el)},scrollTo(){},scrollIntoView(){},focus(){},blur(){},select(){},remove(){},canPlayType(){return 'probably'},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle(x,on){const flag=on??!classes.has(x);flag?classes.add(x):classes.delete(x);return flag}}};}
function environment({fetch,stored={},indexedDB}={}){
 const data=new Map(Object.entries(stored)),nodes=new Map(),writes=[],events=[];
 const get=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)};
 const context={console,URL,URLSearchParams,AbortController,DOMException,performance,Blob,structuredClone,setTimeout,clearTimeout,innerWidth:1280,matchMedia:()=>({matches:false}),navigator:{onLine:true},fetch:fetch||(async()=>response([])),localStorage:{getItem:key=>data.get(key)??null,setItem(key,value){writes.push(key);data.set(key,String(value))}},document:{getElementById:get,createElement:element,querySelectorAll:()=>[],addEventListener(){},body:element(),activeElement:{tagName:'BODY'}},DOMParser:class{parseFromString(text){return {body:{textContent:String(text).replace(/<[^>]*>/g,'')}}}},addEventListener(){}};
 context.window=context;if(indexedDB)context.indexedDB=indexedDB;vm.createContext(context);
 for(const name of files)vm.runInContext(fs.readFileSync(path.join(root,'assets',name),'utf8'),context,{filename:name});
 const run=code=>vm.runInContext(code,context);context.events=events;
 return {context,run,data,nodes,writes,events,get};
}
function response(payload,status=200,headers={}){return {ok:status>=200&&status<300,status,headers:new Headers({'Content-Type':'application/json',...headers}),json:async()=>payload};}
function networkFetch(delay=20,payload=[]){let calls=0,active=0,peak=0;const fetch=(url,{signal})=>new Promise((resolve,reject)=>{calls++;active++;peak=Math.max(peak,active);const finish=()=>{active--;signal.removeEventListener('abort',cancel);resolve(response(payload))};const timer=setTimeout(finish,delay);const cancel=()=>{clearTimeout(timer);active--;reject(new DOMException('aborted','AbortError'))};signal.addEventListener('abort',cancel,{once:true});});return {fetch,get calls(){return calls},get peak(){return peak}};}
function usePanelSpies(e){e.run(`showDictionaryResult=(r,entry,i)=>events.push({panel:'dictionary',word:entry.word,index:i,time:performance.now(),result:r});showExampleResult=(r,entry,i)=>events.push({panel:'examples',word:entry.word,index:i,time:performance.now(),result:structuredClone(r)});showSynonymsResult=(r,i)=>events.push({panel:'synonyms',index:i,time:performance.now()});showCollocationsResult=(r,entry,i)=>events.push({panel:'collocations',word:entry.word,index:i,time:performance.now()});showOnlineResult=(r,entry,i)=>events.push({panel:'complete',word:entry.word,index:i,time:performance.now(),result:structuredClone(r)});`);}
const firstSentence='The students accepted the challenge because they wanted to learn something new.';
const secondSentence='Finding enough clean water is a serious challenge for many families.';
const dict=(word='challenge')=>[{word,phonetic:'/test/',phonetics:[{audio:'https://example.org/en-us.mp3'}],meanings:[{partOfSpeech:'noun',definitions:[{example:firstSentence}]}]}];

// Deliberately validates state/API behavior; it does not substitute for browser layout testing.
test('all script files parse and local HTML asset references exist',()=>{
 for(const name of [...files,'js/app.js'])new vm.Script(fs.readFileSync(path.join(root,'assets',name),'utf8'));
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g))assert.ok(fs.existsSync(path.join(root,match[1].split('?')[0])),match[1]);
 assert.equal(html,fs.readFileSync(path.join(root,'index .html'),'utf8'));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest')));for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join(root,icon.src)));
});
test('all 6012 exact word IDs remain unique',()=>{const e=environment();assert.equal(e.run('VOCABULARY.length'),6012);assert.equal(e.run('new Set(VOCABULARY.map(x=>x.word)).size'),6012);assert.equal(e.run('FAVORITES_KEY'),'gsat-standalone-favorites-v1');});
test('old favorites and every original progress key load without startup writes',()=>{
 const stored={'gsat-standalone-favorites-v1':'["challenge","a/an","legacy-custom-word"]','gsat-v2-search-feedback-v1':'{"challenge":{"challenge":2}}','gsat-v2-collocation-practice-v1':'{"correct":3,"total":4}','gsat-v3-recent-searches-v1':'["challenge"]','gsat-v3-review-queue-v1':'{"challenge":{"stage":2,"due":"2020-01-01"}}'};
 const e=environment({stored});assert.deepEqual(JSON.parse(e.run('JSON.stringify([...state.favorites])')),['challenge','a/an','legacy-custom-word']);assert.equal(e.run('state.practice.correct'),3);assert.equal(e.run('state.review.challenge.stage'),2);assert.equal(e.writes.length,0);for(const [k,v]of Object.entries(stored))assert.equal(e.data.get(k),v);
});
test('favorite changes never reload the detail card/API and preserve unknown IDs',()=>{
 const e=environment({stored:{'gsat-standalone-favorites-v1':'["challenge","legacy-word"]'}});e.run(`renderDetail=()=>{throw Error('should not rerender')};loadOnlineData=()=>{throw Error('should not reload')};showToast=()=>{};applyFilters=()=>{};state.selectedIndex=VOCABULARY.findIndex(x=>x.word==='challenge');toggleFavorite('challenge');`);assert.deepEqual(JSON.parse(e.data.get('gsat-standalone-favorites-v1')),['legacy-word']);e.run("toggleFavorite('challenge')");assert.deepEqual(JSON.parse(e.data.get('gsat-standalone-favorites-v1')),['legacy-word','challenge']);
});
test('quota failure leaves original favorites and memory unchanged',()=>{const e=environment({stored:{'gsat-standalone-favorites-v1':'["challenge"]'}});e.run(`showToast=()=>{};localStorage.setItem=()=>{throw Error('quota')};toggleFavorite('study');`);assert.equal(e.run('state.favorites.has("study")'),false);assert.equal(e.data.get('gsat-standalone-favorites-v1'),'["challenge"]');});
test('import merges backups and rejects malformed data without clearing favorites',async()=>{const e=environment({stored:{'gsat-standalone-favorites-v1':'["challenge"]'}});e.run('showToast=()=>{};applyFilters=()=>{}');e.context.backup={size:50,text:async()=>'["a/an","challenge","legacy-word"]'};await e.run('importFavorites(backup)');assert.deepEqual(JSON.parse(e.data.get('gsat-standalone-favorites-v1')),['challenge','a/an','legacy-word']);e.context.backup={size:3,text:async()=>'{'};await e.run('importFavorites(backup)');assert.equal(e.run('state.favorites.size'),3);});
test('malformed localStorage does not crash startup or get rewritten',()=>{const e=environment({stored:{'gsat-standalone-favorites-v1':'{not json','gsat-v2-search-feedback-v1':'null'}});assert.equal(e.run('state.favorites.size'),0);assert.equal(e.writes.length,0);});
test('target forms, contractions and phrase boundaries',()=>{const e=environment();assert.equal(e.run(`containsTargetForm('The children went to school early this morning.','child')`),true);assert.equal(e.run(`containsTargetForm('We looked forward to the school trip next week.','look forward to')`),true);assert.equal(e.run(`containsTargetForm('The artist performed well at school yesterday.','the art')`),false);assert.equal(e.run(`containsTargetForm('The artist performed well on stage at school today.','art')`),false);assert.equal(e.run(`sentenceWords('We don’t know.')[1]`),"don't");assert.match(e.run(`clozeSentence('We looked forward to the school trip.','look forward to')`),/________/);});
test('ordered collocation matching avoids unrelated nearby prepositions',()=>{const e=environment();assert.equal(e.run(`curatedCollocationCheck('Students contribute for the school to help local families.','contribute').aligned`),false);assert.equal(e.run(`curatedCollocationCheck('Students contribute to the school each year.','contribute').aligned`),true);assert.equal(e.run(`curatedCollocationCheck('We are satisfied with the school results.','satisfy').blocked`),false);assert.equal(e.run(`curatedCollocationCheck('They are capable to learn from their school experience.','capable').blocked`),true);});
test('exact, Chinese concept, typo and phrase searches remain available',()=>{const e=environment();assert.equal(e.run("hybridSearch('challenge')[0].entry.word"),'challenge');assert.ok(e.run("hybridSearch('導致').some(x=>x.entry.word==='lead')"));assert.ok(e.run("hybridSearch('challnege').some(x=>x.entry.word==='challenge')"));assert.ok(e.run("hybridSearch('give rise to').length>0"));assert.equal(e.run("hybridSearch('challenge')===hybridSearch('challenge')"),true);});
test('full app startup runs through all 6012 entries with old favorites',async()=>{const e=environment({stored:{'gsat-standalone-favorites-v1':'["challenge"]'}});e.run('loadOnlineData=async()=>{};warmSearchIndex=()=>{};');vm.runInContext(fs.readFileSync(path.join(root,'assets/js/app.js'),'utf8'),e.context);assert.equal(e.get('totalCount').textContent,'6,012');assert.equal(e.get('favoriteCount').textContent,'1');assert.equal(e.get('bootStatus').hidden,true);assert.match(e.get('wordDetail').innerHTML,/challenge/);await pause(110);});
test('expanded corpus counts, verified evidence and reachable source cards are consistent',()=>{
 const e=environment();const points=JSON.parse(e.run('JSON.stringify(GSAT_COLLOCATION_GUIDE)')),stats=e.run('GSAT_COLLOCATION_STATS');
 assert.equal(points.length,1061);assert.equal(points.reduce((n,p)=>n+p.patterns.length,0),2500);
 assert.equal(points.filter(p=>p.evidence.length).length,609);
 const refs=points.flatMap(p=>p.patternReferences.flat());assert.equal(refs.length,636);
 assert.deepEqual([...new Set(refs.map(r=>r.year))].sort(),['111','112','113','114','115']);
 for(const point of points){
  assert.equal(point.patternReferences.length,point.patterns.length);
  assert.deepEqual([...new Set(point.patternReferences.flat().map(r=>r.year))].sort(),point.evidence);
  for(const ref of point.patternReferences.flat()){
   assert.ok(ref.pdfPage>=2&&ref.pdfPage<=12);assert.equal(ref.printedPage,ref.pdfPage-1);
   assert.ok(['stem','passage','option'].includes(ref.role));assert.ok(ref.detailId&&ref.location&&ref.filename);assert.equal(ref.quote,undefined);
  }
 }
 assert.equal(e.run('GSAT_EXAM_COLLOCATIONS.every(point=>VOCABULARY.some(entry=>getGsatPoints(entry).includes(point)))'),true);
 assert.equal(stats.verifiedPatterns,611);
});
test('new phrases and Chinese concepts are searchable through existing vocabulary',()=>{
 const e=environment();
 for(const [query,word]of [['take precedence over','priority'],['one of a kind','kind'],['coexist with','exist'],['規律運動','exercise'],['公開露面','appearance']]){
  e.context.lookupQuery=query;e.context.expectedWord=word;
  assert.ok(e.run('hybridSearch(lookupQuery).some(result=>result.entry.word===expectedWord)'),query);
 }
});
test('each year filters both word results and displayed source references',()=>{
 const e=environment();e.run('state.examOnly=true;state.query="";');
 for(const year of ['111','112','113','114','115']){
  e.context.year=year;e.run('state.examYear=year;applyFilters();');
  assert.ok(e.run('state.filtered.length>0'));
  assert.equal(e.run('state.filtered.every(({entry})=>getGsatPoints(entry).some(point=>point.evidence.includes(year)))'),true);
  assert.equal(e.run('state.filtered.every(({entry})=>getVisibleGsatPoints(entry).every(point=>point.evidence.includes(year)))'),true);
 }
 e.run('state.examYear="114";');
 const html=e.run('renderGsatPoint(VOCABULARY.find(entry=>entry.word==="allow"))');
 assert.match(html,/114 年/);assert.doesNotMatch(html,/111 年｜/);assert.doesNotMatch(html,/112 年｜/);
});
test('source UI distinguishes options, leaves general patterns unverified and escapes quotations',()=>{
 const e=environment();
 const html=e.run('renderGsatPoint(VOCABULARY.find(entry=>entry.word==="fuel"))');
 assert.match(html,/115 年/);assert.match(html,/第 36 題/);assert.match(html,/PDF 第 6 頁/);assert.match(html,/選項用語 · 非答案標記/);
 assert.match(e.run('renderPatternReferences([])'),/未附逐句真題出處/);
 e.context.untrusted={year:'115',location:'test',role:'passage',quote:'<img src=x onerror=alert(1)>',printedPage:1,pdfPage:2,filename:'test.pdf'};
 const escaped=e.run('renderPatternReferences([untrusted])');assert.doesNotMatch(escaped,/<img/);assert.match(escaped,/&lt;img/);
});
test('practice uses reviewed four-choice prompts, skips slash alternatives and deduplicates',()=>{
 const e=environment();
 const all=e.run('GSAT_COLLOCATION_GUIDE.flatMap(point=>point.practice.map(q=>({...q,form:point.patterns[q.patternIndex][0]})))');
 assert.equal(new Set(all.map(q=>q.masked+'|'+q.answer)).size,129);
 for(const q of all){assert.equal(new Set([q.answer,...q.distractors]).size,4);assert.equal(q.masked.replace('_____',q.answer),q.form);assert.equal(q.masked.split('_____').length,2);}
 const candidates=e.run('collocationPracticeCandidates(VOCABULARY.find(entry=>entry.word==="allow"))');
 assert.equal(new Set(candidates.map(q=>q.masked+'|'+q.answer)).size,candidates.length);
 e.run('state.examOnly=true;state.examYear="115";');
 assert.equal(e.run('VOCABULARY.every(entry=>collocationPracticeCandidates(entry).every(q=>q.point.patternReferences[q.patternIndex].some(ref=>ref.year==="115")))'),true);
 const practice=e.run('collocationQuestion(VOCABULARY.find(entry=>entry.word==="resort"))');
 assert.equal(practice.answer,'to');assert.match(practice.meaning,/訴諸/);assert.equal(practice.options.length,4);
});
test('changing source filters refreshes learning only and keeps stored favorites untouched',()=>{
 const e=environment({stored:{'gsat-standalone-favorites-v1':'["allow","legacy-word"]'}});
 e.run('state.selectedIndex=VOCABULARY.findIndex(entry=>entry.word==="allow");loadOnlineData=()=>{throw Error("unnecessary API reload")};state.examYear="114";setListMode("exam");');
 assert.match(e.get('collocationContent').innerHTML,/114 年/);assert.equal(e.get('examYearFilters').hidden,false);
 assert.equal(e.data.get('gsat-standalone-favorites-v1'),'["allow","legacy-word"]');assert.equal(e.writes.length,0);
 e.run('setListMode("all")');assert.equal(e.get('examYearFilters').hidden,true);
 assert.equal(e.run('typeof AI_MODEL_ID'),'undefined');
});

// V6: provenance, self-authored coverage, on-demand quotations, and diagnostics.
test('new bilingual thematic patterns are reachable, distinct, and do not claim exam provenance',()=>{
 const e=environment(),points=JSON.parse(e.run('JSON.stringify(GSAT_COLLOCATION_GUIDE)')),vocab=new Set(e.run('VOCABULARY.map(entry=>entry.word)'));
 const original=points.slice(0,883),additional=points.slice(883);assert.equal(original.reduce((n,p)=>n+p.patterns.length,0),1295);
 assert.equal(additional.reduce((n,p)=>n+p.patterns.length,0),1205);
 assert.equal(new Set(additional.flatMap(p=>p.patterns.map(row=>row[0].toLowerCase()))).size,1205);assert.ok(new Set(points.flatMap(p=>p.patterns.map(row=>row[0].toLowerCase()))).size>=2476);
 for(const p of additional){assert.equal(p.origin,'self-authored');assert.deepEqual(p.evidence,[]);assert.ok(vocab.has(p.keys[0]));assert.ok(p.patterns.every(([en,zh])=>en.length>3&&zh.length>3));assert.ok(p.patternNotes.every(note=>note.includes('自編')));}
 for(const term of ['reduce the risk of air pollution','collect research data','public concerns about digital technologies','focus on new ideas']){e.context.term=term;assert.ok(e.run('hybridSearch(term).length>0'),term)}
});
test('all 636 original quote texts are moved to delayed JSON but citation metadata stays usable',()=>{
 const excerpts=JSON.parse(fs.readFileSync(path.join(root,'assets/data/reference-details.json'),'utf8'));
 const source=fs.readFileSync(path.join(root,'assets/data/collocations.js'),'utf8');
 const e=environment(),references=JSON.parse(e.run('JSON.stringify(GSAT_COLLOCATION_GUIDE.flatMap(p=>p.patternReferences.flat()))'));
 assert.equal(Object.keys(excerpts).length,636);assert.equal(references.length,636);
 assert.ok(references.every(ref=>excerpts[ref.detailId]?.quote&&excerpts[ref.detailId]?.anchor));
 assert.ok(!source.includes('lead to dizziness, nausea, and vomiting. Motion sickness occurs'));
 assert.match(e.run('renderPatternReferences(GSAT_COLLOCATION_GUIDE[2].patternReferences[0])'),/點開後載入原文摘錄/);
});
test('self-authored diagnostics retain wrong answers independently of legacy favorites and remove only on successful retry',()=>{
 const e=environment({stored:{'gsat-standalone-favorites-v1':'["challenge","old-favorite"]','gsat-v3-review-queue-v1':'{}'}});
 assert.ok(e.run('GSAT_DIAG_QUESTIONS.length>=30'));
 e.run("saveDiagnosticMistake('ctx-001',false)");
 assert.equal(e.run('diagnosticWrongCount()'),1);
 assert.equal(JSON.parse(e.data.get('gsat-v6-context-mistakes-v1'))['ctx-001'].times,1);
 e.run("saveDiagnosticMistake('ctx-001',true)");
 assert.equal(e.run('diagnosticWrongCount()'),0);
 assert.equal(e.data.get('gsat-standalone-favorites-v1'),'["challenge","old-favorite"]');
 assert.equal(e.data.get('gsat-v3-review-queue-v1'),'{}');
});
