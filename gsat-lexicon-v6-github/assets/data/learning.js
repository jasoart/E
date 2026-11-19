"use strict";
const GSAT_EXAM_COLLOCATIONS=Object.freeze(GSAT_COLLOCATION_GUIDE.filter(point=>point.evidence.length));
const GSAT_POINTS_BY_WORD=new Map();
GSAT_COLLOCATION_GUIDE.forEach(point=>point.keys.forEach(key=>{const normalized=String(key).toLowerCase();if(!GSAT_POINTS_BY_WORD.has(normalized))GSAT_POINTS_BY_WORD.set(normalized,[]);GSAT_POINTS_BY_WORD.get(normalized).push(point)}));
const SEARCH_CONCEPTS = Object.freeze([
  {triggers:["導致","造成","引起","cause"],terms:["lead to","result in","contribute to","cause","bring about","give rise to"]},
  {triggers:["起因","源自","because","原因"],terms:["result from","arise from","stem from","due to","owing to","because of"]},
  {triggers:["習慣","used to"],terms:["be used to","get used to","be accustomed to","used to"]},
  {triggers:["阻止","預防","prevent"],terms:["prevent from","stop from","keep from","protect from","warn against"]},
  {triggers:["負責","責任","responsible"],terms:["be responsible for","take responsibility for","be to blame for"]},
  {triggers:["參加","參與","participate"],terms:["participate in","take part in","be involved in","engage in"]},
  {triggers:["處理","應付","deal"],terms:["deal with","cope with","attend to","dispose of","work out"]},
  {triggers:["申請","apply"],terms:["apply for","apply to","application for"]},
  {triggers:["提供","供應","provide"],terms:["provide with","provide for","supply with","offer to"]},
  {triggers:["比較","區分","compare"],terms:["compare with","compare to","distinguish from","difference between","in contrast to"]},
  {triggers:["反對","object"],terms:["object to","be opposed to","have an objection to","against"]},
  {triggers:["致力","投入","devote"],terms:["devote to","dedicate to","engage in","focus on","work on"]},
  {triggers:["擅長","善於","capable"],terms:["be good at","excel in","be capable of","be skilled at"]},
  {triggers:["道歉","apologize"],terms:["apologize to","apologize for","make an apology"]},
  {triggers:["感謝","grateful"],terms:["be grateful to","be grateful for","thanks to","express gratitude"]},
  {triggers:["影響","effect","affect"],terms:["have an effect on","have an influence on","affect","make a difference to"]},
  {triggers:["缺乏","lack"],terms:["lack","a lack of","be lacking in","for lack of"]},
  {triggers:["恢復","克服","recover"],terms:["recover from","get over","make a recovery from","cope with"]},
  {triggers:["允許","許可","allow"],terms:["allow to","permit to","allow v-ing","permission"]},
  {triggers:["建議","suggest","recommend"],terms:["suggest v-ing","recommend v-ing","advise to","suggest that"]},
  {triggers:["動名詞","v-ing","gerund"],terms:["v-ing","avoid","enjoy","mind","practice","risk","suggest","postpone"]},
  {triggers:["不定詞","to v","infinitive"],terms:["to v","afford","decide","expect","manage","offer","promise","refuse"]},
  {triggers:["儘管","讓步","although"],terms:["although","though","despite","in spite of","even though"]},
  {triggers:["此外","addition"],terms:["in addition","in addition to","besides","moreover"]},
  {triggers:["相反","對比","contrast"],terms:["in contrast to","by contrast","on the contrary","whereas","while"]}
]);
