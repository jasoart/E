# 學測英文字典 V6｜可直接上傳 GitHub Pages 的完整網站

這是從上傳的 `gsat-lexicon-v5.zip` 改良的**完整覆蓋包**，不是增量 patch。將壓縮檔內 `index.html`、`assets/`、`favicon.ico`、`manifest.webmanifest` 以及文件一併上傳原儲存庫的公開根目錄；GitHub Pages 若採 `main / (root)`，首頁使用 `index.html`。原始相容入口 `index .html` 也保留，兩者內容相同。不要只上傳 HTML 或多放一層資料夾；不需 npm、Node、資料庫或建置流程。

## 功能與實際數量

- 完整保留 **6,012 個原詞條**和原站各字資料；不改詞條字串 ID。
- **2,500 條雙語搭配條目**，分屬 1,061 組；包含原有 1,295 條與新增 1,205 條自編內容。舊條目本來有部分相同英文字串，若只算不同英文字形，共 2,476 種，不應把條目數當作完全不同的片語數。
- 原有 **111–115 年試卷出處**：611 條句型、636 筆來源紀錄，保留原包中的年度、本文／題幹／選項、印刷頁碼、PDF 頁碼。這次只將 636 筆原文摘錄搬到獨立 `assets/data/reference-details.json`，引用卡片展開時才透過 `fetch` 載入（展開一次後共用緩存）。**本次沒有取得原始五份 PDF 重做逐頁比對，這些核對紀錄沿用上傳的 V5.1 包。**
- **102–110 年**：提供大考中心公開歷屆試題的下載索引和舊制題型導覽。**本次上傳的 ZIP 只有網站，沒有九份 PDF；也未能取得九份完整 PDF 做逐頁核對，因此尚未將 102–110 年新句型列成「已核對真題」或納入年度逐句篩選。**請勿將此索引誤認為九年考題已完整匯入。詳見 `SOURCE_GUIDE.md`。
- 中文語意／用法提醒、新增主題環境（保育與污染）、科技（產品、資料安全）、研究（資料、方法）、社會（公共服務）及寫作（觀點、解法）。新作內容有「自編」標記，絕不宣稱是官方歷年原題。
- 35 題**本站自編**情境診斷，涵蓋固定搭配、語意轉承、指代、研究判讀及寫作。答錯加入獨立錯題集合，重做答對後從錯題集合移出。既有 129 種介系詞練習仍然保留。
- 保留原混合搜尋、年度篩選（**111–115 年已核對來源**）、詞彙級別、線上發音／例句、AI 可選模型、收藏匯入／匯出及原有單字複習功能；自編延伸可由一般搜尋與搭配分類查到。

## 收藏相容性

**收藏 key 永不變動：`gsat-standalone-favorites-v1`**，資料格式仍是字串陣列。舊進度 key `gsat-v3-review-queue-v1`、介系詞練習 `gsat-v2-collocation-practice-v1`、搜尋偏好及最近搜尋仍相同。新錯題才單獨使用 `gsat-v6-context-mistakes-v1`。因擴充資料，衍生的 AI 搜尋索引 key 更新為 `gsat-v6-minilm-l12-6012-patterns-2500-v1`，需在使用者下次啟用 AI 時重建，但不清除收藏。

同一 GitHub Pages 網址（同 protocol、hostname、port）與同一瀏覽器設定檔，覆蓋檔案**不會刪除既有 localStorage**。若搬站到新網域、從 `http` 換到 `https`、更換瀏覽器或使用 `file://`，收藏不一定會自動出現；先從舊站使用「匯出收藏」，再至新站「匯入收藏」。GitHub 儲存庫裡不會含任何訪客收藏或個人進度。不要清除網站資料來解決快取問題；若舊版殘留請強制重新載入。

## 部署與測試

1. 建議在 GitHub 先備份原分支；把本包內容解壓並覆蓋到原公開根目錄；確認 `index.html`、`assets/data/collocations.js`、`assets/data/reference-details.json`、`assets/js/diagnostics.js` 均在正確路徑。
2. GitHub → Settings → Pages，選擇對應 branch 與公開目錄（若原本已設定，不必變更）。正常情況首頁網址不會變。
3. 同一瀏覽器開舊站先匯出收藏作備份，更新後檢查收藏標籤；搜尋 `carbon emissions`、`research data`、`quality education`；在來源卡片按「展開並載入原文」；測試「情境診斷」並故意答錯、再以「只練錯題」重答。
4. 本包保留 `tests/regression.cjs`；安裝 Node 20+ 後執行 `node --test tests/regression.cjs`，不需額外 npm 套件。測試涵蓋詞表完整性、句型數、來源延遲檔一致性、搜尋、舊收藏與新錯題分離等。

**驗證範圍：** 33 項 Node 程式回歸測試通過。此環境的 Chromium 對所有 URL（含 `data:`、`file:`、`localhost`）均回報 `ERR_BLOCKED_BY_ADMINISTRATOR`，故沒有宣稱桌機／手機實機介面操作已通過；網站部署後請依上項逐項測試。第三方 API 與可選 AI 模型仍需使用者網路，無網路也能查本機詞表、搭配與自編診斷；原文檔在初次展開時須能透過站點取用。

更多來源、短摘錄與法律使用邊界請見 `SOURCE_GUIDE.md`；實測紀錄見 `TEST_REPORT.md`。
