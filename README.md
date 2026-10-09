# 學測英文：五欄實戰筆記與內建雙語教材

本版直接修改 `jasoart/E` 的 `restore-old-site` 分支網站，以根目錄 `index.html` 為入口。搜尋、例句、中文說明、搭配、遮字練習與作文分析都在瀏覽器內運算，不需要語言模型、API Key 或外部句庫。原有 6,012 個詞條 ID、六級詞表、收藏與複習紀錄保留。

## 教材與學習功能

- 「單字筆記 V2.0」覆蓋原有 6,012 詞與 12 個補充詞。399 組專題新編筆記對應 402 個詞條，另有 5,622 詞使用既有教材情境導讀；所有詞都可做搭配、句型或例句回想。58 組功能詞另附文法句型，代名詞形式與派生字族分開整理。新編與原卡逐句標示來源，教材設計與覆蓋統計見 [全詞表 V2 說明](docs/NOTEBOOK_ALL_WORDS.md)。
- 「詞性與多重字義」直接顯示原詞表的完整釋意、原教材簡要說明與存在的上傳教材釋意，再列出分詞性的新編情境補充。原字串不刪改、不藏在展開區；例如 `challenge` 的「盤問、要求、懷疑、表示異議」也完整保留。原例句可展開備查。
- `elbow` 的動詞用法、`responsive to`、`tight schedule`、`exacerbate`／`add fuel to the fire` 與寵物作文語境分別整理。原 6,012 詞條以外的新增詞清楚標為「補充詞彙」。
- 五份上傳試卷新增 127 條逐頁核對短引文，區分本文、題幹與選項；六個 115 年重點實例另附核對紀錄。細節見 [115 五欄筆記來源](docs/GSAT_115_NOTEBOOK_SOURCES.md)。
- KK 顯示使用 CMUdict 美式音段轉寫，明示來源與重音位置推估，保留原 ECDICT 音標；方法與授權見 [KK 音標說明](docs/KK_NOTATION.md)。

- 每個詞條至少兩組內建英文例句與繁中翻譯，可直接閱讀、朗讀、遮字作答與訂正。
- 原中文釋意完整保留，另外提供易懂說明、上傳 Anki 的短釋意與用法提醒；不以單一短義取代所有原義。
- 新編教材涵蓋說理、證據、比較、讓步、條件、方案與反思，以及數位素養、氣候、公共健康和社群等當代情境。新句與原有 Anki 教材分別標示，不宣稱為真題或已發生的新聞。
- 原有雙語搭配與 111–115 年來源卡保留，另補詞性、介系詞、可數性與作文用法。新搭配可透過原有搜尋找到。
- 學習助手以規則辨識查詢意圖，從內建教材找例句與搭配；TextRank 抽取學生短文的關鍵詞與原文重點句，另提示常見用法並提供修訂問題。它沒有通用聊天、文章事實查核或學測作文評分功能。
- 遮字作答提供即時訂正，錯誤紀錄與收藏分開；另有「先回想，再看筆記」，以中文提示練完整英文搭配、訂正後再回想，完成時可安排下次複習。原有今日複習與情境診斷繼續使用；流程與驗證見 [搭配回想說明](docs/RETRIEVAL_PRACTICE.md)。
- 本機搜尋使用 BM25 倒排清單、有限距離的拼字近似與分段索引預熱；保留原本字面、中文及搭配查詢。技術、學習研究及採用範圍見 [2026 研究與實作](docs/TECHNOLOGY_RESEARCH_2026.md)。

完整教材來源、資料重建與覆蓋統計見 [Anki 匯入說明](docs/ANKI_IMPORT.md)。研究依據及方法實際採用範圍見 [本機學習研究](docs/LOCAL_LEARNING_RESEARCH.md)；五年試卷及官方規範見 [111–115 再研究](docs/GSAT_111_115_RESEARCH.md)。例句訓練要看字義、自然搭配和資訊關係，不只堆疊難字或高階句型；尚未以學生實驗證明作文提分。

本次新增 60 個重點詞，另補 `challenge` 等多義詞的用法及搭配；教材改寫、查核範圍與新增統計見 [教材審核與擴充](docs/CONTENT_AUDIT_2026.md)。搜尋前後測量與索引容量取捨見 [搜尋效能報告](docs/SEARCH_PERFORMANCE.md)。

## 單字與例句朗讀

不需要 API 金鑰，也不下載文字或語音模型。單字點按發音後，依偏好從 Free Dictionary API 或 Wikimedia Commons 取得公開錄音；可選擇自動依序備援、指定來源或只用裝置語音，以及美式／英式口音。缺少錄音、逾時或離線時使用裝置本機英文聲線。例句一律使用本機聲線，切換單字及停止會取消舊播放。

錄音的實際來源與授權隨播放顯示。另提供 Cambridge、Merriam-Webster 詞條連結供人工核對，不冒稱公開社群錄音是這些出版社的官方發音。來源、錯誤備援與驗證範圍見 [發音說明](docs/PRONUNCIATION_SOURCES.md)。舊 Kokoro 實作保留作歷史紀錄，現行頁面不載入。

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
python3 research/build_exam_evidence_index.py --check
python3 research/build_wordnet_learning.py --check
python3 tools/validate_site.py
python3 tests/browser_builtin.py
python3 tests/browser_notebook.py
python3 tests/browser_learning.py
```

筆記的可編輯原始資料為 `research/exam_notebook.json` 與 `research/function_word_notes.json`；修改後執行 `python3 research/build_exam_notebook.py` 重建 `assets/data/exam-notebook.js`。例句練習以來源及句子內容辨識，替換句子不會承接舊句子的作答統計；舊收藏、複習與原作答紀錄不被清除。修改素材後執行 `python3 tools/validate_site.py --refresh-hashes` 更新兩個 HTML 的素材版本。完整步驟見 [CONTRIBUTING.md](CONTRIBUTING.md)。

原創句改寫進度：新增 503 句含繁中翻譯、句構說明、仿寫方向的情境句；連同既有專題教材，2,171 / 6,024 個詞條已套用原創雙句，其中 A 開頭詞條全部補齊。尚有 3,853 個詞條使用既有教材導讀，首頁與篩選器如實標示。這不是全詞表改寫完成的宣告。同一原創句可用於多個實際出現的目標詞，獨立句數與詞條顯示次數分開計算。

新增句子的可編輯來源為 `research/authored_scenarios.txt`。執行 `node research/build_authored_scenarios.cjs` 產生原創句庫與 `research/authored_scenario_coverage.json`；只有找到兩個不同、包含本詞實際詞形的原創語境才切換主要練習，原句保留在備查區。

全詞表英語字義、同義候選與明示派生關係的離線節錄見 [V2 全詞表教材設計](docs/NOTEBOOK_ALL_WORDS.md)。字典內容在學生展開時才載入，原詞表釋義、級別與上傳教材的來源標記保持獨立。

GitHub Actions 分開驗證資料／程式與桌面／手機 Chromium；採唯讀權限、完整 SHA 固定 Actions 版本與固定 Playwright，並提供 Dependabot 更新。流程不會自動部署或改動 Pages 設定。資料與模組界線、儲存相容及效能取捨見 [網站架構](docs/ARCHITECTURE.md)。

瀏覽器測試使用桌面及手機尺寸的 Chromium，另檢查資料全覆蓋、完整原釋意可見、原詞條與收藏相容、同站素材、年度篩選、搭配回想及沒有自動外站請求。它不能代替 iPhone 實機及真人發音聽辨。本次結果見 [升級驗證](docs/UPGRADE_VALIDATION_2026.md)；先前版本的結果保留於 [五欄筆記驗證](docs/NOTEBOOK_V2_VALIDATION.md) 與 [內建教材驗證](docs/BUILTIN_VALIDATION.md)。

先前的 Danube／Colab 微調研究保留於 `colab/` 供研究紀錄；根目錄網站已撤下 MiniLM 語意模型及 Danube 生成介面。舊模型研究文件不代表目前網站仍載入那些模型。原站重複目錄 `gsat-lexicon-v6-github/` 的舊入口已導向根目錄，部署請使用根目錄。
