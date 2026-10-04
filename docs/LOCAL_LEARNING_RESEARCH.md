# 本機閱讀、搭配與作文工具：研究來源與採用範圍

查核日期：2026-10-04。本站的本機學習助手使用規則、內建教材檢索及圖排序，不使用下載的語言模型來生成或評分英文。以下區分「參考方法」「實際程式」與「尚未證明的學習效果」，避免把工具名稱當作能力保證。

## 使用者指定的四個來源

已讀取下列儲存庫預設分支的原始 README 及可取得的授權文件。年份列的是方法年代或 LICENSE 著作權標示，**不是最新提交時間、版本發行日或作者現職**；本站沒有直接依賴這四個套件，也沒有把它們的程式整段搬入網站。

| 來源 | 方法與授權查核 | 本站採用範圍 |
| --- | --- | --- |
| [urbanautomaton/eliza-js](https://github.com/urbanautomaton/eliza-js)；[README](https://github.com/urbanautomaton/eliza-js/blob/master/README.md)、[LICENSE](https://github.com/urbanautomaton/eliza-js/blob/master/LICENSE) | JavaScript 版 ELIZA：加權關鍵字、依次嘗試分解模式與回應，有記憶回應及轉向規則。MIT，Copyright 2013 Simon Coffey。原始 ELIZA 是 Joseph Weizenbaum 在 1960 年代的工作，並非新的大型語言模型。 | `assets/js/local-coach.js` 自行實作**有順序的意圖規則**，將「搭配／文法／仿寫／例句」指令導向內建教材。沒有實作完整 ELIZA 的對話記憶、所有模式分解或心理諮商腳本；稱為 ELIZA 風格的規則路由較準確。 |
| 使用者提供的 [Stanford ConvNetJS 網頁](https://cs.stanford.edu/people/karpathy/convnetjs/)；原始 [karpathy/convnetjs](https://github.com/karpathy/convnetjs)、[Readme.md](https://github.com/karpathy/convnetjs/blob/master/Readme.md)、[LICENSE](https://github.com/karpathy/convnetjs/blob/master/LICENSE) | JavaScript 神經網路工具：全連接／卷積層、分類、回歸、訓練與瀏覽器示範。MIT，Copyright 2014 Andrej Karpathy。README 明說作者已不積極維護。Stanford 網址不代表作者是 Stanford 教授。 | **沒有載入**。神經網路引擎本身沒有英文知識；沒有適用資料、訓練及留出驗證，放進網站也不會自動理解作文。 |
| [karpathy/micrograd](https://github.com/karpathy/micrograd)；[README](https://github.com/karpathy/micrograd/blob/master/README.md)、[LICENSE](https://github.com/karpathy/micrograd/blob/master/LICENSE) | Python 的純量反向模式自動微分引擎及小型神經網路教學庫。MIT，Copyright 2020 Andrej Karpathy。README 的主要示範是二維資料的二元分類；另連結的 microgpt 是另一個範例。 | **沒有載入或移植**。micrograd 本身不是可直接使用的英文語言模型，也不是本機文法檢查器。沒有用未訓練網路對學生作文產生假分數。 |
| [dpressel/textrank-js](https://github.com/dpressel/textrank-js)；[README](https://github.com/dpressel/textrank-js/blob/master/README.md)、[package.json](https://github.com/dpressel/textrank-js/blob/master/package.json) | 示範 Rada Mihalcea、Paul Tarau 的 TextRank：詞的共現圖、句子相似度圖及圖排序。README 要求註明此實作；本次常見 LICENSE 路徑及 package.json 查核未找到標準授權宣告，**不能據此宣稱 MIT**。README 亦指出需先做好分句／詞性等前處理，示範 tests 並非真正測試。 | 採用 TextRank 的**算法構想，程式自行撰寫**：內容詞共現圖找重點詞；TF-IDF 向量的餘弦相似度建立句子圖，再以 PageRank 找原文重點句。沒有複製該 repo 程式，也沒有使用其 lodash 或詞性標記前處理。 |

TextRank 的原始論文是 Mihalcea 與 Tarau（2004），[TextRank: Bringing Order into Texts](https://aclanthology.org/W04-3252/)。本站用 TF-IDF／餘弦相似度作句子連邊，是實務變體，不能宣稱與該論文的實驗設定及結果完全相同。原論文託管網域在此環境受代理限制；本次直接查核的是上述原始實作 README，沒有宣稱重新讀取原論文全文。

## 本站現在做哪些工作

- **內建資料查找。** `assets/js/search.js` 將字面與字族命中、BM25、人工概念擴展及本機查找偏好結合。BM25 是詞項相關性排序；概念擴展來自已整理的詞與搭配，並不是神經語意理解。`local-coach.js` 再依查詢與例句內容詞，對候選教材作輕量排序。
- **閱讀重點抽取。** `local-coach.js` 建立詞共現圖與句子圖，獨立實作含懸空節點處理、阻尼及收斂條件的 PageRank。重點句是輸入原句的抽取，按原文次序呈現，沒有生成摘要新句。詞性未作完整分析，不能將關鍵詞列表當成精確語法分析。
- **作文修訂提示。** 有限規則提示已收錄的常見問題，例如 `discuss about`、`despite of`、重複比較級與部分主謂一致；再提供主張、理由、例證、限制與結尾的人工檢視問題。沒有觸發規則只表示「未命中已收錄規則」，不表示全文正確，也不提供官方學測分數。連接詞被辨識到，亦不代表前後邏輯正確。
- **回想與反饋。** 內建例句及搭配可用遮字／填空練習，先嘗試再顯示答案或用法提示。練習紀錄與收藏分開；只有實際作答才應計入練習結果，閱讀或按「顯示答案」不能自動視為記住。自由造句沒有唯一答案，不能只靠字串命中判定字義、自然度與文法全部合格。
- **簡單間隔複習。** `assets/js/state.js` 的 `markReview` 使用 `[1, 3, 7, 14, 30, 60, 120]` 天的產品排程；「記住了」提升階段，「再複習」縮短並排到明天。這是現有可解釋的規則，**不是 HLR、FSRS 或已校準的遺忘機率模型**。

程式功能的有無可由測試檢查；學測閱讀、作文或長期記憶是否改善，需要獨立的延後測驗與人工評閱。目前沒有本網站的學習成效實驗，也沒有將別人的改善百分比移植成本網站的效果。

## 可實作的兩個可靠方向

### 1. 主動回想，接上具體的正確用法

優先讓學習者在看答案前回想：英文語境留空一個目標詞或搭配成分；作答後顯示正確詞形、該句字義、完整例句及搭配。第二個例句換情境，使同一詞的用法能比較；若教材收錄不同字義，分別標註，不能混成一張無法判讀的卡。

已查核的機構來源：Anki 官方 [Background](https://github.com/ankitects/anki-manual/blob/main/src/background.md)、[Studying](https://github.com/ankitects/anki-manual/blob/main/src/studying.md) 說明 active recall、先顯示問題後揭示答案，以及以 Again／Good 等回饋排程。Duolingo 原始研究下述論文 §2.1（印出頁 1850）也具體呈現語言練習的糾錯解釋，並提醒不能只標「錯」。這些支援可落地的流程，不能獨自證明「每字兩句」一定提高作文分數。

重要原始研究背景：Karpicke 與 Roediger（2008），[The Critical Importance of Retrieval for Learning](https://doi.org/10.1126/science.1152408)。它是檢索練習的經典研究，不是 2026 年新方法。此環境無法取得 Purdue／PubMed／期刊全文，本次未重新查核其完整實驗，故不引用試驗人數、效果量或推廣為高中英作文的已證明效果。

### 2. 先保留透明排程，再按真實紀錄評估升級

已直接取得並閱讀方法與結果段落的原始研究：Burr Settles、Brendan Meeder（2016），[A Trainable Spaced Repetition Model for Language Learning](https://doi.org/10.18653/v1/P16-1174)，ACL，1848–1858；[Duolingo 原始 repo](https://github.com/duolingo/halflife-regression)、[原論文 PDF](https://github.com/duolingo/halflife-regression/blob/master/settles.acl16.pdf)。論文列 Settles 為 Duolingo，Meeder 為 Uber Advanced Technologies Center，並注明研究在 Duolingo 完成；不改寫成某頂尖大學教授的發明。

HLR 使用 `p = 2^(-Δ/h)`、`h = 2^(θ·x)`：Δ 是距上次練習的時間，x 包含過往見過／答對／答錯等紀錄，θ 必須用資料擬合。固定手選參數可以作排程估計，不能稱為已校準的個人記憶機率。論文的召回預測誤差改善是其資料上的結果；§4.4 的「12%」指隔日回來活動的使用者留存，**不是單字記憶提高 12%，也不是作文提高 12%**。

實務上先保存卡片／字義／題型、作答時間、上次練習時間、是否正確及是否先看提示，再用留出的延後作答檢查排程。另可評估 Anki 採用的 [FSRS](https://github.com/open-spaced-repetition/fsrs4anki) 及 [TypeScript 實作](https://github.com/open-spaced-repetition/ts-fsrs)。已讀其官方 README／套件文檔，確認有瀏覽器應用與評分 API；目前本站沒有導入。選用時需固定版本、保留 MIT 聲明、遷移儲存結構並測試，不能把目前的簡單 intervals 改名為 FSRS。

交錯練習、兩個情境與作文仿寫可作教學設計，但本次沒有取得可直接證明這套網站組合有效的新試驗；不宣稱「最新教授方法」或保證分數提升。

## 語音角色另見文件

Kokoro、ONNX Runtime、Hugging Face 與 Safari／WebKit 的角色、下載及執行限制另見 [LOCAL_VOICE.md](LOCAL_VOICE.md)。語音合成負責朗讀，不負責例句正確性；瀏覽器工具或機構名稱不等於 iPhone 效能保證。本研究文件沒有進行 GPU 訓練、語音效能或 iPhone 13 實機測量。
