# 本次驗證紀錄

> 歷史研究紀錄：目前網站已改為內建教材與無語言模型的本機助手，先前 MiniLM／Danube 介面已撤下。現在的語音與操作方式請看 [本機語音](LOCAL_VOICE.md) 和 [最新驗證](BUILTIN_VALIDATION.md)。


日期：2026-10-04。網站來源為 `jasoart/E` 的 `restore-old-site`，基礎 commit `7513d5ad546b79a2f21c8b0e604206efb355c3be`。新增內容保存在工作區，尚未推送 GitHub 或部署公開網站。

| 檢查 | 結果與範圍 |
| --- | --- |
| Node 回歸與例句介面 | `node --test tests/regression.cjs tests/tutor.cjs`：47 通過，0 失敗，0 跳過。包含原有 33 項回歸與新增 14 項；模型推論使用測試替身。 |
| 資料、研究取樣與 Colab 邏輯 | 最新 `python3 -m unittest discover -s tests -p 'test_*.py' -v`：36 通過。檢查來源級別、切分、13 種提示文字一致、答案 loss mask、長輸入、近似原文、候選門檻、manifest、多 PDF 去重、匯出資料界線與詞彙題取樣。 |
| 筆記本格式 | nbformat 5.10.4 驗證成功；15 個儲存格都有 id，所有 Python 儲存格可編譯，沒有偽造執行輸出。內嵌 helper／資料與目前檔案一致。 |
| 官方對話格式 | 固定模型版本的實際 Jinja template 接受共同的單一 user 提示。原始 system-role 拒絕已重現，網站與筆記本都已修正。這不是完整 tokenizer BPE 或模型推論測試。 |
| 原網站瀏覽器流程 | Chromium 實際啟動、搜尋、診斷、延遲出處載入、舊收藏保留通過。 |
| 新介面與手機尺寸 | Chromium 390×844：實際 Worker 的缺 manifest 錯誤、重試、無自動模型下載通過；生成、文字安全顯示、停止、過期回應與收藏檢查使用假 Worker。尺寸模擬不代表 iPhone／Safari 硬體驗證。 |
| WASM 4-bit 算子 | Transformers.js 3.8.1 固定的 ORT Web WASM、單執行緒、MatMulNBits 4-bit/block32：輸出 `[32,64]` 正確。僅為小型算子圖，不是完整 Danube 模型。 |
| HTTP | 新分支根目錄服務入口與 27 個引用資源均回傳 200，包含可下載的筆記本。 |
| 風格示範資料 | 78 句原創風格句，12 類文法、級別 1–6；與使用者 PDF 沒有連續 8 詞相同，最大共同連續片段 3 詞。另有 60 句一般原創示範，總計 138 句。 |
| 模型 metadata | 已從官方固定版本核對 `c202f976c26875541e738ea978c8158fa536da9a` 的模型卡、Apache-2.0、Llama 架構與 tokenizer template。尚未下載完整權重。 |

目前工作區沒有 GPU／PyTorch，沒有執行完整微調、完整 ONNX 匯出或原始／微調／量化模型的實際品質比較。iPhone 13 的下載、記憶體、耗時、背景切換與實際文法品質尚未測試。筆記本會在 Colab 產生真正的執行紀錄與候選模型；本次程式與介面測試不能替代這些結果。

環境草稿已改為使用目前分支的根目錄，更新 `start_skill`、移除失效的舊搬移 `install_script`，並保存 GitHub／Hugging Face 研究及下載所需的網路設定。草稿儲存不代表已發布環境，也不代表網站或模型已公開。

## 六份文件的再次研究

新增 111–115 五份試卷和 115 起適用官方說明的共同分析，6 份文件共 94 頁。50 個詞彙題題幹的定義式取樣得到 14／19／25 詞的最少／中位／最多計數；題幹可能含多句，不等於全卷句長分布。

使用實際 PDF 驗證 `reference_ngram_index`：故意再加入一份相同 115 檔案作去重測試，7 次輸入得到 6 份不同文件、94 頁、19,292 個不同八詞片段。原有 138 句示範沒有八詞連續重複命中。來源 JSON 只保存統計與雜湊，原文及 PDF 未進入網站或 Colab 匯出 ZIP。

本輪 47 項 Node 與 36 項 Python 測試全部通過，合計 83 項；新版 15 個 Colab 儲存格通過 schema 與語法驗證。新增的是參考與研究能力，沒有取得新的模型品質、GPU 微調或 iPhone 實機結果。
