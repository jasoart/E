# Google 音檔與音標來源

單字、片語與例句皆只使用 Google 音檔。查字、搜尋、切換詞條和變更設定不會自動載入音訊；按下播放後才連線。播放器不使用裝置朗讀、字典 API 或 Wikimedia 音檔。

美式單字先嘗試 `https://ssl.gstatic.com/dictionary/static/sounds/oxford/<word>--_us_1.mp3`；未收錄或播放失敗時，改用 `https://translate.google.com/translate_tts`。英式讀音、片語及例句直接使用 Google 語音音檔。過長例句在字詞邊界分段播放，不省略文字。口音和播放速度存於既有本機偏好 key，舊來源選項會轉為 Google。

播放器限制 HTTPS 及兩個確切 Google 主機、路徑，提供開始／播放逾時，並在切字、再按播放、變更偏好或停止時取消舊音訊。兩個 Google 來源皆無法播放時，明確顯示失敗，讓使用者再次點按重試。

狀態連結指向實際音檔，不推定 CC 授權或真人錄音。Gstatic 路徑的 oxford 不能視為 Oxford 官方開放 API。第三方音檔的涵蓋與可用性由 Google 決定。

KK 音標仍依 CMUdict 音段資料轉寫；保留原詞表音標與授權說明。音標不依播放器的來源改寫。

驗證使用模擬音訊事件和瀏覽器中的受控 WAV 音檔，涵蓋顯式播放、Google 來源限制、分段、失敗、逾時、切換取消、設定相容與實際音檔連結。這些檢查不代表已測試所有 Google 音檔的即時可用性。
