'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function element(){const listeners=new Map();return {innerHTML:'',textContent:'',hidden:false,value:'',disabled:false,dataset:{},className:'',classList:{add(){},remove(){},toggle(){}},addEventListener(type,fn){listeners.set(type,fn)},emit(type='click'){listeners.get(type)?.({currentTarget:this,key:'Enter',preventDefault(){}})},querySelectorAll(){return []},setAttribute(){},scrollIntoView(){},focus(){},scrollTo(){}};}
function environment(){
  const nodes=new Map(),data=new Map([['gsat-standalone-favorites-v1','["challenge","legacy"]'],['gsat-v3-review-queue-v1','{"challenge":{"stage":2,"due":"2027-01-01"}}']]),writes=[];
  const get=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)};
  let requests=0,stops=0;
  const study={plainMeaning:'遇到問題時需要克服的挑戰',ankiMeaning:'挑戰；艱鉅工作',examples:[
    {text:'The students accepted the challenge because they wanted to learn something new.',translationZh:'學生接受挑戰，因為他們想學習新事物。',source:'uploaded-anki',grammar:'過去式與 because 原因子句。',writingTip:'換成自己的學習目標。'},
    {text:'Finding enough clean water is a serious challenge for many families.',translationZh:'取得足夠的乾淨水對許多家庭而言是重大挑戰。',source:'self-authored',grammar:'V-ing 作主詞。',writingTip:'寫出具體問題與受影響者。'}],collocations:[['take on a challenge','接受挑戰','常搭配 take on。']]};
  const context={console,URL,URLSearchParams,setTimeout,clearTimeout,performance,innerWidth:1280,matchMedia:()=>({matches:false}),navigator:{},BUILTIN_STUDY_DATA:{version:'fixture',entries:{challenge:study}},localStorage:{getItem:key=>data.get(key)||null,setItem(key,value){writes.push(key);data.set(key,value)}},document:{getElementById:get,querySelectorAll:()=>[],addEventListener(){},activeElement:{tagName:'BODY'}},fetch(){requests++;throw Error('Unexpected request')},stopPronunciation(){stops++},localVoiceStatus:()=>({message:'裝置本機英文語音'}),speakWord(){},speakSentence(){},loadLocalVoice(){}};
  context.window=context;vm.createContext(context);
  for(const file of ['js/config.js','data/vocabulary.js','data/collocations.js','data/learning.js','js/state.js','js/builtin.js','js/search.js','js/examples.js','js/ui.js','js/favorites.js','js/online.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets',file),'utf8'),context,{filename:file});
  const run=code=>vm.runInContext(code,context);
  run('state.selectedIndex=VOCABULARY.findIndex(entry=>entry.word==="challenge");');
  return {get,run,data,writes,context,get requests(){return requests},get stops(){return stops}};
}
test('all built-in UI files parse; entry identity, old meaning and provenance remain',()=>{
  const e=environment();e.run('renderDetail(VOCABULARY[state.selectedIndex],state.selectedIndex)');
  assert.match(e.get('wordDetail').innerHTML,/遇到問題時需要克服的挑戰/);assert.match(e.get('wordDetail').innerHTML,/保留的原釋意/);
  assert.match(e.get('exampleResults').innerHTML,/上傳教材/);assert.match(e.get('exampleResults').innerHTML,/本站新編/);
  assert.doesNotMatch(e.get('exampleResults').innerHTML,/gold-score|品質評分|Google/);
  assert.equal(e.requests,0);assert.equal(e.writes.length,0);
});
test('cloze uses exact actual inflection, case insensitive, never an arbitrary substring',()=>{
  const e=environment();const q=e.run('builtinClozeQuestion({word:"protect"},{text:"Students protected the river by reducing waste at school."})');
  assert.equal(q.answer,'protected');assert.match(q.masked,/Students ________ the river/);
  e.context.question=q;assert.equal(e.run('checkBuiltinAnswer(question,"PROTECTED")'),true);assert.equal(e.run('checkBuiltinAnswer(question,"protect")'),false);assert.equal(e.run('checkBuiltinAnswer(question,"pro")'),false);
});
test('Unicode headwords, dotted times and malformed legacy neither ID mask correctly',()=>{
  const e=environment();
  for(const [word,text,answer] of [['café/cafe','We met at the café after the school concert.','café'],['am/a.m.','The bus leaves at 8 a.m. every weekday.','a.m.'],['neither adj./adv./pron./','Neither plan solves the problem for local families.','Neither'],['argue(argument)','His argument was clear and supported by reliable evidence.','argument']]){
    e.context.caseData={word,text};const q=e.run('builtinClozeQuestion({word:caseData.word},{text:caseData.text})');assert.equal(q.answer,answer);assert.equal(q.masked.includes(answer),false);
  }
  assert.equal(e.run('builtinClozeQuestion({word:"café/cafe"},{text:"A cafeteria serves lunch to hundreds of students."})'),null);
  assert.equal(e.run('builtinClozeQuestion({word:"am/a.m."},{text:"The program starts after lunch every school day."})'),null);
});
test('irregular verbs and adjective comparison keep exact words rather than derived word families',()=>{
  const e=environment();
  for(const [word,partOfSpeech,text,answer] of [['become','v.','She became a professional dancer after years of training.','became'],['easy','adj.','This test was easier than I expected.','easier'],['fisherman','n.','Fishermen leave before dawn and return in the afternoon.','Fishermen']]){
    e.context.caseData={word,partOfSpeech,text};assert.equal(e.run('builtinClozeQuestion(caseData,{text:caseData.text}).answer'),answer);
  }
  assert.equal(e.run('builtinClozeQuestion({word:"diversity",partOfSpeech:"n."},{text:"Biodiversity is essential for a healthy ecosystem."})'),null);
  assert.equal(e.run('builtinClozeQuestion({word:"dense",partOfSpeech:"adj."},{text:"Taipei is a densely populated city."})'),null);
});
test('wrong answer requires correction and retry; progress never changes old favorites/review',()=>{
  const e=environment(),favorite=e.data.get('gsat-standalone-favorites-v1'),review=e.data.get('gsat-v3-review-queue-v1');
  e.run('renderBuiltinPractice(VOCABULARY[state.selectedIndex])');e.get('builtinClozeInput').value='chall';e.get('builtinClozeCheck').emit();
  assert.equal(e.get('builtinClozeFeedback').dataset.correct,'false');assert.equal(e.get('builtinClozeCheck').disabled,true);assert.equal(e.get('builtinClozeRetry').hidden,false);assert.equal(e.get('builtinClozeNext').hidden,true);
  assert.match(e.get('builtinClozeFeedback').textContent,/答案是 challenge/);
  e.get('builtinClozeRetry').emit();assert.equal(e.get('builtinClozeInput').value,'');assert.equal(e.get('builtinClozeCheck').disabled,false);
  e.get('builtinClozeInput').value='CHALLENGE';e.get('builtinClozeCheck').emit();assert.equal(e.get('builtinClozeFeedback').dataset.correct,'true');assert.equal(e.get('builtinClozeNext').hidden,false);
  const saved=JSON.parse(e.data.get('gsat-builtin-retrieval-v1'));assert.equal(saved['challenge::0'].attempts,2);assert.equal(saved['challenge::0'].needsRetry,false);
  assert.equal(e.data.get('gsat-standalone-favorites-v1'),favorite);assert.equal(e.data.get('gsat-v3-review-queue-v1'),review);assert.deepEqual([...new Set(e.writes)],['gsat-builtin-retrieval-v1']);
});
test('new meaning, uploaded meaning, examples and bilingual collocations enter local search',()=>{
  const e=environment();const fields=e.run('searchFields(VOCABULARY[state.selectedIndex])');assert.match(fields.meaning,/艱鉅工作/);assert.match(fields.pattern,/take on a challenge/);assert.match(fields.notes,/取得足夠的乾淨水/);
  assert.equal(e.run('hybridSearch("take on a challenge")[0].entry.word'),'challenge');assert.equal(e.requests,0);
});
test('selecting a word and stopping audio cancel pronunciation without external calls',async()=>{
  const e=environment();e.run('selectEntry(state.selectedIndex)');assert.equal(e.stops,1);e.get('stopLocalVoiceButton').emit();assert.equal(e.stops,2);
  await e.run('loadOnlineData(VOCABULARY[state.selectedIndex],state.selectedIndex)');assert.equal(e.requests,0);
});
test('missing built-in data reports pending and creates no invented examples',()=>{
  const e=environment();assert.equal(e.run('getBuiltinStudy({word:"unknown"})'),null);assert.equal(e.run('builtinExampleResult({word:"unknown",partOfSpeech:"n."}).examples.length'),0);
  assert.equal(e.run('builtinStudyStats().examples'),2);
});
test('every released primary sentence can be practiced without accepting related word fragments',()=>{
  const e=environment();
  const source=fs.readFileSync(path.join(root,'assets/data/builtin-study.js'),'utf8').replace('const BUILTIN_STUDY_DATA =','globalThis.BUILTIN_STUDY_DATA =');
  vm.runInContext(source,e.context);
  const failures=e.run('VOCABULARY.flatMap(entry=>(getBuiltinStudy(entry).examples||[]).flatMap((example,index)=>builtinClozeQuestion(entry,example)?[]:[entry.word+":"+index]))');
  assert.equal(failures.length,0,failures.slice(0,20).join(', '));
  assert.equal(e.run('builtinStudyStats().words'),6012);
  assert.equal(e.run('builtinStudyStats().examples'),13060);
  assert.equal(e.run('spokenForm("café/cafe")'),'café');
  assert.equal(e.run('spokenForm("neither adj./adv./pron./")'),'neither');
});
