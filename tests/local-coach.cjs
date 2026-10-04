"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const coach=require("../assets/js/local-coach.js");
test("TextRank preserves probability mass, handles dangling nodes and favors connected evidence",()=>{
 const scores=coach.pageRank([[0,1,0],[1,0,0],[0,0,0]]);
 assert.ok(Math.abs(scores.reduce((a,b)=>a+b,0)-1)<1e-8);assert.ok(scores[0]>scores[2]);
 assert.deepEqual(coach.pageRank([]),[]);assert.deepEqual(coach.pageRank([[0]]),[1]);
});
test("extractive summary keeps original text/order and suppresses duplicate sentences",()=>{
 const text="Solar panels produce energy. Solar panels produce energy. Batteries store energy for homes. Dr. Lee compares 3.5 units of energy.";
 const results=coach.sentenceRank(text,3);
 assert.equal(new Set(results.map(x=>x.text)).size,results.length);
 assert.ok(results.every(x=>text.includes(x.text)));assert.ok(results.every((x,i)=>!i||x.index>results[i-1].index));
 assert.equal(coach.splitSentences(text).length,4);assert.match(coach.splitSentences(text)[3],/Dr\. Lee compares 3\.5/);
 assert.equal(coach.splitSentences('Students need safer routes\nbecause heavy traffic puts them at risk.')[0],'Students need safer routes because heavy traffic puts them at risk.');
});
test("keyword graph excludes stop words and ranks the recurring topic",()=>{
 const words=coach.keywordRank("The students compare renewable energy. Clean energy reduces waste. Energy storage supports communities.");
 assert.ok(words.some(x=>x.word==="energy"));assert.ok(!words.some(x=>["the","and"].includes(x.word)));
 assert.deepEqual(coach.keywordRank("the and of"),[]);
});
test("writing rules catch supported traps without merging distinct sentences",()=>{
 const r=coach.writingFeedback("Although the plan is useful, but it costs too much. We discuss about its limits. More better equipment is needed.");
 assert.deepEqual(r.warnings.map(x=>x.id).sort(),["although","comparative","discuss"]);
 assert.ok(!coach.writingFeedback("Although it costs money, we support it. But others disagree.").warnings.some(x=>x.id==="although"));
 assert.equal(coach.writingFeedback("We discuss the plan.").warnings.length,0);
 assert.match(r.scope,/不提供/);
});
test("ELIZA-style study intents use bounded, ordered rules",()=>{
 assert.deepEqual(coach.detectIntent("搭配: benefit"),{type:"collocation",query:"benefit"});
 assert.deepEqual(coach.detectIntent("文法 climate"),{type:"grammar",query:"climate"});
 assert.deepEqual(coach.detectIntent("查字 energy"),{type:"example",query:"energy"});
});
test("example retrieval rewards topic overlap and never generates substitute claims",()=>{
 const a={word:"panel",text:"Solar panels supply renewable energy.",topic:"energy"};
 const b={word:"school",text:"Students visit the school library."};
 assert.equal(coach.rankExamples("renewable energy",[b,a])[0].text,a.text);
 const c={word:'zebra',text:'We discuss the climate.',topic:'氣候'},d={word:'apple',text:'We read books.',topic:'閱讀'};
 assert.equal(coach.rankExamples('氣候',[d,c])[0].word,'zebra');
 assert.equal(coach.rankExamples('沒有命中',[c,d])[0].word,'zebra');
});
