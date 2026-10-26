# 學測英文：原創三句、五欄筆記與完整詞條

本版直接修改 `jasoart/E` 的 `restore-old-site` 分支網站，以根目錄 `index.html` 為入口。搜尋、例句、中文說明、搭配、遮字練習與作文分析都在瀏覽器內運算，不需要語言模型、API Key 或外部句庫。原有 6,012 個詞條 ID、六級詞表、收藏與複習紀錄保留。

## 111–115 閱讀詞彙擴充

新增「閱讀詞彙」專區：970 個既有詞條的閱讀出處、80 個原詞表外的題材補充詞，以及 137 筆閱讀語境義與 144 組學習搭配。依五份試卷的 25 個正文單位核對，可按年度、主題、題型與複習順序篩選，並匯出目前詞單 CSV。`current` 電流、`plant` 工廠、`file` 提出申請等用法有各自核對的題組範圍。

新補充詞有獨立詞性、中文義及頁碼，不冒稱官方級別或 V2 三句教材；全站搜尋可直接找到閱讀補充詞入口。這些是實際正文詞形及複習重點，不保證未來出題。選詞方法、來源與維護見 [閱讀詞彙說明](docs/READING_VOCABULARY.md)。

## 演算法、底層與閱讀體驗升級（2026-10-26）

- 搜尋加入不漏有效拼字候選的 bigram／字長索引、穩定 Top-350 選取及稀疏分數緩衝；保留原搜尋評分、命中理由與個人偏好。快取改為 24 筆 LRU，偏好更新只失效相關查詢。
- 作文重點詞採 PositionRank 的位置偏置；例句與原文摘要採 MMR 兼顧相關性和內容差異。實際採用範圍、作者與論文見 [研究依據](docs/ALGORITHM_UPGRADE_2026.md)，不是完整論文模型重現或學習成效保證。
- 儲存讀取檢查練習統計、搜尋偏好和複習日期；容忍損壞資料與停用儲存，啟動時不重寫既有收藏或進度。
- 調整繁中／英文／音標字體、正文大小與行距，支援手機及放大閱讀；單字卡和列表加入可取消的短轉場，支援「減少動態效果」。不新增字型 CDN 或動畫套件。

效能數據與取捨見 [搜尋效能報告](docs/SEARCH_PERFORMANCE.md)，整體檢查見 [本次驗證紀錄](docs/UPGRADE_VALIDATION_20261026.md)。

## 教材與學習功能

- 「單字筆記 V2.0」覆蓋原有 6,012 詞與 12 個補充詞。每詞套用三個實際含目標詞形的原創情境句，各附繁中翻譯、句構說明和仿寫方向；原上傳教材句保留在備查區。58 組功能詞另附文法句型。教材設計、獨立句數與詞條覆蓋見 [全詞表 V2 說明](docs/NOTEBOOK_ALL_WORDS.md)及[原創句庫](docs/ORIGINAL_SCENARIOS.md)。
- 「詞性與多重字義」直接顯示原詞表的完整釋意、原教材簡要說明與存在的上傳教材釋意，再列出分詞性的新編情境補充。原字串不刪改、不藏在展開區；例如 `challenge` 的「盤問、要求、懷疑、表示異議」也完整保留。原例句可展開備查。
- `elbow` 的動詞用法、`responsive to`、`tight schedule`、`exacerbate`／`add fuel to the fire` 與寵物作文語境分別整理。原 6,012 詞條以外的新增詞清楚標為「補充詞彙」。
- 五份上傳試卷新增 127 條逐頁核對短引文，區分本文、題幹與選項；六個 115 年重點實例另附核對紀錄。細節見 [115 五欄筆記來源](docs/GSAT_115_NOTEBOOK_SOURCES.md)。
- KK 顯示使用 CMUdict 美式音段轉寫，明示來源與重音位置推估，保留原 ECDICT 音標；方法與授權見 [KK 音標說明](docs/KK_NOTATION.md)。

- 每個詞條有三組 15–30 英文詞的原創情境句與繁中翻譯，可直接閱讀、朗讀、遮字作答與訂正。題材包含校園、公共生活、科學、環境與媒體；句中的因果、對比和線索供詞義辨識與仿寫練習。
- 原中文釋意完整保留，另外提供易懂說明、上傳 Anki 的短釋意與用法提醒；不以單一短義取代所有原義。
- 新編教材涵蓋說理、證據、比較、讓步、條件、方案與反思，以及數位素養、氣候、公共健康和社群等當代情境。新句與原有 Anki 教材分別標示，不宣稱為真題或已發生的新聞。
- 全部 6,024 詞另有常用義、詞性與學習提示；有可核對資料時展示 WordNet 英語詞義、明示派生字族、近義候選和雙語搭配。動詞三態、第三人稱單數、V-ing、名詞複數及比較級分欄列出。原有雙語搭配與 111–115 年來源卡保留。
- 學習助手以規則辨識查詢意圖，從內建教材找例句與搭配；位置偏置圖排序抽取關鍵詞，TextRank 加 MMR 選取原文重點句，另提示常見用法並提供修訂問題。它沒有通用聊天、文章事實查核或學測作文評分功能。
- 遮字作答提供即時訂正，錯誤紀錄與收藏分開；另有「先回想，再看筆記」，以中文提示練完整英文搭配、訂正後再回想，完成時可安排下次複習。原有今日複習與情境診斷繼續使用；流程與驗證見 [搭配回想說明](docs/RETRIEVAL_PRACTICE.md)。
- 本機搜尋使用 BM25 倒排清單、有限距離的拼字近似與分段索引預熱；保留原本字面、中文及搭配查詢。技術、學習研究及採用範圍見 [2026 研究與實作](docs/TECHNOLOGY_RESEARCH_2026.md)。

完整教材來源、資料重建與覆蓋統計見 [Anki 匯入說明](docs/ANKI_IMPORT.md)。研究依據及方法實際採用範圍見 [本機學習研究](docs/LOCAL_LEARNING_RESEARCH.md)；五年試卷及官方規範見 [111–115 再研究](docs/GSAT_111_115_RESEARCH.md)。例句訓練要看字義、自然搭配和資訊關係，不只堆疊難字或高階句型；尚未以學生實驗證明作文提分。

本次新增 60 個重點詞，另補 `challenge` 等多義詞的用法及搭配；教材改寫、查核範圍與新增統計見 [教材審核與擴充](docs/CONTENT_AUDIT_2026.md)。搜尋前後測量與索引容量取捨見 [搜尋效能報告](docs/SEARCH_PERFORMANCE.md)。

## 單字與例句朗讀

不需要 API 金鑰，也不下載文字或語音模型。點按單字發音時，美式先試 Google 靜態字典音檔，再試 Google 語音音檔；英式、片語及例句使用 Google 語音音檔。可選口音和語速。長句按字詞邊界分段；切換單字或停止會取消舊播放。音檔無法取得時明確顯示錯誤供再次點按。

播放器顯示實際 Google 音檔連結，不推定其開放授權。另提供 Cambridge、Merriam-Webster 詞條連結供人工核對。來源、錯誤處理與驗證範圍見 [發音說明](docs/PRONUNCIATION_SOURCES.md)。舊 Kokoro 實作保留作歷史紀錄，現行頁面不載入。

## 啟動與部署

網站是靜態 HTML／JavaScript，不需安裝套件或建置。部署根目錄 `index.html`、`assets/`、圖示與 manifest；`index .html` 為相容入口，內容相同。請使用 HTTPS 或 localhost，讓瀏覽器儲存、複製與發音權限正常運作。

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

部署至 GitHub Pages 時，選擇本分支的 `/ (root)`。保留同一網站網址可繼續讀取瀏覽器的收藏；搬站前可使用網站的匯出／匯入收藏功能。收藏 key 維持 `gsat-standalone-favorites-v1`，原複習 key 維持 `gsat-v3-review-queue-v1`；新增作答紀錄使用獨立 key。沒有清除或覆寫舊收藏的啟動流程。

## 驗證與歷史工作

```sh
node --test tests/*.cjs
python3 -m unittest discover -s tests -p 'test_*.py' -q
python3 research/build_exam_notebook.py --check
node research/build_authored_scenarios.cjs --check
node research/audit_scenario_difficulty.cjs --check
node research/build_vocabulary_enrichment.cjs --check
python3 research/build_exam_evidence_index.py --check
python3 research/build_wordnet_learning.py --check
python3 tools/validate_site.py
python3 tests/browser_builtin.py
python3 tests/browser_notebook.py
python3 tests/browser_learning.py
```

筆記的可編輯原始資料為 `research/exam_notebook.json` 與 `research/function_word_notes.json`；修改後執行 `python3 research/build_exam_notebook.py` 重建 `assets/data/exam-notebook.js`。例句練習以來源及句子內容辨識，替換句子不會承接舊句子的作答統計；舊收藏、複習與原作答紀錄不被清除。修改素材後執行 `python3 tools/validate_site.py --refresh-hashes` 更新兩個 HTML 的素材版本。完整步驟見 [CONTRIBUTING.md](CONTRIBUTING.md)。

原創句庫以每詞三句為完成條件，涵蓋原詞表與補充詞共 6,024 個 ID。完整詞形比對、生成時的缺口清單與獨立句數見 `research/authored_scenario_coverage.json`；同一原創句可教多個實際出現的目標詞，獨立句數與詞條顯示次數分開計算。

新增句子的可編輯來源為 `research/authored_scenarios.txt` 與 `research/scenario-batch-*.txt`。執行 `node research/build_authored_scenarios.cjs` 產生原創句庫與缺口清單；只有找到三個不同、各含本詞實際詞形的 15–30 詞原創語境才切換主要練習，原句保留在備查區。

全詞表的常用義、詞性、雙語搭配及有依據的 WordNet 英語字義、近義候選與明示派生關係由 `research/build_vocabulary_enrichment.cjs` 生成；來源為原雙語教材、專題筆記及 `research/vocabulary-editorial.json`。原詞表釋義、級別與上傳教材的來源標記保持獨立；完整設計見 [V2 全詞表教材設計](docs/NOTEBOOK_ALL_WORDS.md)。

GitHub Actions 分開驗證資料／程式與桌面／手機 Chromium；採唯讀權限、完整 SHA 固定 Actions 版本與固定 Playwright，並提供 Dependabot 更新。流程不會自動部署或改動 Pages 設定。資料與模組界線、儲存相容及效能取捨見 [網站架構](docs/ARCHITECTURE.md)。

瀏覽器測試使用桌面及手機尺寸的 Chromium，另檢查資料全覆蓋、完整原釋意可見、原詞條與收藏相容、同站素材、年度篩選、搭配回想及沒有自動外站請求。它不能代替 iPhone 實機及真人發音聽辨。本次結果見 [正式版驗證](docs/RELEASE_2026-10-25.md)；先前版本的結果保留於 [五欄筆記驗證](docs/NOTEBOOK_V2_VALIDATION.md) 與 [內建教材驗證](docs/BUILTIN_VALIDATION.md)。

先前的 Danube／Colab 微調研究保留於 `colab/` 供研究紀錄；根目錄網站已撤下 MiniLM 語意模型及 Danube 生成介面。舊模型研究文件不代表目前網站仍載入那些模型。原站重複目錄 `gsat-lexicon-v6-github/` 的舊入口已導向根目錄，部署請使用根目錄。
