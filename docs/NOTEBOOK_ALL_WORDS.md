# 單字筆記 V2.0：全詞表教學設計

本版讓原有 6,012 個詞條及 12 個補充詞都使用五欄筆記、句中導讀及主動回想。原詞條 ID、原釋義、官方級別、收藏與複習 key 保持不變。

## 每個詞的學習流程

| 欄位 | 學生要完成的動作 | 教材處理 |
| --- | --- | --- |
| 詞性與多義 | 判斷本句使用哪個字義 | 完整原釋義一直可見；按原釋義的詞性標記分段，專題詞另提供新編說明。 |
| 搭配與句中用法 | 圈出相鄰詞、介系詞與限定詞 | 使用既有雙語搭配；沒有獨立搭配時使用兩個完整例句，明示為整句、不計入搭配數。 |
| 近義辨析／語境對照 | 比較對象、語氣、程度與搭配 | 有新編近義辨析時直接呈現；其他詞以實際兩句比較用法，不自動宣稱有可互換近義詞。 |
| 字族／詞形 | 由句中位置判斷詞性與詞形 | 重用教材明列的字族關係；未整理字族時展示例句實際詞形。沒有靠共同字首或任意加字尾製造衍生字。 |
| 情境句與仿寫 | 指出證據、遮字作答，再寫自己的句子 | 所有例句附閱讀檢查提示、中文對照及仿寫任務；回想時收起可能洩漏答案的教材。 |

每句導讀現在另標示目標詞前後最多各四個**原句實際用字**，方便學生圈出相鄰線索。當辨識不到目標詞形時，不會虛構詞組。

先嘗試、再核對、訂正後重答的流程沿用既有回想模組。獨立搭配不足的詞改練例句回想，介面及完成訊息明確區分兩者。例句回想使用自評，不把不同但合理的英文寫法自動判錯。

導讀是學生需要完成的觀察任務，不是自動句法分析的結果。例如讀到 `after`，提示學生判斷後接名詞、動名詞或子句；不因為出現關鍵字就斷言是時間子句。S/V/O/C 是提問框架，不把規則推測冒充逐句已核對的剖析。

## 實際覆蓋與來源

- 335 個專題詞筆記，對應 337 個實際詞條 ID（包含原詞表的明示變體）。專題資料共有 670 句自編例句、1,362 條雙語搭配。
- 5,687 個詞條使用既有例句配合 V2 導讀。沿用的 `uploaded-anki` 句子保持原文、翻譯與來源，沒有改標為新編。
- 實際頁面合計 6,024 個詞條、12,772 句例句，其中 1,100 句沿用或新增的本站自編例句。其餘 11,672 句為上傳教材。這些是依詞條計數的顯示覆蓋，不是宣稱本次新寫了 12,772 句。
- 4,553 條整理搭配是按實際詞條的資料總和，含重用的既有搭配；完整例句不混入這個數字，也不宣稱為考試出現頻率。
- 本次新增 20 組專題，包含 apple、bank、fast、extend、adept、allocate、prudent、discretion、allegation、accuse、unanimous、consensus、interfere、intervene、thesis、ethic、ethnic、compatible、condense、reclaim，共 40 句新編情境句。
- adept、allegation、discretion、prudent、reclaim 不在本專案原有 6,012 個 ID 中，因此以補充詞加入；不據此推定官方未收錄，也不指定官方級別。
- 另以 Princeton WordNet 3.1 原始資料節錄 5,960 個詞條的 19,448 個英語詞義候選、24,066 個同義候選及 6,623 項明示派生關聯。64 個詞條無可對應的節錄，仍顯示原釋義、例句與原句導讀。數量是資料項數，不能理解為 5,960 個詞都已逐義人工核稿。

「V2 筆記」頁籤可篩選全部、專題新編與既有教材情境導讀。統計分開呈現，不把全詞表覆蓋等同全詞表已逐詞重寫、逐句人工審稿。

WordNet 層在展開「字典詞義與近義候選」或「派生關係」時才下載一次 2.3 MB JSON；英語 gloss 按字典原義列出，不自動配給上傳例句中的特定中文譯法。只採同一 synset 的近義候選，以及 `+` 指標明示的 derivationally related form；沒有使用字首相似度猜派生。每種詞性限制前三個名詞／動詞與前兩個形容詞／副詞義，總計最多八義，故非完整字典；可再開詞典核對罕見義與現代常用程度。頁面保留來源、版本與[授權聲明](../assets/data/wordnet.NOTICE.txt)，並清楚區分此層與大考中心資料。

## 學測與語言依據

使用本次提供的五份 111–115 年試卷重新執行 `research/verify_uploaded_exams.py`：127 條既有短摘錄與 6 項題型相關紀錄全部通過核對。原卷及本機絕對路徑不提交到 repository。這次沒有新增或推定官方答案。

115 起適用考試說明 PDF 第 7–8 頁（正文第 1–2 頁）列出語意、構詞、搭配、篇章理解與讀寫能力；PDF 第 3 頁公告篇章結構五選四。單詞導讀只支援這些能力的局部練習，不能當作完整篇章題組。

以下原始字典與文法資料用來核對新編規則，例句由本站編寫，未複製字典例句；不把 Cambridge 的 CEFR 等級當作大考中心詞彙級別。

- [Cambridge：although／though](https://dictionary.cambridge.org/grammar/british-grammar/although)
- [Cambridge：despite／in spite of](https://dictionary.cambridge.org/grammar/british-grammar/in-spite-of-and-despite)
- [Cambridge：rather／rather than](https://dictionary.cambridge.org/us/grammar/british-grammar/rather)
- [Cambridge：unanimous](https://dictionary.cambridge.org/dictionary/english/unanimous) 與 [consensus](https://dictionary.cambridge.org/dictionary/english/consensus)
- [Cambridge：discretion](https://dictionary.cambridge.org/us/dictionary/english/discretion) 與 [discreet](https://dictionary.cambridge.org/dictionary/english/discreet)
- [Cambridge：thesis／theses](https://dictionary.cambridge.org/us/dictionary/english/thesis)
- [Cambridge：ethic](https://dictionary.cambridge.org/us/dictionary/english/ethic) 與 [ethics](https://dictionary.cambridge.org/us/dictionary/english/ethics)

## 維護與驗證

專題新編的唯一編輯來源仍是 `research/exam_notebook.json`；執行 `python3 research/build_exam_notebook.py` 重建。全詞表導讀在 `assets/js/exam-notes.js` 從既有資料組成，不複製整份 6,012 詞的例句資料。`getCuratedExamNotebook` 僅回傳專題資料；`getExamNotebook` 回傳全詞表可用的 V2 筆記。未知 ID 仍回傳 null。

字典層是可重建的資料節錄：`npm install --prefix /tmp/wordnet-build --ignore-scripts wordnet-db@3.1.14`，接著 `python3 research/build_wordnet_learning.py --dict-dir /tmp/wordnet-build/node_modules/wordnet-db/dict`。一般 CI 不必下載字典，`python3 research/build_wordnet_learning.py --check` 會驗證 ID、數量、欄位與授權；持有原始詞庫時加上 `--dict-dir` 可逐位元比對重新產生的內容。

`tests/notebook-all-words.cjs` 全量檢查每個 ID 的欄位、雙語例句、回想題、來源不變，以及詞形與字族的來源。瀏覽器測試驗證新編／導讀篩選、先作答後核對、教材收合、返回，以及 390px／320px 排版。既有收藏、例句回想 key 和試卷出處的延遲讀取測試繼續保留。
