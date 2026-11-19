"use strict";
// Self-authored situational questions. Not excerpts, official items, or official answer keys.
const GSAT_DIAG_KEY="gsat-v6-context-mistakes-v1";
const GSAT_DIAG_QUESTIONS=[
["搭配與語境","The city introduced new rules to _____ air pollution near schools.","市府推出新規定，目的在降低學校附近的空氣污染。",["reduce","reduce to","increase to","depend"],0,"reduce + pollution 直接接名詞；不必加 to。引入規定與污染的語意關係是減少。"],
["搭配與語境","Many families now rely _____ public transportation for work.","許多家庭仰賴公共運輸通勤。",["in","to","on","at"],2,"rely on 為固定搭配，on 後接依賴的對象。"],
["搭配與語境","The findings may lead _____ further research into this disease.","研究發現可能促成後續研究。",["at","to","from","with"],1,"lead to + N／V-ing 表『導致、促成』；to 是介系詞。"],
["搭配與語境","The project aims to raise awareness _____ food waste.","該計畫旨在提高對食物浪費的認識。",["on","for","of","to"],2,"raise awareness of + N；注意不是 raise an awareness to。"],
["搭配與語境","Students should base their conclusions _____ reliable evidence.","學生應以可靠證據作為結論的基礎。",["from","on","for","at"],1,"base A on B：以 B 作為 A 的基礎。"],
["搭配與語境","The report draws attention _____ the lack of clean water.","這份報告使人注意到潔淨飲水不足。",["to","for","of","in"],0,"draw attention to + N；to 連接被注意的對象。"],
["搭配與語境","The team collected data _____ hundreds of volunteers.","研究團隊從數百名志工蒐集資料。",["in","with","from","over"],2,"collect data from + 來源；with 指工具或伴隨，不表示資料來源。"],
["搭配與語境","The policy has had a positive impact _____ local communities.","政策對在地社區產生正面影響。",["with","on","for","at"],1,"have an impact on + 受影響對象。"],
["搭配與語境","Many people are concerned _____ the safety of their personal data.","許多人擔心個資安全。",["for","at","about","from"],2,"be concerned about + 令人擔心的事情。"],
["搭配與語境","The two methods differ _____ the amount of time they require.","兩種方法在所需時間方面有所不同。",["in","with","of","on"],0,"differ in + 差異面向；differ from + 比較對象。"],
["篇章轉承","The device is inexpensive. _____, it uses very little electricity.","前句說價格低，後句補充耗電少。",["However","In addition","Instead","Nevertheless"],1,"後句提供另一項優點，屬遞進補充；In addition 合理，However 是轉折。"],
["篇章轉承","The experiment was carefully designed. _____, the sample size was too small to draw firm conclusions.","設計周詳，但樣本過小。",["Therefore","Similarly","However","For example"],2,"前後方向相反：設計周詳卻仍有限制，用 However。"],
["篇章轉承","Several roads were flooded overnight. _____, the morning bus service was delayed.","夜間道路淹水，造成早班公車延誤。",["As a result","By contrast","For instance","Meanwhile"],0,"前因後果，用 As a result；不要誤判為同時發生。"],
["篇章轉承","Some birds migrate thousands of kilometers. _____, the Arctic tern travels between the Arctic and Antarctica.","後句舉出鳥類長距離遷徙的具體例子。",["Otherwise","For example","In contrast","As a result"],1,"從一般敘述到一個具體物種，用 For example。"],
["篇章轉承","Many residents support the plan. _____, others are concerned about its cost.","前後分別是支持者與憂慮者。",["In other words","Likewise","On the other hand","Consequently"],2,"引介另一群人的相異觀點，用 On the other hand。"],
["篇章轉承","The results are preliminary. _____, further testing is necessary.","結果只是初步的，所以需要進一步測試。",["Therefore","Nevertheless","In contrast","For example"],0,"結果尚未確定是原因，需要測試是推論出的後果。"],
["篇章轉承","The app is easy to use. _____, its privacy settings are difficult to find.","容易操作，隱私設定卻難找。",["In addition","However","For this reason","Similarly"],1,"容易使用與設定難找構成反差，選 However。"],
["篇章轉承","The study included adults from five cities. _____, it did not include participants living in rural areas.","都市樣本有涵蓋，但鄉村樣本未涵蓋。",["In fact","Moreover","However","That is"],2,"後句指出研究取樣的限制，應使用轉折。"],
["指代與連貫","Mina borrowed a book from Aya. She returned it the next day. What does “it” most directly refer to?","判斷 it 指向哪個先前提到的名詞。",["Mina","Aya","the book","the next day"],2,"it 作 returned 的受詞，對應可歸還的事物 the book，而不是人或時間。"],
["指代與連貫","The museum reduced its ticket price. This change attracted more visitors. What is “This change”?","This change 回指前一句的哪一項改變？",["the museum building","the lower ticket price","more visitors","the old ticket"],1,"This change 是前句整個『降低票價』的事件，而非僅指博物館。"],
["指代與連貫","A storm damaged the bridge. As a result, it remained closed for a week. What remained closed?","it 的指稱須符合 closed 的語意。",["the storm","the bridge","the week","the result"],1,"bridge 才能因受損而關閉；要同時檢查語法位置與情境。"],
["指代與連貫","Some students chose printed textbooks; others preferred digital ones. What does “ones” replace?","ones 代替前句的複數名詞。",["students","preferences","textbooks","printed pages"],2,"ones 對應 textbooks；digital 修飾被省略的同一類名詞。"],
["指代與連貫","The researchers found an unusual pattern. They then tested it with new data. What does “it” refer to?","研究者用新資料驗證的對象是什麼？",["the researchers","the unusual pattern","the new data","the test"],1,"it 回指前句受詞 an unusual pattern；new data 是驗證工具。"],
["指代與連貫","The city planted trees along the road. These trees now provide shade. What are “These trees”?","these + 名詞通常就近承接已提及的實體。",["existing buildings","trees planted along the road","all forests","road signs"],1,"these trees 是先前種植的路樹；留意名詞重複帶來的篇章連貫。"],
["研究判讀","Researchers observed a link between screen time and sleep quality. Which statement is most accurate?","觀察到相關性，能直接證明因果嗎？",["Screen time was proven to cause poor sleep.","The two variables were associated in the study.","Every participant slept poorly.","The study had no limitations."],1,"observed a link 表相關，不足以單獨證明因果；留意研究設計和措辭強度。"],
["研究判讀","The survey included only university students. Which conclusion stays within its evidence?","樣本只包含大學生，結論不能直接擴大至所有年齡層。",["All people share the same view.","The findings describe the surveyed university students.","The results prove the policy is effective.","The sample represents every citizen."],1,"推論範圍應與受訪群體一致，不可無根據地外推到所有人。"],
["研究判讀","The experiment was repeated and produced similar results. What does this most directly strengthen?","多次實驗得到相近結果，增加哪方面的信心？",["The price of equipment","The reproducibility of the result","The number of possible explanations","The age of the researcher"],1,"重複試驗得到相近結果有助於支持可重現性，但不會自動證明所有因果解釋。"],
["研究判讀","A graph shows that energy use fell from January to March. Which sentence matches the graph description?","選擇與所給趨勢相符的敘述。",["Energy use increased steadily.","Energy use remained unchanged.","Energy use declined over the period.","Energy use doubled each month."],2,"fell 對應 declined，不能把下降寫成增加或不變。"],
["研究判讀","The report states that 60% of respondents preferred buses. Which paraphrase is accurate?","百分比主詞是受訪者，不是全體人口。",["All residents preferred buses.","A majority of surveyed respondents preferred buses.","Exactly 60% of all citizens preferred buses.","No respondents preferred trains."],1,"60% 只描述 respondents；多數不等於所有，受訪者不等於全體公民。"],
["寫作與語意","Choose the sentence with a clear cause-and-effect relationship.","選出清楚表達因果、語法也正確的句子。",["Because it rained, so the event was canceled.","Because of it rained, the event was canceled.","The event was canceled because it rained.","Despite it rained, the event was canceled."],2,"because 接完整子句；because of、despite 後接名詞／動名詞，且 because 不應和 so 重複連用。"],
["寫作與語意","Choose the most suitable opening for a paragraph comparing two learning methods.","題旨是比較兩種學習方法。",["This paragraph will compare online and classroom learning.","Learning exists.","Online learning is always better for everyone.","I have nothing more to say about learning."],0,"開頭直接說明比較主題；絕對化斷言未提供證據，也不利於客觀比較。"],
["寫作與語意","Which sentence correctly introduces an example after a general claim?","前句已有一般性主張，後句要提出例證。",["However, for example, therefore.","For example, some schools have installed solar panels.","As a result, there are many opinions.","By contrast, a good example exists."],1,"For example 後須接具體可辨認的例子，不能只堆疊轉承語。"],
["寫作與語意","Complete the sentence: Students can improve their writing by _____ regularly.","by 在此表示方法，後接動名詞。",["practice","to practice","practicing","practiced"],2,"by + V-ing 表手段或方式；本句不是不定詞 to V。"],
["寫作與語意","Complete the sentence: The report suggests that the city _____ more trees.","suggest that 後接建議事項；選最合適的動詞形式。",["plants","plant","planting","to plant"],1,"表建議的 suggest that + 主詞 + (should) 原形動詞；美式正式用法常省 should。"],
["寫作與語意","Choose a suitable concluding sentence for a paragraph about reducing food waste.","結尾應呼應段落主題與具體行動。",["Food is a very broad word.","In conclusion, planning meals can help families waste less food.","Therefore, every study is wrong.","On the other hand, trees are tall."],1,"總結句應回扣核心主題，並與前文的減少食物浪費措施連貫。"]
].map((row,index)=>({id:'ctx-'+String(index+1).padStart(3,'0'),category:row[0],prompt:row[1],zh:row[2],options:row[3],answer:row[4],explanation:row[5]}));
function loadDiagnosticMistakes(){try{const value=JSON.parse(localStorage.getItem(GSAT_DIAG_KEY)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return{}}}
const gsatMistakes=loadDiagnosticMistakes();
let gsatDiagnosticSession=[],gsatDiagnosticPos=0,gsatDiagnosticReview=false;
function diagnosticWrongCount(){return Object.keys(gsatMistakes).filter(k=>GSAT_DIAG_QUESTIONS.some(q=>q.id===k)).length;}
function diagnosticInfo(){const n=byId('diagnosticWrongCount');if(n)n.textContent=String(diagnosticWrongCount());}
function saveDiagnosticMistake(id,correct){if(correct)delete gsatMistakes[id];else gsatMistakes[id]={wrongAt:new Date().toISOString(),times:Number(gsatMistakes[id]?.times||0)+1};try{localStorage.setItem(GSAT_DIAG_KEY,JSON.stringify(gsatMistakes))}catch{}diagnosticInfo()}
function showDiagnosticQuestion(){
 const host=byId('diagnosticContent');if(!host)return;
 if(gsatDiagnosticPos>=gsatDiagnosticSession.length){host.innerHTML='<p class="practice-feedback">本輪完成。可以選擇重新診斷，或只複習尚未答對的錯題。</p>';return;}
 const q=gsatDiagnosticSession[gsatDiagnosticPos],order=shuffled(q.options.map((_,i)=>i));
 host.innerHTML=`<div class="diagnostic-progress">${gsatDiagnosticReview?'錯題複習':'情境診斷'} · 第 ${gsatDiagnosticPos+1}／${gsatDiagnosticSession.length} 題 · ${escapeHtml(q.category)} · 全部為本站自編</div><p class="diagnostic-prompt" lang="en">${escapeHtml(q.prompt)}</p><p class="practice-meaning">${escapeHtml(q.zh)}</p><div class="diagnostic-options">${order.map(i=>`<button type="button" class="practice-option" data-option="${i}">${escapeHtml(q.options[i])}</button>`).join('')}</div><p class="diagnostic-explain" aria-live="polite">先看前後文，再選一個答案。</p>`;
 host.querySelector('.diagnostic-options').addEventListener('click',event=>{
  const button=event.target.closest('[data-option]');if(!button||host.dataset.answered==='true')return;host.dataset.answered='true';
  const correct=Number(button.dataset.option)===q.answer;saveDiagnosticMistake(q.id,correct);
  host.querySelectorAll('[data-option]').forEach(el=>{el.disabled=true;el.classList.toggle('correct',Number(el.dataset.option)===q.answer);if(el===button&&!correct)el.classList.add('wrong')});
  host.querySelector('.diagnostic-explain').textContent=(correct?'答對：':'本題需複習：')+q.explanation;
  const next=document.createElement('button');next.type='button';next.className='practice-next';next.textContent=gsatDiagnosticPos+1<gsatDiagnosticSession.length?'下一題 →':'查看本輪結果 →';next.addEventListener('click',()=>{gsatDiagnosticPos++;host.dataset.answered='';showDiagnosticQuestion()});host.appendChild(next);
 });
}
function startDiagnostic(review=false){gsatDiagnosticReview=review;gsatDiagnosticSession=review?GSAT_DIAG_QUESTIONS.filter(q=>gsatMistakes[q.id]):shuffled(GSAT_DIAG_QUESTIONS);gsatDiagnosticPos=0;const host=byId('diagnosticContent');host.hidden=false;host.dataset.answered='';if(review&&!gsatDiagnosticSession.length){host.innerHTML='<p class="practice-feedback">目前沒有待複習的診斷錯題。答錯的題目會自動加入；答對後才移出。</p>';return;}showDiagnosticQuestion()}
function setupDiagnostics(){const first=byId('diagnosticStart'),wrong=byId('diagnosticReview');if(!first||!wrong)return;first.addEventListener('click',()=>startDiagnostic(false));wrong.addEventListener('click',()=>startDiagnostic(true));diagnosticInfo()}
