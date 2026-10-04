'use strict';
// Protocol, safe output and cleanup tests. No model downloads are needed.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const core=require('../colab/browser-runtime/tutor-core.js');
const {createTutorController,validateSentence}=require('../colab/browser-runtime/tutor.js');
const {createTutorWorkerRuntime}=require('../colab/browser-runtime/tutor-worker.js');
const root=path.resolve(__dirname,'..');
const validManifest=()=>({schema_version:1,runtime:'transformers.js',dtype:'q4',device:'wasm',max_input_tokens:384,max_new_tokens:96,model_files:['onnx/model_q4.onnx']});

function realValidators(){
 const dummy={textContent:'',value:'',addEventListener(){}};
 const context={console,URL,localStorage:{getItem(){return null}},document:{getElementById(){return dummy}},escapeRegExp:value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')};
 vm.createContext(context);
 for(const file of ['js/config.js','data/vocabulary.js','data/collocations.js','data/learning.js','js/state.js','js/examples.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets',file),'utf8'),context,{filename:file});
 return vm.runInContext('({sentenceWords,containsTargetForm,likelyCompleteSentence,sentenceCeecCoverage,curatedCollocationCheck})',context);
}
const validators=realValidators();
const sentence='The students accepted the challenge because they wanted to learn something new.';

function node(){
 return {textContent:'',value:'',hidden:false,disabled:false,dataset:{},attributes:{},listeners:{},addEventListener(type,fn){this.listeners[type]=fn},setAttribute(key,value){this.attributes[key]=value},removeAttribute(key){delete this.attributes[key]},set innerHTML(_){throw Error('Output must never use innerHTML')}};
}
function controllerEnvironment({stored={},supported=true}={}){
 const elements=new Map(),workers=[],writes=[],data=new Map(Object.entries(stored)),lifecycle={};
 let entry={word:'challenge',partOfSpeech:'n.',meaning:'挑戰',level:3};
 const get=id=>{if(!elements.has(id))elements.set(id,node());return elements.get(id)};
 get('tutorGrammar').value='auto';
 class FakeWorker{
  constructor(url,options){this.url=url;this.options=options;this.messages=[];this.terminated=false;workers.push(this)}
  postMessage(message){this.messages.push(message)} terminate(){this.terminated=true}
  emit(message){this.onmessage({data:message})}
 }
 const observed=[];
 class Observer{constructor(callback){this.callback=callback;observed.push(this)}observe(){}disconnect(){this.disconnected=true}}
 const controller=createTutorController({core,document:{getElementById:get},storage:{getItem:key=>data.get(key),setItem(key,value){writes.push(key);data.set(key,value)}},Worker:supported?FakeWorker:null,MutationObserver:Observer,pageUrl:'https://example.org/E/',workerUrl:'https://example.org/E/colab/browser-runtime/tutor-worker.js',getEntry:()=>entry,getPoints:()=>[{patterns:[['take on a challenge','接受挑戰'],['a serious challenge','重大挑戰'],['extra pattern','略']]}],validators,addEventListener:(type,fn)=>{lifecycle[type]=fn}});
 const load=()=>{get('tutorModelSource').value='./models/gsat-danube-q4/';controller.load();return workers.at(-1)};
 const ready=worker=>worker.emit({id:worker.messages.at(-1).id,type:'ready'});
 return {get,controller,workers,writes,data,load,ready,observed,lifecycle,setEntry:value=>{entry=value}};
}

test('model locations permit supported artifacts and reject credentials and executable URLs',()=>{
 assert.equal(core.modelLocation('someone/gsat-danube-q4','https://example.org/E/').baseUrl,'https://huggingface.co/someone/gsat-danube-q4/resolve/main/');
 assert.equal(core.modelLocation('./models/q4','https://example.org/E/').baseUrl,'https://example.org/E/models/q4/');
 assert.equal(core.modelLocation('../models/q4','https://example.org/E/').baseUrl,'https://example.org/models/q4/');
 assert.equal(core.modelLocation('./models/q4','http://localhost:8080/E/').baseUrl,'http://localhost:8080/E/models/q4/');
 assert.equal(core.modelLocation('https://models.example.org/q4/','https://example.org/E/').kind,'directory');
 for(const source of ['', 'javascript:alert(1)', 'data:text/plain,x', '//evil.example/q4','http://evil.example/q4','https://user:secret@example.org/model','https://example.org/model?token=secret','https://example.org/model#secret','https://127.0.0.1/model'])assert.throws(()=>core.modelLocation(source,'https://example.org/E/'),source);
});

test('manifest rejects incompatible runtimes, missing q4 and excess mobile token budgets',()=>{
 assert.equal(core.validateManifest(validManifest()).maxInputTokens,384);
 for(const change of [{schema_version:2},{dtype:'fp32'},{device:'webgpu'},{max_input_tokens:4096},{max_new_tokens:256},{model_files:['onnx/model.onnx']},{model_files:['onnx/model_q4.onnx','onnx/../secret']}])assert.throws(()=>core.validateManifest({...validManifest(),...change}));
});

test('prompt preserves 12 dataset tags, bounded context and primary target spelling',()=>{
 assert.equal(Object.keys(core.GRAMMAR).length,13);
 for(const grammar_tag of Object.keys(core.GRAMMAR)){
  const messages=core.buildMessages({word:'aluminum/aluminium',partOfSpeech:'n.',meaning:'鋁',level:4,grammar_tag});
  assert.equal(messages.length,1);assert.equal(messages[0].role,'user');
  assert.ok(messages[0].content.startsWith(core.SYSTEM_PROMPT+'\n\n'));
  assert.match(messages[0].content,/using "aluminum"/);
  assert.ok(messages[0].content.includes('Grammar: '+core.GRAMMAR[grammar_tag]));
  assert.match(messages[0].content,/levels 1 to 5/);
 }
 assert.equal(core.normalizeContext({word:'attend(ance)',topic:'x'.repeat(1000)}).word,'attend');
 assert.equal(core.normalizeContext({word:'challenge',topic:'x'.repeat(1000)}).topic.length,100);
 assert.equal(core.normalizeContext({word:'challenge',grammar_tag:'unknown'}).grammar_tag,'auto');
 assert.throws(()=>core.buildMessages({word:''}));
});

test('no model loads or original storage writes occur at startup',()=>{
 const existing={'gsat-standalone-favorites-v1':'["legacy-word"]','gsat-v3-review-queue-v1':'{"legacy-word":{"stage":2}}'};
 const e=controllerEnvironment({stored:existing});
 assert.equal(e.workers.length,0);assert.equal(e.controller.getMode(),'idle');assert.deepEqual(e.writes,[]);
 assert.equal(e.get('tutorGenerate').disabled,true);assert.match(e.get('tutorTarget').textContent,/challenge/);
 for(const [key,value]of Object.entries(existing))assert.equal(e.data.get(key),value);
 e.controller.destroy();assert.equal(e.observed[0].disconnected,true);
});

test('load requires explicit valid configuration, persists only its own key, then gates generation',()=>{
 const e=controllerEnvironment();e.controller.load();assert.equal(e.workers.length,0);
 const worker=e.load();assert.equal(worker.options.type,'module');assert.equal(worker.messages.length,1);assert.equal(worker.messages[0].type,'load');
 assert.deepEqual(e.writes,[core.MODEL_SOURCE_KEY]);assert.equal(e.controller.getMode(),'loading');
 worker.emit({type:'progress',id:worker.messages[0].id,loaded:1048576,total:2097152,progress:50,file:'onnx/model_q4.onnx'});
 assert.match(e.get('tutorStatus').textContent,/1.0 \/ 2.0 MB/);assert.equal(e.get('tutorProgress').value,50);
 e.ready(worker);assert.equal(e.controller.getMode(),'ready');assert.equal(e.get('tutorGenerate').disabled,false);
 const completedStatus=e.get('tutorStatus').textContent;worker.emit({type:'status',id:worker.messages[0].id,text:'late progress'});assert.equal(e.get('tutorStatus').textContent,completedStatus);
 e.get('tutorTopic').value='teamwork';e.get('tutorGrammar').value='conditional_modal';e.controller.generate();
 const request=worker.messages.at(-1);assert.equal(request.type,'generate');assert.equal(request.context.word,'challenge');assert.equal(request.context.grammar_tag,'conditional_modal');assert.equal(request.context.topic,'teamwork');assert.equal(request.context.patterns.length,2);
 e.controller.destroy();assert.equal(worker.terminated,true);
});

test('streaming and final output use plain text; failed checks remain visible',()=>{
 const e=controllerEnvironment(),worker=e.load();e.ready(worker);e.controller.generate();const id=worker.messages.at(-1).id;
 worker.emit({type:'token',id,text:'<img src=x onerror=alert(1)>challenge'});
 assert.equal(e.get('tutorOutput').textContent,'<img src=x onerror=alert(1)>challenge');
 worker.emit({type:'result',id,text:'<img src=x onerror=alert(1)>challenge'});
 assert.equal(e.controller.getMode(),'ready');assert.equal(e.get('tutorValidation').dataset.passed,'false');assert.match(e.get('tutorValidation').textContent,/需重新生成或人工修訂/);
 e.controller.generate();const next=worker.messages.at(-1).id;worker.emit({type:'result',id:next,text:sentence});assert.equal(e.get('tutorValidation').dataset.passed,'true');
 assert.match(e.get('tutorStatus').textContent,/AI 自編例句，非學測真題/);e.controller.destroy();
});

test('stopping releases worker, clears partial generation and ignores stale callbacks after retry',()=>{
 const e=controllerEnvironment(),old=e.load();e.ready(old);e.controller.generate();const id=old.messages.at(-1).id;old.emit({type:'token',id,text:'Partial sentence'});
 e.get('tutorStop').listeners.click();assert.equal(old.terminated,true);assert.equal(e.get('tutorOutput').textContent,'');assert.equal(e.controller.getMode(),'idle');assert.match(e.get('tutorStatus').textContent,/已停止/);
 const next=e.load();const status=e.get('tutorStatus').textContent;old.emit({type:'error',id,message:'old failure'});assert.equal(e.get('tutorStatus').textContent,status);assert.equal(next.terminated,false);
 e.ready(next);assert.equal(e.controller.getMode(),'ready');e.controller.destroy();assert.equal(next.terminated,true);
});

test('switching vocabulary during generation discards stale sentence and releases resources',()=>{
 const e=controllerEnvironment(),worker=e.load();e.ready(worker);e.controller.generate();const id=worker.messages.at(-1).id;
 e.setEntry({word:'school',partOfSpeech:'n.',meaning:'學校',level:1});e.observed[0].callback();
 assert.equal(worker.terminated,true);assert.equal(e.controller.getMode(),'idle');assert.match(e.get('tutorTarget').textContent,/school/);
 worker.emit({type:'result',id,text:sentence});assert.equal(e.get('tutorOutput').textContent,'');
});

test('worker failures and pagehide release memory and allow explicit retry',()=>{
 const e=controllerEnvironment(),worker=e.load();worker.onerror({message:'CORS failed'});assert.equal(worker.terminated,true);assert.match(e.get('tutorStatus').textContent,/CORS failed/);
 const next=e.load();e.ready(next);e.lifecycle.pagehide();assert.equal(next.terminated,true);assert.equal(e.controller.getMode(),'idle');assert.notEqual(e.observed[0].disconnected,true);
 const unsupported=controllerEnvironment({supported:false});assert.equal(unsupported.get('tutorLoad').disabled,true);assert.match(unsupported.get('tutorStatus').textContent,/不支援 Worker/);
});

test('existing target, coverage and collocation rules report meaningful failures',()=>{
 const entry={word:'challenge'};assert.equal(validateSentence(sentence,entry,validators).passed,true);
 assert.ok(validateSentence('The students wanted to learn something new at school today.',entry,validators).problems.some(x=>x.includes('目標字')));
 assert.ok(validateSentence('They are capable to learn from their school experience.',{word:'capable'},validators).problems.some(x=>x.includes('易錯搭配')));
 assert.ok(validateSentence('Challenge.',entry,validators).problems.some(x=>x.includes('長度')));
});

function workerEnvironment({manifest=validManifest(),tokenCount=120,fetchOk=true}={}){
 const messages=[],fetches=[],calls=[],imports=[],env={backends:{onnx:{wasm:{}}}};let disposals=0;
 const tokenizer={chat_template:'template',apply_chat_template(chat){assert.ok(chat.every(message=>message.role!=='system'),'Danube does not support a system role');calls.push({chat});return Array(tokenCount).fill(1)}};
 const generator=async(chat,options)=>{calls.push({chat,options});options.streamer.options.callback_function('The students ');return [{generated_text:[...chat,{role:'assistant',content:sentence}]}]};
 generator.tokenizer=tokenizer;generator.dispose=async()=>{disposals++};
 const library={env,pipeline:async(task,id,options)=>{calls.push({task,id,options});options.progress_callback({file:'onnx/model_q4.onnx',status:'progress',loaded:1,total:2,progress:50});return generator},TextStreamer:class{constructor(t,options){this.options=options}}};
 const runtime=createTutorWorkerRuntime({core,postMessage:message=>messages.push(message),fetch:async(url,options)=>{fetches.push({url,options});return {ok:fetchOk,json:async()=>manifest}},importTransformers:async(url)=>{imports.push(url);return library}});
 return {runtime,messages,fetches,calls,imports,env,tokenizer,get disposals(){return disposals}};
}

test('worker verifies manifest before importing or downloading any model',async()=>{
 const e=workerEnvironment({manifest:{...validManifest(),dtype:'fp32'}});await e.runtime.receive({type:'load',id:1,source:'someone/model',pageUrl:'https://example.org/E/'});
 assert.equal(e.imports.length,0);assert.equal(e.calls.length,0);assert.equal(e.messages.at(-1).type,'error');
 const missing=workerEnvironment({fetchOk:false});await missing.runtime.receive({type:'load',id:2,source:'h2oai/h2o-danube3-500m-chat',pageUrl:'https://example.org/E/'});assert.equal(missing.imports.length,0);assert.match(missing.messages.at(-1).message,/原始 Danube 權重/);
});

test('worker uses the pinned q4 WASM runtime, real progress, bounded chat and correlated output',async()=>{
 const e=workerEnvironment();await e.runtime.receive({type:'load',id:10,source:'./models/q4/',pageUrl:'https://example.org/E/'});
 assert.equal(e.fetches[0].url,'https://example.org/E/models/q4/runtime-manifest.json');assert.equal(e.fetches[0].options.credentials,'omit');assert.equal(e.imports[0],core.LIBRARY_URL);assert.equal(e.env.remoteHost,'https://example.org/E/models/q4/');assert.equal(e.env.remotePathTemplate,'');assert.equal(e.env.backends.onnx.wasm.numThreads,1);assert.equal(e.env.backends.onnx.wasm.proxy,false);assert.equal(e.tokenizer.model_max_length,384);
 const load=e.calls.find(x=>x.task);assert.equal(load.task,'text-generation');assert.equal(load.options.dtype,'q4');assert.equal(load.options.device,'wasm');assert.ok(e.messages.some(x=>x.type==='progress'&&x.id===10));assert.equal(e.messages.at(-1).type,'ready');
 await e.runtime.receive({type:'generate',id:11,context:{word:'challenge',grammar_tag:'relative_clause'}});
 const generated=e.calls.find(x=>x.options?.max_new_tokens);assert.equal(generated.options.max_new_tokens,96);assert.equal(generated.options.do_sample,false);assert.equal(generated.options.repetition_penalty,1.1);assert.equal(e.messages.at(-1).text,sentence);assert.equal(e.messages.at(-1).inputTokens,120);assert.equal(e.messages.at(-1).id,11);assert.ok(e.messages.some(x=>x.type==='token'&&x.id===11));
 await e.runtime.receive({type:'dispose',id:12});assert.equal(e.disposals,1);assert.equal(e.messages.at(-1).type,'disposed');
});

test('oversized worker input is refused and disposed instead of silently exceeding token cap',async()=>{
 const e=workerEnvironment({tokenCount:500});await e.runtime.receive({type:'load',id:1,source:'someone/model',pageUrl:'https://example.org/E/'});await e.runtime.receive({type:'generate',id:2,context:{word:'challenge',meaning:'x'.repeat(120),patterns:['long pattern'],topic:'environment'}});
 assert.equal(e.messages.at(-1).type,'error');assert.match(e.messages.at(-1).message,/超過手機長度上限/);assert.equal(e.disposals,1);assert.equal(e.calls.filter(x=>x.options?.max_new_tokens).length,0);
});

test('chat outputs choose assistant only and never echo system or training prompt',()=>{
 assert.equal(core.generatedText([{generated_text:[{role:'system',content:'secret instruction'},{role:'user',content:'question'},{role:'assistant',content:sentence}]}]),sentence);
 assert.throws(()=>core.generatedText([{generated_text:[{role:'user',content:'question'}]}]));
 assert.equal(core.generatedText([{generated_text:'x'.repeat(9000)}]).length,2000);
});
