"use strict";

// Keep the official table and its exact word strings intact. Supplemental words
// are appended at runtime; favorites and review continue to use the original IDs.
const GSAT_OFFICIAL_VOCABULARY_COUNT = VOCABULARY.length;
const EXAM_ORIGINAL_STUDY = new Map();
const EXAM_NOTEBOOK_BY_WORD = new Map();
const EXAM_NOTEBOOK_BY_ID = new Map();
function examNotebookKey(value) {
  return String(value || "").normalize("NFKC").toLowerCase().replace(/’/g,"'").replace(/\s+/g," ").trim();
}
function examNotebookAliases(value) {
  const word=examNotebookKey(value), values=[word];
  if(word==="neither adj./adv./pron./")values.push("neither");
  if(word==="sportsman/sportswoma n")values.push("sportswoman");
  if(word==="argue(argument)")values.push("argument");
  for(const variant of word.split("/")) {
    const part=variant.trim(), match=/^([^()]+)\(([^)]+)\)$/.exec(part);
    if(match) { values.push(match[1].trim()); if(match[2].includes(","))values.push(...match[2].split(",").map(item=>item.trim())); else values.push(match[1].trim()+match[2]); }
    else if(/^[a-z]+(?:[-'][a-z]+)*(?: [a-z]+)*$/.test(part))values.push(part);
  }
  return [...new Set(values)];
}
function getCuratedExamNotebook(entry) {
  const word=typeof entry==="string"?entry:entry?.word;
  for(const alias of examNotebookAliases(word))if(EXAM_NOTEBOOK_BY_WORD.has(alias))return EXAM_NOTEBOOK_BY_WORD.get(alias);
  return null;
}
function getExamNotebook(entry) {
  const word=typeof entry==="string"?entry:entry?.word;
  return EXAM_NOTEBOOK_BY_ID.get(word)||getCuratedExamNotebook(entry);
}
function getOriginalStudy(entry) { return EXAM_ORIGINAL_STUDY.get(typeof entry==="string"?entry:entry?.word)||null; }
function getVocabularyInformation(entry) {
  return typeof GSAT_VOCABULARY_ENRICHMENT!=="undefined"?GSAT_VOCABULARY_ENRICHMENT.entries[typeof entry==="string"?entry:entry?.word]||null:null;
}
function notebookTeacherTip(entry,note) {
  const information=getVocabularyInformation(entry);
  if(information?.teacherTip)return information.teacherTip;
  const extra=information?.dictionarySenses?.length>1?"本詞有不同字義，先用前後文選義；近義候選不能跨詞義直接替換。":"仿寫時保留原來的語意與搭配，再補上原因、對比或結果。";
  return notebookPosPrompt(entry)+" "+extra;
}
function getExamEvidenceYears(entry) {
  // Keep legacy point citations and newly verified notebook citations searchable
  // together. The small index contains no excerpts and triggers no requests.
  const word=typeof entry==="string"?entry:entry?.word;
  const indexed=typeof GSAT_EXAM_EVIDENCE_INDEX!=="undefined"?GSAT_EXAM_EVIDENCE_INDEX.yearsByHeadword||{}:{};
  const years=typeof getGsatPoints==="function"&&entry&&typeof entry==="object"?getGsatPoints(entry).flatMap(point=>point.evidence||[]):[];
  for(const alias of examNotebookAliases(word))years.push(...(indexed[alias]||[]));
  return [...new Set(years.map(String))].sort((a,b)=>Number(a)-Number(b));
}
function notebookStats() {
  const entries=VOCABULARY.map(getExamNotebook).filter(Boolean);
  return {words:entries.length,listedWords:entries.length,curatedWords:VOCABULARY.filter(entry=>getCuratedExamNotebook(entry)).length,
    guidedWords:entries.filter(note=>note.provenance==="source-guided").length,
    scenarioWords:entries.filter(note=>note.provenance==="authored-scenarios").length,
    originalPairWords:entries.filter(note=>note.provenance!=="source-guided").length,
    completeWords:entries.filter(note=>note.examples?.length>=3&&note.examples.every(row=>row.source==="self-authored")).length,
    incompleteWords:entries.filter(note=>!note.examples||note.examples.length<3||note.examples.some(row=>row.source!=="self-authored")).length,
    elevenContextWords:entries.filter(note=>note.examples?.length>=11&&note.examples.every(row=>row.source==="self-authored")).length,
    newScenarioSentences:typeof GSAT_AUTHORED_SCENARIOS!=="undefined"?GSAT_AUTHORED_SCENARIOS.stats.newlyWrittenSentences:0,
    uniquePrimarySentences:new Set(entries.flatMap(note=>(note.examples||[]).map(example=>example.text))).size,
    examples:entries.reduce((sum,item)=>sum+(item.examples?.length||0),0),
    authoredExamples:entries.reduce((sum,item)=>sum+(item.examples||[]).filter(row=>row.source==="self-authored").length,0),
    collocations:entries.reduce((sum,item)=>sum+(item.collocations?.length||0),0),
    grammarPatterns:entries.reduce((sum,item)=>sum+(item.grammarPatterns?.length||0),0),supplemental:VOCABULARY.length-GSAT_OFFICIAL_VOCABULARY_COUNT};
}
if(typeof GSAT_EXAM_NOTEBOOK!=="undefined") {
  for(const [word,note] of Object.entries(GSAT_EXAM_NOTEBOOK.entries||{}))EXAM_NOTEBOOK_BY_WORD.set(examNotebookKey(word),note);
  for(const item of GSAT_EXAM_NOTEBOOK.supplemental||[]) {
    if(!item?.word||VOCABULARY.some(entry=>examNotebookKey(entry.word)===examNotebookKey(item.word)))continue;
    VOCABULARY.push({...item,level:6,supplemental:true,source:item.source||"本站補充詞彙；不列入大考中心原有 6,012 詞條"});
  }
  if(typeof BUILTIN_STUDY_DATA!=="undefined")for(const entry of VOCABULARY) {
    const note=getExamNotebook(entry);if(!note)continue;
    const original=BUILTIN_STUDY_DATA.entries[entry.word]||null;
    if(original)EXAM_ORIGINAL_STUDY.set(entry.word,original);
    BUILTIN_STUDY_DATA.entries[entry.word]={...original,
      plainMeaning:note.senses?.map(item=>item.meaning).filter(Boolean).join("；")||original?.plainMeaning||entry.meaning,
      examples:note.examples?.length?note.examples.map(item=>({...item,examStyle:true})):original?.examples||[],
      collocations:note.collocations?.map(item=>[item.en,item.zh,item.note||""])||original?.collocations||[],
      usageNote:note.usageNote||original?.usageNote||""};
  }
}

// V2 is available for every exact vocabulary ID. Curated writing and imported
// sentences keep separate provenance; no generated fallback is called an authored
// example, a verified synonym, an official frequency, or a new CEEC level.
function notebookSourceSenses(entry) {
  const information=getVocabularyInformation(entry),raw=String(information?.commonMeaningZh||entry.meaning||""),pattern=/\b(n\. pl\.|vt\.|vi\.|adj\.|adv\.|prep\.|conj\.|pron\.|interj\.|art\.|num\.|aux\.|v\.|n\.|a\.)\s*/g;
  const matches=[...raw.matchAll(pattern)];
  if(!matches.length)return [{pos:entry.partOfSpeech||"詞性依原表",meaning:raw,usage:"對照下方三句，先選出各句使用的字義，再觀察前後搭配。"}];
  return matches.map((match,index)=>({pos:match[1]==="a."?"adj.":match[1],
    meaning:raw.slice(match.index+match[0].length,matches[index+1]?.index??raw.length).replace(/^[；;\s]+|[；;\s]+$/g,""),
    usage:"依原釋義的詞性分段；專門義需配合實際語境核對。"})).filter(item=>item.meaning);
}
function notebookPosPrompt(entry) {
  const pos=new Set(String(entry.partOfSpeech||"").split(/[\s/]+/));
  if(["v.","vt.","vi."].some(value=>pos.has(value)))return "找出 [S] 誰做、[V] 做什麼；有 [O] 時指出對象。圈出動詞後的介系詞，並檢查時態與主被動。";
  if(pos.has("n."))return "找出包含目標詞的名詞片語，再判斷它作 [S]、[O] 或 [C]。觀察限定詞、數量與單複數，不以字尾猜可數性。";
  if(pos.has("adj.")||pos.has("a."))return "找出目標詞修飾的名詞，或它是否在連綴動詞後作 [C]；再圈出程度詞及後接介系詞。";
  if(pos.has("adv."))return "指出目標詞修飾動作、形容詞，還是整個子句；觀察放置位置是否改變語氣或意思。";
  return "先找 [S] 與 [V]，再判斷目標詞如何連接或指向其他成分；用完整上下文核對關係。";
}
function notebookExampleGuide(entry,example) {
  const text=String(example.text||""),question=typeof builtinClozeQuestion==="function"?builtinClozeQuestion(entry,example):null;
  // The short window is quoted from the actual example, not generated prose.
  const slot=question?.masked.indexOf("________")??-1;
  const left=slot<0?"":(question.masked.slice(0,slot).match(/[A-Za-z]+(?:[-’'][A-Za-z]+)*/g)||[]).slice(-4).join(" ");
  const right=slot<0?"":(question.masked.slice(slot+8).match(/[A-Za-z]+(?:[-’'][A-Za-z]+)*/g)||[]).slice(0,4).join(" ");
  const evidenceWindow=question?`${left?"… "+left+" ":""}【${question.answer}】${right?" "+right+" …":""}`:"";
  const signals=[
    [/\b(?:although|even though|whereas|however|nevertheless)\b/i,"讓步／對比","哪兩項資訊形成對比？保留兩邊的主張，再檢查連接詞與標點。"],
    [/\b(?:because of|due to)\b/i,"原因片語","圈出原因片語與主句；because of／due to 後接名詞性成分。"],
    [/\bbecause\b/i,"原因與結果","分開指出原因及結果；不要把兩者的順序當作因果證明。"],
    [/\b(?:despite|in spite of)\b/i,"讓步片語","指出與預期不同的結果；despite／in spite of 後接名詞性成分或動名詞。"],
    [/\b(?:if|unless)\b/i,"條件／是否","判斷這裡提出條件，還是詢問／轉述是否；假設不等於已發生的事。"],
    [/\b(?:before|after|when|while|until)\b/i,"時間／對比線索","判斷後接名詞、動名詞或子句；while 還可能表對比，不能只見關鍵字就判句型。"],
    [/\b(?:may|might|could|some|often|usually)\b/i,"語氣與範圍","圈出限制程度或範圍的詞；改寫時不要把可能、部分或通常變成一定、全部。"],
  ];
  const signal=signals.find(([pattern])=>pattern.test(text));
  const topics=[[/\b(?:school|students?|teachers?|class|homework|exam|learn\w*)\b/i,"學校與學習"],
    [/\b(?:river|trees?|animals?|birds?|energy|water|pollution|climate|recycl\w*)\b/i,"自然與環境"],
    [/\b(?:health|hospital|doctor|sleep|exercise|patient|illness)\b/i,"健康與生活"],
    [/\b(?:work|job|office|business|company|money|bank|market)\b/i,"工作與社會"],
    [/\b(?:computer|online|internet|data|phone|research|science)\b/i,"科技與資訊"]];
  return {target:question?.answer||entry.word,evidenceWindow,prompt:notebookPosPrompt(entry),
    cue:signal?.[1]||"人物、動作與情境",evidence:signal?.[2]||"從本句找出支持這個字義的相鄰詞；中文對照用來核對整句，不把每個中文義都套入本句。",
    topic:example.topic&&!/未分類|原卡例句/.test(example.topic)?example.topic:topics.find(([pattern])=>pattern.test(text))?.[1]||"日常情境",
    transfer:`保留「${question?.answer||entry.word}」在本句的用法，改寫人物或事件；補上一個具體原因、結果或細節，再檢查意思是否成立。`};
}
function initializeAllWordNotebooks() {
  if(typeof BUILTIN_STUDY_DATA==="undefined")return;
  const relatives=new Map(),patterns=new Map();
  // Reuse explicit editorial family relationships; never infer family by prefix.
  for(const [head,note] of EXAM_NOTEBOOK_BY_WORD){
    const parent={word:head,pos:note.senses?.[0]?.pos||"",meaning:note.senses?.[0]?.meaning||""};
    const group=[parent,...(note.family||[])].filter(row=>row.word&&row.pos&&row.meaning);
    for(const member of group){
      const key=examNotebookKey(member.word),rows=relatives.get(key)||[];
      for(const other of group)if(examNotebookKey(other.word)!==key&&!rows.some(row=>row.word===other.word))rows.push({...other,sourceHeadword:head});
      relatives.set(key,rows);
    }
  }
  if(typeof GSAT_COLLOCATION_GUIDE!=="undefined")for(const point of GSAT_COLLOCATION_GUIDE){
    for(const key of point.keys||[]){
      const normalized=examNotebookKey(key),rows=patterns.get(normalized)||[];
      for(const [en,zh] of point.patterns||[])if(en&&zh&&!rows.some(row=>row.en.toLowerCase()===en.toLowerCase()))rows.push({en,zh,note:"原有搭配教材整理；是否出現在試卷須另看原文出處。"});
      patterns.set(normalized,rows);
    }
  }
  for(const entry of VOCABULARY){
    const curated=getCuratedExamNotebook(entry);
    const information=getVocabularyInformation(entry);
    const sentenceIds=typeof GSAT_AUTHORED_SCENARIOS!=="undefined"?GSAT_AUTHORED_SCENARIOS.byWord[entry.word]:null;
    const authored=sentenceIds?.map(id=>GSAT_AUTHORED_SCENARIOS.sentences[id]).filter(Boolean)||[];
    const hasOriginalPair=authored.length>=3;
    if(curated){
      const note={...curated,coreMeaning:information?.commonMeaningZh||"",teacherTip:information?.teacherTip||"",examples:hasOriginalPair?authored:curated.examples};
      EXAM_NOTEBOOK_BY_ID.set(entry.word,note);
      if(hasOriginalPair&&BUILTIN_STUDY_DATA.entries[entry.word])BUILTIN_STUDY_DATA.entries[entry.word]={...BUILTIN_STUDY_DATA.entries[entry.word],examples:authored};
      continue;
    }
    const study=BUILTIN_STUDY_DATA.entries[entry.word];if(!study)continue;
    const collocations=[];
    const add=row=>{if(row.en&&row.zh&&!/未附中文/.test(row.zh)&&!collocations.some(item=>item.en.toLowerCase()===row.en.toLowerCase()))collocations.push(row);};
    for(const [en,zh,note] of study.collocations||[])add({en,zh,note:note||""});
    for(const alias of examNotebookAliases(entry.word))for(const row of patterns.get(alias)||[])add(row);
    const family=[];
    for(const alias of examNotebookAliases(entry.word))for(const row of relatives.get(alias)||[])if(!family.some(item=>item.word===row.word))family.push(row);
    if(hasOriginalPair){
      EXAM_ORIGINAL_STUDY.set(entry.word,study);
      BUILTIN_STUDY_DATA.entries[entry.word]={...study,examples:authored};
    }
    EXAM_NOTEBOOK_BY_ID.set(entry.word,{provenance:hasOriginalPair?"authored-scenarios":"source-guided",senses:notebookSourceSenses(entry),collocations,
      coreMeaning:information?.commonMeaningZh||study.plainMeaning||"",teacherTip:information?.teacherTip||"",
      synonyms:[],idioms:[],
      family:[...family,...(information?.family||[]).filter(row=>!family.some(item=>item.word===row.word))],examples:hasOriginalPair?authored:study.examples||[],
      usageNote:study.usageNote||entry.note||notebookPosPrompt(entry)});
  }
}
initializeAllWordNotebooks();

// Inflections are kept apart from derivational families. Positions in each verb
// tuple are past / past participle; identical forms are intentionally repeated.
const NOTEBOOK_VERB_INFLECTIONS = Object.freeze({
  overdo:['overdid','overdone','overdoes','overdoing'],oversee:['oversaw','overseen','oversees','overseeing'],repay:['repaid','repaid'],output:['output / outputted','output / outputted','outputs','outputting'],input:['input / inputted','input / inputted','inputs','inputting'],offset:['offset','offset','offsets','offsetting'],reset:['reset','reset','resets','resetting'],rebuild:['rebuilt','rebuilt'],retell:['retold','retold'],rewrite:['rewrote','rewritten'],underlie:['underlay','underlain','underlies','underlying'],arise:['arose','arisen'],awake:['awoke','awoken'],be:['was / were','been','is','being'],bear:['bore','borne / born'],beat:['beat','beaten'],become:['became','become'],begin:['began','begun'],bend:['bent','bent'],bet:['bet','bet'],bid:['bid / bade','bid / bidden'],bind:['bound','bound'],bite:['bit','bitten'],bleed:['bled','bled'],blow:['blew','blown'],break:['broke','broken'],breed:['bred','bred'],bring:['brought','brought'],broadcast:['broadcast','broadcast'],build:['built','built'],burn:['burned / burnt','burned / burnt'],burst:['burst','burst'],buy:['bought','bought'],cast:['cast','cast'],catch:['caught','caught'],choose:['chose','chosen'],cling:['clung','clung'],come:['came','come'],cost:['cost','cost'],creep:['crept','crept'],cut:['cut','cut'],deal:['dealt','dealt'],dig:['dug','dug'],dive:['dived / dove','dived'],do:['did','done','does','doing'],draw:['drew','drawn'],dream:['dreamed / dreamt','dreamed / dreamt'],drink:['drank','drunk'],drive:['drove','driven'],dwell:['dwelt / dwelled','dwelt / dwelled'],eat:['ate','eaten'],fall:['fell','fallen'],feed:['fed','fed'],feel:['felt','felt'],fight:['fought','fought'],find:['found','found'],fit:['fit / fitted','fit / fitted'],flee:['fled','fled'],fling:['flung','flung'],fly:['flew','flown'],forbid:['forbade','forbidden'],forecast:['forecast','forecast'],foresee:['foresaw','foreseen'],forget:['forgot','forgotten'],forgive:['forgave','forgiven'],forsake:['forsook','forsaken'],freeze:['froze','frozen'],get:['got','gotten / got'],give:['gave','given'],go:['went','gone','goes','going'],grind:['ground','ground'],grow:['grew','grown'],hang:['hung','hung'],have:['had','had','has','having'],hear:['heard','heard'],hide:['hid','hidden'],hit:['hit','hit'],hold:['held','held'],hurt:['hurt','hurt'],keep:['kept','kept'],kneel:['knelt / kneeled','knelt / kneeled'],knit:['knitted / knit','knitted / knit'],know:['knew','known'],lay:['laid','laid'],lead:['led','led'],lean:['leaned / leant','leaned / leant'],leap:['leaped / leapt','leaped / leapt'],learn:['learned / learnt','learned / learnt'],leave:['left','left'],lend:['lent','lent'],let:['let','let'],lie:['lay（躺）/ lied（說謊）','lain（躺）/ lied（說謊）','lies','lying'],light:['lit / lighted','lit / lighted'],lose:['lost','lost'],make:['made','made','makes','making'],mean:['meant','meant'],meet:['met','met'],mislead:['misled','misled'],mistake:['mistook','mistaken'],misunderstand:['misunderstood','misunderstood'],overcome:['overcame','overcome'],overhear:['overheard','overheard'],overtake:['overtook','overtaken'],overthrow:['overthrew','overthrown'],pay:['paid','paid'],prove:['proved','proved / proven'],put:['put','put'],quit:['quit','quit'],read:['read /rɛd/','read /rɛd/'],ride:['rode','ridden'],ring:['rang','rung'],rise:['rose','risen'],run:['ran','run','runs','running'],say:['said','said','says','saying'],see:['saw','seen','sees','seeing'],seek:['sought','sought'],sell:['sold','sold'],send:['sent','sent'],set:['set','set'],sew:['sewed','sewn / sewed'],shake:['shook','shaken'],shed:['shed','shed'],shine:['shone / shined','shone / shined'],shoot:['shot','shot'],show:['showed','shown / showed'],shrink:['shrank','shrunk'],shut:['shut','shut'],sing:['sang','sung'],sink:['sank','sunk'],sit:['sat','sat','sits','sitting'],sleep:['slept','slept'],slide:['slid','slid'],smell:['smelled / smelt','smelled / smelt'],sow:['sowed','sown / sowed'],speak:['spoke','spoken'],speed:['sped / speeded','sped / speeded'],spell:['spelled / spelt','spelled / spelt'],spend:['spent','spent'],spill:['spilled / spilt','spilled / spilt'],spin:['spun','spun'],spit:['spat / spit','spat / spit'],split:['split','split'],spoil:['spoiled / spoilt','spoiled / spoilt'],spread:['spread','spread'],spring:['sprang','sprung'],stand:['stood','stood'],steal:['stole','stolen'],stick:['stuck','stuck'],sting:['stung','stung'],stink:['stank','stunk'],stride:['strode','stridden'],strike:['struck','struck / stricken'],strive:['strove / strived','striven / strived'],swear:['swore','sworn'],sweep:['swept','swept'],swell:['swelled','swollen / swelled'],swim:['swam','swum','swims','swimming'],swing:['swung','swung'],take:['took','taken'],teach:['taught','taught'],tear:['tore','torn'],tell:['told','told'],think:['thought','thought'],throw:['threw','thrown'],thrust:['thrust','thrust'],tread:['trod','trodden'],undergo:['underwent','undergone'],understand:['understood','understood'],undertake:['undertook','undertaken'],undo:['undid','undone'],upset:['upset','upset'],wake:['woke / waked','woken / waked'],wear:['wore','worn'],weave:['wove','woven'],weep:['wept','wept'],win:['won','won','wins','winning'],wind:['wound','wound'],withdraw:['withdrew','withdrawn'],withhold:['withheld','withheld'],withstand:['withstood','withstood'],wring:['wrung','wrung'],write:['wrote','written']
});
const NOTEBOOK_DOUBLE_FINAL = new Set('outfit overlap handicap admit allot ban bar beg begin blur brag cancel chat chop clap clip commit compel confer control cram crop defer deter drag drop drum equip excel expel fan fit flap flip forbid format fret grab grin grip hop hug hum incur infer jam jog kid knit label lag lap log map mar mop nod occur omit pat permit pin plan plot plug pop prefer propel quit rebel recap refer regret repel rip rob rub scan scrub ship shop shrug sip skip slam slap slip snap sob span spin spot star stem step stir stop strap strip submit tag tap tip transfer trap trim trip tug unzip upset wag whip wrap'.split(' '));
const NOTEBOOK_NOUN_PLURALS = Object.freeze({police:'police（集合複數）',headquarters:'headquarters（單複數同形）',firewoman:'firewomen',layman:'laymen',statesman:'statesmen',child:'children',person:'people（人們）/ persons（個別人士，正式）',man:'men',woman:'women',foot:'feet',tooth:'teeth',goose:'geese',mouse:'mice',louse:'lice',ox:'oxen',sheep:'sheep',deer:'deer',fish:'fish / fishes（魚種）',salmon:'salmon',trout:'trout',species:'species',series:'series',means:'means',aircraft:'aircraft',spacecraft:'spacecraft',offspring:'offspring',analysis:'analyses',axis:'axes',basis:'bases',crisis:'crises',diagnosis:'diagnoses',hypothesis:'hypotheses',oasis:'oases',parenthesis:'parentheses',synthesis:'syntheses',thesis:'theses',criterion:'criteria',phenomenon:'phenomena',bacterium:'bacteria',medium:'media / mediums（依字義）',datum:'data',curriculum:'curricula / curriculums',formula:'formulas / formulae',fungus:'fungi / funguses',cactus:'cacti / cactuses',alumnus:'alumni',alumna:'alumnae',nucleus:'nuclei',stimulus:'stimuli',radius:'radii / radiuses',focus:'focuses / foci',index:'indexes / indices',appendix:'appendixes / appendices',matrix:'matrices',vertex:'vertices',quiz:'quizzes',bus:'buses',gas:'gases',hero:'heroes',potato:'potatoes',tomato:'tomatoes',echo:'echoes',veto:'vetoes',mosquito:'mosquitoes / mosquitos',volcano:'volcanoes / volcanos',buffalo:'buffalo / buffaloes',knife:'knives',life:'lives',wife:'wives',leaf:'leaves',loaf:'loaves',wolf:'wolves',calf:'calves',half:'halves',shelf:'shelves',thief:'thieves',self:'selves',scarf:'scarves / scarfs',dwarf:'dwarfs / dwarves',hoof:'hoofs / hooves',handkerchief:'handkerchiefs / handkerchieves',fisherman:'fishermen',freshman:'freshmen',policeman:'policemen',policewoman:'policewomen',fireman:'firemen',salesman:'salesmen',businessman:'businessmen',spokesman:'spokesmen',gentleman:'gentlemen',sportsman:'sportsmen',sportswoman:'sportswomen',postman:'postmen',workman:'workmen',passerby:'passersby',data:'data（複數；現代亦可作集合用法）',bacteria:'bacteria（複數，單數 bacterium）',criteria:'criteria（複數，單數 criterion）',phenomena:'phenomena（複數，單數 phenomenon）',alumni:'alumni（複數，單數 alumnus）',indices:'indices（複數，單數 index）',media:'media（複數或集合用法，依字義）'});
const NOTEBOOK_MASS_NOUNS = new Set('humankind sportsmanship advice air baggage bread cash chaos clothing courage education equipment evidence feedback footwear furniture garbage gold grammar happiness homework housework information jewelry jewellery knowledge laughter leisure lightning livestock luck luggage machinery mankind money music news nonsense nutrition oxygen patience permission pollution poverty progress publicity research rice rubbish safety scenery software stationery stuff sunlight sunshine thunder traffic transportation underwear violence vocabulary weather wealth welfare wildlife wood work'.split(' '));
const NOTEBOOK_PLURAL_ONLY = new Set('binoculars clothes congratulations earnings glasses goods jeans manners outskirts pants pajamas pyjamas proceeds scissors shorts spectacles stairs surroundings thanks trousers'.split(' '));
const NOTEBOOK_NON_GRADABLE = new Set('absolute annual automatic atomic biological chemical circular daily dead digital domestic double electric electrical empty entire equal false female final full global ideal impossible initial internal legal local main male married maximum medical mental minimum monthly national nuclear online opposite perfect physical plastic potential pregnant previous primary principal private public round single solar square sufficient technical total unique universal urban weekly wooden worldwide yearly'.split(' '));
const NOTEBOOK_SHORT_COMPARATIVES = new Set('clever common cruel gentle handsome humble narrow pleasant quiet shallow simple stupid subtle'.split(' '));
for(const word of 'set maiden lay all another any both each either enough every neither no other own same several some such only former latter last next first second third fourth fifth sixth seventh eighth ninth tenth prior superior inferior inner outer upper lower indoor outdoor top bottom born chinese japanese portuguese vietnamese swiss'.split(' '))NOTEBOOK_NON_GRADABLE.add(word);
function notebookRegularS(word) { if(word==='echo'||word==='veto')return word+'es'; return /[^aeiou]y$/.test(word)?word.slice(0,-1)+'ies':/(?:s|sh|ch|x|z)$/.test(word)?word+'es':word+'s'; }
function notebookDoublesFinal(word) { return NOTEBOOK_DOUBLE_FINAL.has(word)||(/^[bcdfghjklmnpqrstvwxyz]*[aeiou][bcdfgklmnprstz]$/.test(word)&&!/(?:fix|mix|tax)$/.test(word)); }
function notebookRegularPast(word) {
  if(/[^aeiou]y$/.test(word))return word.slice(0,-1)+'ied';
  if(word.endsWith('e'))return word+'d';
  if(word.endsWith('c'))return word+'ked';
  return word+(notebookDoublesFinal(word)?word.slice(-1):'')+'ed';
}
function notebookRegularIng(word) {
  if(word.endsWith('ie'))return word.slice(0,-2)+'ying';
  if(word.endsWith('c'))return word+'king';
  if(word.endsWith('e')&&!/(?:ee|ye|oe)$/.test(word))return word.slice(0,-1)+'ing';
  return word+(notebookDoublesFinal(word)?word.slice(-1):'')+'ing';
}
function notebookComparisons(word) {
  const special={good:['better','best'],well:['better','best'],bad:['worse','worst'],ill:['worse','worst'],far:['farther / further','farthest / furthest'],little:['less / smaller（依字義）','least / smallest（依字義）'],many:['more','most'],much:['more','most'],old:['older / elder（親屬）','oldest / eldest（親屬）']};
  if(special[word])return special[word];
  if(NOTEBOOK_NON_GRADABLE.has(word))return ['通常不作程度比較','通常不作程度比較'];
  if(/[^aeiou]y$/.test(word)&&word.length>2&&(word.match(/[aeiouy]+/g)||[]).length<=2)return [word.slice(0,-1)+'ier',word.slice(0,-1)+'iest'];
  if(['fun','real','right','wrong','worth'].includes(word))return ['more '+word,'most '+word];
  const oneSyllable=(word.match(/[aeiouy]+/g)||[]).length-(word.length>3&&/[^aeiou]e$/.test(word)?1:0)<=1;
  if((oneSyllable&&!/(?:ed|ing)$/.test(word))||NOTEBOOK_SHORT_COMPARATIVES.has(word)){
    const stem=word.endsWith('e')?word.slice(0,-1):word;
    const base=stem+(notebookDoublesFinal(word)?word.slice(-1):'');return [base+'er',base+'est'];
  }
  return ['more '+word,'most '+word];
}
function notebookInflectionVariants(entry) {
  const original=String(entry.word||''), pos=String(getVocabularyInformation(entry)?.pos||entry.partOfSpeech||'');
  const parenthesized=original.match(/^([^()/]+)\(([^)]+)\)/);
  const aliases=typeof builtinTargetAliases==='function'?builtinTargetAliases(original):[original];
  return aliases.map(value=>{
    const word=value.toLowerCase();let role=word==='underlying'?'adj.':pos,alreadyPlural=false;
    if(parenthesized){
      const base=parenthesized[1].trim().toLowerCase();
      if(/\(n\.\)/.test(pos))role=word===base?pos.replace(/\/\(n\.\)/g,''):'n.';
      else if(parenthesized[2]==='s'&&word===base+'s'){role='n.';alreadyPlural=true;}
    }
    return {word,pos:role,alreadyPlural};
  }).filter(item=>/^[a-z]+(?:[-'][a-z]+)*$/.test(item.word));
}
function getNotebookInflections(entry) {
  if(!entry)return [];
  const variants=notebookInflectionVariants(entry),rows=[];
  for(const {word,pos,alreadyPlural} of variants){
    const prefix=variants.length>1?word+' · ':'';
    if(/(?:^|\/)v\.|vt\.|vi\./.test(pos)){
      const irregular=NOTEBOOK_VERB_INFLECTIONS[word],past=notebookRegularPast(word);
      // can / will also have lexical verb senses, with regular inflections.
      const modal=/^(?:could|may|might|must|shall|should|would|ought)$/.test(word);
      rows.push({label:prefix+'動詞原形',value:word},
        {label:prefix+'過去式',value:modal?'情態助動詞，依語意選形式':irregular?.[0]||past},
        {label:prefix+'過去分詞',value:modal?'無此形式':irregular?.[1]||past},
        {label:prefix+'第三人稱單數',value:modal?word:irregular?.[2]||notebookRegularS(word)},
        {label:prefix+'V-ing',value:modal?'無此形式':irregular?.[3]||notebookRegularIng(word)});
      if(/aux\./.test(pos))rows.push({label:prefix+'情態助動詞用法',value:'不加 -s，無 V-ing 或過去分詞；上列變化屬一般動詞義。'});
    }
    if(/(?:^|\/)n\./.test(pos))rows.push({label:prefix+'名詞複數',value:alreadyPlural||NOTEBOOK_PLURAL_ONLY.has(word)||/n\.\s*pl\./.test(pos)?word+'（本身為複數形式）':NOTEBOOK_MASS_NOUNS.has(word)?'常用義為不可數；不直接加 -s':({chinese:'Chinese',japanese:'Japanese',portuguese:'Portuguese',vietnamese:'Vietnamese',swiss:'Swiss',chairman:'chairmen',chairwoman:'chairwomen',congressman:'congressmen',congresswoman:'congresswomen',saleswoman:'saleswomen',spokeswoman:'spokeswomen',spokesperson:'spokespeople / spokespersons',salesperson:'salespeople / salespersons',chairperson:'chairpeople / chairpersons',mister:'Messrs.（稱謂）/ misters（一般名詞）'})[word]||NOTEBOOK_NOUN_PLURALS[word]||notebookRegularS(word)});
    if(/adj\.|a\./.test(pos)||(['well','early','fast','hard','late','long','soon'].includes(word)&&/adv\./.test(pos))){
      const [comparative,superlative]=notebookComparisons(word);rows.push({label:prefix+'比較級',value:comparative},{label:prefix+'最高級',value:superlative});
    }
  }
  return rows;
}
