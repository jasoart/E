"use strict";

function isNounEntry(entry){return String(entry.partOfSpeech||"").split("/").some(part=>part.trim()==="n.")}
function emptyDictionaryResult(){return{phonetic:"",audioCandidates:[],examples:[],partsOfSpeech:[]}}
function emptyExampleSource(){return{partsOfSpeech:[],candidates:[],candidateCount:0}}
function emptyAudioResult(){return{candidates:[]}}
function normalizeAudioUrl(value){let url=String(value||"").trim();if(!url)return"";if(url.startsWith("//"))url="https:"+url;if(url.startsWith("http://"))url="https://"+url.slice(7);return safeExternalUrl(url)}
function decodedAudioLabel(value){let label=String(value||"");try{label=decodeURIComponent(label)}catch{}return label}
function audioAccent(url,label=""){
  const value=(decodedAudioLabel(url)+" "+label).toLowerCase();
  if(/(^|[-_. (])(us|usa|american)([-_. )]|$)/.test(value))return"US";
  if(/(^|[-_. (])(uk|gb|british|rp)([-_. )]|$)/.test(value))return"UK";
  if(/(^|[-_. (])(ca|canadian)([-_. )]|$)/.test(value))return"CA";
  if(/(^|[-_. (])(au|australian)([-_. )]|$)/.test(value))return"AU";
  return"EN";
}
function audioFormat(url){const value=String(url||"").toLowerCase().split(/[?#]/)[0];if(value.endsWith(".mp3"))return"MP3";if(/\.(m4a|aac)$/.test(value))return"AAC";if(/\.(wav|wave)$/.test(value))return"WAV";if(/\.(ogg|oga|opus)$/.test(value))return"OGG";return"AUDIO"}
function audioCandidate(url,label="",source="DictionaryAPI",attributionUrl=""){
  const normalized=normalizeAudioUrl(url);if(!normalized)return null;return{url:normalized,accent:audioAccent(normalized,label),format:audioFormat(normalized),source,label:String(label||"").trim(),attributionUrl:String(attributionUrl||"").trim()};
}
function supportsAudioCandidate(candidate){
  if(!candidate||!candidate.url)return false;const probe=document.createElement("audio"),format=candidate.format;if(!probe.canPlayType)return true;
  const mime=format==="MP3"?"audio/mpeg":format==="AAC"?"audio/mp4":format==="WAV"?"audio/wav":format==="OGG"?"audio/ogg":"";return!mime||probe.canPlayType(mime)!=="";
}
function rankAudioCandidates(candidates){
  const accentRank={US:0,CA:1,UK:2,AU:3,EN:4},formatRank={MP3:0,AAC:1,WAV:2,AUDIO:3,OGG:4},seen=new Set();
  return(candidates||[]).filter(Boolean).filter(candidate=>{const key=candidate.url.toLowerCase();if(seen.has(key)||!supportsAudioCandidate(candidate))return false;seen.add(key);return true}).sort((a,b)=>(accentRank[a.accent]??9)-(accentRank[b.accent]??9)||(formatRank[a.format]??9)-(formatRank[b.format]??9)||a.source.localeCompare(b.source));
}

function parseDictionaryPayload(payload){
  const result=emptyDictionaryResult();if(!Array.isArray(payload))return result;
  for(const item of payload){
    if(!item)continue;
    if(!result.phonetic&&item.phonetic)result.phonetic=String(item.phonetic).trim();
    for(const phonetic of item.phonetics||[]){const candidate=audioCandidate(phonetic.audio,phonetic.text||"","DictionaryAPI");if(candidate)result.audioCandidates.push(candidate)}
    for(const meaning of item.meanings||[]){
      const part=String(meaning.partOfSpeech||"").trim();if(part&&!result.partsOfSpeech.includes(part))result.partsOfSpeech.push(part);
      for(const definition of meaning.definitions||[]){const text=String(definition&&definition.example||"").trim();if(text)result.examples.push({text,partOfSpeech:part,source:"DictionaryAPI",sourceUrl:"https://dictionaryapi.dev/"})}
    }
  }
  result.audioCandidates=rankAudioCandidates(result.audioCandidates);
  return result;
}

function stripWikiHtml(value){const documentValue=new DOMParser().parseFromString(String(value||""),"text/html");return String(documentValue.body.textContent||"").replace(/\s+/g," ").trim()}
function wiktionaryExampleText(value){if(typeof value==="string")return stripWikiHtml(value);if(value&&typeof value==="object")return stripWikiHtml(value.text||value.example||"");return""}
function parseWiktionaryPayload(payload,word){
  const blocks=payload&&Array.isArray(payload.en)?payload.en:[],partsOfSpeech=[],evaluated=[],seen=new Set();
  for(const block of blocks){
    const part=String(block.partOfSpeech||"").trim();if(part&&!partsOfSpeech.includes(part))partsOfSpeech.push(part);
    for(const definition of block.definitions||[]){
      const candidates=[...(Array.isArray(definition.examples)?definition.examples:[]),...(Array.isArray(definition.parsedExamples)?definition.parsedExamples:[])];
      for(const candidate of candidates){const text=wiktionaryExampleText(candidate),key=text.toLowerCase();if(text&&!seen.has(key)){seen.add(key);evaluated.push(evaluateGsatExample(text,part,word,{source:"Wiktionary",sourceUrl:"https://en.wiktionary.org/wiki/"+encodeURIComponent(word)}))}}
    }
  }
  return{partsOfSpeech,candidates:evaluated,candidateCount:evaluated.length};
}
function collectFreeDictionarySenses(senses,part,word,sourceUrl,output,depth=0){
  if(depth>5||output.length>=160)return;
  for(const sense of Array.isArray(senses)?senses:[]){
    for(const example of Array.isArray(sense&&sense.examples)?sense.examples:[]){const text=wiktionaryExampleText(example);if(text)output.push(evaluateGsatExample(text,part,word,{source:"FreeDictionaryAPI／Wiktionary",sourceUrl}))}
    collectFreeDictionarySenses(sense&&sense.subsenses,part,word,sourceUrl,output,depth+1);
  }
}
function parseFreeDictionaryPayload(payload,word){
  const result=emptyExampleSource();if(!payload||!Array.isArray(payload.entries))return result;const sourceUrl=String(payload.source&&payload.source.url||"https://freedictionaryapi.com/");
  for(const entry of payload.entries){const part=String(entry&&entry.partOfSpeech||"").trim();if(part&&!result.partsOfSpeech.includes(part))result.partsOfSpeech.push(part);collectFreeDictionarySenses(entry&&entry.senses,part,word,sourceUrl,result.candidates)}
  result.candidateCount=result.candidates.length;return result;
}
function parseTatoebaPayload(payload,word){
  const result=emptyExampleSource();for(const sentence of payload&&Array.isArray(payload.data)?payload.data:[]){
    const text=String(sentence&&sentence.text||"").replace(/\s+/g," ").trim();if(!text)continue;const audio=(Array.isArray(sentence.audios)?sentence.audios:[]).find(item=>item&&item.download_url),audioUrl=audio?normalizeAudioUrl(audio.download_url):"";
    result.candidates.push(evaluateGsatExample(text,"",word,{source:"Tatoeba 母語者句庫",sourceUrl:"https://tatoeba.org/en/sentences/show/"+encodeURIComponent(sentence.id),sentenceLicense:String(sentence&&sentence.license||""),nativeSpeaker:true,audioUrl,audioAuthor:String(audio&&audio.author||""),audioLicense:String(audio&&audio.licence||""),audioAttributionUrl:String(audio&&audio.attribution_url||"")}));
  }
  result.candidateCount=result.candidates.length;return result;
}
function emptyCeecSuggestions(){return{items:[],candidateCount:0,rejectedCount:0,blockedCount:0}}
function ceecSuggestion(value){const key=normalizeCeecWord(value),single=/^[A-Za-z]+(?:[-'][A-Za-z]+)*$/.test(String(value||"").trim()),level=Number(CEEC_LEVEL_BY_WORD[key]||0)||(single?ceecTokenLevel(value):0);return level?{word:value,level}:null}
function parseSynonyms(payload,word){
  if(!Array.isArray(payload))return emptyCeecSuggestions();const seen=new Set(),target=normalizeCeecWord(word),result=emptyCeecSuggestions();
  for(const item of payload){const value=String(item&&item.word||"").trim(),key=normalizeCeecWord(value);if(!value||key===target||seen.has(key))continue;seen.add(key);result.candidateCount++;const match=ceecSuggestion(value);if(!match){result.rejectedCount++;continue}if(result.items.length<5)result.items.push(match)}
  return result;
}
const COLLOCATION_STOPWORDS=new Set("the an a these those and or but all this that their our your its more other any each some no is was be been being are were am have has had do does did will would can could should may might must".split(" "));
const COLLOCATION_PREPOSITIONS=new Set("to with for from of in on as by against into about over under between among through without".split(" "));
function datamusePosTags(item){return new Set((item&&Array.isArray(item.tags)?item.tags:[]).map(tag=>String(tag).toLowerCase()).filter(tag=>["n","v","adj","adv"].includes(tag)))}
function collocationDirectionScore(entry,direction,partnerKey,tags){
  const pos=String(entry&&entry.partOfSpeech||"").toLowerCase(),prep=COLLOCATION_PREPOSITIONS.has(partnerKey);let score=0,label="語料方向";
  if(/v\./.test(pos)){if(direction==="after"&&(tags.has("n")||prep)){score=20;label=prep?"動詞＋介系詞方向":"動詞＋名詞方向"}else if(direction==="before"&&tags.has("adv")){score=10;label="副詞＋動詞方向"}}
  else if(/n\./.test(pos)){if(direction==="before"&&(tags.has("v")||tags.has("adj"))){score=19;label="動／形＋名詞方向"}else if(direction==="after"&&prep){score=13;label="名詞＋介系詞方向"}}
  else if(/adj\.|a\./.test(pos)){if(direction==="after"&&(prep||tags.has("n"))){score=18;label="形容詞後接方向"}else if(direction==="before"&&tags.has("adv")){score=12;label="副詞＋形容詞方向"}}
  else if(/adv\./.test(pos)&&(tags.has("v")||tags.has("adj"))){score=12;label="副詞修飾方向"}
  return{score,label};
}
function parseCorpusCollocations(beforePayload,afterPayload,entry){
  const word=apiLookupWord(entry&&entry.word),target=normalizeCeecWord(word),points=getGsatPoints(entry),blocked=new Set(points.flatMap(point=>point.blocked||[]).map(normalizeSearchValue)),patternText=normalizeSearchValue(points.flatMap(point=>point.patterns).map(pattern=>pattern[0]).join(" ")),seen=new Set(),result=emptyCeecSuggestions(),pool=[];
  for(const [payload,direction] of [[beforePayload,"before"],[afterPayload,"after"]])for(const item of Array.isArray(payload)?payload:[]){
    const value=String(item&&item.word||"").trim(),key=normalizeCeecWord(value);if(!value||key===target||COLLOCATION_STOPWORDS.has(key)||!/^[A-Za-z][A-Za-z '-]*$/.test(value))continue;
    const phrase=direction==="before"?`${value} ${word}`:`${word} ${value}`,phraseKey=normalizeSearchValue(phrase);if(seen.has(phraseKey))continue;seen.add(phraseKey);result.candidateCount++;if(blocked.has(phraseKey)){result.blockedCount++;continue}
    const match=ceecSuggestion(value);if(!match){result.rejectedCount++;continue}pool.push({...match,phrase,direction,rawScore:Math.max(0,Number(item&&item.score||0)),partnerKey:normalizeSearchValue(value),tags:datamusePosTags(item)});
  }
  const maxRaw=Math.max(1,...pool.map(item=>item.rawScore));for(const item of pool){const frequency=Math.round(35*Math.log1p(item.rawScore)/Math.log1p(maxRaw)),directionFit=collocationDirectionScore(entry,item.direction,item.partnerKey,item.tags),coreBonus=item.level<=5?14:6,curated=curatedCollocationCheck(item.phrase,word).aligned,curatedBonus=curated?30:0,score=Math.min(99,frequency+directionFit.score+coreBonus+curatedBonus),confidence=curated||score>=68?"high":score>=48?"medium":"explore";Object.assign(item,{score,confidence,confidenceLabel:confidence==="high"?"高":confidence==="medium"?"中":"探索",reasons:[`語料 ${frequency}/35`,directionFit.label,`CEEC L${item.level}`,...(curated?["精選句型吻合"]:[])]})}
  result.items=pool.sort((a,b)=>b.score-a.score||a.level-b.level||a.phrase.localeCompare(b.phrase)).slice(0,6);return result;
}

function datamuseUrl(params){const url=new URL(API_ENDPOINTS.datamuse);Object.entries(params).forEach(([key,value])=>url.searchParams.set(key,String(value)));return url.href}
function googleTranslationUrl(text){const url=new URL(API_ENDPOINTS.googleTranslate);url.search=new URLSearchParams({client:"gtx",sl:"en",tl:"zh-TW",dt:"t",q:text}).toString();return url.href}
function googleTranslatePage(word){const url=new URL("https://translate.google.com/");url.search=new URLSearchParams({sl:"en",tl:"zh-TW",text:spokenForm(word),op:"translate"}).toString();return url.href}
function tatoebaUrl(word){const url=new URL(API_ENDPOINTS.tatoeba);url.search=new URLSearchParams({lang:"eng",q:`"${word.replace(/["\\]/g,"")}"`,word_count:"7-36",is_unapproved:"no",is_orphan:"no",is_native:"yes",sort:"relevance",limit:"24",include:"audios",showtrans:"none"}).toString();return url.href}
function actionApiUrl(base,params){const url=new URL(base);url.search=new URLSearchParams({origin:"*",format:"json",formatversion:"2",...params}).toString();return url.href}
function wiktionaryWikitextUrl(word){return actionApiUrl(API_ENDPOINTS.wiktionaryAction,{action:"parse",page:word,prop:"wikitext"})}
function commonsAudioUrl(fileNames){return actionApiUrl(API_ENDPOINTS.commonsAction,{action:"query",prop:"imageinfo",iiprop:"url|mime",titles:fileNames.map(name=>"File:"+name).join("|")})}

function parseWiktionaryAudioNames(payload){
  const raw=payload&&payload.parse&&payload.parse.wikitext,text=typeof raw==="string"?raw:String(raw&&raw["*"]||""),regex=/\{\{\s*audio\s*\|\s*en\s*\|\s*([^|}\n]+)(?:\|\s*([^|}\n]*))?/gi,result=[],seen=new Set();let match;
  while((match=regex.exec(text))&&result.length<8){const file=String(match[1]||"").trim(),label=stripWikiHtml(match[2]||"").replace(/^Audio\s*/i,"").trim();if(!file||/[{}]/.test(file)||seen.has(file.toLowerCase()))continue;seen.add(file.toLowerCase());result.push({file,label})}
  return result;
}
function normalizedFileTitle(value){return String(value||"").replace(/^File:/i,"").replace(/_/g," ").trim().toLowerCase()}
async function fetchWiktionaryAudio(word,signal){
  const markup=await fetchJson(wiktionaryWikitextUrl(word),signal);if(markup.error)return{...emptyAudioResult(),error:true};const names=parseWiktionaryAudioNames(markup.payload);if(!names.length)return{...emptyAudioResult(),error:false};
  const info=await fetchJson(commonsAudioUrl(names.map(item=>item.file)),signal);if(info.error)return{...emptyAudioResult(),error:true};const pages=info.payload&&info.payload.query&&info.payload.query.pages,items=Array.isArray(pages)?pages:Object.values(pages||{}),labels=new Map(names.map(item=>[normalizedFileTitle(item.file),item.label])),candidates=[];
  for(const page of items){const image=page&&Array.isArray(page.imageinfo)?page.imageinfo[0]:null,candidate=image&&audioCandidate(image.url,labels.get(normalizedFileTitle(page.title))||"","Wiktionary／Wikimedia Commons",page&&page.canonicalurl||"");if(candidate)candidates.push(candidate)}
  return{candidates:rankAudioCandidates(candidates),error:false};
}

