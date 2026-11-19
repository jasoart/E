# 學測例句生成：Colab 微調、量化與 iPhone 網頁推論研究

> 歷史研究紀錄：目前網站已改為內建教材與無語言模型的本機助手，先前 MiniLM／Danube 介面已撤下。現在的語音與操作方式請看 [本機語音](LOCAL_VOICE.md) 和 [最新驗證](BUILTIN_VALIDATION.md)。


查核日期：2026-10-04。目標是用 `h2oai/h2o-danube3-500m-chat` 生成符合指定字義、自然搭配與學測程度的英文例句，再由網站使用。下列資料來自方法作者、研究團隊、Hugging Face、Microsoft 與 GPUWeb 的公開程式或文件；這是本次查核可取得的相關研究，不是「全球最新方法」排名。

## 選擇與理由

本次採用可重現的流程：**Colab LoRA／QLoRA 訓練 → 以原始精度基礎模型合併 adapter → ONNX with-past → ORT 4-bit weight quantization → Transformers.js 3.8.1 → Web Worker 裡的單執行緒 WASM**。訓練用的 bitsandbytes NF4 與網站載入的 ONNX `q4` 是不同格式；不能把 NF4 或 GGUF 檔案改名成 `.onnx` 後載入。

方法的新穎程度不能代替例句品質。500M 模型適合先做短英文生成，繁體中文解釋與字義優先使用網站已有的詞典資料。Colab 的示範資料僅供驗證流程；正式使用要增加人工核對的學測例句與獨立驗證資料，不能宣稱跑完示範就有學測等級能力。

| 方法與年份 | 可查核來源及作者團隊 | 與本次流程的關係 |
| --- | --- | --- |
| QLoRA，2023 | [官方實作](https://github.com/artidoro/qlora)明載 University of Washington UW NLP；論文作者 Tim Dettmers、Artidoro Pagnoni、Ari Holtzman、Luke Zettlemoyer。[論文](https://arxiv.org/abs/2305.14314) | NF4、double quantization 與 LoRA 降低 Colab 訓練記憶體；訓練後重新載入原始模型合併，再轉成網站格式。這是團隊成果，不應只歸於某一位教授。 |
| PiSSA，2024；官方文件更新至 2025-01 | [GraphPKU 官方實作](https://github.com/GraphPKU/PiSSA)，作者 Fanxu Meng、Zhaohui Wang、Muhan Zhang。張牧涵的[本人網站](https://muhanzhang.github.io/)明載北京大學人工智慧研究院 tenure-track assistant professor。[論文](https://arxiv.org/abs/2404.02948)；[PEFT 實作說明](https://github.com/huggingface/peft/blob/main/docs/source/package_reference/lora.md) | 使用權重 SVD 初始化 adapter，可作同資料、同訓練預算的比較。初始化會改變基礎權重的分解，保存、合併與 adapter 轉換必須遵循官方方式，不能當一般 LoRA adapter 套到未處理的基礎模型。 |
| AWQ，2023；MLSys 2024；TinyChat 2.0，2024-10 | [MIT Han Lab 官方實作](https://github.com/mit-han-lab/llm-awq)，共同作者包括 Song Han；[研究頁](https://hanlab.mit.edu/projects/awq)、[論文](https://arxiv.org/abs/2306.00978)。官方 repo 亦記錄 2025-04 模型支援更新。 | activation-aware 低位元量化是值得比較的部署方法。官方 TinyChat 範例使用 CUDA、RTX 4090／Jetson Orin；其速度不是 iPhone 的速度，AWQ 產物也不是本網站的 ORT `model_q4.onnx`。 |
| DoRA，2024，ICML Oral | [NVIDIA Research 官方實作](https://github.com/NVlabs/DoRA)，共同作者包含 Kwang-Ting Cheng，官方 README 連到 HKUST 教師頁；[論文](https://arxiv.org/abs/2402.09353) | 將權重 magnitude 與 direction 分開微調，PEFT 可合併部署。原論文的大模型結果不能直接推成 Danube 500M 的例句品質提升；需要實際對照實驗。 |
| RandLoRA，2025 | [Hugging Face PEFT 官方文件](https://github.com/huggingface/peft/blob/main/docs/source/package_reference/randlora.md)與[論文編號 2502.00987](https://arxiv.org/abs/2502.00987) | 透過可訓練縮放係數組合隨機低秩基底，形成 full-rank 更新；可合併。極小 rank 可能增加訓練時間，本次未實作或測量。 |
| aLoRA，2025 | [PEFT 官方範例](https://github.com/huggingface/peft/blob/main/examples/alora_finetuning/README.md)、[論文編號 2504.12397](https://arxiv.org/abs/2504.12397) | selectively activated adapter 能重用基礎模型 KV cache，但官方文件明載不能合併權重，與本次單一合併 ONNX artifact 流程不同，因此不採為預設。 |
| Astra，2026，論文編號 2602.19111 | [作者實作](https://github.com/LyoAI/Astra)、[PEFT 官方範例](https://github.com/huggingface/peft/blob/main/examples/astra_finetuning/README.md)、[官方實作](https://github.com/huggingface/peft/blob/main/src/peft/tuners/lora/astra.py)、[論文](https://arxiv.org/abs/2602.19111) | 使用下游任務校準資料的 output activation covariance tail eigenvectors 初始化 LoRA，是本次找到的較新比較方向。需要含此功能的 PEFT commit 與額外校準，官方作者 repo 明載等待後續 release；本筆記本固定版本的 baseline 未執行它。初始化亦改變 frozen residual weights，需依官方流程保存初始 adapter 並轉換成標準 LoRA，才可套到原始基礎模型合併。尚未查核作者的教授職稱或機構，不作此歸屬。 |

以上官方 GitHub 文件內容已讀取；張牧涵本人網站透過[其 GitHub Pages 原始檔](https://github.com/muhanzhang/muhanzhang.github.io/blob/master/index.html)查核。arXiv、Han Lab、HKUST 等網頁連結提供讀者核對，這個雲端的網域限制使其頁面本文未直接讀取。官方 repo 的 benchmark 是作者在其資料與硬體下的報告，並非本專案的結果。

## iPhone 13 與 Safari

[GPUWeb 官方 implementation status](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status)目前列出 Safari 26／iOS 26 預設啟用 WebGPU。因此不能說「iPhone Safari 一律沒有 WebGPU」。在實機上仍須確認系統版本、HTTPS、`navigator.gpu`、`requestAdapter()`、可用 features／limits，並驗證匯出圖的算子與記憶體需求。本次未取得 iPhone 13 實機推論結果。

網站的保守預設是 `device: 'wasm', dtype: 'q4'`、一條 worker、單執行緒、`max_input_tokens: 384` 與 `max_new_tokens: 96`。模型沒有載入前不自行下載數百 MB；由使用者啟動下載。背景分頁與螢幕鎖定可能暫停 worker，回到前景時須處理中止或重新載入。若未通過實機測量，不把 WebGPU 當成保證更快的自動切換。

GitHub Pages 等靜態主機通常不能自由設定 COOP／COEP headers。WASM 單執行緒不用依賴 `SharedArrayBuffer`／跨來源隔離，這也是預設 `numThreads = 1` 的理由。模型、JS、WASM 與 worker 檔案仍須具備正確 CORS、路徑與 MIME type；需在實際使用的 HTTPS 網站驗證。

500M × 4 bit ≈ **250 MB** 只代表假設所有權重都量化的理論 payload。實際檔案還有 scales、保留原精度的 embedding／其他權重、ONNX 圖與 tokenizer；峰值記憶體包含下載 buffer、WASM heap、預先打包的矩陣、activation 與 KV cache。不能把 250 MB 當成下載大小或 iPhone 記憶體用量。KV cache 理論量為 `2 × layers × kv_heads × head_dim × tokens × bytes_per_element`，數值必須從下載的 `config.json` 計算；`q4` 並不代表 cache 也只有 4 bit。

若本機 WASM 在 iPhone 上過慢或被系統回收，可改為網站呼叫受保護的伺服器推論。這樣仍是 iPhone 使用網站，但模型在伺服器執行，介面與文件應如實標示。Colab session 是訓練與試驗環境，不是永久網站 API。網站不應存放 Hugging Face write token、Colab token 或雲端服務密鑰。

## ONNX 與執行版本的實際契約

查核的固定版本是 [Transformers.js 3.8.1](https://github.com/huggingface/transformers.js/tree/3.8.1)。其 [package.json](https://github.com/huggingface/transformers.js/blob/3.8.1/package.json)固定 `onnxruntime-web` 為 `1.22.0-dev.20250409-89f8206ba4`，不是任意最新版 ORT。

依 [模型載入程式](https://github.com/huggingface/transformers.js/blob/3.8.1/src/models.js)和 [dtype 命名](https://github.com/huggingface/transformers.js/blob/3.8.1/src/utils/dtypes.js)，網站的 `dtype: 'q4'` 對應 `onnx/model_q4.onnx`，`q8` 才對應 `model_quantized.onnx`。保留 `config.json`、`tokenizer.json`、`tokenizer_config.json`、special token 設定與 chat template。Danube 的官方模板不接受 `system` 角色，因此共同指示與造句任務合併成單一 `user` 訊息；Python 與網站必須保持完全相同的內容。

生成模型使用 `text-generation-with-past`，並檢查匯出圖的 `input_ids`、`attention_mask`、`position_ids`、`past_key_values.*`／`present.*` 和 `logits` 契約。[官方轉換程式](https://github.com/huggingface/transformers.js/blob/3.8.1/scripts/convert.py)與[量化程式](https://github.com/huggingface/transformers.js/blob/3.8.1/scripts/quantize.py)是檔名與格式的參考。`q4` 使用 `MatMulNBits` 類型的 weight-only int4，不把訓練 NF4 當成相同格式。

若 ONNX 使用 external data，不能只上傳圖檔。Transformers.js 3.8.1 loader 需要 `use_external_data_format` 設定，並依規則抓取 `model_q4.onnx_data`、`model_q4.onnx_data_1` 等檔案；圖內 location 也必須吻合。小於限制且可處理時，單一內嵌 q4 ONNX 能減少路徑錯誤。檔案 integrity、實際 byte size 與 runtime limits 仍需在完整模型測試中查核。

[WebLLM 官方 model registry](https://github.com/mlc-ai/web-llm/blob/main/src/config.ts)本次沒有直接列出 H2O Danube；[MLC 模型 registry](https://github.com/mlc-ai/mlc-llm/blob/main/python/mlc_llm/model/model.py)有 Llama／Mistral 等架構支援。這代表可能研究自行轉換與編譯的路徑，不代表只換 Hugging Face 模型 ID 就能載入。WebLLM 需要 MLC 格式權重與相符的 model library WASM，與本次 ONNX 檔案契約不同。

## 已驗證與尚待測試

已執行 `tests/q4_wasm_smoke.py`：Node 24 主機使用上述固定版本 ORT Web，明確指定 **WASM provider**、單執行緒，以 ONNX IR 10／opset 21 的 `com.microsoft::MatMulNBits`、4 bit、block size 32 計算兩列量化權重。實際輸出 `[32, 64]` 與預期相同。這驗證封裝的 WASM int4 算子，沒有使用 native ONNX provider。

可在 checkout 外安裝測試依賴並重現：

```bash
python -m pip install --target /tmp/q4-python onnx==1.17.0 protobuf
npm install --prefix /tmp/q4-runtime --cache /tmp/q4-npm-cache --ignore-scripts --no-audit --no-fund onnxruntime-web@1.22.0-dev.20250409-89f8206ba4
PYTHONPATH=/tmp/q4-python python tests/q4_wasm_smoke.py --runtime-dir /tmp/q4-runtime/node_modules/onnxruntime-web
```

此測試不等於完整 Danube 500M、Colab GPU 訓練、Safari 或 iPhone 13 已成功。完整驗證還需要下載權重，在 Colab 產生訓練與品質評估結果，匯出並比較原始／微調／q4 的相同測試集，以及實機量測初次下載、首次輸出、tokens/s、記憶體壓力、停止／取消與回到前景的行為。

早期 Hugging Face 請求曾回傳代理 `403 Forbidden`；後續重新讀取官方 API 與固定版本的原始檔成功，已核對 revision `c202f976c26875541e738ea978c8158fa536da9a` 的 [模型卡](https://huggingface.co/h2oai/h2o-danube3-500m-chat/blob/c202f976c26875541e738ea978c8158fa536da9a/README.md)、[config](https://huggingface.co/h2oai/h2o-danube3-500m-chat/blob/c202f976c26875541e738ea978c8158fa536da9a/config.json) 及 [tokenizer template](https://huggingface.co/h2oai/h2o-danube3-500m-chat/blob/c202f976c26875541e738ea978c8158fa536da9a/tokenizer_config.json)。模型卡標示 Apache-2.0；架構為 LlamaForCausalLM，16 層、hidden size 1536、16 attention heads、8 KV heads，最大位置長度 8192。這確認小型設定與模板，不代表完整權重下載或推論成功。正式 Colab 與網站仍需 Hugging Face／下載 CDN 連線；公開模型不應只因未設定 `HF_TOKEN` 就被判斷為缺少憑證。

QLoRA／LoftQ 選項的「微調後至 q4」比較包含 NF4 基礎權重重載為 fp32、adapter 合併及 q4 的整體影響，呈現的是部署流程變化，不能單独歸因為純 q4 量化誤差。LoftQ 使用固定 SHA 的本機 safetensors 與 `alpha=r`，避免讀到可變的 `main` 或將補償縮放兩倍。

## 學測例句的品質評估

比較方法時保持基礎模型、資料切分、seed、訓練 token 預算與 decoding 參數一致。將測試字彙與訓練字彙分開，並依詞性、字義、搭配、抽象／具體詞分層，避免靠記住示範句取得高分。至少比較原始 chat 模型、LoRA／QLoRA 模型及最終 ONNX q4 模型。

自動檢查輸出格式、目標詞是否出現、句數與長度，只能檢查機械條件。字義正確、自然搭配、文法、難度及繁體中文解釋需要英語教師或具能力的人工評閱。以「詞義／文法／搭配各項通過率」呈現，並保留失敗例句；不能用格式通過率冒充學測品質或把 GSM8K 等研究結果移植成學測成效。
