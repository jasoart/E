"use strict";
// Self-authored situational questions. Not excerpts, official items, or official answer keys.
const GSAT_DIAG_KEY="gsat-v6-context-mistakes-v1";

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
 host.innerHTML=`<div class="diagnostic-progress">${gsatDiagnosticReview?'錯題複習':'情境診斷'} · 第 ${gsatDiagnosticPos+1}／${gsatDiagnosticSession.length} 題 · ${escapeHtml(q.category)} · 全部為本站自編</div><p class="diagnostic-prompt" lang="en">${escapeHtml(q.prompt)}</p><details class="diagnostic-hint"><summary>需要中文提示</summary><p class="practice-meaning">${escapeHtml(q.zh)}</p></details><div class="diagnostic-options">${order.map(i=>`<button type="button" class="practice-option" data-option="${i}">${escapeHtml(q.options[i])}</button>`).join('')}</div><p class="diagnostic-explain" aria-live="polite">先看前後文，再選一個答案。</p>`;
 host.querySelector('.diagnostic-options').addEventListener('click',event=>{
  const button=event.target.closest('[data-option]');if(!button||host.dataset.answered==='true')return;host.dataset.answered='true';
  const correct=Number(button.dataset.option)===q.answer;saveDiagnosticMistake(q.id,correct);
  host.querySelectorAll('[data-option]').forEach(el=>{el.disabled=true;el.classList.toggle('correct',Number(el.dataset.option)===q.answer);if(el===button&&!correct)el.classList.add('wrong')});
  host.querySelector('.diagnostic-explain').textContent=(correct?'答對：':'本題需複習：')+q.explanation;
  const next=document.createElement('button');next.type='button';next.className='practice-next';next.textContent=gsatDiagnosticPos+1<gsatDiagnosticSession.length?'下一題 →':'查看本輪結果 →';next.addEventListener('click',()=>{gsatDiagnosticPos++;host.dataset.answered='';showDiagnosticQuestion()});host.appendChild(next);
 });
}
function diagnosticQuestionPool(review=false){
 const category=byId('diagnosticCategory')?.value||'';
 return GSAT_DIAG_QUESTIONS.filter(q=>(!review||gsatMistakes[q.id])&&(!category||q.category===category));
}
function buildDiagnosticSession(pool,limit){
 // Interleave categories in short sessions; no duplicate questions or rewritten IDs.
 const groups=new Map();
 for(const q of shuffled(pool)){if(!groups.has(q.category))groups.set(q.category,[]);groups.get(q.category).push(q)}
 const queues=shuffled([...groups.values()]),result=[];
 while(result.length<Math.min(limit,pool.length))for(const queue of queues){if(queue.length&&result.length<limit)result.push(queue.pop())}
 return result;
}
function startDiagnostic(review=false){gsatDiagnosticReview=review;gsatDiagnosticSession=buildDiagnosticSession(diagnosticQuestionPool(review),Number(byId("diagnosticLength")?.value)||10);gsatDiagnosticPos=0;const host=byId('diagnosticContent');host.hidden=false;host.dataset.answered='';if(review&&!gsatDiagnosticSession.length){host.innerHTML='<p class="practice-feedback">目前所選範圍沒有待複習的診斷錯題。答錯的題目會自動加入；答對後才移出。</p>';return;}showDiagnosticQuestion()}
function setupDiagnostics(){const first=byId('diagnosticStart'),wrong=byId('diagnosticReview');if(!first||!wrong)return;const category=byId('diagnosticCategory');if(category)category.innerHTML='<option value="">全部能力</option>'+[...new Set(GSAT_DIAG_QUESTIONS.map(q=>q.category))].map(value=>`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');first.addEventListener('click',()=>startDiagnostic(false));wrong.addEventListener('click',()=>startDiagnostic(true));diagnosticInfo()}
