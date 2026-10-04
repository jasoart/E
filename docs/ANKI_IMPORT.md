# Anki 參考資料與原網站中文釋意

新增的 `assets/data/builtin-study.js` 是原詞表之外的學習資料層。所有 6,012 個原始 `word` ID、`meaning`、詞性與等級都保留在 `assets/data/vocabulary.js`；易懂說明、Anki 中文摘要和句例不能取代或刪除原釋意。介面應同時提供「易懂說明」與可展開的完整原釋意。

## 上傳內容與欄位

`_Level_1-6111.apkg` 內有 6,176 張卡／筆記，6,175 個忽略大小寫後的詞頭，每筆都有兩組英文句例及繁體中文翻譯。真正的資料庫是 `collection.anki21`，`collection.anki2` 是相容用途檔案，不能用來分析這份牌組。匯入器只讀 SQLite，不載入 Anki 樣板、不執行檔案內容，也不解壓媒體。

| Anki 欄位名稱 | 本牌組實際內容 |
| --- | --- |
| `Front` | 英文詞頭 |
| `Back` | 簡短中文釋意 |
| `vacabulary` | 詞性（名稱拼字照原檔） |
| `詞性` | 本次所有筆記皆空白 |
| `example`／`sound` | 第一組英文例句／中文翻譯；`sound` 實際不是音訊 |
| `memo`／`memo翻譯` | 第二組英文例句／中文翻譯 |

牌組沒有獨立搭配欄位，沒有可據以宣稱公共領域的授權資訊，也沒有可驗證的作者資料。句例保留來源 `uploaded-anki`；只有人工撰寫且記錄在 override JSON 的新句才標為 `self-authored`。原始 APKG、SQLite、媒體與機器上的附件路徑不加入儲存庫。

## 對照與品質界線

原站 5,843 個詞條可直接對上牌組詞頭。另 168 個透過原詞表明列的斜線變體與括號詞形對照，例如 `a/an`、`achieve(ment)`；沒有使用拼字近似配對。`sportswoma n` 是原資料明確拼字間隔錯誤，只在變體對照中修為 `sportswoman`。唯一未對上的原 ID `neither adj./adv./pron./` 由人工 override 提供例句。完整原 ID 始終作資料索引，不重命名原詞。

牌組摘要常只涵蓋一種詞性或字義。例如 `fine` 的摘要只有「罰金」，原站還有形容詞、副詞等意義；因此 `ankiMeaning` 只作補充，完整原釋意必須保留。`March` 與 `march` 優先依大小寫精確對照，避免月份與行進的例句混用。

規則標出的文法只是可觀察的字詞／標點線索，不能替代完整句法分析；判不準者明列「句子結構未分類」。搭配只從原站明列搭配或人工 override 取用，不把任意連續字詞假稱為自然搭配。目標詞形檢查包含部分屈折與不規則變化，剩餘旗標要人工判讀，不能直接當成錯句數。

只用衍生詞、複合詞或同義詞，卻未用到指定詞形的原卡句移到 `familyExamples`，不計入主要 `examples` 的每詞兩句要求。例如 `Biodiversity` 不當成 `diversity` 本身的示範，`prison` 不當成 `imprison` 的示範；來源仍為 `uploaded-anki`，沒有修改牌組原句冒充新編。人工 override 補入真正使用指定詞的句子；若主要例句不足兩句，預設停止發布資料。

## 可重建的匯入流程

先以 Node 讀取網站原詞表，將完整 `VOCABULARY` 匯出到暫存 JSON（不要覆寫詞表），再執行：

```sh
node tools/export_study_vocabulary.cjs /tmp/anki-study/site-vocabulary.json
python tools/build_builtin_study.py \
  --apkg /path/to/uploaded.apkg \
  --vocabularyJson /tmp/anki-study/site-vocabulary.json \
  --overrides colab/data/builtin_overrides_corrections.json \
  --overrides colab/data/builtin_overrides_academic.json \
  --overrides colab/data/builtin_overrides_modern.json \
  --out assets/data/builtin-study.js \
  --report /tmp/anki-study/build-report.json
```

`--vocabulary` 是 `--vocabularyJson` 的別名；也接受有 `vocabulary` 陣列的 JSON。相同 exact ID 出現在多個 override 檔案時會報錯，避免靜默覆寫。每詞至少要有兩組含目標詞形、非空英文／中文的主要句例；詞族延伸句不計入。未達到時預設不輸出發布資料，仍可先寫報告。`--allow-draft` 只供清楚標示的草稿用途。

目前匯入器使用 Python 標準函式庫，支援本次未經 zstd 壓縮的 `collection.anki21`。若將來牌組只有 `collection.anki21b`，會明確停止並要求先以可信解壓工具處理，不讀取占位檔假裝匯入成功。

Override 結構為 exact ID 對應 `plainMeaning`、`usageNote`、`examples` 與 `collocations`。新句必須含 `text`、`translationZh`、`source: "self-authored"`；建議提供人工寫的 `grammar`、`writingTip`、`topic`。新編句優先排列，原卡句例仍作延伸資料保留。搭配為 `[英文, 中文, 用法說明]`。

生成檔的 `sourceSummary` 記錄牌組 SHA-256、對照覆蓋、例句來源與搭配數；完整問題句報告只留在 `/tmp`。這些是資料格式與覆蓋檢查，不代表全部牌組翻譯、語法、事實與學測難度已逐句人工認證。

本版主例句合計 **13,060 組**，其中上傳教材 **12,366 組**、本站新編 **694 組**；347 個詞條另有人工白話說明、用法與作文遷移提示。新增資料層含 **1,430 項搭配**，原站 2,500 項搭配另外保留；兩者可能有重複英文字形，不能將 3,930 項條目宣稱為完全不同的片語。
