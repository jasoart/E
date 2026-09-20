# V6 程式驗證紀錄

使用 `node --test tests/regression.cjs`：**33 passed / 0 failed**。涵蓋 6,012 詞條啟動、原本收藏 key 與資料相容性、API 快取佇列、斷線／重試、2,500 條句型及 1,205 條新自編中英搭配、636 筆延遲來源文字索引、真題年度篩選、情境錯題與舊收藏進度分離。其既有依賴 API 的測試使用模擬回應，**不代表第三方服務實網性能已驗證**。

`tests/browser_smoke.py` 用 Playwright/Chromium 測試本機站；此執行環境對所有瀏覽器 URL，連 `data:`、`file:` 及 `localhost` 都報 `net::ERR_BLOCKED_BY_ADMINISTRATOR`，無法執行視覺、手機、實際互動或瀏覽器 localStorage 的端對端測試，不能將此測試列為通過。此限制不影響 Node 回歸測試的實際通過結果。部署後請手動在同源瀏覽器驗證：舊收藏仍在、搜尋、自編情境錯題加入與移出、111–115 年來源展開能請求 `reference-details.json`，再用手機檢查排版。

**102–110 年完整 PDF 未附於輸入 ZIP，因此尚未執行那九年份 PDF 的逐句核對或匯入測試。**站內提供官方歷屆試題索引，但不列任何未核對的 102–110 年真題來源紀錄。
