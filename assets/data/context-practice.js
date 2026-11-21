"use strict";
// Canonical self-authored question bank. IDs are permanent: never renumber persisted mistakes.
// Inspired by GSAT skills; these are not official questions or answer keys.
const GSAT_DIAG_QUESTIONS = [
  {
    "id": "ctx-001",
    "category": "搭配與語境",
    "prompt": "The city introduced new rules to _____ air pollution near schools.",
    "zh": "市府推出新規定，目的在降低學校附近的空氣污染。",
    "options": [
      "reduce",
      "reduce to",
      "increase to",
      "depend"
    ],
    "answer": 0,
    "explanation": "reduce + pollution 直接接名詞；不必加 to。引入規定與污染的語意關係是減少。"
  },
  {
    "id": "ctx-002",
    "category": "搭配與語境",
    "prompt": "Many families now rely _____ public transportation for work.",
    "zh": "許多家庭仰賴公共運輸通勤。",
    "options": [
      "in",
      "to",
      "on",
      "at"
    ],
    "answer": 2,
    "explanation": "rely on 為固定搭配，on 後接依賴的對象。"
  },
  {
    "id": "ctx-003",
    "category": "搭配與語境",
    "prompt": "The findings may lead _____ further research into this disease.",
    "zh": "研究發現可能促成後續研究。",
    "options": [
      "at",
      "to",
      "from",
      "with"
    ],
    "answer": 1,
    "explanation": "lead to + N／V-ing 表『導致、促成』；to 是介系詞。"
  },
  {
    "id": "ctx-004",
    "category": "搭配與語境",
    "prompt": "The project aims to raise awareness _____ food waste.",
    "zh": "該計畫旨在提高對食物浪費的認識。",
    "options": [
      "on",
      "for",
      "of",
      "to"
    ],
    "answer": 2,
    "explanation": "raise awareness of + N；注意不是 raise an awareness to。"
  },
  {
    "id": "ctx-005",
    "category": "搭配與語境",
    "prompt": "Students should base their conclusions _____ reliable evidence.",
    "zh": "學生應以可靠證據作為結論的基礎。",
    "options": [
      "from",
      "on",
      "for",
      "at"
    ],
    "answer": 1,
    "explanation": "base A on B：以 B 作為 A 的基礎。"
  },
  {
    "id": "ctx-006",
    "category": "搭配與語境",
    "prompt": "The report draws attention _____ the lack of clean water.",
    "zh": "這份報告使人注意到潔淨飲水不足。",
    "options": [
      "to",
      "for",
      "of",
      "in"
    ],
    "answer": 0,
    "explanation": "draw attention to + N；to 連接被注意的對象。"
  },
  {
    "id": "ctx-007",
    "category": "搭配與語境",
    "prompt": "The team collected data _____ hundreds of volunteers.",
    "zh": "研究團隊從數百名志工蒐集資料。",
    "options": [
      "in",
      "with",
      "from",
      "over"
    ],
    "answer": 2,
    "explanation": "collect data from + 來源；with 指工具或伴隨，不表示資料來源。"
  },
  {
    "id": "ctx-008",
    "category": "搭配與語境",
    "prompt": "The policy has had a positive impact _____ local communities.",
    "zh": "政策對在地社區產生正面影響。",
    "options": [
      "with",
      "on",
      "for",
      "at"
    ],
    "answer": 1,
    "explanation": "have an impact on + 受影響對象。"
  },
  {
    "id": "ctx-009",
    "category": "搭配與語境",
    "prompt": "Many people are concerned _____ the safety of their personal data.",
    "zh": "許多人擔心個資安全。",
    "options": [
      "for",
      "at",
      "about",
      "from"
    ],
    "answer": 2,
    "explanation": "be concerned about + 令人擔心的事情。"
  },
  {
    "id": "ctx-010",
    "category": "搭配與語境",
    "prompt": "The two methods differ _____ the amount of time they require.",
    "zh": "兩種方法在所需時間方面有所不同。",
    "options": [
      "in",
      "with",
      "of",
      "on"
    ],
    "answer": 0,
    "explanation": "differ in + 差異面向；differ from + 比較對象。"
  },
  {
    "id": "ctx-011",
    "category": "篇章轉承",
    "prompt": "The device is inexpensive. _____, it uses very little electricity.",
    "zh": "前句說價格低，後句補充耗電少。",
    "options": [
      "However",
      "In addition",
      "Instead",
      "Nevertheless"
    ],
    "answer": 1,
    "explanation": "後句提供另一項優點，屬遞進補充；In addition 合理，However 是轉折。"
  },
  {
    "id": "ctx-012",
    "category": "篇章轉承",
    "prompt": "The experiment was carefully designed. _____, the sample size was too small to draw firm conclusions.",
    "zh": "設計周詳，但樣本過小。",
    "options": [
      "Therefore",
      "Similarly",
      "However",
      "For example"
    ],
    "answer": 2,
    "explanation": "前後方向相反：設計周詳卻仍有限制，用 However。"
  },
  {
    "id": "ctx-013",
    "category": "篇章轉承",
    "prompt": "Several roads were flooded overnight. _____, the morning bus service was delayed.",
    "zh": "夜間道路淹水，造成早班公車延誤。",
    "options": [
      "As a result",
      "By contrast",
      "For instance",
      "Meanwhile"
    ],
    "answer": 0,
    "explanation": "前因後果，用 As a result；不要誤判為同時發生。"
  },
  {
    "id": "ctx-014",
    "category": "篇章轉承",
    "prompt": "Some birds migrate thousands of kilometers. _____, the Arctic tern travels between the Arctic and Antarctica.",
    "zh": "後句舉出鳥類長距離遷徙的具體例子。",
    "options": [
      "Otherwise",
      "For example",
      "In contrast",
      "As a result"
    ],
    "answer": 1,
    "explanation": "從一般敘述到一個具體物種，用 For example。"
  },
  {
    "id": "ctx-015",
    "category": "篇章轉承",
    "prompt": "Many residents support the plan. _____, others are concerned about its cost.",
    "zh": "前後分別是支持者與憂慮者。",
    "options": [
      "In other words",
      "Likewise",
      "On the other hand",
      "Consequently"
    ],
    "answer": 2,
    "explanation": "引介另一群人的相異觀點，用 On the other hand。"
  },
  {
    "id": "ctx-016",
    "category": "篇章轉承",
    "prompt": "The results are preliminary. _____, further testing is necessary.",
    "zh": "結果只是初步的，所以需要進一步測試。",
    "options": [
      "Therefore",
      "Nevertheless",
      "In contrast",
      "For example"
    ],
    "answer": 0,
    "explanation": "結果尚未確定是原因，需要測試是推論出的後果。"
  },
  {
    "id": "ctx-017",
    "category": "篇章轉承",
    "prompt": "The app is easy to use. _____, its privacy settings are difficult to find.",
    "zh": "容易操作，隱私設定卻難找。",
    "options": [
      "In addition",
      "However",
      "For this reason",
      "Similarly"
    ],
    "answer": 1,
    "explanation": "容易使用與設定難找構成反差，選 However。"
  },
  {
    "id": "ctx-018",
    "category": "篇章轉承",
    "prompt": "The study included adults from five cities. _____, it did not include participants living in rural areas.",
    "zh": "都市樣本有涵蓋，但鄉村樣本未涵蓋。",
    "options": [
      "In fact",
      "Moreover",
      "However",
      "That is"
    ],
    "answer": 2,
    "explanation": "後句指出研究取樣的限制，應使用轉折。"
  },
  {
    "id": "ctx-019",
    "category": "指代與連貫",
    "prompt": "Mina borrowed a book from Aya. She returned it the next day. What does “it” most directly refer to?",
    "zh": "判斷 it 指向哪個先前提到的名詞。",
    "options": [
      "Mina",
      "Aya",
      "the book",
      "the next day"
    ],
    "answer": 2,
    "explanation": "it 作 returned 的受詞，對應可歸還的事物 the book，而不是人或時間。"
  },
  {
    "id": "ctx-020",
    "category": "指代與連貫",
    "prompt": "The museum reduced its ticket price. This change attracted more visitors. What is “This change”?",
    "zh": "This change 回指前一句的哪一項改變？",
    "options": [
      "the museum building",
      "the lower ticket price",
      "more visitors",
      "the old ticket"
    ],
    "answer": 1,
    "explanation": "This change 是前句整個『降低票價』的事件，而非僅指博物館。"
  },
  {
    "id": "ctx-021",
    "category": "指代與連貫",
    "prompt": "A storm damaged the bridge. As a result, it remained closed for a week. What remained closed?",
    "zh": "it 的指稱須符合 closed 的語意。",
    "options": [
      "the storm",
      "the bridge",
      "the week",
      "the result"
    ],
    "answer": 1,
    "explanation": "bridge 才能因受損而關閉；要同時檢查語法位置與情境。"
  },
  {
    "id": "ctx-022",
    "category": "指代與連貫",
    "prompt": "Some students chose printed textbooks; others preferred digital ones. What does “ones” replace?",
    "zh": "ones 代替前句的複數名詞。",
    "options": [
      "students",
      "preferences",
      "textbooks",
      "printed pages"
    ],
    "answer": 2,
    "explanation": "ones 對應 textbooks；digital 修飾被省略的同一類名詞。"
  },
  {
    "id": "ctx-023",
    "category": "指代與連貫",
    "prompt": "The researchers found an unusual pattern. They then tested it with new data. What does “it” refer to?",
    "zh": "研究者用新資料驗證的對象是什麼？",
    "options": [
      "the researchers",
      "the unusual pattern",
      "the new data",
      "the test"
    ],
    "answer": 1,
    "explanation": "it 回指前句受詞 an unusual pattern；new data 是驗證工具。"
  },
  {
    "id": "ctx-024",
    "category": "指代與連貫",
    "prompt": "The city planted trees along the road. These trees now provide shade. What are “These trees”?",
    "zh": "these + 名詞通常就近承接已提及的實體。",
    "options": [
      "existing buildings",
      "trees planted along the road",
      "all forests",
      "road signs"
    ],
    "answer": 1,
    "explanation": "these trees 是先前種植的路樹；留意名詞重複帶來的篇章連貫。"
  },
  {
    "id": "ctx-025",
    "category": "研究判讀",
    "prompt": "Researchers observed a link between screen time and sleep quality. Which statement is most accurate?",
    "zh": "觀察到相關性，能直接證明因果嗎？",
    "options": [
      "Screen time was proven to cause poor sleep.",
      "The two variables were associated in the study.",
      "Every participant slept poorly.",
      "The study had no limitations."
    ],
    "answer": 1,
    "explanation": "observed a link 表相關，不足以單獨證明因果；留意研究設計和措辭強度。"
  },
  {
    "id": "ctx-026",
    "category": "研究判讀",
    "prompt": "The survey included only university students. Which conclusion stays within its evidence?",
    "zh": "樣本只包含大學生，結論不能直接擴大至所有年齡層。",
    "options": [
      "All people share the same view.",
      "The findings describe the surveyed university students.",
      "The results prove the policy is effective.",
      "The sample represents every citizen."
    ],
    "answer": 1,
    "explanation": "推論範圍應與受訪群體一致，不可無根據地外推到所有人。"
  },
  {
    "id": "ctx-027",
    "category": "研究判讀",
    "prompt": "The experiment was repeated and produced similar results. What does this most directly strengthen?",
    "zh": "多次實驗得到相近結果，增加哪方面的信心？",
    "options": [
      "The price of equipment",
      "The reproducibility of the result",
      "The number of possible explanations",
      "The age of the researcher"
    ],
    "answer": 1,
    "explanation": "重複試驗得到相近結果有助於支持可重現性，但不會自動證明所有因果解釋。"
  },
  {
    "id": "ctx-028",
    "category": "研究判讀",
    "prompt": "A graph shows that energy use fell from January to March. Which sentence matches the graph description?",
    "zh": "選擇與所給趨勢相符的敘述。",
    "options": [
      "Energy use increased steadily.",
      "Energy use remained unchanged.",
      "Energy use declined over the period.",
      "Energy use doubled each month."
    ],
    "answer": 2,
    "explanation": "fell 對應 declined，不能把下降寫成增加或不變。"
  },
  {
    "id": "ctx-029",
    "category": "研究判讀",
    "prompt": "The report states that 60% of respondents preferred buses. Which paraphrase is accurate?",
    "zh": "百分比主詞是受訪者，不是全體人口。",
    "options": [
      "All residents preferred buses.",
      "A majority of surveyed respondents preferred buses.",
      "Exactly 60% of all citizens preferred buses.",
      "No respondents preferred trains."
    ],
    "answer": 1,
    "explanation": "60% 只描述 respondents；多數不等於所有，受訪者不等於全體公民。"
  },
  {
    "id": "ctx-030",
    "category": "寫作與語意",
    "prompt": "Choose the sentence with a clear cause-and-effect relationship.",
    "zh": "選出清楚表達因果、語法也正確的句子。",
    "options": [
      "Because it rained, so the event was canceled.",
      "Because of it rained, the event was canceled.",
      "The event was canceled because it rained.",
      "Despite it rained, the event was canceled."
    ],
    "answer": 2,
    "explanation": "because 接完整子句；because of、despite 後接名詞／動名詞，且 because 不應和 so 重複連用。"
  },
  {
    "id": "ctx-031",
    "category": "寫作與語意",
    "prompt": "Choose the most suitable opening for a paragraph comparing two learning methods.",
    "zh": "題旨是比較兩種學習方法。",
    "options": [
      "This paragraph will compare online and classroom learning.",
      "Learning exists.",
      "Online learning is always better for everyone.",
      "I have nothing more to say about learning."
    ],
    "answer": 0,
    "explanation": "開頭直接說明比較主題；絕對化斷言未提供證據，也不利於客觀比較。"
  },
  {
    "id": "ctx-032",
    "category": "寫作與語意",
    "prompt": "Which sentence correctly introduces an example after a general claim?",
    "zh": "前句已有一般性主張，後句要提出例證。",
    "options": [
      "However, for example, therefore.",
      "For example, some schools have installed solar panels.",
      "As a result, there are many opinions.",
      "By contrast, a good example exists."
    ],
    "answer": 1,
    "explanation": "For example 後須接具體可辨認的例子，不能只堆疊轉承語。"
  },
  {
    "id": "ctx-033",
    "category": "寫作與語意",
    "prompt": "Complete the sentence: Students can improve their writing by _____ regularly.",
    "zh": "by 在此表示方法，後接動名詞。",
    "options": [
      "practice",
      "to practice",
      "practicing",
      "practiced"
    ],
    "answer": 2,
    "explanation": "by + V-ing 表手段或方式；本句不是不定詞 to V。"
  },
  {
    "id": "ctx-034",
    "category": "寫作與語意",
    "prompt": "Complete the sentence: The report suggests that the city _____ more trees.",
    "zh": "suggest that 後接建議事項；選最合適的動詞形式。",
    "options": [
      "plants",
      "plant",
      "planting",
      "to plant"
    ],
    "answer": 1,
    "explanation": "表建議的 suggest that + 主詞 + (should) 原形動詞；美式正式用法常省 should。"
  },
  {
    "id": "ctx-035",
    "category": "寫作與語意",
    "prompt": "Choose a suitable concluding sentence for a paragraph about reducing food waste.",
    "zh": "結尾應呼應段落主題與具體行動。",
    "options": [
      "Food is a very broad word.",
      "In conclusion, planning meals can help families waste less food.",
      "Therefore, every study is wrong.",
      "On the other hand, trees are tall."
    ],
    "answer": 1,
    "explanation": "總結句應回扣核心主題，並與前文的減少食物浪費措施連貫。"
  },
  {
    "id": "ctx-036",
    "category": "熟詞偏義",
    "prompt": "With the train about to leave, Leo had to _____ his way through the crowd.",
    "zh": "火車即將開動，Leo 得擠過人群。",
    "options": [
      "elbow",
      "kneel",
      "blink",
      "nod"
    ],
    "answer": 0,
    "explanation": "elbow 作動詞，elbow one’s way through 表「用手肘推擠著穿過」。kneel 跪、blink 眨眼、nod 點頭，均不合擠過人群的動作。"
  },
  {
    "id": "ctx-037",
    "category": "熟詞偏義",
    "prompt": "The editor questioned the claim because the report did not _____ its main conclusion.",
    "zh": "編輯質疑該主張，因為報告未提供支持主要結論的證據。",
    "options": [
      "support",
      "lift",
      "carry",
      "hold"
    ],
    "answer": 0,
    "explanation": "support a claim / conclusion 表「支持論點」，不是身體上的支撐；lift 提起、carry 攜帶、hold 握住，皆不表提供論據。"
  },
  {
    "id": "ctx-038",
    "category": "熟詞偏義",
    "prompt": "The committee will _____ the proposal at its next meeting before deciding whether to approve it.",
    "zh": "委員會會先處理提案，再決定是否批准。",
    "options": [
      "address",
      "mail",
      "post",
      "deliver"
    ],
    "answer": 0,
    "explanation": "address a proposal / issue 表「處理、探討」，address 不只指地址。其餘選項表示寄送或投遞，與會議審議的情境不合。"
  },
  {
    "id": "ctx-039",
    "category": "熟詞偏義",
    "prompt": "The second paragraph challenges the belief that expensive products are always better. What does “challenges” mean here?",
    "zh": "判斷動詞 challenge 在論述中的意思。",
    "options": [
      "calls into question",
      "accepts without doubt",
      "puts into practice",
      "learns by heart"
    ],
    "answer": 0,
    "explanation": "challenge a belief = question it，質疑某種信念；不是接受、實踐或背熟。challenge 作名詞另有「挑戰、難題」之義。"
  },
  {
    "id": "ctx-040",
    "category": "熟詞偏義",
    "prompt": "The guide asked visitors to _____ the narrow gap between the platform and the train.",
    "zh": "導覽員提醒旅客留意月台和列車間的縫隙。",
    "options": [
      "mind",
      "recall",
      "imagine",
      "memorize"
    ],
    "answer": 0,
    "explanation": "mind the gap 的 mind 是動詞「留意、當心」；recall 回想、imagine 想像、memorize 記住，均不表示當下小心跨越。"
  },
  {
    "id": "ctx-041",
    "category": "熟詞偏義",
    "prompt": "The school will charge a small fee for the optional trip. What does “charge” mean here?",
    "zh": "注意 charge 的受詞 a small fee。",
    "options": [
      "ask someone to pay",
      "accuse someone of a crime",
      "store electrical energy",
      "rush toward someone"
    ],
    "answer": 0,
    "explanation": "charge a fee 表「收費」。charge 也可指控、充電或衝向，但需依受詞和情境判讀，不能只背單一意思。"
  },
  {
    "id": "ctx-042",
    "category": "介系詞與搭配",
    "prompt": "A good teacher is responsive _____ students’ questions and adjusts the lesson when needed.",
    "zh": "老師會回應提問並視需要調整課程。",
    "options": [
      "to",
      "for",
      "at",
      "with"
    ],
    "answer": 0,
    "explanation": "be responsive to + 對象：對……有反應。此處 to 是介系詞；for、at、with 不符合此搭配。"
  },
  {
    "id": "ctx-043",
    "category": "介系詞與搭配",
    "prompt": "Because of her _____ schedule, Nina could spare only ten minutes for lunch.",
    "zh": "Nina 午餐只有十分鐘。",
    "options": [
      "tight",
      "loose",
      "distant",
      "hollow"
    ],
    "answer": 0,
    "explanation": "a tight schedule 是緊湊的行程，could spare only ten minutes 提供語境線索。loose 表寬鬆；distant 遙遠、hollow 中空皆不合。"
  },
  {
    "id": "ctx-044",
    "category": "介系詞與搭配",
    "prompt": "Many students find it difficult to adapt _____ a new school environment at first.",
    "zh": "學生起初可能難以適應新環境。",
    "options": [
      "to",
      "with",
      "at",
      "by"
    ],
    "answer": 0,
    "explanation": "adapt to + 環境，適應……。區分 adapt A for B（為 B 改編 A），介系詞由句型和語意決定。"
  },
  {
    "id": "ctx-045",
    "category": "介系詞與搭配",
    "prompt": "The success of the project depends _____ close cooperation among the members.",
    "zh": "合作是計畫能否成功的關鍵。",
    "options": [
      "on",
      "at",
      "into",
      "of"
    ],
    "answer": 0,
    "explanation": "depend on + N / V-ing 表「取決於、依賴」。on 後的 close cooperation 是名詞片語，其他介系詞不合。"
  },
  {
    "id": "ctx-046",
    "category": "介系詞與搭配",
    "prompt": "The campaign aims to prevent plastic waste _____ entering the ocean.",
    "zh": "活動旨在阻止塑膠垃圾進入海洋。",
    "options": [
      "from",
      "to",
      "with",
      "into"
    ],
    "answer": 0,
    "explanation": "prevent A from V-ing：阻止 A 做某事。進入海洋已由 entering the ocean 表達，不可在 prevent 結構中另改成 into。"
  },
  {
    "id": "ctx-047",
    "category": "介系詞與搭配",
    "prompt": "The volunteers are committed to _____ abandoned animals find new homes.",
    "zh": "志工致力於協助棄養動物找到新家。",
    "options": [
      "helping",
      "help",
      "helped",
      "helpful"
    ],
    "answer": 0,
    "explanation": "be committed to + N / V-ing 的 to 是介系詞，故接 helping；help 是原形、helped 是過去式或分詞、helpful 是形容詞。"
  },
  {
    "id": "ctx-048",
    "category": "詞性轉換",
    "prompt": "The community praised her _____ to the school’s reading program.",
    "zh": "居民讚許她對學校閱讀計畫的貢獻。",
    "options": [
      "contribution",
      "contribute",
      "contributive",
      "contributes"
    ],
    "answer": 0,
    "explanation": "her 後需要名詞核心，contribution to 表「對……的貢獻」。contribute 是動詞；contributive 是形容詞；contributes 是第三人稱單數動詞。"
  },
  {
    "id": "ctx-049",
    "category": "詞性轉換",
    "prompt": "The shelter depends on volunteers to care for animals _____.",
    "zh": "照顧動物時應有耐心。",
    "options": [
      "patiently",
      "patient",
      "patience",
      "patients"
    ],
    "answer": 0,
    "explanation": "修飾動詞片語 care for 用副詞 patiently。patient 為形容詞或「病人」名詞；patience 為「耐心」名詞；patients 為病人複數。"
  },
  {
    "id": "ctx-050",
    "category": "詞性轉換",
    "prompt": "The new website makes medical information more _____ to people with poor eyesight.",
    "zh": "新版網站讓視力不佳者更容易取得醫療資訊。",
    "options": [
      "accessible",
      "access",
      "accessibility",
      "accessibly"
    ],
    "answer": 0,
    "explanation": "make + 受詞 + 形容詞作受詞補語，選 accessible；access 可作名詞或動詞，accessibility 為名詞，accessibly 為副詞。"
  },
  {
    "id": "ctx-051",
    "category": "詞性轉換",
    "prompt": "Good communication can _____ misunderstandings before they become serious conflicts.",
    "zh": "良好溝通可以減少誤會。",
    "options": [
      "reduce",
      "reduction",
      "reduced",
      "reducing"
    ],
    "answer": 0,
    "explanation": "助動詞 can 後接原形動詞 reduce；reduction 是名詞，reduced 和 reducing 不是原形。"
  },
  {
    "id": "ctx-052",
    "category": "詞性轉換",
    "prompt": "The sudden _____ of the volunteer surprised everyone at the shelter.",
    "zh": "志工突然離開讓收容所的人都很驚訝。",
    "options": [
      "departure",
      "depart",
      "departed",
      "departing"
    ],
    "answer": 0,
    "explanation": "The sudden + 名詞 + of，選 departure「離開」。depart 為動詞；departed / departing 為分詞，不能在本結構中取代所需名詞。"
  },
  {
    "id": "ctx-053",
    "category": "詞性轉換",
    "prompt": "The two teams worked _____ to complete the rescue before sunset.",
    "zh": "兩隊密切合作以在日落前完成救援。",
    "options": [
      "closely",
      "closes",
      "closeness",
      "closing"
    ],
    "answer": 0,
    "explanation": "worked closely 表「密切合作」，副詞修飾動詞。closes 是第三人稱單數動詞；closeness 是名詞，closing 是分詞。"
  },
  {
    "id": "ctx-054",
    "category": "語境替換",
    "prompt": "Instead of calming the argument, his rude comment exacerbated the situation. Which phrase best replaces “exacerbated the situation”?",
    "zh": "他的失禮評論沒有平息爭執。",
    "options": [
      "added fuel to the fire",
      "broke the ice",
      "turned over a new leaf",
      "kept an eye on things"
    ],
    "answer": 0,
    "explanation": "exacerbate = worsen / aggravate，使惡化；add fuel to the fire 是火上加油。break the ice 打破僵局；turn over a new leaf 改過自新；keep an eye on 留意。"
  },
  {
    "id": "ctx-055",
    "category": "語境替換",
    "prompt": "Daily walks with her dog helped ease her anxiety. Which word is closest to “ease”?",
    "zh": "散步有助於紓解焦慮。",
    "options": [
      "relieve",
      "intensify",
      "conceal",
      "predict"
    ],
    "answer": 0,
    "explanation": "ease anxiety = relieve anxiety，減輕焦慮；intensify 加劇，conceal 隱藏，predict 預測，都不同於緩解。"
  },
  {
    "id": "ctx-056",
    "category": "語境替換",
    "prompt": "For some older adults, pets provide companionship. Which phrase best explains “companionship”?",
    "zh": "判斷寵物帶來的陪伴之意。",
    "options": [
      "the comfort of having a companion",
      "the cost of medical treatment",
      "the ability to live without help",
      "the pressure to compete with others"
    ],
    "answer": 0,
    "explanation": "companionship 指有人或動物相伴的情誼與慰藉，不是醫療花費、獨立能力或競爭壓力。可搭配 provide / offer companionship。"
  },
  {
    "id": "ctx-057",
    "category": "寫作句型",
    "prompt": "Which sentence best expresses「飼養寵物不僅帶來快樂，也需要長期的承諾」?",
    "zh": "留意主詞動名詞與 not only ... but also ... 的平行結構。",
    "options": [
      "Keeping a pet not only brings joy but also requires a long-term commitment.",
      "Keep a pet not only bring joy but also requiring a long-term commitment.",
      "Keeping a pet not only brings joy but also a long-term commitment is required.",
      "Keeping a pet not only to bring joy but also to require a long-term commitment."
    ],
    "answer": 0,
    "explanation": "Keeping a pet 作單數主詞，兩個並列動詞用 brings / requires。其餘選項分別有動詞形式、結構不平行或缺少限定動詞的問題。"
  },
  {
    "id": "ctx-058",
    "category": "寫作句型",
    "prompt": "Which sentence accurately compares the two percentages: 65% of surveyed students preferred dogs, while 35% preferred cats?",
    "zh": "只根據給定資料比較受訪學生的偏好。",
    "options": [
      "A larger proportion of the surveyed students preferred dogs than cats.",
      "All students preferred dogs to cats.",
      "The survey proved that dogs make better pets than cats.",
      "The number of students who preferred cats doubled."
    ],
    "answer": 0,
    "explanation": "a larger proportion ... than ... 準確比較比例；資料未支持全體學生、寵物好壞的因果結論或跨時間倍增。"
  },
  {
    "id": "ctx-059",
    "category": "寫作句型",
    "prompt": "Complete the sentence: _____ pets can offer comfort, owners must also consider the time and cost of caring for them.",
    "zh": "先承認陪伴的益處，再指出照顧責任。",
    "options": [
      "Although",
      "Because of",
      "Despite",
      "Therefore"
    ],
    "answer": 0,
    "explanation": "Although 接完整子句，表「雖然」。because of / despite 接名詞或動名詞；therefore 是連接副詞，不能以此標點連接兩個獨立子句。"
  },
  {
    "id": "ctx-060",
    "category": "歷屆延伸詞彙",
    "prompt": "The city built apartments with low rents so that housing would remain _____ for families on a tight budget.",
    "zh": "市府興建低租金公寓，好讓預算吃緊的家庭仍然負擔得起住房。",
    "options": [
      "adjustable",
      "affordable",
      "mandatory",
      "minimalist"
    ],
    "answer": 1,
    "explanation": "low rents 和 on a tight budget 都把線索指向負擔能力。affordable 描述價格可負擔，adjustable 描述可調整的設計。"
  },
  {
    "id": "ctx-061",
    "category": "歷屆延伸詞彙",
    "prompt": "More reminders had the opposite effect: volunteers started ignoring every message. The reminders were _____.",
    "zh": "更多提醒產生了反效果，志工開始忽略每則訊息。這些提醒適得其反。",
    "options": [
      "cost-effective",
      "unpredictable",
      "counterproductive",
      "timeless"
    ],
    "answer": 2,
    "explanation": "the opposite effect 已說明做法妨礙了原本目標，用 counterproductive。unpredictable 只指出難以預料，沒有說明結果的方向。"
  },
  {
    "id": "ctx-062",
    "category": "歷屆延伸詞彙",
    "prompt": "Instead of offering instant advice, Leo tried to imagine how his friend felt. His response showed _____.",
    "zh": "小立沒有馬上給建議，而是試著想像朋友的感受。他的回應展現了同理心。",
    "options": [
      "empathy",
      "serenity",
      "inclination",
      "individualism"
    ],
    "answer": 0,
    "explanation": "imagine how his friend felt 是站在對方立場理解感受。serenity 描述自己平靜的狀態。"
  },
  {
    "id": "ctx-063",
    "category": "歷屆延伸詞彙",
    "prompt": "The safety briefing is _____ for all guides. Anyone who misses it must attend a later session before working.",
    "zh": "所有導覽員都必須參加安全說明，缺席者得先補參加才能工作。",
    "options": [
      "therapeutic",
      "seasonal",
      "outdated",
      "mandatory"
    ],
    "answer": 3,
    "explanation": "must attend 和 before working 說明這是必要規定。seasonal 表示在特定季節發生，無法表達義務。"
  },
  {
    "id": "ctx-064",
    "category": "歷屆延伸詞彙",
    "prompt": "A second witness gave an account that directly opposed the first. The two accounts were _____.",
    "zh": "第二位目擊者的敘述直接牴觸第一位的說法，兩份證詞相互矛盾。",
    "options": [
      "recognizable",
      "contradictory",
      "inseparable",
      "uninhabited"
    ],
    "answer": 1,
    "explanation": "directly opposed 說明兩種說法互相抵觸。unbiased 是公正的，不足以表達矛盾關係。"
  },
  {
    "id": "ctx-065",
    "category": "歷屆延伸詞彙",
    "prompt": "Demand shot up for a week and then returned to normal. The analyst called it a temporary _____.",
    "zh": "需求僅暴增一週就回到平時水準，分析師稱之為短暫波動。",
    "options": [
      "craze",
      "cutback",
      "blip",
      "blackout"
    ],
    "answer": 2,
    "explanation": "temporary 和 returned to normal 描寫偏離趨勢後迅速恢復的小波動。cutback 是削減，與先上升的情境不合。"
  },
  {
    "id": "ctx-066",
    "category": "歷屆延伸詞彙",
    "prompt": "The vendor showed us how one _____ of garlic could flavor a whole bowl of noodles.",
    "zh": "攤販示範如何用一瓣大蒜替整碗麵提味。",
    "options": [
      "clove",
      "hoop",
      "neuron",
      "trench"
    ],
    "answer": 0,
    "explanation": "a clove of garlic 是一瓣蒜。clove 單獨使用時也可以指香料丁香，須看 of garlic 的搭配。"
  },
  {
    "id": "ctx-067",
    "category": "歷屆延伸詞彙",
    "prompt": "Only the labels had to be replaced each year. The sturdy boards themselves were _____.",
    "zh": "每年只需要更換標籤，堅固的看板本身可以反覆使用。",
    "options": [
      "short-lived",
      "residual",
      "outdated",
      "reusable"
    ],
    "answer": 3,
    "explanation": "only the labels 和 each year 表示看板能保留到下次使用。residual 意為殘餘的，不表示可以重複使用。"
  },
  {
    "id": "ctx-068",
    "category": "歷屆延伸詞彙",
    "prompt": "Knowing where the report got its figures made it more _____ in the readers' eyes.",
    "zh": "知道數據來自何處，讓讀者覺得報告更加可信。",
    "options": [
      "festive",
      "trustworthy",
      "intricate",
      "affordable"
    ],
    "answer": 1,
    "explanation": "能追查 figures 的來源，提升的是可信度。intricate 形容細節繁複，與資料可查證是不同面向。"
  },
  {
    "id": "ctx-069",
    "category": "歷屆延伸詞彙",
    "prompt": "The ferry stopped at four islands within the same _____. Each island had its own small harbor.",
    "zh": "渡輪停靠了同一群島內的四座島，每座島都有自己的小港口。",
    "options": [
      "staircase",
      "rainforest",
      "archipelago",
      "courtyard"
    ],
    "answer": 2,
    "explanation": "four islands 與 within the same 表示一個包含多座島嶼的地理單位，應用 archipelago。"
  },
  {
    "id": "ctx-070",
    "category": "歷屆延伸詞彙",
    "prompt": "A storm forced the team to start again, yet they returned every weekend. Their _____ impressed the neighbors.",
    "zh": "風暴讓團隊得重新開始，但他們每個週末都回來工作，這份毅力讓鄰居印象深刻。",
    "options": [
      "perseverance",
      "irritability",
      "imagery",
      "serenity"
    ],
    "answer": 0,
    "explanation": "受挫後仍反覆投入是 perseverance。serenity 表內心平靜，不能由每週堅持回來這個線索推出。"
  },
  {
    "id": "ctx-071",
    "category": "歷屆延伸詞彙",
    "prompt": "An hour after I turned off the stove, the pot's _____ heat was still enough to warm my hands.",
    "zh": "爐火關掉一小時後，鍋子的餘熱仍足以暖手。",
    "options": [
      "seasonal",
      "focal",
      "acoustic",
      "residual"
    ],
    "answer": 3,
    "explanation": "turned off the stove 和 an hour after 表示主要熱源移除後還留著熱，應選 residual。focal 表焦點的。"
  },
  {
    "id": "ctx-072",
    "category": "歷屆延伸詞彙",
    "prompt": "The bags were judged by overall cost and service life together. The longer-lasting one was more _____ despite its higher price.",
    "zh": "評估袋子時同時考慮成本與使用年限。耐用的那款雖然買得較貴，整體更划算。",
    "options": [
      "heartwarming",
      "cost-effective",
      "weightless",
      "timeless"
    ],
    "answer": 1,
    "explanation": "儘管單價較高，較長的使用年限可提高成本效益。timeless 指歷久不衰的風格，並非經濟評估。"
  },
  {
    "id": "ctx-073",
    "category": "歷屆延伸詞彙",
    "prompt": "For the owner, the boat was the family's _____: without it, nobody could earn money by fishing.",
    "zh": "對船主來說，船維繫全家生計，沒了它就無法捕魚賺錢。",
    "options": [
      "lifestyle",
      "headgear",
      "livelihood",
      "accompaniment"
    ],
    "answer": 2,
    "explanation": "earn money 把語意限定在謀生的來源。lifestyle 指生活方式，不能精確表達經濟依靠。"
  },
  {
    "id": "ctx-074",
    "category": "歷屆延伸詞彙",
    "prompt": "The photographer used the red door as the _____ point, drawing every viewer's eye to the center.",
    "zh": "攝影師用紅門作為焦點，把觀看者的目光吸引到中央。",
    "options": [
      "focal",
      "residual",
      "culinary",
      "periodic"
    ],
    "answer": 0,
    "explanation": "focal point 是視覺焦點，drawing every viewer's eye 說明它如何引導目光。residual 則指殘留。"
  },
  {
    "id": "ctx-075",
    "category": "歷屆延伸詞彙",
    "prompt": "Mina wants a strap she can shorten for cycling and lengthen for walking. It needs to be _____.",
    "zh": "小敏希望騎車時能調短背帶、走路時能調長，所以背帶必須可調整。",
    "options": [
      "recognizable",
      "festive",
      "vegan",
      "adjustable"
    ],
    "answer": 3,
    "explanation": "shorten 和 lengthen 都表示改變長度，兩個動作直接說明 adjustable 的設計功能。"
  },
  {
    "id": "ctx-076",
    "category": "歷屆延伸詞彙",
    "prompt": "We paid less because someone else had already owned the bicycle. We bought it _____.",
    "zh": "因為這輛自行車以前有其他車主，所以我們花得比較少。我們買的是二手車。",
    "options": [
      "nationwide",
      "second-hand",
      "periodically",
      "upstairs"
    ],
    "answer": 1,
    "explanation": "already owned 表示所有權曾屬別人。second-hand 在 bought it 後說明購買方式。"
  },
  {
    "id": "ctx-077",
    "category": "歷屆延伸詞彙",
    "prompt": "The two pieces of paper began to _____ into flakes when I tried to lift them from the damp box.",
    "zh": "我試著從潮濕的箱裡拿出那兩張紙時，它們開始碎成薄片。",
    "options": [
      "recharge",
      "collide",
      "disintegrate",
      "reestablish"
    ],
    "answer": 2,
    "explanation": "into flakes 指碎裂後化成的小片，符合 disintegrate。collide 著重物體相撞，常接 with。"
  },
  {
    "id": "ctx-078",
    "category": "歷屆延伸詞彙",
    "prompt": "The planners had enough money to repair only one hall, so they had to _____ the remaining funds among three activities.",
    "zh": "規劃者的錢只夠修一座禮堂，所以得在三項活動之間重新分配剩餘經費。",
    "options": [
      "redistribute",
      "withstand",
      "showcase",
      "eschew"
    ],
    "answer": 0,
    "explanation": "funds 是待分配的資源，among three activities 指分配對象。withstand 表承受，無法帶出分配關係。"
  },
  {
    "id": "ctx-079",
    "category": "歷屆延伸詞彙",
    "prompt": "The guide used a fan to test whether the paper tower could _____ a breeze without falling over.",
    "zh": "導覽員用風扇測試紙塔能否承受微風而不倒下。",
    "options": [
      "regain",
      "untangle",
      "recast",
      "withstand"
    ],
    "answer": 3,
    "explanation": "without falling over 說明塔要承受外力。withstand 直接接受詞 a breeze，無須介系詞。"
  },
  {
    "id": "ctx-080",
    "category": "歷屆延伸詞彙",
    "prompt": "Two cyclists swerved just in time to avoid colliding _____ each other.",
    "zh": "兩位騎士及時轉向，避免彼此相撞。",
    "options": [
      "from",
      "with",
      "at",
      "of"
    ],
    "answer": 1,
    "explanation": "動詞 collide 指明相撞對象時用 with。avoid 後用動名詞，所以原句已有 colliding。"
  },
  {
    "id": "ctx-081",
    "category": "歷屆延伸詞彙",
    "prompt": "During the meeting, Sara kept thinking about the loose rope on the bridge. She finally expressed her _____ about the plan.",
    "zh": "開會時，莎拉一直想到橋上那條鬆動的繩索，最後說出了她對計畫的不安。",
    "options": [
      "serenity",
      "timeliness",
      "uneasiness",
      "utilization"
    ],
    "answer": 2,
    "explanation": "kept thinking about the loose rope 表明她對風險感到不安。express uneasiness about 可接擔心的事項。"
  },
  {
    "id": "ctx-082",
    "category": "歷屆延伸詞彙",
    "prompt": "We could see every leaf clearly after adding the final shadows. The painting looked remarkably _____.",
    "zh": "加上最後幾道陰影後，每片葉子的模樣都清晰可見，畫作顯得極為逼真。",
    "options": [
      "lifelike",
      "unbiased",
      "mandatory",
      "reproductive"
    ],
    "answer": 0,
    "explanation": "葉片的細節與陰影讓畫面像真物，適合 lifelike。unbiased 評價立場公正，並非畫面逼真。"
  },
  {
    "id": "ctx-083",
    "category": "歷屆延伸詞彙",
    "prompt": "The map's station names had changed years ago. The information it gave travelers was _____.",
    "zh": "車站名稱多年前就改過了，這張地圖給旅客的資訊早已過時。",
    "options": [
      "groundbreaking",
      "culinary",
      "timeless",
      "outdated"
    ],
    "answer": 3,
    "explanation": "舊地圖未反映更名，資訊已經落後。timeless 描述歷久仍保有魅力，語意不同。"
  },
  {
    "id": "ctx-084",
    "category": "歷屆延伸詞彙",
    "prompt": "Plant roots cracked the pavement, causing a change in its shape. The engineer photographed this _____.",
    "zh": "樹根撐裂了路面，造成形狀改變。工程師拍下了這種變形。",
    "options": [
      "absorption",
      "deformation",
      "hydration",
      "regeneration"
    ],
    "answer": 1,
    "explanation": "a change in its shape 就是 deformation。regeneration 是重新生長或恢復的過程。"
  },
  {
    "id": "ctx-085",
    "category": "歷屆延伸詞彙",
    "prompt": "The bowl became thinner toward the edge, a detail that showed the _____ of the maker's work.",
    "zh": "碗緣逐漸變薄，這個細節表現出製作手藝的精緻細膩。",
    "options": [
      "blackout",
      "craving",
      "delicacy",
      "cutback"
    ],
    "answer": 2,
    "explanation": "此處 delicacy 指精細、細膩，of the maker's work 可協助判讀。文中沒有提到地方美食或菜餚。"
  },
  {
    "id": "ctx-086",
    "category": "歷屆延伸詞彙",
    "prompt": "Each cashier checked the same five items in the same order. The manager wanted _____ across all counters.",
    "zh": "每個櫃檯都依相同順序檢查相同的五個項目，經理希望各櫃檯作業一致。",
    "options": [
      "consistency",
      "imagery",
      "individualism",
      "dizziness"
    ],
    "answer": 0,
    "explanation": "the same ... in the same order 重複強調一致性。individualism 著重個人選擇，和標準化流程不同。"
  },
  {
    "id": "ctx-087",
    "category": "歷屆延伸詞彙",
    "prompt": "Sorting thousands of slides by hand was so _____ that the museum recruited ten additional volunteers.",
    "zh": "手工分類數千張幻燈片太耗時，博物館因此多找了十名志工。",
    "options": [
      "short-lived",
      "lightweight",
      "heartwarming",
      "time-consuming"
    ],
    "answer": 3,
    "explanation": "thousands、by hand 和增派人手說明工作占用大量時間。short-lived 形容事物維持不久。"
  },
  {
    "id": "ctx-088",
    "category": "歷屆延伸詞彙",
    "prompt": "The shop's ten-year-old waste policy asked everyone to print a new sheet each day. A volunteer argued that it was _____ to the goal of saving paper.",
    "zh": "店裡實行十年的減廢政策要求每人每天印一張新紙。志工認為這反而妨礙省紙的目標。",
    "options": [
      "recognizable",
      "counterproductive",
      "inseparable",
      "uninhabited"
    ],
    "answer": 1,
    "explanation": "每天印新紙與省紙目標背道而馳，應用 counterproductive to the goal。inseparable 通常與 from 搭配。"
  },
  {
    "id": "ctx-089",
    "category": "歷屆延伸詞彙",
    "prompt": "The choir sang without instruments at first. Then a pianist added a gentle _____.",
    "zh": "合唱團起初清唱，接著鋼琴師加入了輕柔的伴奏。",
    "options": [
      "emergence",
      "inclination",
      "accompaniment",
      "aroma"
    ],
    "answer": 2,
    "explanation": "without instruments 和 a pianist 提供音樂語境。accompaniment 的另一個常見義是配菜，要由上文選義。"
  },
  {
    "id": "ctx-090",
    "category": "歷屆延伸詞彙",
    "prompt": "The bags must be finished before the rainy season. In this case, _____ matters more than decorative packaging.",
    "zh": "這些袋子必須在雨季前做好，此時能否及時完成比包裝美觀更重要。",
    "options": [
      "timeliness",
      "cleanliness",
      "weightlessness",
      "individualism"
    ],
    "answer": 0,
    "explanation": "before the rainy season 給了明確期限，timeliness 對應是否趕得上。cleanliness 評估整潔程度。"
  },
  {
    "id": "ctx-091",
    "category": "歷屆延伸詞彙",
    "prompt": "The paper's figures came from people who had already read one another's accounts. We asked for an _____ observer with no ties to either group.",
    "zh": "報告的數據來自看過彼此說法的人。我們要求找一名和雙方皆無關係的公正觀察者。",
    "options": [
      "uninhabited",
      "intricate",
      "acoustic",
      "unbiased"
    ],
    "answer": 3,
    "explanation": "no ties to either group 是重點，目的是避免立場偏向任何一方。unbiased 可直接修飾 observer。"
  },
  {
    "id": "ctx-092",
    "category": "歷屆延伸詞彙",
    "prompt": "The restaurant buys fruit that is ready to harvest locally that month. Its menu changes with the _____ produce available.",
    "zh": "餐廳採購當月在地成熟的水果，菜單隨當季可取得的農產品而改變。",
    "options": [
      "outdated",
      "seasonal",
      "residual",
      "therapeutic"
    ],
    "answer": 1,
    "explanation": "ready to harvest ... that month 指農作物的產季。seasonal produce 是當季農產品。"
  },
  {
    "id": "ctx-093",
    "category": "歷屆延伸詞彙",
    "prompt": "The director moved the scene from a courtroom to a kitchen and chose to _____ the tragedy as a comedy.",
    "zh": "導演把場景從法庭移到廚房，決定把悲劇重新詮釋成喜劇。",
    "options": [
      "outweigh",
      "withstand",
      "recast",
      "coexist"
    ],
    "answer": 2,
    "explanation": "recast A as B 指重新詮釋或改造 A，使它呈現為 B。coexist 描述同時存在，常接 with。"
  },
  {
    "id": "ctx-094",
    "category": "歷屆延伸詞彙",
    "prompt": "The band moved the speakers twice to improve the hall's _____ properties and reduce the echo.",
    "zh": "為了改善禮堂的聲學特性並減少回音，樂團兩度移動揚聲器。",
    "options": [
      "acoustic",
      "culinary",
      "reproductive",
      "festive"
    ],
    "answer": 0,
    "explanation": "speakers 和 echo 都與聲音有關，因此選 acoustic。culinary 則指烹飪。"
  },
  {
    "id": "ctx-095",
    "category": "歷屆延伸詞彙",
    "prompt": "The sign pointed down three steps into a _____ garden, set lower than the surrounding paths.",
    "zh": "標示指向三階樓梯下方的一座庭園，位置低於四周步道。",
    "options": [
      "picturesque",
      "uninhabited",
      "short-lived",
      "sunken"
    ],
    "answer": 3,
    "explanation": "set lower than the surrounding paths 直接解釋地勢下凹。picturesque 雖能形容庭園美麗，題幹沒有美感線索。"
  },
  {
    "id": "ctx-096",
    "category": "歷屆延伸詞彙",
    "prompt": "After comparing both routes, we decided the safety benefits of the wider road _____ the cost of walking two extra blocks.",
    "zh": "比較兩條路線後，我們認為較寬道路的安全效益大於多走兩個街區的代價。",
    "options": [
      "recast",
      "outweigh",
      "regain",
      "untangle"
    ],
    "answer": 1,
    "explanation": "benefits 和 cost 是權衡的兩方。A outweighs B 的 A 是較重要的一方，此句 A 為複數 benefits。"
  },
  {
    "id": "ctx-097",
    "category": "歷屆延伸詞彙",
    "prompt": "Access for people using wheelchairs takes precedence _____ the choice of wall color in the station plan.",
    "zh": "在車站規劃中，輪椅使用者的通行需求比牆面顏色更優先。",
    "options": [
      "with",
      "at",
      "over",
      "from"
    ],
    "answer": 2,
    "explanation": "take precedence over 是固定搭配。如果改用 give precedence，則是 give precedence to 優先處理的對象。"
  },
  {
    "id": "ctx-098",
    "category": "歷屆延伸詞彙",
    "prompt": "The old cinema had one outlet, so we took turns plugging in our phones to _____ their batteries.",
    "zh": "老電影院只有一個插座，所以我們輪流插上手機替電池充電。",
    "options": [
      "recharge",
      "recast",
      "regain",
      "redistribute"
    ],
    "answer": 0,
    "explanation": "outlet、plugging in 和 batteries 共同指向充電。regain 用於重新獲得原本失去的事物。"
  },
  {
    "id": "ctx-099",
    "category": "歷屆延伸詞彙",
    "prompt": "The cushions must still fit the covers after washing, so the tailor allowed for a little fabric _____.",
    "zh": "洗過後靠墊仍得裝進套子裡，因此裁縫預留了一點布料縮水的空間。",
    "options": [
      "breakage",
      "drainage",
      "hydration",
      "shrinkage"
    ],
    "answer": 3,
    "explanation": "fit 和 after washing 讓人聚焦在布料尺寸的縮小。breakage 描述破損，drainage 指排水。"
  },
  {
    "id": "ctx-100",
    "category": "歷屆延伸詞彙",
    "prompt": "The lecture was split into _____ lessons, each short enough to finish on a five-minute bus ride.",
    "zh": "這堂講座被拆成短小單元，每一單元短到搭五分鐘公車就能上完。",
    "options": [
      "handcrafted",
      "bite-sized",
      "unbiased",
      "lightweight"
    ],
    "answer": 1,
    "explanation": "原指一口大小的 bite-sized，在此比喻拆成容易吸收的短單元。lightweight 側重重量輕，也可指內容分量不足，沒有分成短節的意思。"
  }
];
