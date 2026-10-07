# 單字錄音、裝置朗讀與音標來源

本頁的單字發音不需要帳號或 API 金鑰，也不下載語音模型。第一次載入網站、切換單字、搜尋及看例句，都不會連線到外部發音服務。

發音偏好可選「自動備援」、「字典錄音優先」、「Wikimedia 錄音優先」或「只用裝置語音」，並可選美式／英式口音與三種速度。偏好儲存在本機，調整設定本身不會查詢錄音。自動模式在點按播放後依序嘗試 [Free Dictionary API](https://dictionaryapi.dev/)、[Wikimedia Commons](https://commons.wikimedia.org/) 的公開錄音，最後使用裝置英文語音；指定錄音來源時，只查詢該來源，失敗後使用裝置語音。

Free Dictionary API 依英文詞條查詢，播放其回傳、位於 `api.dictionaryapi.dev` 或 `upload.wikimedia.org` 的 HTTPS 錄音。錄音按檔名明確標示的口音排序，先選所偏好的口音，再選另一個已標示口音，最後才選未標示的錄音。網站不猜測未標示音檔的口音，不以音標字串拼湊音檔網址。錄音出處與 API 對該錄音提供的授權名稱會隨播放來源顯示；若沒有該錄音的出處連結，連結直接指向音檔。不把詞條文字的授權當成錄音授權。

Free Dictionary API 是公開社群服務，並不是 Cambridge、Oxford 或 Merriam-Webster 的官方 API。官方專案 [使用說明](https://github.com/meetDeveloper/freeDictionaryAPI) 提供無金鑰的英文查詢範例。錄音可能來自公開字典或 Wikimedia 貢獻者；來源、授權及字形覆蓋率依實際回應而定，不能承諾商業字典等級的審校或服務 SLA。

Wikimedia 備援使用 [MediaWiki Action API](https://www.mediawiki.org/wiki/API:Imageinfo)，每次只查六個確切候選檔案名稱：`En-us-<word>`、`En-uk-<word>`、`En-<word>` 各搭配 `.ogg` 與 `.mp3`。候選名稱用來查詢中繼資料，並非捏造可播放的音檔網址。只有 API 證實檔案位於 File 命名空間、媒體類型為音訊、音檔及來源頁的檔名皆吻合時，才使用回傳的 Wikimedia 音檔。獨立取得的錄音還必須具有可核對的 CC BY、CC BY-SA、CC0 或公有領域標記；需署名的錄音必須有作者欄位。播放狀態顯示出處、授權與作者。這種有限查詢可能找不到使用其他命名方式的錄音，不能視為完整 Wiktionary 發音目錄。

沒有錄音、離線、查詢逾時、媒體無法播放，或查詢的是完整片語時，網站改用裝置上已安裝的本機英文聲線。例句一律使用此本機聲線。僅選取 `localService === true` 的英文聲線，不默默換成瀏覽器的遠端語音；作業系統與瀏覽器仍決定可用聲線。所選口音未安裝時會標明實際改用的口音；沒有本機英文聲線時，顯示下載英文語音的提醒，以及權威字典查詢連結。瀏覽器播放權限、裝置聲線和網路狀態會影響結果。

每次中繼資料查詢最長等待 3.5 秒，單個錄音開始最長等待 5 秒。每個來源最多嘗試兩個錄音，全程最多三個不同音檔，並共享 12 秒的公開錄音總預算；所有查詢、啟播及播後停滯都受剩餘預算限制，預算耗盡就釋放媒體並改用本機語音。聲線尚未載入時另外最多等候 1.2 秒。本機朗讀有播放逾時監控，最少 30 秒並依句長調整。

成功查詢的錄音資料僅在本頁記憶體快取，每個來源最多 128 詞；最近再次使用的詞會移至快取末端。沒有錄音的查詢和失敗資料不永久快取；播放失敗會清除該詞的來源快取，使下一次點按可重新取得資料。不下載全詞表音檔。切換單字、再次播放、變更偏好或停止，都會取消舊查詢與播放，避免舊錄音稍後覆蓋目前單字。錄音與裝置朗讀都只接受一次完成結果，延後或重複的瀏覽器事件不會覆蓋成功／失敗狀態。

## 權威字典核對

- [Cambridge Dictionary](https://dictionary.cambridge.org/dictionary/english/) 提供詞義與英、美發音供人工核對。
- [Oxford Learner's Dictionaries](https://www.oxfordlearnersdictionaries.com/definition/english/) 提供學習者詞義、用法與發音。
- [Merriam-Webster](https://www.merriam-webster.com/) 可核對美式詞義與發音；其印刷音標是自有符號系統。

網站提供連到字典詞條的查詢連結，不抓取、轉存或聲稱使用這些商業字典的音檔。這些查詢頁面可以不用本站 API 金鑰開啟，但頁面是否可用及內容授權由各出版社決定。

## 音標標示

原 ECDICT 詞表音標保留其來源；IPA 音標不能直接改名為 KK。新的 KK 資料依建置來源另行標明，沒有 KK 資料的詞條必須明確顯示原音標或未收錄。Free Dictionary API 回傳的 phonetic 字串不覆蓋本站 KK 欄位。

## 驗證與雲端網路

`node --test tests/pronunciation.cjs` 的 31 項測試驗證不自動連線、字典與 Commons 中繼資料、來源／授權／署名標示、錯誤來源拒絕、口音與速度偏好、本機儲存失敗、裝置備援、聲線延後載入、切換取消、總等待預算、播放與朗讀逾時、重複事件、來源去重與快取回復。

2026-10-08 在開發環境重新執行實際查詢：`api.dictionaryapi.dev` 的 `study` 詞條在 10 秒內未收到資料而逾時；`commons.wikimedia.org/w/api.php` 被代理伺服器以 CONNECT 403 拒絕。這些結果未證明外部錄音可播放。單元測試使用明確的模擬回應與媒體播放器，不能視為外部服務的連線驗證。要在此雲端環境驗證線上錄音，網路設定需允許 `api.dictionaryapi.dev`、`commons.wikimedia.org` 及 `upload.wikimedia.org`，再重試實際詞條、中繼資料與回傳音檔。本站本機朗讀不依賴這些網域；不會為發音服務新增秘密金鑰或停用 TLS 驗證。

舊的 `local-tts.js` 與 Kokoro 資料夾保留為歷史實作，現行頁面不載入它們。
