# 學測英文：五欄實戰筆記與內建雙語教材

本版直接修改 `jasoart/E` 的 `restore-old-site` 分支網站，以根目錄 `index.html` 為入口。搜尋、例句、中文說明、搭配、遮字練習與作文分析都在瀏覽器內運算，不需要語言模型、API Key 或外部句庫。原有 6,012 個詞條 ID、六級詞表、收藏與複習紀錄保留。

## 教材與學習功能

- 「五欄新編筆記」整理 255 個重點詞、1,020 條雙語搭配、510 句仿學測例句、463 項字義、510 項近義字、32 項慣用語及 626 項詞族資料。可直接篩選已升級詞條，依五大欄位學習精準用法。
- 升級詞條以「仿學測自編」短例句替換主面板的舊教材例句；原例句與原釋意保留在可展開的教材區。新增例句不是試卷原文，也不是官方答案。
- `elbow` 的動詞用法、`responsive to`、`tight schedule`、`exacerbate`／`add fuel to the fire` 與寵物作文語境分別整理。原 6,012 詞條以外的新增詞清楚標為「補充詞彙」。
- 五份上傳試卷新增 127 條逐頁核對短引文，區分本文、題幹與選項；六個 115 年重點實例另附核對紀錄。細節見 [115 五欄筆記來源](docs/GSAT_115_NOTEBOOK_SOURCES.md)。
- KK 顯示使用 CMUdict 美式音段轉寫，明示來源與重音位置推估，保留原 ECDICT 音標；方法與授權見 [KK 音標說明](docs/KK_NOTATION.md)。

- 每個詞條至少兩組內建英文例句與繁中翻譯，可直接閱讀、朗讀、遮字作答與訂正。
- 原中文釋意完整保留，另外提供易懂說明、上傳 Anki 的短釋意與用法提醒；不以單一短義取代所有原義。
- 新編教材涵蓋說理、證據、比較、讓步、條件、方案與反思，以及數位素養、氣候、公共健康和社群等當代情境。新句與原有 Anki 教材分別標示，不宣稱為真題或已發生的新聞。
- 原有雙語搭配與 111–115 年來源卡保留，另補詞性、介系詞、可數性與作文用法。新搭配可透過原有搜尋找到。
- 學習助手以規則辨識查詢意圖，從內建教材找例句與搭配；TextRank 抽取學生短文的關鍵詞與原文重點句，另提示常見用法並提供修訂問題。它沒有通用聊天、文章事實查核或學測作文評分功能。
- 遮字作答提供即時訂正，錯誤紀錄與收藏分開；原有今日複習與情境診斷繼續使用。

完整教材來源、資料重建與覆蓋統計見 [Anki 匯入說明](docs/ANKI_IMPORT.md)。研究依據及方法實際採用範圍見 [本機學習研究](docs/LOCAL_LEARNING_RESEARCH.md)；五年試卷及官方規範見 [111–115 再研究](docs/GSAT_111_115_RESEARCH.md)。例句訓練要看字義、自然搭配和資訊關係，不只堆疊難字或高階句型；尚未以學生實驗證明作文提分。

## 單字與例句朗讀

不需要 API 金鑰，也不下載文字或語音模型。單字按下「字典發音」才取得公開字典錄音；缺少錄音、逾時或離線時使用裝置本機英文聲線。例句一律使用本機聲線，切換單字及停止會取消舊播放。

錄音的實際來源與授權隨播放顯示。另提供 Cambridge、Merriam-Webster 詞條連結供人工核對，不冒稱公開社群錄音是這些出版社的官方發音。來源、錯誤備援與驗證範圍見 [發音說明](docs/PRONUNCIATION_SOURCES.md)。舊 Kokoro 實作保留作歷史紀錄，現行頁面不載入。

## 啟動與部署

網站是靜態 HTML／JavaScript，不需安裝套件或建置。部署根目錄 `index.html`、`assets/`、圖示與 manifest；`index .html` 為相容入口，內容相同。請使用 HTTPS 或 localhost，讓瀏覽器儲存、複製與發音權限正常運作。

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

GitHub Pages 使用本分支的 `/ (root)`。保留同一網站網址可繼續讀取瀏覽器的收藏；搬站前可使用網站的匯出／匯入收藏功能。收藏 key 維持 `gsat-standalone-favorites-v1`，原複習 key 維持 `gsat-v3-review-queue-v1`；新增作答紀錄使用獨立 key。沒有清除或覆寫舊收藏的啟動流程。

## 驗證與歷史工作

```sh
node --test tests/regression.cjs tests/builtin-ui.cjs tests/local-coach.cjs tests/pronunciation.cjs tests/exam-notes.cjs tests/exam-year-index.cjs
python3 -m unittest discover -s tests -p 'test_*.py'
python3 tests/browser_builtin.py
python3 tests/browser_notebook.py
python3 research/build_exam_notebook.py --check
python3 research/build_exam_evidence_index.py --check
```

筆記的可編輯原始資料為 `research/exam_notebook.json`；修改後執行 `python3 research/build_exam_notebook.py` 重建 `assets/data/exam-notebook.js`。例句練習以來源及句子內容辨識，替換句子不會承接舊句子的作答統計；舊收藏、複習與原作答紀錄不被清除。

瀏覽器測試使用桌面及手機尺寸的 Chromium，另檢查資料全覆蓋、原詞條與收藏相容、同站素材、年度篩選與沒有自動外站請求。它不能代替 iPhone 實機及真人發音聽辨。最新結果見 [五欄筆記驗證](docs/NOTEBOOK_V2_VALIDATION.md)；舊版紀錄保留於 [內建教材驗證](docs/BUILTIN_VALIDATION.md)。

先前的 Danube／Colab 微調研究保留於 `colab/` 供研究紀錄；根目錄網站已撤下 MiniLM 語意模型及 Danube 生成介面。舊模型研究文件不代表目前網站仍載入那些模型。原站重複目錄 `gsat-lexicon-v6-github/` 的舊入口已導向根目錄，部署請使用根目錄。
