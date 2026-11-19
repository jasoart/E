'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({VOCABULARY:[],console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../assets/js/builtin.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../assets/js/exam-notes.js'),'utf8'),context);
function forms(word,pos){context.entry={word,partOfSpeech:pos};return Object.fromEntries(JSON.parse(vm.runInContext('JSON.stringify(getNotebookInflections(entry))',context)).map(row=>[row.label,row.value]));}
test('verb principal parts occupy separate rows, including identical forms',()=>{
 assert.deepEqual(forms('write','v.'),{'動詞原形':'write','過去式':'wrote','過去分詞':'written','第三人稱單數':'writes','V-ing':'writing'});
 assert.equal(forms('cut','v.')['過去式'],'cut');assert.equal(forms('cut','v.')['過去分詞'],'cut');assert.equal(forms('be','v.')['第三人稱單數'],'is');
});
test('regular verb spelling handles y, silent e, ie, c and stress exceptions',()=>{
 for(const [word,past,ing]of [['overlap','overlapped','overlapping'],['handicap','handicapped','handicapping'],['outfit','outfitted','outfitting'],['study','studied','studying'],['hope','hoped','hoping'],['tie','tied','tying'],['panic','panicked','panicking'],['stop','stopped','stopping'],['prefer','preferred','preferring'],['visit','visited','visiting'],['open','opened','opening'],['fix','fixed','fixing'],['play','played','playing']]){const f=forms(word,'v.');assert.equal(f['過去式'],past,word);assert.equal(f['V-ing'],ing,word);}
});
test('noun countability and exceptional plurals do not masquerade as verbs',()=>{
 assert.equal(forms('child','n.')['名詞複數'],'children');assert.equal(forms('analysis','n.')['名詞複數'],'analyses');assert.equal(forms('criterion','n.')['名詞複數'],'criteria');
 assert.match(forms('information','n.')['名詞複數'],/不可數/);assert.match(forms('scissors','n.')['名詞複數'],/本身為複數/);assert.match(forms('data','n.')['名詞複數'],/data/);assert.equal(forms('offspring','n.')['名詞複數'],'offspring');assert.equal(forms('sheep','n.')['名詞複數'],'sheep');assert.equal(forms('city','n.')['名詞複數'],'cities');
 assert.equal(forms('child','n.')['過去式'],undefined);
 assert.match(forms('police','n.')['名詞複數'],/集合複數/);assert.match(forms('headquarters','n.')['名詞複數'],/單複數同形/);assert.equal(forms('firewoman','n.')['名詞複數'],'firewomen');assert.equal(forms('layman','n.')['名詞複數'],'laymen');assert.equal(forms('statesman','n.')['名詞複數'],'statesmen');assert.match(forms('humankind','n.')['名詞複數'],/不可數/);
});
test('comparisons separate degree and do not inflect long adjectives as verbs',()=>{
 for(const [word,a,b]of [['good','better','best'],['happy','happier','happiest'],['big','bigger','biggest'],['large','larger','largest'],['useful','more useful','most useful'],['ordinary','more ordinary','most ordinary'],['contemporary','more contemporary','most contemporary']]){const f=forms(word,'adj.');assert.equal(f['比較級'],a);assert.equal(f['最高級'],b);assert.equal(f['V-ing'],undefined);}
 assert.match(forms('dead','adj.')['比較級'],/通常不作/);assert.deepEqual(forms('because','conj.'),{});
});
test('combined headwords keep derived nouns and plural variants in their own roles',()=>{
 const rows=JSON.parse(vm.runInContext(`JSON.stringify(getNotebookInflections({word:'achieve(ment)',partOfSpeech:'v./(n.)'}))`,context));
 assert.ok(rows.some(row=>row.label==='achieve · 過去式'&&row.value==='achieved'));
 assert.ok(rows.some(row=>row.label==='achievement · 名詞複數'&&row.value==='achievements'));
 assert.ok(!rows.some(row=>row.value==='achievemented'||row.value==='achieveings'));
 assert.equal(forms('T-shirt','n.')['名詞複數'],'t-shirts');
 assert.equal(forms('can','aux./n./v.')['過去式'],'canned');
 assert.equal(forms('can','aux./n./v.')['V-ing'],'canning');
 const plural=JSON.parse(vm.runInContext(`JSON.stringify(getNotebookInflections({word:'chopstick(s)',partOfSpeech:'n.'}))`,context));
 assert.ok(plural.some(row=>row.label==='chopsticks · 名詞複數'&&/本身為複數/.test(row.value)));
});

test('reviewed compound verbs and participial adjectives retain their actual forms',()=>{
 assert.equal(forms('echo','v.')['第三人稱單數'],'echoes');assert.equal(forms('veto','v.')['第三人稱單數'],'vetoes');
 assert.equal(forms('overdo','v.')['過去式'],'overdid');assert.equal(forms('oversee','v.')['過去分詞'],'overseen');assert.equal(forms('repay','v.')['過去式'],'repaid');
 assert.equal(forms('output','v.')['V-ing'],'outputting');assert.equal(forms('underlying','adj./v.')['過去式'],undefined);assert.match(forms('maiden','adj.')['比較級'],/通常不作/);
});
