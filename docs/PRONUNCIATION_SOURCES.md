# 單字錄音、裝置朗讀與音標來源

本頁的單字發音不需要帳號或 API 金鑰，也不下載語音模型。第一次載入網站、切換單字、搜尋及看例句，都不會連線到外部發音服務。

只有按下「字典發音」才會查詢 [Free Dictionary API](https://dictionaryapi.dev/) 的英文詞條。播放 API 回傳、位於 `api.dictionaryapi.dev` 或 `upload.wikimedia.org` 的 HTTPS 錄音；優先採用檔名明確標示為美式的音檔，其次為英式，再選未標示口音的錄音。網站不猜測未標示音檔的口音，不以音標字串拼湊音檔網址。錄音出處與 API 對該錄音提供的授權名稱會隨播放來源顯示；授權和原始來源保留在狀態資料中，可由「錄音出處」開啟核對。若沒有該錄音的出處連結，連結直接指向音檔；不把詞條文字的授權當成錄音授權。

Free Dictionary API 是公開社群服務，並不是 Cambridge、Oxford 或 Merriam-Webster 的官方 API。官方專案 [使用說明](https://github.com/meetDeveloper/freeDictionaryAPI) 提供無金鑰的英文查詢範例。錄音可能來自公開字典或 Wikimedia 貢獻者；來源、授權及字形覆蓋率依實際回應而定，不能承諾商業字典等級的審校或服務 SLA。

沒有錄音、離線、查詢逾時、媒體無法播放，或查詢的是完整片語時，網站改用裝置上已安裝的本機英文聲線。例句一律使用此本機聲線。僅選取 `localService === true` 的英文聲線，不默默換成瀏覽器的遠端語音；作業系統與瀏覽器仍決定可用聲線。如果裝置沒有本機英文聲線，網站顯示下載英文語音的提醒，以及權威字典查詢連結。瀏覽器播放權限、裝置聲線和網路狀態會影響結果。

查詢最長等待 3.5 秒，錄音開始最長等待 5 秒；失敗時會釋放媒體並嘗試本機朗讀。成功查詢的錄音資料僅在本頁記憶體快取（最多 128 詞），不下載全詞表音檔。切換單字、再次播放或停止，都會取消舊查詢與播放，避免舊錄音稍後覆蓋目前單字。

## 權威字典核對

- [Cambridge Dictionary](https://dictionary.cambridge.org/dictionary/english/) 提供詞義與英、美發音供人工核對。
- [Oxford Learner's Dictionaries](https://www.oxfordlearnersdictionaries.com/definition/english/) 提供學習者詞義、用法與發音。
- [Merriam-Webster](https://www.merriam-webster.com/) 可核對美式詞義與發音；其印刷音標是自有符號系統。

網站提供連到字典詞條的查詢連結，不抓取、轉存或聲稱使用這些商業字典的音檔。這些查詢頁面可以不用本站 API 金鑰開啟，但頁面是否可用及內容授權由各出版社決定。

## 音標標示

原 ECDICT 詞表音標保留其來源；IPA 音標不能直接改名為 KK。新的 KK 資料依建置來源另行標明，沒有 KK 資料的詞條必須明確顯示原音標或未收錄。Free Dictionary API 回傳的 phonetic 字串不覆蓋本站 KK 欄位。

## 驗證與雲端網路

`node --test tests/pronunciation.cjs` 驗證不自動連線、字典錄音與實際來源標示、裝置備援、聲線延後載入、不同字切換、停止、各階段逾時與錯誤回復。

2026-10-07 的開發環境能讀取 Free Dictionary API 的 GitHub 使用說明，但向 `api.dictionaryapi.dev` 的實際英文查詢回應為 HTTP 403；目前網路政策沒有允許該網域。單元測試使用明確的模擬字典回應與媒體播放器，不能視為外部錄音已連線驗證。要在此雲端環境驗證線上錄音，設定需允許 `api.dictionaryapi.dev` 及 `upload.wikimedia.org`，再重試實際英文詞條與回傳音檔。本站本機朗讀不依賴這些網域；不會為發音服務新增秘密金鑰或停用 TLS 驗證。

舊的 `local-tts.js` 與 Kokoro 資料夾保留為歷史實作，現行頁面不載入它們。
