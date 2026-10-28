# 離線雙語參考句

此資料層把社群句庫與本站自編的 15–30 詞學測情境句分開。英文、中文、兩名作者與各自的 Tatoeba 句子編號均保留；畫面提供兩個原句連結及 [CC BY 2.0 France](https://creativecommons.org/licenses/by/2.0/fr/) 授權連結。參考句可朗讀、複製及遮字練習，不標示為本站自編或官方真題。

## 來源與授權

- 原始語料為 [Tatoeba](https://tatoeba.org/) 社群句子及翻譯，透過 [ManyThings 英中句對](https://www.manythings.org/anki/)整理。使用的固定來源快照是 [JYRoy/TransformerEN2CN 的 `datasets/cmn.txt`](https://github.com/JYRoy/TransformerEN2CN/blob/main/datasets/cmn.txt)，Git blob `a14124a158ff4ac6415aa77fd3aad1fb3cb5cd73`。來源每筆均附 CC BY 2.0 FR 與兩位作者、兩個句子 ID。
- 中文原句可能是簡體或繁體。為閱讀方便，以 OpenCC 的字詞對照表做最長匹配與臺灣字形轉換；這是簡化的兩階段對照，並非 OpenCC 完整分詞演算法，也不是人工逐句翻譯。字形有變動時可在卡片展開原中文。OpenCC 表來自 [BYVoid/OpenCC](https://github.com/BYVoid/OpenCC)，Apache 2.0 授權副本見 [`opencc.LICENSE.txt`](../assets/data/opencc.LICENSE.txt)。
- 篩選後的原始英文、原中文、轉換結果與作者編號保存在 `research/tatoeba-sentence-pairs.json`。社群語料並非完整人工審稿；詞形和難度篩選是規則，不保證句意、翻譯、搭配或適合所有詞義。請依上下文和來源核對。

## 篩選、數量與限制

收錄 9–30 英文詞的完整候選句，去除相同英文的多份翻譯，優先保留轉換較少的中文；檢查句子基本結構、目標詞實際詞形及遮字匹配，排除其他已知六級詞和進階字周邊用詞。排序偏向較長及具有連接線索的句子，每詞最多選 12 句。這些參考句可短於自編學測情境句，故不提供虛構的逐句文法解析或官方題型分類。

生成統計與逐詞缺口以 `research/reference_sentence_coverage.json` 為準。現有 2,567 個不同參考句帶來 8,194 次詞條顯示；加上自編句後，6,024 詞中有 1,374 詞達 11 句、4,650 詞尚未達標，缺口合計 33,160 次不同句子配對。閱讀專區另有 80 個題材補充詞，尚未納入這套索引。不同詞可共用同一句，顯示次數不等於獨立句數；既有上傳 Anki 原句仍在備查區，不算入上述兩類。

## 重建

```sh
# 若只更新已保存的句對或本站原創資料：
node research/build_reference_sentences.cjs
node research/build_reference_sentences.cjs --check
python3 tools/validate_site.py --refresh-hashes
```

如需重新從來源快照匯入，下載上列固定版本的 `cmn.txt` 及 OpenCC `STCharacters.txt`、`STPhrases.txt`、`TWVariants.txt`、`TWVariantsPhrases.txt`，再執行：

```sh
python3 research/import_tatoeba_pairs.py --source /path/to/cmn.txt --opencc-directory /path/to/opencc-dictionaries
node research/build_reference_sentences.cjs
```

目前字典 blob SHA 分別是 `677e8fbc70dcdc1da477b9f6c9f42a6b33609ae0`、`eb0e131eaffdd4a2e9c2e4673b4f48854b688819`、`5eed7ea81979f57e207de551f8c9f44328d54b82`、`ce196cd48662fbb1f6a11359331de23833b50d3a`。如上游字典更新，重建前先固定並核對版本，以免輸出改變。
