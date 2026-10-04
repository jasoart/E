# 本機單字與例句語音

網站的單字與內建例句共用一個播放入口。原先的 Dictionary API、Wiktionary／Wikimedia、Tatoeba 錄音播放路徑已從 `assets/js/audio.js` 移除；語音文字不傳送到 TTS 服務。未載入 Kokoro 時，網站選擇瀏覽器標示 `localService: true` 的英文裝置聲線。只有遠端聲線時會提示下載本機英文聲線，不會自動選用遠端聲線。

## 使用方式

1. 開啟網站後可直接按單字或例句的播放鍵，使用裝置英文語音。
2. 要使用 Kokoro，按「載入本機 WebGPU 語音」。程式先確認 HTTPS／localhost、`navigator.gpu` 與 `requestAdapter()` 的實際結果，通過才下載語音執行程式與模型。
3. 模型就緒後，同樣的播放鍵改用 Kokoro 在裝置合成音訊。停止或切換單字會取消播放，較早的推論即使完成也不會播出。
4. 記憶體不足、GPU 初始化／推論失敗時會顯示狀態，回到裝置英文聲線；可再次按載入按鈕重試。

模型第一次下載約 **326 MB**；網站自帶的 JavaScript 與 ONNX Runtime 執行檔另外約 **24 MB**。還有聲線與 tokenizer 檔案，因此首次總下載量約 350 MB，應使用穩定連線。瀏覽器快取可減少重複下載，但可能被系統清除，不能保證離線可用。網站不在開頁、搜尋或切換單字時自動下載模型。

這項語音功能本身使用 82M 參數的語音模型；網站的搜尋、例句教學與作文分析可使用無模型演算法。兩者的用途不同。語音不做聲音複製，也沒有辨識或評分學生錄音的功能。

## 技術選擇與官方來源

| 項目 | 實作與依據 |
| --- | --- |
| 模型 | [onnx-community/Kokoro-82M-v1.0-ONNX](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/tree/1939ad2a8e416c0acfeecc08a694d14ef25f2231)，固定 revision `1939ad2a8e416c0acfeecc08a694d14ef25f2231`；模型卡標示 Apache-2.0。 |
| WebGPU 精度 | [Kokoro.js 官方使用說明](https://github.com/hexgrad/kokoro/blob/664c76a704021239ba59c84dcbaa4d3dece01fe9/kokoro.js/README.md)明確建議 WebGPU 使用 `fp32`，本版遵循此建議，沒有把未驗證的量化精度當成裝置可用保證。 |
| 檔案 | `onnx/model.onnx` 為 325,532,232 bytes；Hugging Face LFS SHA-256 為 `8fbea51ea711f2af382e88c833d9e288c6dc82ce5e98421ea61c058ce21a34cb`。這是官方檔案中繼資料，沒有宣稱本機下載過全量模型並比對。 |
| 聲線 | `af_heart`，輸出 24 kHz、單聲道 Float32 PCM，再用 Web Audio 播放。模型、tokenizer 與聲線均鎖定上述 revision。 |
| 瀏覽器推論 | Kokoro.js 1.2.1、Transformers.js 3.8.1、ONNX Runtime Web `1.22.0-dev.20250409-89f8206ba4`；全部執行程式從同站 `assets/vendor/kokoro/` 載入，不用 CDN。 |
| iPhone／Safari | [WebKit 的 Safari 26 beta 官方公告](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26/)說明加入 WebGPU，涵蓋 iOS，並提到 Transformers.js 與 ONNX Runtime。這不等於已驗證本網站、Kokoro 或每一台 iPhone 13。實作以功能與 GPU adapter 檢查判斷；較舊的 Safari 可能直接使用裝置語音。 |

上游 Kokoro.js 1.2.1 的預設聲線下載使用會變動的 `resolve/main`，且 `from_pretrained` 沒有傳遞 revision。本站的 `entry.mjs` 直接以固定 revision 初始化模型與 tokenizer，覆寫聲線 tensor 載入，避開這兩項問題。原始依賴沒有修改。模型若初始化失敗會釋放已載入的資源；推論失敗後停止使用失效的 runtime。

WebGPU 執行來源設為 `device: "webgpu"`，ONNX Runtime 仍可能在 CPU／WASM 處理特定算子；這是同裝置推論。`numThreads: 1` 避免網站必須先提供跨來源隔離標頭。Web Audio 在播放按鍵當下先解鎖，然後等待合成，以減少 iOS 阻擋稍後播放的情況。

## 完全同站部署模型

預設只在明確點按後，向 Hugging Face 取得固定版本的檔案；不會向其傳送播放文字。若希望執行時完全不連 Hugging Face，可把同一 revision 的檔案放在：

```text
assets/models/kokoro/
  config.json
  tokenizer.json
  tokenizer_config.json
  onnx/model.onnx
  voices/af_heart.bin
```

模型資料夾需保留模型的授權與來源說明。下載檔案時核對上述模型 SHA-256。接著在 `index.html` 的 `<html>` 加入 `data-local-voice-source="site"`。同站模式設定 `allowRemoteModels: false`、`local_files_only: true`，檔案缺少時會明確失敗並回到裝置語音，不會轉向 Hugging Face 或 CDN。模型大檔未納入此 Git 儲存庫；靜態託管平台的檔案大小限制需要實際確認。

## 重建與驗證

可直接使用儲存庫內的 runtime 檔案。要重建，使用 Node.js 與 npm：

```sh
cd assets/vendor/kokoro
npm ci --ignore-scripts
npm run build
```

`--ignore-scripts` 避免安裝僅供 Node 使用的 ONNX Runtime GPU binary；瀏覽器 build 不需要該 binary。`package-lock.json` 鎖定依賴完整版本與 npm integrity；`runtime-manifest.json` 記錄實際瀏覽器輸出檔案的 SHA-256。授權全文與來源在 [vendor NOTICE](../assets/vendor/kokoro/NOTICE.md)；Phonemizer 的 Apache wrapper 與其中 eSpeak NG 的 GPL 元件有分開記錄。

```sh
node --test tests/local-tts.cjs
```

本機驗證包括缺少 WebGPU／adapter 失敗時不下載、載入失敗重試、佇列取消與切字後丟棄舊合成、遠端系統聲線拒絕、字元限制、PCM 格式與播放時機。另以真實 Chromium 匯入自帶 bundle，沒有任何外站請求或瀏覽器程式錯誤。這些是程式與瀏覽器載入驗證；**尚未執行完整 Kokoro 模型推論，也未用 iPhone 13 實機測試音質、速度與記憶體**。

實機驗收仍須在 HTTPS 上測試首次下載、取消／切字、單字與長例句、背景返回、快取被清除與低記憶體。裝置不同不應顯示同樣的 GPU 效能保證。
