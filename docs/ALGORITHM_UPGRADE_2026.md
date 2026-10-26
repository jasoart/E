# 詞典演算法升級與研究依據

查核日期：2026-10-26。適用版本以 `restore-old-site` 的 `9024c595e0f10700e009086d4c97203c954b4378` 為基準。

這次把可在瀏覽器直接執行的圖排序與多樣性選擇用於英文短文和詞典例句。選擇依據是現有資料、可驗證的行為與運算成本；論文作者的任職機構不代表本站效果經過該機構驗證。本次採用的是有明確研究來源的既有方法，沒有把它們標為 2026 年最新方法，也沒有宣稱作者具有未核實的院士身分。

## 已採用：PositionRank 的位置偏置

Corina Florescu 與 Cornelia Caragea 在 ACL 2017 發表 [PositionRank](https://aclanthology.org/P17-1102/)，論文署名機構為 University of North Texas。Caragea 現任 UIC Kenyon Professor，見 [UIC 官方頁面](https://cs.uic.edu/profiles/cornelia-caragea/)。

`assets/js/local-coach.js` 的 `keywordRank()` 原本使用均勻跳轉機率。新版先累加詞的每次出現位置：

```text
positionWeight(w) = Σ 1 / tokenPosition
p(w) = positionWeight(w) / Σ positionWeight(v)
r(next) = (1 − d) p + d Pᵀ r
```

位置從 1 開始，包含尚未移除的停用詞；同一詞多次出現會累加。PageRank 的無出邊節點將機率依 `p` 分配，維持機率總和；既有未提供偏置的呼叫維持均勻分配。

這是 **PositionRank 思路的關鍵詞改寫版**。原論文先用詞性標記選出名詞／形容詞，並組合多詞片語；本站沿用停用詞篩選，輸出單詞，沒有加入詞性模型。論文在學術文章的評估結果不能直接當成學測作文效果。較早出現的詞獲得偏重，也可能受到引言、題幹或重複開場影響，仍需閱讀原文判斷。

## 已採用：MMR 兼顧相關性與內容差異

Jaime Carbonell 與 Jade Goldstein 在 SIGIR 1998 提出 [Maximal Marginal Relevance](https://www.cs.cmu.edu/afs/cs/Web/People/jgc/publication/MMR_DiversityBased_Reranking_SIGIR_1998.pdf)，署名 Carnegie Mellon University Language Technologies Institute。Carbonell 的 University Professor 職銜可由 [CMU 個人頁](https://www.cs.cmu.edu/~jgc/)查核。

`sentenceRank()` 與 `rankExamples()` 逐次選擇：

```text
argmax candidate ∉ selected
  λ × relevance(candidate)
  − (1 − λ) × max similarity(candidate, selectedItem)
```

`λ = 0.7` 是本站明確設定的取捨，不是經學習者資料訓練的最佳值。相關性先正規化，文字相似度使用本機詞項向量的 cosine。短文重點句沿用圖排序作為重要性，選取後恢復原文次序；主題例句沿用中英詞項命中相關性，再降低重複內容的優先度。有正向詞項命中時，完全相同的例句先去重，不把沒有命中的例句當作多樣性補位；全部候選都沒有命中時，則沿用原版的輸入順序與數量上限作參考回退，這條回退不額外去重，也不宣稱內容相關。

這能直接處理舊版「只按單一分數取前幾句，容易連續挑到相似句」的行為。cosine 衡量的是詞面重疊，沒有語意嵌入或詞義消歧；摘要仍是原文抽取，並非生成式改寫。原詞條的精確查字教材順序由既有顯示流程決定。

## 搜尋效能與相容性

`assets/js/search.js` 保留既有 BM25、OSA 拼字距離與 RRF 權重，改用以下候選處理：

- 拼字索引依字長及 bigram 多重集合排除不可能候選，再以 OSA 精確驗證。每次相鄰交換至多破壞三個 bigram，使用保守重疊下界；下界不大於零的短詞回到字長桶，避免漏字。
- 各路排名使用穩定 Top-350 heap；同分仍依原詞條索引。未進字面前 350、但由其他通道進入結果的詞條仍保留字面理由。
- BM25 分數緩衝區重用，只整理及清除實際命中的詞條。

OSA 不滿足一般距離度量所需的三角不等式，所以沒有對它直接套用 BK-tree 剪枝。新增索引會增加初始化成本與記憶體；實際取捨須參照同教材的基準量測，不能只以漸近複雜度宣稱所有查詢更快。基準程式 `tools/benchmark_search.cjs` 納入正式載入的 `vocabulary-enrichment.js`，並支援獨立基準來源檔。

## 查閱過、這次未採用的研究

| 研究 | 查核來源與適用性判斷 |
| --- | --- |
| Biased TextRank，COLING 2020 | [論文](https://aclanthology.org/2020.coling-main.144/)／[arXiv](https://arxiv.org/abs/2011.01026)。Kazemi、Pérez-Rosas、Mihalcea，University of Michigan；依任務焦點改變隨機跳轉，原實驗使用文件嵌入。本站目前沒有使用者指定焦點的摘要介面，也未引入該嵌入流程，因此不宣稱實作此模型。 |
| Rank1，CoLM 2025 | [arXiv 原文](https://arxiv.org/abs/2502.18418)。Weller 等人的推理式重排序需要訓練後的語言模型與推論資源。它是本次查閱的較新方向；在目前純靜態、即時查字流程中引入其模型，需另有下載成本、手機效能及雙語詞典相關性評估。 |
| Determinantal Point Processes，2012／2013 | [Kulesza、Taskar 的專論](https://arxiv.org/abs/1207.6083)。可作多樣化子集選取，但目前僅需挑選少量例句，MMR 的評分與取捨較容易檢查，無須新增核矩陣與行列式推論。 |
| MEMORIZE，2017／2019 | [arXiv](https://arxiv.org/abs/1712.01856)／[PNAS](https://doi.org/10.1073/pnas.1815156116)。Tabibian 等人，包括 Max Planck 的 Bernhard Schölkopf，以記憶模型和隨機控制決定複習時機。現有紀錄不足以在本站驗證個人遺忘參數；直接填入任意參數不能稱為精準個人化。本次維持既有複習排程和儲存格式。 |

以上「適用性判斷」是根據本站架構作出的工程選擇，並非論文作者對本站的評估。後續若要加入學習式排序或記憶模型，應先建立標註查詢集／經同意蒐集的學習紀錄，再比較相關性、延遲及校準度。
