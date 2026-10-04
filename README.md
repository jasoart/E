# 學測英文：內建雙語教材與本機學習助手

本版直接修改 `jasoart/E` 的 `restore-old-site` 分支網站，以根目錄 `index.html` 為入口。搜尋、例句、中文說明、搭配、遮字練習與作文分析都在瀏覽器內運算，不需要語言模型、API Key 或外部句庫。原有 6,012 個詞條 ID、六級詞表、收藏與複習紀錄保留。

## 教材與學習功能

- 每個詞條至少兩組內建英文例句與繁中翻譯，可直接閱讀、朗讀、遮字作答與訂正。
- 原中文釋意完整保留，另外提供易懂說明、上傳 Anki 的短釋意與用法提醒；不以單一短義取代所有原義。
- 新編教材涵蓋說理、證據、比較、讓步、條件、方案與反思，以及數位素養、氣候、公共健康和社群等當代情境。新句與原有 Anki 教材分別標示，不宣稱為真題或已發生的新聞。
- 原有雙語搭配與 111–115 年來源卡保留，另補詞性、介系詞、可數性與作文用法。新搭配可透過原有搜尋找到。
- 學習助手以規則辨識查詢意圖，從內建教材找例句與搭配；TextRank 抽取學生短文的關鍵詞與原文重點句，另提示常見用法並提供修訂問題。它沒有通用聊天、文章事實查核或學測作文評分功能。
- 遮字作答提供即時訂正，錯誤紀錄與收藏分開；原有今日複習與情境診斷繼續使用。

完整教材來源、資料重建與覆蓋統計見 [Anki 匯入說明](docs/ANKI_IMPORT.md)。研究依據及方法實際採用範圍見 [本機學習研究](docs/LOCAL_LEARNING_RESEARCH.md)；五年試卷及官方規範見 [111–115 再研究](docs/GSAT_111_115_RESEARCH.md)。例句訓練要看字義、自然搭配和資訊關係，不只堆疊難字或高階句型；尚未以學生實驗證明作文提分。

## 單字與例句朗讀

原外部錄音來源已移除。預設使用裝置標示為本機的英文聲線；可明確點按「載入本機 WebGPU 語音」，改用指定的 [Kokoro-82M ONNX](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) 在裝置推論，不傳送朗讀文字。

語音模型與無模型學習助手各自運作。Kokoro WebGPU 使用官方建議的 fp32，首次模型約 **326 MB**，執行程式另外約 **24 MB**，另有聲線及 tokenizer。網站不自動下載模型；版本固定並可改成同站權重。瀏覽器會先檢查 WebGPU adapter，失敗時回到裝置語音。完整模型與 iPhone 13 音質、速度、記憶體尚未實測，細節見 [本機語音說明](docs/LOCAL_VOICE.md)。

## 啟動與部署

網站是靜態 HTML／JavaScript，不需安裝套件或建置。部署根目錄 `index.html`、`assets/`、圖示與 manifest；`index .html` 為相容入口，內容相同。請使用 HTTPS 或 localhost；WebGPU 不適用一般 HTTP 網站。

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

GitHub Pages 使用本分支的 `/ (root)`。保留同一網站網址可繼續讀取瀏覽器的收藏；搬站前可使用網站的匯出／匯入收藏功能。收藏 key 維持 `gsat-standalone-favorites-v1`，原複習 key 維持 `gsat-v3-review-queue-v1`；新增作答紀錄使用獨立 key。沒有清除或覆寫舊收藏的啟動流程。

## 驗證與歷史工作

```sh
node --test tests/regression.cjs tests/builtin-ui.cjs tests/local-coach.cjs tests/local-tts.cjs
python3 -m unittest discover -s tests -p 'test_*.py'
python3 tests/browser_builtin.py
```

瀏覽器測試使用手機尺寸的 Chromium，另檢查資料全覆蓋、原詞條與收藏相容、同站素材與無外站請求。它不能代替 iPhone 13 實機或完整 Kokoro 推論驗證。最新實測結果見 [驗證紀錄](docs/BUILTIN_VALIDATION.md)。

先前的 Danube／Colab 微調研究保留於 `colab/` 供研究紀錄；根目錄網站已撤下 MiniLM 語意模型及 Danube 生成介面。舊模型研究文件不代表目前網站仍載入那些模型。原站重複目錄 `gsat-lexicon-v6-github/` 的舊入口已導向根目錄，部署請使用根目錄。
