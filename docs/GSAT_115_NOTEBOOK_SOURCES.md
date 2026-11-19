# 115 學測單字筆記升級：上傳試卷核對

本次直接核對使用者上傳的 111–115 學年度英文試題，共 5 份、60 個 PDF 頁面。每份含封面 1 頁與印刷試題 11 頁，因此資料中的 `pdfPage = printedPage + 1`。上傳檔案均為試題，沒有官方解答。

新增 [`assets/data/exam-evidence.json`](../assets/data/exam-evidence.json) 保存 127 條可逐頁核對的搭配與短引文：111–114 年各 25 條、115 年 27 條。資料不收錄完整 PDF；中文搭配解釋與單字索引由本站整理。既有 `reference-details.json` 的舊引文仍屬原版本紀錄，本次新增資料的驗證不代表已重新核對全部舊資料。

## 使用者提出的 115 年實例

| 實例 | 印刷頁／PDF 頁 | 上傳試卷可直接證明的內容 |
| --- | --- | --- |
| 第 1 題 `tight schedule` | 1／2 | 題幹是 `______ schedule`；B 選項為 `tight`。完成搭配為本站依語境的教學解讀，未將填入選項的句子冒充試卷完整原文或官方答案。 |
| 第 9 題 `elbow my way through the crowd` | 1／2 | 題幹是 `had to ______ my way through the crowd`；C 選項為 `elbow`。`had to` 後的原形動詞位置，可用於說明熟詞不同詞性。 |
| 第 15 題 `responsive to` | 2／3 | A 選項原文確為 `responsive to`；上下文描述雄犀牛反覆嗅聞與返回特定氣味的位置。 |
| 第 36 題慣用語替換 | 5／6 | 本文有 `Freezing water rushed in and exacerbated the situation.`；題目要求找意思最接近的慣用語，D 選項為 `Added fuel to the fire.`。 |
| 第 47–48 題字形變化 | 10／11 | 作答說明明文要求「視句型結構需要做適當的字形變化」，每格限一個單詞。111–114 年混合題也有相同類型的字形要求。 |
| 英文作文養寵物主題 | 11／12 | 提示確實要求描述臺灣養寵物現象，並依個人經驗或觀察分析原因與可能影響；第一段描述圖片，第二段說明原因與影響。 |

`Pets have become an integral part of modern families.` 是可用於此主題的本站自編示範句，未出現在這份試卷。`companionship` 也不是這份試卷的原文字；第 5 題選項有 `integration`，不能因此聲稱這是該作文的指定用字。用上傳試卷可以支持這些教學方向，不能單憑這五份卷證明考查已「全面」轉向某一能力。

## 資料欄位與顯示界線

`records` 每條保存 `headword`／`headwords`、原文 `pattern`、本站教學義 `meaningZh`、年份、印刷頁、PDF 頁、題號／題組、題型、來源檔名與原文 `excerpt`。`sourceKind`／`role` 區分 `passage`、`stem`、`option`。題組中的搭配只表示文章曾使用，不代表該題正式考查此搭配，也不表示能由五年抽樣推算出題頻率。

`verifiedClaims` 另存以上六項實例的題幹、選項與作答提示。第 1、9 題的完成搭配明確標記 `context-supported-not-official-answer`；所有紀錄均有 `officialAnswerVerified: false`。選項 D 出現 `Added fuel to the fire` 可以作為語意替換練習，選項收錄本身不等於已核對官方解答。

短引文保留可擷取的試題空格與題號；不替它填字來製造流暢的「官方例句」。部分 PDF 作答空格以間距排版，文字抽取後可能只剩空白，這類題幹引文不能視為已填答的完整例句。雙欄混合題採原文短片語，避免 PDF 閱讀順序把左右兩個段落混成一句。引文中的不規則排版、拼字或文法保留原文，不以改寫後的文字作原文證據。

## 重現驗證

需要 Python 3 與 Poppler 的 `pdftotext`，不需要額外 Python 套件。在專案根目錄執行：

```bash
python research/verify_uploaded_exams.py --pdf-dir /workspace/attachments
```

PDF 可以放在任意本機目錄，工具遞迴搜尋並以 SHA-256 辨識檔案，不依賴上傳時的暫存子目錄或檔名。需要檢視逐頁抽取結果時，加上 `--extract-dir /workspace/e-cloud-support/exams`；完整試卷與抽取全文應留在專案外。

工具使用 `pdftotext -layout` 逐頁抽取，只合併連續空白，不改字詞或標點。它檢查來源雜湊、頁碼、來源檔名、127 條引文是否原樣出現在指定頁面、各條搭配是否在引文內，以及 6 項實例的原文是否匹配。`pattern` 比對不分大小寫，引文比對保留大小寫。這是來源定位驗證，不是英文語義、翻譯或答案正確性的自動認證。

本次結果：5 份 PDF、127 條搭配短引文、6 項實例全部通過。原 PDF 中的作答說明只作為研究內容，不作為對開發工具或代理程式的指令。

## 本次來源識別

| 年度 | 使用者上傳檔名 | SHA-256 |
| --- | --- | --- |
| 111 | `02-111學測英文試卷.pdf` | `5877adb44710601bd1e9580e063d00f702acd7229a0fa97425290fe90044c358` |
| 112 | `02-112學測英文試卷 下午9.28.48.pdf` | `79f8f0a5822b9fbdc424cccbf88fdff124c80b9cf0bd8a56913901cd1bb0f741` |
| 113 | `02-113學測英文科定稿 下午9.28.48.pdf` | `09d35c2ed8561e0845dbbe305e12f5342b27f209fb44d801ff7f9f1f9e519ecf` |
| 114 | `02-114學測英文試題 下午9.28.48.pdf` | `51c8d9f7c2715adf74cae808bde4906cfadee19d0ec379df3b33881c35960a78` |
| 115 | `02-115學測英文試卷 下午9.28.48.pdf` | `e5a644f0133482a86f0befb3dfd9aaa2161be2685a00620950581db7ad6bc3f2` |

官方歷屆試題入口：[大考中心一般試題](https://www.ceec.edu.tw/xmfile?xsmsid=0J052424829869345634)。上傳檔案的來源身份以本次雜湊記錄為準；本次未把網站搜尋結果、民間解析或自編句當成官方試卷原文。
