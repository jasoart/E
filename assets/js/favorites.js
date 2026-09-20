"use strict";

// Preserve V1's array of exact word strings. Do not renumber words, rename the
// key, clear localStorage, or rewrite favorites during startup.
function toggleFavorite(word) {
  const next = new Set(readFavorites());
  next.has(word) ? next.delete(word) : next.add(word);
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next])); }
  catch { showToast("無法儲存收藏，請先備份或檢查瀏覽器儲存空間"); return; }
  state.favorites = next;
  syncFavoriteButton(); applyFilters(false);
  showToast(next.has(word) ? "已加入收藏" : "已取消收藏");
}
function syncFavoriteButton() {
  const button = byId("favoriteButton"), word = VOCABULARY[state.selectedIndex]?.word;
  if (!button || !word) return;
  const saved = state.favorites.has(word);
  button.classList.toggle("saved", saved); button.setAttribute("aria-pressed", String(saved));
  button.textContent = saved ? "★ 已收藏" : "☆ 收藏";
}
function exportFavorites() {
  const payload = {type:"gsat-favorites-backup",version:1,key:FAVORITES_KEY,exportedAt:new Date().toISOString(),favorites:readFavorites()};
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)], {type:"application/json;charset=utf-8"}));
  const link = document.createElement("a"); link.href=url; link.download=`gsat-favorites-${localDateKey()}.json`;
  document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
async function importFavorites(file) {
  if (!file) return;
  try {
    if (file.size > 2 * 1024 * 1024) throw new Error("檔案太大，請選擇收藏備份 JSON");
    const data=JSON.parse(await file.text());
    const items=Array.isArray(data)?data:data?.type==="gsat-favorites-backup"&&data.key===FAVORITES_KEY?data.favorites:null;
    if (!Array.isArray(items) || !items.every(word=>typeof word==="string" && word.length>0 && word.length<200)) throw new Error("這不是有效的收藏備份");
    const next=new Set([...readFavorites(),...items]);
    // Merge rather than overwrite. Unknown words are kept for compatibility.
    localStorage.setItem(FAVORITES_KEY,JSON.stringify([...next]));
    const added=next.size-state.favorites.size;state.favorites=next;
    syncFavoriteButton();applyFilters(false);showToast(`已合併收藏，新增 ${Math.max(0,added)} 個單字`);
  } catch(error) {showToast(error instanceof SyntaxError?"無法讀取 JSON 備份":error.message||"匯入失敗，原收藏仍保留");}
}
function setupFavoriteBackup() {
  byId("exportFavorites").addEventListener("click",exportFavorites);
  byId("importFavorites").addEventListener("click",()=>byId("favoritesFile").click());
  byId("favoritesFile").addEventListener("change",async event=>{await importFavorites(event.target.files[0]);event.target.value="";});
  window.addEventListener("storage",event=>{
    if(event.key!==FAVORITES_KEY && event.key!==REVIEW_KEY)return;
    state.favorites=new Set(readFavorites());state.review=readReviewQueue();syncFavoriteButton();updateReviewCount();applyFilters(false);
  });
}
