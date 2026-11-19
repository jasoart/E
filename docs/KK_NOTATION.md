# KK 美式音標顯示層

使用 [Carnegie Mellon University 的 CMU Pronouncing Dictionary](https://github.com/cmusphinx/cmudict) 美式 ARPAbet 音段，轉換成 KK 常用符號。這是本站轉寫，不是出版社逐詞審訂的 KK 欄位，也不把原 ECDICT 的 IPA 改名為 KK。原詞表音標仍可展開查看。

來源固定在 commit `74790861f652b15e4ac49015a90074ad62a27690`，字典檔 SHA-256 為 `81917843c7f44ce2b094ac63873c2c7a4cf802040792c455ba3ca406891c3d22`。授權完整保存在 `assets/data/cmudict.LICENSE.txt`；網站音標說明連結來源與授權。

`EY`、`OW` 分別顯示 `[e]`、`[o]`，`ER1/2` 顯示 `[ɝ]`，`ER0` 顯示 `[ɚ]`，`AH0` 顯示 `[ə]`。重音保留 CMU 的主、次重音，以 KK 常用的 `ˋ`、`ˏ` 標記。CMU 不提供音節邊界，標記位置使用英語可能聲母群推估，因此介面明示「重音位置依音節規則推估」。不自行省略 CMU 收錄的次重音。

原有 6,012 詞條中 5,998 詞有可核對的 CMU 發音；沒有對應的詞保留原音標，明示 KK 尚未收錄。斜線或括號詞條保留明確列出的變化字。不同發音全部收錄，但不在沒有詞性標記時猜測某一發音必然對應某詞性。新增學測延伸詞由同一工具重新產生。

重新建置時，先取得上述固定版本的 `cmudict.dict`，再執行：

```sh
python3 tools/build_kk_pronunciation.py \
  --dictionary /path/to/cmudict.dict \
  --sha256 81917843c7f44ce2b094ac63873c2c7a4cf802040792c455ba3ca406891c3d22 \
  --notebook research/exam_notebook.json
```

檔案雜湊不符即拒絕建置；不變更預期雜湊來略過驗證。`tests/test_kk_pronunciation.py` 檢查美式母音、schwa、rhotic vowel、重音、明確詞形及多發音處理。這些檢查驗證轉寫方法，不能替代詞典編輯與真人音檔聽辨。
