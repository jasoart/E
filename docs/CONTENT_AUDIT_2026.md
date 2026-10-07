# 學測教材增補與內容審核（2026-10-08）

本輪在原有 255 筆新編筆記上新增 60 筆，並審核多義、句型界線、近義替換及繁體中文。新編例句均為本站原創練習，並非歷屆考題原句，也不代表字詞的官方命題頻率。原有 6,012 筆詞表、上傳教材資料及既有收藏／複習識別字串均保留。

## 完成範圍

| 資料 | 原有 | 本輪完成後 |
| --- | ---: | ---: |
| 新編單字筆記 | 255 | 315 |
| 雙語搭配 | 1,020 | 1,282 |
| 原創雙語例句 | 510 | 630 |
| 結構化詞性／義項 | 463 | 638 |
| 附使用界線的近義詞 | 510 | 630 |
| 慣用語 | 32 | 32 |
| 字族與明確標示的詞形變化 | 626 | 786 |

315 個筆記主詞對應 317 個現行詞表列：原表本身有括號或變體別名，因此筆記數與列數不同。原表維持 6,012 列，先前加入的 7 個補充詞仍另行標示；本輪 60 詞全部能連到原表，沒有新增補充列。`achieve` 對應原有 `achieve(ment)`，`attach` 對應 `attach(ment)`，識別字串不改寫。

## 新增的 60 詞

accurate, achieve, analyze, anticipate, approve, appropriate, assumption, attach, attempt, attention, avoid, bias, clarify, collaboration, combine, commitment, compare, compensate, complex, concentrate, confirm, consistent, construct, contrast, convince, coordinate, cope, despite, distinguish, diverse, effective, emphasize, enable, encounter, evaluate, exception, exclude, experiment, explanation, expose, facilitate, identify, ignore, illustrate, implication, interpret, justify, observe, overcome, perceive, perspective, preserve, principle, propose, recommend, recall, relevant, retain, revise, valid。

選詞補足資訊判讀、學習策略、公共議題、文化與社區、實驗描述及常見句型混淆；未宣稱這 60 詞皆在上傳考卷出現。每詞至少四組雙語搭配、兩個附情境限制的近義詞、兩句 10–26 字的原創例句。每句另有針對該句的文法解析、寫作提示與情境標籤。

字族欄區分衍生字與詞形變化，例如 `overcame` 明標過去式。`despite` 不虛構常用衍生字來填滿欄位。正式或專門用法會註明語域，例如 `perspectival`、`theoretical construct`；不要求學生把較難的字無差別換入作文。

## 明確修正與多義細化

- `challenge`：由兩項概括說明細分成難題／考驗、競賽邀請、質疑／異議、盤問、要求證明等名詞與動詞用法；補入 `challenge someone to a chess match`、`challenge someone to prove a claim`、`a legal challenge to a decision`、`challenge a visitor at the gate`。不把原表「要求」誤解為任何一般請求，也不把盤問當成競賽。
- `account`：把帳戶、敘述、解釋原因、占比拆開。原近義提示「account for 可表示解釋原因或比例」容易令人以為 `explain` 可替換占比，現已明示 `explain` 只對應解釋義，占比可用 `make up`。
- `mean`、`light`、`bear`、`charge`、`draw`、`address`、`head`、`issue`、`board`：九詞多義細化為 73 個義項，增 18 搭配與 7 個字族／詞形；保留原有近義詞、慣用語及例句。特別區分 `mean to V`／`mean V-ing`、`born`／`borne`、`charge for`／`charge with`、`in charge of`／`in the charge of`、`draw a conclusion`／`prize draw` 等。
- `flat`：補上現有搭配 `a flat fee` 的固定收費義，以及副詞、平淡／無力、斷然拒絕等常見用法；說明平面可能傾斜，`flat` 不等於一律水平的 `level`。
- `due`：補上應得肯定的名詞義、`dues` 會費義及 `due north` 方位副詞義，區分 `due to + 名詞` 與 `be due to + 原形動詞`。
- `research`：將未附研究來源的泛稱「Recent research suggests...」練習句改為具體的校園交通專題情境，避免讀者把原創句誤認為本站查證過的近期研究結論。
- 新增筆記的語法界線：`approve of`（贊成）／`approve`（正式核准）、`effective`／`efficient`、`facilitate learning`／`enable someone to learn`、`despite + 名詞或 V-ing`／`although + 子句`、`identify`／`identify with`、`ignore`／`be ignorant of`、`principle`／`principal`、`recall doing`／`remember to do` 均有說明。
- `achieve` 例句經複讀改為 `achieved better results`，使目標搭配更自然；另修正既有及新增筆記中混入的簡體字，例如「強调」改為「強調」、「簽约」改為「簽約」、「发現」改為「發現」、「依恋」改為「依戀」。此項只整理新編筆記，不批次轉換原始字典資料。

本輪審核並非重新編成完整大型英漢詞典。常用義項依詞性、受詞與情境細分；原表較古舊或罕見釋義仍保留供核對，不自動推定為現代學測作文建議。網站主面板同時呈現完整原始釋義與新編結構化筆記，原字典與上傳教材摘要不因新編筆記而隱藏或截斷。

## 原始資料與題目證據

本輪沒有修改 `assets/data/vocabulary.js`、`assets/data/builtin-study.js`、`assets/data/collocations.js`；來源檔 `research/exam_notebook.json` 經建置器產生 `assets/data/exam-notebook.js`。

111–115 學年度共五份上傳試卷的既有證據再檢查通過：127 條短引文、6 項重點事實。未新增或猜測官方答案；題本中的選項仍標示選項。對應年度引文與新編練習句有不同來源標籤，新增的 120 句不冒充歷屆原句。

## 驗證

```sh
python3 research/build_exam_notebook.py --check
node --test tests/exam-notes.cjs tests/exam-year-index.cjs
python3 research/verify_uploaded_exams.py --pdf-dir /workspace/attachments
```

- 建置器檢查通過：315 詞、1,282 搭配、630 例句；每句字數、目標詞形、雙語內容、原創標籤與個別解析完整，無重複例句。
- 20 項整合測試通過：原 6,012 列及既有識別字串保持不變；每個現行替換例句都能產生該詞的填空練習；筆記、搭配、近義／字族與原文來源可在實際資料中運作；全部 6,019 列的完整原義在主面板可見且經 HTML 跳脫。
- 別名檢查：315 個筆記主詞均能找到現行詞表列，無孤立筆記。
- 五份試卷的 127 條引文與 6 項事實逐頁核對通過；未包含官方答案卷。

新增例句經兩次逐句內容檢閱，程式檢查負責結構、來源及整合，不能取代語言判斷。本文報告已完成的範圍；不把自動檢查通過表述為教材絕無錯誤。
