# 維護教材與程式

網站入口為根目錄 `index.html`。正式網站不需要 npm、Python、API Key 或語言／語音模型；Python 與 Node 僅用於資料生成和驗證。程式架構見 [ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## 修改教材

1. 五欄筆記修改 `research/exam_notebook.json`，不要直接編輯生成的 `assets/data/exam-notebook.js`。每詞至少四組雙語搭配、兩句含目標詞的自編情境句；句子需附翻譯、文法提示、作文用法與主題。
2. 遵守原詞條 ID。原詞表的完整釋意在詞性與多重字義欄直接顯示；新編字義屬於補充，不得用短釋意取代或刪除原文。原教材的簡要說明與上傳 Anki 的原釋意也需完整保留並顯示。
3. 搭配須符合對應字義、詞性及介系詞；近義字與慣用語須說明適用語境，不宣稱可在所有句子互換。字族不是同義字清單；不確定的形態請查核後再加入。
4. 自編例句標為自編，不稱為試卷原文。新增試卷出處需記錄年份、題組、紙本／PDF 頁碼與短摘錄；題目選項不等於已核對的官方答案。
5. 修改資料後執行相應生成器，並核對生成差異。保留教材授權、資料來源及已知限制。

```sh
python3 research/build_exam_notebook.py
python3 research/build_exam_evidence_index.py
```

上傳 PDF 可用 `python3 research/verify_uploaded_exams.py --pdf-dir <PDF目錄>` 核對。私人上傳檔案與本機絕對路徑不應加入 repository；CI 使用已提交的資料、索引與生成器。

## 修改程式

依 [啟動順序](docs/ARCHITECTURE.md) 修改 `assets/js/`，確保收藏及複習的舊儲存 key 相容。新練習使用獨立版本 key；資料解析需容忍損壞、儲存空間不足與瀏覽器停用儲存。顯示教材與輸入文字時使用既有跳脫函式。

單字錄音只由明確播放動作查詢；句子使用裝置語音。新增來源需提供可核對的錄音與授權資訊，限制來源 URL、逾時、快取與重試數，並驗證切換單字會取消舊播放。不得把教授的講義、音標詞典或出版社查字連結稱為可直接串接的錄音 API。

`index .html` 是相容入口，必須與 `index.html` 完全一致。更新網站素材後刷新兩個 HTML 的內容雜湊，再檢查所有引用：

```sh
python3 tools/validate_site.py --refresh-hashes
```

工具會同步兩個入口並檢查素材、manifest 圖示、腳本順序及資料統計。新增啟動腳本時同步更新 `STARTUP_SCRIPTS`；保留 `defer` 及依賴順序。

## 提交前驗證

```sh
node --test tests/*.cjs
python3 -m unittest discover -s tests -p 'test_*.py' -q
python3 research/build_exam_notebook.py --check
python3 research/build_exam_evidence_index.py --check
python3 tools/validate_site.py
python3 tests/browser_builtin.py
python3 tests/browser_notebook.py
python3 tests/browser_learning.py
```

瀏覽器測試使用 Python 3.12、`.github/requirements-browser.txt` 的固定 Playwright 版本及 `/usr/bin/chromium`。GitHub Actions 安裝對應 Chromium；本機需準備同一路徑。測試會啟動並關閉自己的本機伺服器。聽辨品質與 iPhone 實機需要另行驗證，模擬失敗備援不能證明外站一直可用。

修改搜尋演算法時，可用相同教材比較兩版，不以結果快取掩蓋查詢成本：

```sh
node --expose-gc tools/benchmark_search.cjs --compare-ref <基準commit>
```

PR 應交代使用者可見的結果、相關來源、資料重建與實際驗證。CI 只有讀取 repository 的權限，不部署網站；GitHub Pages 部署分支及目錄仍由 repository 設定管理。
