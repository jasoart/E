# 內建教材與本機助手驗證

查核日期：2026-10-04。網站入口為 `restore-old-site` 分支根目錄；舊副本入口已導向根目錄。

## 資料與保留項目

- 原 `assets/data/vocabulary.js` 沒有修改；6,012 個 exact word ID、原中文釋意、詞性及級別完整保留。
- 6,012／6,012 詞均至少有兩組含指定詞形的雙語主要例句：13,060 組，上傳 Anki 12,366 組、本站新編 694 組。另有 8 組詞族延伸，不計入主要例句。
- 347 詞人工補寫白話說明、不同情境、文法解析、作文遷移提示與搭配。新增資料層含 1,430 項搭配；原 2,500 項及 636 筆出處紀錄保留，條目數不表示英文字形完全不重複。
- 原創 694 句與六份參考 PDF 的逐頁英文八詞片段比對，命中 0。此檢查使用 `pdftotext -layout` 的私人抽取文字，不發布 PDF 全文；字串檢查不能證明語意全無相似或代替教師評閱。
- 原收藏 key 與複習 key 保留；遮字練習以 `gsat-builtin-retrieval-v1` 保存獨立紀錄，啟動不清空收藏或進度。

## 程式與瀏覽器

```sh
node --test tests/regression.cjs tests/builtin-ui.cjs tests/local-coach.cjs tests/local-tts.cjs
python3 -m unittest discover -s tests -p 'test_*.py'
python3 tests/browser_builtin.py
```

**47 項 Node、44 項 Python，合計 91 項全部通過，沒有略過。** Python 範圍也包含保留的 Colab／PDF 研究工具；Node 針對目前網站與語音程式。原外接句庫、翻譯與 API 快取的測試已依功能撤除而替換，收藏、原詞表、原真題出處及情境診斷回歸繼續執行。

重點驗證：

- 13,060 句全部可精準抽取目標詞形遮字，包含不規則變化、重音字母、縮寫和原 ID 格式問題；不接受 `diversity` 作 `Biodiversity` 的子字。
- 錯答顯示訂正並要求重答；大小寫可忽略，但不是任意子字就算答對；練習不修改收藏與原複習紀錄。
- 中文釋意、例句和新增搭配可搜尋。TextRank 處理懸空節點、原文次序及重複句；貼文換行不漏句，中文教材主題可參與例句排序。
- 原句及寫作輸入以文字方式呈現；惡意 HTML 不建立圖片或執行事件。作文提示沒有官方分數或全文正確保證。
- Kokoro 只在明確點按後檢查 WebGPU／adapter，再載入自帶 runtime 和固定版本權重。缺少 GPU 時不下載；停止／切字使舊推論輸出失效，裝置備援不選遠端聲線。
- 自帶語音 runtime 的 bytes 與 SHA-256 均符合 manifest；真 Chromium 可載入該 bundle，沒有外站請求或語法錯誤。

手機尺寸 Chromium（390×844）已實際通過開頁、選字、例句、訂正、中文主題查找、作文抽取與 escaping、收藏相容及無水平溢出。開頁／選字／查詢過程外站請求為 **0**，也沒有自動載入語音模型。HTTP 測試確認目前 HTML、資料、助手與語音文件回傳的是本機最新檔案。

## 實際限制

沒有執行完整 325.5 MB Kokoro 模型推論，也沒有 iPhone 13 實機音質、速度或記憶體結果。Safari 26 的 WebGPU 官方支援不等於所有裝置都能跑此模型；以 adapter 與實際初始化結果判斷。沒有學生延後測驗／作文人工評閱實驗，不能據此宣稱提高多少分或記憶率。

更多方法及來源見 [學習研究](LOCAL_LEARNING_RESEARCH.md)、[語音說明](LOCAL_VOICE.md) 和 [Anki 匯入](ANKI_IMPORT.md)。
