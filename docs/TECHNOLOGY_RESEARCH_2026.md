# 語音、記憶研究與網站架構：來源查核及採用範圍

查核日期：2026-10-08（Asia/Taipei）。本文件記錄實際取得的原始資料，以及如何把適合的構想用在這個靜態學測單字網站。論文年份、儲存庫版本、網站程式的驗證與學生學習成效分別記錄；作者或大學名稱不代表對本站的背書。

## 1. 使用者指定的語音與語言研究來源

| 人物／原始來源 | 實際查核內容 | 本站採用與限制 |
| --- | --- | --- |
| Alan W Black；[CMUdict](https://github.com/cmusphinx/cmudict)、[Flite](https://github.com/festvox/flite) | CMUdict README 說明它是 CMU Speech Group 維護的英文發音字典，亦明示仍可能有錯誤；README 列出的維護聯絡人是 Alex Rudnicky。Flite README 明列核心引擎由 CMU Language Technologies Institute 的 Alan W Black 開發，聲線、詞典與語言組件由 Kevin A. Lenzo 與 Black 開發。已讀 Flite `COPYING`：核心為 BSD 類授權，部分檔案有各自聲明，不改稱全庫 MIT。 | 已用固定版本 CMUdict 的 ARPAbet 音素產生可追溯的 KK 顯示層，保留異讀及原音素；詳見 [KK_NOTATION.md](KK_NOTATION.md)。CMUdict **不是錄音庫，也不提供每個詞的詞性**。Flite 的文字處理、詞典、聲線及音訊輸出分層可作設計參考；本站沒有載入 Flite 或複製其 C 程式，也沒有把舊 README 的 Pentium III 效能數據宣稱成手機實測。 |
| Kyle Mahowald；[作者網站原始檔](https://github.com/mahowak/mahowak.github.io/blob/63323182e5e349f350c46189a5b22c3934a5ad3d/index.md)、[memorable_words](https://github.com/gretatuckute/memorable_words) | 作者網站列其為 UT Austin Linguistics 的 Associate Professor，並列 2025 年同題期刊論文。成功取得 Greta Tuckute 的作者資料庫 README、MIT LICENSE、兩份實驗 CSV 及 `analyze_expt1.py`。配套庫引用的是 **2022 年預印本**，並非 2025 年期刊全文。 | 用於確認「辨識一個詞」與「掌握該詞的多重字義」需要分開看待。教材保留全部原釋意，另以字義、搭配及語境整理，避免只有一個中文提示的卡片混淆多義詞。這是本網站的教學設計判斷；沒有從資料相關性推論這套版面能提高學測分數。 |
| Simon King；[CSTR-Edinburgh/Merlin](https://github.com/CSTR-Edinburgh/merlin)、[Ossian](https://github.com/CSTR-Edinburgh/Ossian) | Merlin README 明列 University of Edinburgh 的 CSTR，引用 Wu、Watts、King（2016）〈Merlin: An Open Source Neural Network Speech Synthesis System〉，並要求前端文字處理器及 vocoder。README 列 Python 2.7–3.6、Theano；Ossian 列 HTK／HTS 與 Merlin 訓練依賴。 | 參考文字、發音表示、聲學模型、音訊輸出的職責分離。這些研究工具不是可直接放入本頁的現成瀏覽器發音服務；本站沒有導入其訓練環境或聲學模型。未以 README 查核取代教授現職的獨立查核。 |
| Frank Rudzicz；使用者指定的 [Toronto CSC401 synthesis PDF](https://www.cs.toronto.edu/~frank/csc401/lectures/10_Synthesis.pdf) | 此 PDF 的 HTTPS 請求遭環境代理拒絕（403），未取得全文。 | 保留為待讀來源，沒有宣稱已讀其講義、萃取特定算法，或用這份講義替本站語音品質背書。 |

使用者指定的 [CMU CGI 網頁](http://www.speech.cs.cmu.edu/cgi-bin/cmudict) 與 [UT Austin 研究群網頁](https://sites.utexas.edu/compling/) 本次也遭代理拒絕。上述可查核結論來自可正常取得的原始 GitHub 文件及作者資料，不曾繞過網路政策。

### 2025 年記憶論文與公開配套資料

作者網站的完整書目為：Tuckute, G., Mahowald, K., Isola, P., Fedorenko, E., Gibson, E., and Oliva, A.（2025），*Intrinsically memorable words have unique associations with their meanings*，*Journal of Experimental Psychology: General*。網站連結的 [MIT 作者 PDF](https://tedlab.mit.edu/tedlab_website/researchpapers/tuckute_mahowald_et_al_2025.pdf) 本次亦為代理 403，所以沒有引用正式論文的效果量、頁碼或全文實驗細節。

同題配套庫引用 2022 年預印本，DOI：[10.31234/osf.io/p6kv9](https://doi.org/10.31234/osf.io/p6kv9)。直接解析固定版本 CSV 確認實驗 1 有 **2,109 列**、實驗 2 有 **2,165 列**；作者 README 說明各實驗有超過 600 位參與者。欄位包含辨識正確率 `acc`、命中、漏答、誤警、人工評定的字義／同義詞數，以及熟悉度、具體性等詞特徵。分析程式以這些特徵預測辨識正確率，含交叉驗證及頻率等比較項。

這是**詞辨識與詞特徵**資料；不是台灣高中生背中英搭配的隨機試驗，也不是個人的遺忘曲線。本站沒有把 `acc` 複製成學生的「記住機率」，沒有按詞的字義數刪除原釋意，也沒有導入 GloVe 或任何語言模型。合理的教材處理是保留原資料，以明確的詞性、完整搭配、兩種情境及訂正來減少用法混淆。

## 2. 間隔複習研究與實際頁面流程

| 研究／原始專案 | 已讀資料與可採用方向 | 本站狀態 |
| --- | --- | --- |
| [Anki 官方手冊](https://github.com/ankitects/anki-manual)：`background.md`、`studying.md` | 官方流程說明主動回想、先看問題再揭示答案，以及答題後的自評。這是產品文件，不能當成新的隨機試驗。 | `retrieval-practice.js` 提供短搭配回想：先收起答案、中文提示、輸入英文、核對完整搭配與介系詞、再自行評估。按「想不起來」後不能直接標成成功；不熟搭配會在本次練習末尾重試。自由搭配允許其他合理寫法，不用字串相等給作文分數。 |
| Ye、Su、Cao（2022），[SSP-MMC](https://github.com/maimemo/SSP-MMC)，KDD，DOI：[10.1145/3534678.3539081](https://doi.org/10.1145/3534678.3539081)；Su 等（2023），[SSP-MMC-Plus](https://github.com/maimemo/SSP-MMC-Plus)，IEEE TKDE，DOI：[10.1109/TKDE.2023.3251721](https://doi.org/10.1109/TKDE.2023.3251721) | 已讀原始 README 與工作流程。它們把記憶狀態估計與排程最佳化分開，模型需要資料擬合。README 的「2.2 億」是 MaiMemo 行為紀錄數；Dataverse 託管不代表 Harvard 研究團隊執行該試驗。本次沒有下載完整資料或重現原論文。 | 參考記錄練習結果再評估模型的原則。未導入兩個算法，沒有挪用其百分比效果，也沒有把資料量當成本站效果的證明。 |
| [FSRS4Anki](https://github.com/open-spaced-repetition/fsrs4anki)、[SRS Benchmark](https://github.com/open-spaced-repetition/srs-benchmark) | 已讀官方 README。FSRS 的 scheduler 與 optimizer 分開；benchmark 以歷史練習預測後續結果，區分 Log Loss、AUC 與 RMSE。快照已列 FSRS-7 等算法，但這是持續更新的工程 benchmark，不是「2026 年教授論文」，本次沒有重跑大型比較。 | 頁面仍使用明示的 `[1, 3, 7, 14, 30, 60, 120]` 天規則。自訂搭配練習保存題目、嘗試數、自評結果及時間，使用獨立儲存鍵，沒有假冒 FSRS，也沒有把收藏、閱讀或先看答案當成記住。 |
| Upadhyay 等（2021），[Spaced-Selection](https://github.com/Networks-Learning/spaced-selection)，*npj Science of Learning*，DOI：[10.1038/s41539-021-00105-8](https://doi.org/10.1038/s41539-021-00105-8)；[Memorize](https://github.com/Networks-Learning/memorize) | 已讀作者原始 README：使用者選練習時間，算法選題；研究用 Swift 駕駛學習資料及隨機試驗。這是 2021 年研究，不重新標成「最新」。本次未讀期刊全文或下載完整試驗資料。 | 目前採容易理解的本機選題順序：不熟搭配優先、未練習搭配其次，再按紀錄時間排序。沒有聲稱實作其最佳化策略或具有同樣成效。 |

搭配回想限制一次三題，是減少單次操作負擔的產品選擇，**不是由上述論文推得的最佳題數**。當日自評也不等於延後測驗：未來若評估學習成效，應保存是否先看提示、題型與間隔，將不同字義分開，並用事先約定的延後測驗及人工評閱。現階段先完成透明流程與可靠資料，不對未測過的學測分數或長期記憶作保證。

## 3. 使用者指定的 GitHub 與底層架構來源

| 指定來源 | 查核結果 | 適合本網站的實作 |
| --- | --- | --- |
| [GitHub Blog：building-git-infrastructure-for-agent-scale-development](https://github.blog/engineering/architecture-optimization/building-git-infrastructure-for-agent-scale-development/) | 原 URL 遭代理 403；未取得文章全文、發表日期或作者。不能依 URL 推測文章細節，也沒有宣稱移植其內部 Git 基礎設施。 | 以已取得的下列來源及本網站測量決定改動。純靜態教材的規模不需要增加分散式 Git 服務。 |
| [github/github-well-architected](https://github.com/github/github-well-architected) | 已讀 README、`docs/framework-overview.md` 與貢獻文件。框架列 Productivity、Collaboration、Application Security、Governance、Architecture 五個支柱；文件明說 GitHub Docs 是實作細節的主要依據。 | 新增 GitHub Actions 自動檢查資料、程式、產物及瀏覽器流程；Actions 固定完整 commit，權限限 `contents: read`、不保留 checkout 憑證，同一分支的新檢查取消過期執行；PR 範本要求內容來源與驗證資訊。工作流程的實際可用性由測試與 GitHub 執行結果確認。 |
| [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | 已讀原始 README 的效能／延遲、快取及可靠性取捨。它是社群整理的系統設計教材，不是學習成效論文，也不要求每個網站都用資料庫或服務叢集。 | 保持根目錄可部署的靜態網站，採有限快取、依需求載入來源資料、可取消及逾時的外部語音請求。BM25 改由詞項 postings 累加有命中的文件，減少逐詞的稀疏排序計算；暖機每輪約 4 ms 後讓出主執行緒。使用可重跑的 benchmark 比較相同教材與查詢，具體速度以實測報告為準。 |

本站的搜尋與語音程式都是自行編寫。倒排索引、BM25、有限快取及降級是一般工程方法；沒有把它們說成上列某篇文章的獨家技術。一般文字／概念搜尋仍保留需要的完整查找，單次索引建置、記憶體與字族／中文檢索正確性也要一起檢查，不能只報最有利的一個查詢。

### 程式與驗證的對應

- 教材來源及產物：`research/exam_notebook.json` → `research/build_exam_notebook.py` → `assets/data/exam-notebook.js`；原釋意的保留與呈現另外由資料及 UI 測試驗證。英文新編例句與歷屆原文各有標示，不混稱官方題目。
- 搜尋：`assets/js/search.js`、`tests/search-performance.cjs`、`tools/benchmark_search.cjs`。基準工具在相同資料上比較指定 Git 版本，測未使用結果快取的查詢，回報中位數、P95 及索引記憶體；這是該機器的工程測量，不能直接換算 iPhone 速度。
- 語音：`assets/js/audio.js` 與 `assets/js/config.js` 分離 provider、錄音授權、裝置合成及播放狀態。公開來源錄音與裝置語音各有標示，可選美式／英式及語速；詳見 [PRONUNCIATION_SOURCES.md](PRONUNCIATION_SOURCES.md)。只有點擊播放才請求錄音，切字或停止會取消舊請求。提供多個來源提高可選性；同樣不保證每個詞都有兩種口音。
- 回想：`assets/js/retrieval-practice.js` 使用獨立、有上限的本機紀錄，與收藏及既有排程分開；教材更動後不以陣列序號誤配舊題紀錄。
- GitHub：`.github/workflows/validate.yml`、PR 範本與 Dependabot；`tools/validate_site.py` 檢查兩個入口 HTML 一致、資源存在、內容雜湊及教材產物。外部來源無法下載時，網站測試應驗證可理解的降級，不把阻斷環境下的模擬回應叫成真實錄音驗證。

## 4. 可重查的版本快照

下表 commit 是本次取得的來源快照，**不是論文年份或維護品質排名**。本站只直接使用 CMUdict 的發音資料；其他項目是研究與設計參考，沒有把它們全部加入前端依賴。

| 原始儲存庫 | 查核 commit |
| --- | --- |
| `cmusphinx/cmudict` | `74790861f652b15e4ac49015a90074ad62a27690` |
| `festvox/flite` | `6c9f20dc915b17f5619340069889db0aa007fcdc` |
| `CSTR-Edinburgh/Ossian` | `fd01c8f9e1e5fa4f4f00dd444a565b714973b7a9` |
| `CSTR-Edinburgh/merlin` | `33fa6e65ddb903ed5633ccb66c74d3e7c128667f` |
| `mahowak/mahowak.github.io` | `63323182e5e349f350c46189a5b22c3934a5ad3d` |
| `gretatuckute/memorable_words` | `56f041965a582dd12e212726ad36cc3d70ed9d5e` |
| `ankitects/anki-manual` | `91f7485236db2a89d2a8abaed618976caf971de2` |
| `maimemo/SSP-MMC` | `89a1423a8ac102cc85742f184177960c87837302` |
| `maimemo/SSP-MMC-Plus` | `b20a49f2f7403c5013b0c9f0937d5296a7b50fd6` |
| `open-spaced-repetition/fsrs4anki` | `ff7c85cee735472d1c9cec0b9252d184087f74d8` |
| `open-spaced-repetition/srs-benchmark` | `bd9110f791e5b37282c55a9aa8db35f68f0c4aa2` |
| `Networks-Learning/memorize` | `a5fe694c62da65b74160e37d1b0a1c6d90a4d7dd` |
| `Networks-Learning/spaced-selection` | `fb197043c287a3d4f76787a19c023b964e823c7d` |
| `github/github-well-architected` | `19010cbd586be876e670c156fbc6ed91f5050b13` |
| `donnemartin/system-design-primer` | `ae9bbd7b02d90b9866215de185217d33f39ab733` |
