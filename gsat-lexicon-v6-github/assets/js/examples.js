"use strict";

const GSAT_TOPICS=[
  {label:"生活與教育",signals:["school","student","teacher","learn","education","family","meal","restaurant","travel","community","daily life","volunteer"]},
  {label:"健康與心理",signals:["health","medical","exercise","sleep","disease","emotion","memory","behavior","behaviour","mental","stress","decision"]},
  {label:"環境與永續",signals:["climate","carbon","environment","pollution","renewable","ocean","drought","conservation","energy","habitat","recycle"]},
  {label:"科學與科技",signals:["science","research","digital","technolog","satellite","artificial intelligence","algorithm","data","internet","device","innovation"]},
  {label:"文化與歷史",signals:["history","historical","civilization","ancient","culture","cultural","art","tradition","language","museum","century"]},
  {label:"社會與公民",signals:["society","social","public","government","law","election","citizen","equality","media","population","rights"]},
  {label:"經濟與工作",signals:["econom","finance","market","consumer","industry","trade","investment","employment","income","business","workplace"]},
  {label:"自然與生物",signals:["species","evolut","organism","genetic","ecosystem","biodiversity","marine","survival","animal","plant"]}
];
const CONTEXT_SIGNAL_PATTERNS=[
  {label:"因果線索",test:/\b(because|since|therefore|thus|consequently|so that|as a result|due to)\b/i},
  {label:"轉折比較",test:/\b(although|though|however|whereas|nevertheless|despite|while|rather than|in contrast)\b/i},
  {label:"條件目的",test:/\b(if|unless|whether|in order to|so as to|provided that)\b/i},
  {label:"舉例補充",test:/\b(for example|for instance|such as|in addition|moreover|furthermore)\b/i},
  {label:"關係指涉",test:/\b(which|who|whom|whose|where|that)\b/i},
  {label:"時間順序",test:/\b(before|after|when|while|eventually|meanwhile|first|finally)\b/i}
];
const IRREGULAR_FORMS=new Map(Object.entries({be:["am","is","are","was","were","been","being"],have:["has","had"],do:["does","did","done"],go:["goes","went","gone"],make:["made"],take:["took","taken"],give:["gave","given"],get:["got","gotten"],come:["came"],see:["saw","seen"],know:["knew","known"],think:["thought"],find:["found"],write:["wrote","written"],speak:["spoke","spoken"],choose:["chose","chosen"],lead:["led"],teach:["taught"],buy:["bought"],bring:["brought"],build:["built"],feel:["felt"],keep:["kept"],leave:["left"],meet:["met"],read:["read"],run:["ran"],say:["said"],send:["sent"],stand:["stood"],understand:["understood"],win:["won"]}));
const IRREGULAR_BASE_BY_FORM=new Map([...IRREGULAR_FORMS].flatMap(([base,forms])=>forms.map(form=>[form,base])));
const CONTRACTION_BASES=new Map(Object.entries({"can't":"can","cannot":"can","couldn't":"could","won't":"will","wouldn't":"would","shouldn't":"should","mustn't":"must","isn't":"be","aren't":"be","wasn't":"be","weren't":"be","hasn't":"have","haven't":"have","hadn't":"have","doesn't":"do","don't":"do","didn't":"do","i'm":"be","you're":"be","we're":"be","they're":"be","i've":"have","we've":"have","they've":"have"}));

const FORM_CACHE = new Map(), PATTERN_CACHE = new Map();
const EXTRA_IRREGULAR = {eat:["ate","eaten"],drink:["drank","drunk"],break:["broke","broken"],hold:["held"],hear:["heard"],lose:["lost"],pay:["paid"],sell:["sold"],sit:["sat"],sleep:["slept"],spend:["spent"],swim:["swam","swum"],fall:["fell","fallen"],grow:["grew","grown"],rise:["rose","risen"],drive:["drove","driven"],fly:["flew","flown"],lie:["lay","lain"],lay:["laid"],child:["children"],person:["people"],man:["men"],woman:["women"],foot:["feet"],tooth:["teeth"],mouse:["mice"]};
for (const [base, forms] of Object.entries(EXTRA_IRREGULAR)) { IRREGULAR_FORMS.set(base, forms); for (const form of forms) IRREGULAR_BASE_BY_FORM.set(form, base); }
function sentenceWords(text) { return String(text || "").replace(/’/g, "'").match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g) || []; }
function normalizedToken(value) { return String(value || "").toLowerCase().replace(/’/g,"'").replace(/[^a-z'-]/g,""); }
function wordForms(target) {
  if (FORM_CACHE.has(target)) return FORM_CACHE.get(target);
  const forms = new Set([target, ...(IRREGULAR_FORMS.get(target) || [])]);
  if (target.length > 2) {
    forms.add(target + "s");
    if (/(s|x|z|ch|sh|o)$/.test(target)) forms.add(target + "es");
    if (/[^aeiou]y$/.test(target)) { forms.add(target.slice(0,-1)+"ies"); forms.add(target.slice(0,-1)+"ied"); }
    else forms.add(target + (target.endsWith("e") ? "d" : "ed"));
    if (/ie$/.test(target)) forms.add(target.slice(0,-2)+"ying");
    else forms.add((/[^e]e$/.test(target) ? target.slice(0,-1) : target) + "ing");
    if (/[aeiou][bcdfgklmnprst]$/.test(target)) { forms.add(target+target.slice(-1)+"ed"); forms.add(target+target.slice(-1)+"ing"); }
  }
  FORM_CACHE.set(target, forms); return forms;
}
function matchesTargetForm(token, target) { return Boolean(token && target && wordForms(target).has(token)); }
function targetVariants(word) { return String(word || "").split("/").map(part => sentenceWords(part.replace(/\([^)]*\)/g, "")).map(normalizedToken)).filter(parts=>parts.length); }
function containsTargetForm(text, word) {
  const tokens = sentenceWords(text).map(normalizedToken);
  return targetVariants(word).some(target => tokens.some((_, start) => target.every((part, offset) => matchesTargetForm(tokens[start + offset], part))));
}
function ceecTokenLevel(value){
  let token=normalizedToken(value);if(!token)return 0;token=CONTRACTION_BASES.get(token)||token;const exact=Number(CEEC_LEVEL_BY_WORD[token]||0);if(exact)return exact;
  const irregular=IRREGULAR_BASE_BY_FORM.get(token);if(irregular&&CEEC_LEVEL_BY_WORD[irregular])return Number(CEEC_LEVEL_BY_WORD[irregular]);
  const candidates=[];if(token.endsWith("ies")&&token.length>4)candidates.push(token.slice(0,-3)+"y");if(token.endsWith("ied")&&token.length>4)candidates.push(token.slice(0,-3)+"y");
  if(token.endsWith("ing")&&token.length>5){const stem=token.slice(0,-3);candidates.push(stem,stem+"e");if(stem[stem.length-1]===stem[stem.length-2])candidates.push(stem.slice(0,-1))}
  if(token.endsWith("ed")&&token.length>4){const stem=token.slice(0,-2);candidates.push(stem,stem+"e");if(stem[stem.length-1]===stem[stem.length-2])candidates.push(stem.slice(0,-1))}
  if(token.endsWith("es")&&token.length>4)candidates.push(token.slice(0,-2),token.slice(0,-1));if(token.endsWith("s")&&token.length>3)candidates.push(token.slice(0,-1));
  for(const candidate of candidates){const level=Number(CEEC_LEVEL_BY_WORD[candidate]||0);if(level)return level}return 0;
}

function sentenceCeecCoverage(tokens) {
  let known = 0, total = 0, ignoredProper = 0; const unknown = [];
  tokens.forEach((token, index) => {
    const level = ceecTokenLevel(token);
    if (level) { known++; total++; }
    else if (index > 0 && /^[A-Z][a-z'-]+$/.test(token) && ignoredProper < 2) ignoredProper++;
    else { total++; unknown.push(normalizedToken(token)); }
  });
  return { ratio: total ? known / total : 0, known, total, unknown: [...new Set(unknown)].slice(0, 5) };
}
// Structural heuristic, not a grammar parser or a guarantee of grammaticality.
const VERB_WORDS = new Set(VOCABULARY.filter(entry=>/(^|[ /])v\./.test(entry.partOfSpeech)).flatMap(entry=>[...wordForms(apiLookupWord(entry.word).toLowerCase())]));
function likelyCompleteSentence(text, tokens) {
  if (tokens.length < 7 || !/^[“"']?[A-Z0-9]/.test(text) || !/[.!?][”"']?$/.test(text)) return false;
  const words = tokens.map(normalizedToken);
  return words.some(token => /^(am|is|are|was|were|has|have|had|can|could|will|would|shall|should|may|might|must)$/.test(token) || CONTRACTION_BASES.has(token) || VERB_WORDS.has(token));
}
function patternRegex(form) {
  if (PATTERN_CACHE.has(form)) return PATTERN_CACHE.get(form);
  const placeholders = new Set("A B N V S V-ing person people thing someone something feature identity result cause activity problem topic time position aid school source clause quantity amount figure aspect place situation object group office degree event policy method danger illness shock crime assignment material task tears information business worker hobby space offer volume fire journey loss mistake past rule decision subject letter issue activity".split(" "));
  const tokens = String(form).match(/[A-Za-z]+(?:[-'][A-Za-z]+)*|\//g) || [], groups = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === "/") continue;
    const alternatives = [tokens[i]];
    while (tokens[i + 1] === "/" && tokens[i + 2]) { alternatives.push(tokens[i + 2]); i += 2; }
    groups.push(alternatives.every(t=>placeholders.has(t)) ? null : alternatives.filter(t=>!placeholders.has(t)).map(t=>t.toLowerCase()));
  }
  while (groups.length && !groups[0]) groups.shift();
  while (groups.length && !groups.at(-1)) groups.pop();
  if (groups.filter(Boolean).length < 2) { PATTERN_CACHE.set(form, null); return null; }
  const source = groups.map(group=>group ? "(?:"+[...new Set(group.flatMap(token=>[...wordForms(token)]))].map(escapeRegExp).join("|")+")" : "(?:[a-z'-]+(?:\\s+[a-z'-]+){0,4})").join("\\s+");
  const regex = new RegExp("\\b"+source+"\\b", "i"); PATTERN_CACHE.set(form, regex); return regex;
}
function curatedCollocationCheck(text, word) {
  const points = getGsatPoints({word}), normalized = sentenceWords(text).map(normalizedToken).join(" ");
  for (const point of points) for (const blocked of point.blocked || []) {
    if (new RegExp("\\b" + escapeRegExp(normalizeSearchValue(blocked)).replace(/ /g,"\\s+") + "\\b", "i").test(normalized)) return { aligned:false, blocked:true, score:0, label:"易錯搭配" };
  }
  for (const point of points) for (const [form] of point.patterns) {
    if (patternRegex(form)?.test(normalized)) return {aligned:true, blocked:false, score:14, label:"句型搭配吻合"};
  }
  return {aligned:false, blocked:false, score:0, label:""};
}
function evaluateGsatExample(text, partOfSpeech, word, meta = {}) {
  text = String(text || "").replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase(), tokens = sentenceWords(text), wordCount = tokens.length;
  const targetMatched = containsTargetForm(text, word), coverage = sentenceCeecCoverage(tokens);
  const complete = likelyCompleteSentence(text, tokens), collocation = curatedCollocationCheck(text, word);
  const context = CONTEXT_SIGNAL_PATTERNS.filter(p=>p.test.test(text));
  const topic = GSAT_TOPICS.find(t=>t.signals.some(signal=>new RegExp("\\b"+escapeRegExp(signal),"i").test(lower)));
  const markup = /<[^>]+>|\{\{|\}\}|\[[^\]]+\]|https?:\/\/|\uFFFD/.test(text);
  const metalinguistic = /\b(word|term|spelling|pronounce)\b/i.test(text) && /["“”‘’]/.test(text);
  const repeated = /[!?.,]{3,}/.test(text);
  const hardReject = !targetMatched || !complete || wordCount < 7 || wordCount > 36 || coverage.ratio < .55 || markup || collocation.blocked || repeated;
  let score = 0; const reasons = [];
  if (targetMatched) { score += 24; reasons.push("目標字／變化形入句"); }
  if (complete) { score += 12; reasons.push("句型結構線索"); }
  const lengthScore = wordCount>=10 && wordCount<=26 ? 16 : wordCount>=7 && wordCount<=32 ? 11 : 5;
  score += lengthScore; reasons.push(`${wordCount} 字`);
  score += coverage.ratio>=.85 ? 18 : coverage.ratio>=.7 ? 13 : coverage.ratio>=.55 ? 6 : 0;
  reasons.push(`CEEC 覆蓋 ${Math.round(coverage.ratio*100)}%`);
  if (collocation.aligned) {score+=14; reasons.push(collocation.label);}
  if (context.length) {score+=Math.min(8,4+context.length*2); reasons.push(context[0].label);}
  if (topic) {score+=4; reasons.push(topic.label);}
  if (meta.nativeSpeaker || /Wiktionary|DictionaryAPI|詞表內建/.test(meta.source || "")) score+=4;
  if (meta.audioUrl) score+=1;
  if (metalinguistic) score-=25;
  return {...meta, text, partOfSpeech, score:Math.max(0,Math.min(99,score)), wordCount,
    ceecCoverage:coverage.ratio, ceecKnown:coverage.known, ceecTotal:coverage.total,
    unknownWords:coverage.unknown, collocationAligned:collocation.aligned, officialSignals:context.length,
    hardReject, eligible:!hardReject && score>=65, targetMatched, reasons:reasons.slice(0,7)};
}
const DIVERSITY_STOPWORDS = new Set("a an the is are was were be been being to of in on at for with and or but it its this that these those he she they we i you his her their our my your as by from".split(" "));
function exampleSimilarity(a, b) {
  const tokens = text => new Set(sentenceWords(text).map(normalizedToken).filter(t=>!DIVERSITY_STOPWORDS.has(t)));
  const left=tokens(a), right=tokens(b), overlap=[...left].filter(t=>right.has(t)).length;
  return overlap / Math.max(1, Math.min(left.size, right.size));
}
function sourceFamily(example) {return /wiktionary/i.test(example.source || "") ? "wiktionary" : example.source;}
function emergencyExample(entry) {
  return {text:`目前沒有找到適合示範「${entry.word}」用法的完整例句。可先閱讀上方中文釋義與下方搭配考點。`, partOfSpeech:entry.partOfSpeech,
    score:0, wordCount:0, ceecCoverage:null, reasons:["暫無合格例句"], eligible:false, targetMatched:false,
    source:"學習提示", sourceUrl:"", selectionTier:"emergency", isEmergency:true};
}
function rankExampleCandidates(entry, wiktionary, freeDictionary, tatoeba, dictionary) {
  const partsOfSpeech = new Set(dictionary?.partsOfSpeech || []), pool=[];
  for (const source of [wiktionary,freeDictionary,tatoeba]) {
    for (const part of source?.partsOfSpeech || []) partsOfSpeech.add(part);
    pool.push(...(source?.candidates || []));
  }
  for (const item of dictionary?.examples || []) pool.push(evaluateGsatExample(item.text,item.partOfSpeech,entry.word,item));
  if (entry.example) pool.push(evaluateGsatExample(entry.example,entry.partOfSpeech,entry.word,{source:"詞表內建例句",sourceUrl:"",translationZh:entry.exampleZh || "",translationSource:"內建翻譯"}));
  const byText=new Map();
  for (const example of pool) {
    const key=sentenceWords(example.text).map(normalizedToken).join(" "), current=byText.get(key);
    if (!key) continue;
    if (!current) {byText.set(key,example); continue;}
    const winner=example.score>current.score ? example : current, other=winner===example ? current : example;
    // Preserve audio attribution and existing translations when sources duplicate a sentence.
    byText.set(key,{...winner, ...(!winner.audioUrl && other.audioUrl ? {audioUrl:other.audioUrl,audioAuthor:other.audioAuthor,audioLicense:other.audioLicense,audioAttributionUrl:other.audioAttributionUrl}:{}),
      ...(!winner.translationZh && other.translationZh ? {translationZh:other.translationZh,translationSource:other.translationSource}: {})});
  }
  const all=[...byText.values()];
  const usable=all.filter(e=>!e.hardReject && e.targetMatched).sort((a,b)=>b.score-a.score || b.ceecCoverage-a.ceecCoverage || Number(Boolean(b.audioUrl))-Number(Boolean(a.audioUrl)) || Math.abs(18-a.wordCount)-Math.abs(18-b.wordCount) || a.text.localeCompare(b.text));
  const qualified=usable.filter(e=>e.eligible); let examples;
  if (qualified.length) {
    const first=qualified[0];
    const candidates=qualified.slice(1).filter(e=>e.score>=first.score-14 && exampleSimilarity(e.text,first.text)<.78);
    candidates.sort((a,b)=>(b.score-18*exampleSimilarity(b.text,first.text)+(sourceFamily(b)!==sourceFamily(first)?3:0))-(a.score-18*exampleSimilarity(a.text,first.text)+(sourceFamily(a)!==sourceFamily(first)?3:0)) || a.text.localeCompare(b.text));
    examples=[first,...candidates.slice(0,1)].map(e=>({...e,selectionTier:"gold",translationPending:!e.translationZh}));
  } else if (usable.length) examples=[{...usable[0],selectionTier:"fallback"}];
  else examples=[emergencyExample(entry)];
  return {partsOfSpeech:partsOfSpeech.size?[...partsOfSpeech]:[entry.partOfSpeech],examples,candidateCount:all.length,
    qualifiedCount:qualified.length,rejectedCount:all.length-qualified.length,selectionTier:examples[0].selectionTier,algorithmVersion:"GSAT V5 · 例句品質與多樣性排序"};
}
function parseTranslationPayload(payload) {if(!Array.isArray(payload)||!Array.isArray(payload[0]))return "";return payload[0].map(segment=>Array.isArray(segment)?String(segment[0]||""):"").join("").trim();}
async function translateQualifiedExamples(result, signal, onUpdate = () => {}) {
  let error=false;
  const examples=result.examples.map(example=>({...example})), output={...result,examples};
  await Promise.all(examples.map(async (example,index)=>{
    if (example.selectionTier!=="gold" || example.translationZh) return;
    const response=await fetchJson(googleTranslationUrl(example.text),signal,3000,{priority:2});
    const translationZh=parseTranslationPayload(response.payload);
    if (response.error || !translationZh) error=true;
    examples[index]={...example,translationZh,translationSource:"Google 翻譯",translationPending:false,translationError:response.error||!translationZh};
    if (!signal?.aborted) onUpdate(output);
  }));
  return {result:output,error};
}
