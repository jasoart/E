"use strict";

// Printed choices in A–D order. The answer index is zero-based.
// Bilingual examples and option comparisons load when a learner opens them.
const GSAT_VOCABULARY_PAPERS = {
  "111": {
    answerUrl: "https://www.ceec.edu.tw/files/file_pool/1/0m052625594764853905/02-111%E5%AD%B8%E6%B8%AC%E8%8B%B1%E6%96%87%E9%81%B8%E6%93%87%E9%A1%8C%E7%AD%94%E6%A1%88..pdf",
    questions: [
      {
        options: [
          {"form": "advanced", "pos": "v.／adj.", "zh": "推進、使提前；先進的", "entry": "advanced", "relation": "entry"},
          {"form": "delivered", "pos": "v.", "zh": "遞送、送達", "entry": "deliver", "relation": "inflection"},
          {"form": "offered", "pos": "v.", "zh": "提供、提出", "entry": "offer", "relation": "inflection"},
          {"form": "stretched", "pos": "v.", "zh": "拉長、伸展", "entry": "stretch", "relation": "inflection"},
        ],
        answer: 1,
        phrase: "have something delivered",
        clue: "披薩是被送到家中的物品。have 加受詞與過去分詞，可以表示安排別人完成這件事。",
      },
      {
        options: [
          {"form": "assistant", "pos": "n.", "zh": "助理、助手", "entry": "assistant", "relation": "entry"},
          {"form": "influence", "pos": "n.", "zh": "影響、影響力", "entry": "influence", "relation": "entry"},
          {"form": "contribution", "pos": "n.", "zh": "貢獻、捐助", "entry": "contribution", "relation": "entry"},
          {"form": "politician", "pos": "n.", "zh": "政治人物", "entry": "politician", "relation": "entry"},
        ],
        answer: 0,
        phrase: "work as an assistant",
        clue: "題句提到有人在辦公室幫忙，空格要填能擔任這項工作的人。",
      },
      {
        options: [
          {"form": "chat", "pos": "n.", "zh": "聊天、閒談", "entry": "chat", "relation": "entry"},
          {"form": "quiz", "pos": "n.", "zh": "小考、知識問答", "entry": "quiz", "relation": "entry"},
          {"form": "puppet", "pos": "n.", "zh": "偶、木偶", "entry": "puppet", "relation": "entry"},
          {"form": "variety", "pos": "n.", "zh": "多樣性、種類", "entry": "variety", "relation": "entry"},
        ],
        answer: 2,
        phrase: "a hand puppet",
        clue: "獅舞、戲曲之後列的是另一種傳統演出。hand puppet 指套在手上操縱的偶。",
      },
      {
        options: [
          {"form": "potentially", "pos": "adv.", "zh": "可能、潛在地", "entry": "potential", "relation": "family"},
          {"form": "delicately", "pos": "adv.", "zh": "小心地、細緻地", "entry": "delicate", "relation": "family"},
          {"form": "ambiguously", "pos": "adv.", "zh": "含糊地、模稜兩可地", "entry": "ambiguous", "relation": "family"},
          {"form": "optionally", "pos": "adv.", "zh": "可自行選擇地", "entry": "optional", "relation": "family"},
        ],
        answer: 0,
        phrase: "potentially dangerous",
        clue: "題句描述副作用有致命的可能。副詞 potentially 修飾形容詞 fatal，說明的是風險。",
      },
      {
        options: [
          {"form": "Tagging", "pos": "v.", "zh": "加上標籤", "entry": "tag", "relation": "inflection"},
          {"form": "Flocking", "pos": "v.", "zh": "成群湧向", "entry": "flock", "relation": "inflection"},
          {"form": "Rolling", "pos": "v.", "zh": "滾動、捲起", "entry": "roll", "relation": "inflection"},
          {"form": "Snapping", "pos": "v.", "zh": "迅速拍照、啪地折斷", "entry": "snap", "relation": "inflection"},
        ],
        answer: 0,
        phrase: "tag a photo with a keyword",
        clue: "日期和關鍵字能幫助分類，因此應選「加標籤」。snap a photo 則是拍下照片。",
      },
      {
        options: [
          {"form": "enormous", "pos": "adj.", "zh": "巨大的", "entry": "enormous", "relation": "entry"},
          {"form": "intimate", "pos": "adj.", "zh": "親密的、私人的", "entry": "intimate", "relation": "entry"},
          {"form": "agreeable", "pos": "adj.", "zh": "親切隨和的、宜人的", "entry": "agreeable", "relation": "entry"},
          {"form": "ultimate", "pos": "adj.", "zh": "最終的、根本的", "entry": "ultimate", "relation": "entry"},
        ],
        answer: 2,
        phrase: "an agreeable person",
        clue: "好相處是在描述性格。agreeable 用來形容人時可指親切隨和，和是否同意某項提議是兩回事。",
      },
      {
        options: [
          {"form": "identical", "pos": "adj.", "zh": "完全相同的", "entry": "identical", "relation": "entry"},
          {"form": "visible", "pos": "adj.", "zh": "看得見的", "entry": "visible", "relation": "entry"},
          {"form": "available", "pos": "adj.", "zh": "可取得的、有空的", "entry": "available", "relation": "entry"},
          {"form": "remarkable", "pos": "adj.", "zh": "非凡的、值得注意的", "entry": "remarkable", "relation": "entry"},
        ],
        answer: 1,
        phrase: "barely visible",
        clue: "入口隱在小巷裡，barely 表示幾乎看不見。visible 說的是視線所及。",
      },
      {
        options: [
          {"form": "moderate", "pos": "adj.", "zh": "適度的、中等的", "entry": "moderate", "relation": "entry"},
          {"form": "absolute", "pos": "adj.", "zh": "絕對的、完全的", "entry": "absolute", "relation": "entry"},
          {"form": "promising", "pos": "adj.", "zh": "有希望的", "entry": "promising", "relation": "entry"},
          {"form": "eventual", "pos": "adj.", "zh": "最終的", "entry": "eventual", "relation": "entry"},
        ],
        answer: 3,
        phrase: "the eventual cost",
        clue: "原先的預算是一開始的估計，空格指旅程最後會花掉的總金額。",
      },
      {
        options: [
          {"form": "trial", "pos": "n.", "zh": "審判、試驗", "entry": "trial", "relation": "entry"},
          {"form": "route", "pos": "n.", "zh": "路線", "entry": "route", "relation": "entry"},
          {"form": "strike", "pos": "n.", "zh": "罷工、打擊", "entry": "strike", "relation": "entry"},
          {"form": "quest", "pos": "n.", "zh": "長時間的追尋、探索", "entry": "quest", "relation": "entry"},
        ],
        answer: 3,
        phrase: "a quest for something",
        clue: "電視節目讓主角動身尋找化石。quest for 的後面接想找到的事物。",
      },
      {
        options: [
          {"form": "bounces", "pos": "v.", "zh": "彈跳", "entry": "bounce", "relation": "inflection"},
          {"form": "blushes", "pos": "v.", "zh": "臉紅、泛紅", "entry": "blush", "relation": "inflection"},
          {"form": "polishes", "pos": "v.", "zh": "擦亮、潤飾", "entry": "polish", "relation": "inflection"},
          {"form": "transfers", "pos": "v.", "zh": "轉移、轉送", "entry": "transfer", "relation": "inflection"},
        ],
        answer: 1,
        phrase: "blush with embarrassment",
        clue: "粉紅花海被比成新娘，山谷像人一樣臉紅。這裡用 blushes 把顏色寫成動作。",
      },
    ],
  },
  "112": {
    answerUrl: "https://www.ceec.edu.tw/files/file_pool/1/0n045359936769376687/02-112%E5%AD%B8%E6%B8%AC%E8%8B%B1%E6%96%87%E9%81%B8%E6%93%87%E9%A1%8C%E7%AD%94%E6%A1%88.pdf",
    questions: [
      {
        options: [
          {"form": "sticky", "pos": "adj.", "zh": "黏的、黏手的", "entry": "sticky", "relation": "entry"},
          {"form": "greasy", "pos": "adj.", "zh": "油膩的", "entry": "greasy", "relation": "entry"},
          {"form": "clumsy", "pos": "adj.", "zh": "笨拙的", "entry": "clumsy", "relation": "entry"},
          {"form": "mighty", "pos": "adj.", "zh": "強而有力的", "entry": "mighty", "relation": "entry"},
        ],
        answer: 0,
        phrase: "sticky fingers",
        clue: "口香糖黏在座椅底下，難以去除。sticky 描述碰到表面時會黏住的特性。",
      },
      {
        options: [
          {"form": "clap", "pos": "n.", "zh": "拍手聲", "entry": "clap", "relation": "entry"},
          {"form": "toss", "pos": "n.", "zh": "輕拋、擲", "entry": "toss", "relation": "entry"},
          {"form": "pose", "pos": "n.", "zh": "姿勢", "entry": "pose", "relation": "entry"},
          {"form": "snap", "pos": "n.", "zh": "喀嚓聲、快照", "entry": "snap", "relation": "entry"},
        ],
        answer: 2,
        phrase: "strike a pose",
        clue: "模特兒在鏡頭前擺出優雅的姿勢，pose 在冠詞與形容詞後作名詞。",
      },
      {
        options: [
          {"form": "siblings", "pos": "n.", "zh": "兄弟姊妹", "entry": "sibling", "relation": "inflection"},
          {"form": "commuters", "pos": "n.", "zh": "通勤者", "entry": "commuter", "relation": "inflection"},
          {"form": "ancestors", "pos": "n.", "zh": "祖先", "entry": "ancestor", "relation": "inflection"},
          {"form": "instructors", "pos": "n.", "zh": "指導者、講師", "entry": "instructor", "relation": "inflection"},
        ],
        answer: 2,
        phrase: "trace one's ancestors",
        clue: "家譜向前追溯到移居的年代，因此要找的是前幾代的家人。",
      },
      {
        options: [
          {"form": "blank", "pos": "adj.", "zh": "空白的、茫然的", "entry": "blank", "relation": "entry"},
          {"form": "bare", "pos": "adj.", "zh": "空的、光禿的", "entry": "bare", "relation": "entry"},
          {"form": "hollow", "pos": "adj.", "zh": "中空的", "entry": "hollow", "relation": "entry"},
          {"form": "queer", "pos": "adj.", "zh": "古怪的、異常的", "entry": "queer", "relation": "entry"},
        ],
        answer: 1,
        phrase: "bare shelves",
        clue: "貨快賣光時，架上幾乎空無一物。hollow 則指物體內部是空的。",
      },
      {
        options: [
          {"form": "liability", "pos": "n.", "zh": "責任、負擔", "entry": "liability", "relation": "entry"},
          {"form": "generosity", "pos": "n.", "zh": "慷慨", "entry": "generosity", "relation": "entry"},
          {"form": "integrity", "pos": "n.", "zh": "正直、誠信", "entry": "integrity", "relation": "entry"},
          {"form": "sincerity", "pos": "n.", "zh": "真誠、誠意", "entry": "sincerity", "relation": "entry"},
        ],
        answer: 3,
        phrase: "the sincerity of an apology",
        clue: "親口道歉之後，聽者仍感受不到誠意。sincerity 指言行反映真心的程度。",
      },
      {
        options: [
          {"form": "resolve", "pos": "n.", "zh": "決心", "entry": "resolve", "relation": "entry"},
          {"form": "fraction", "pos": "n.", "zh": "一小部分、分數", "entry": "fraction", "relation": "entry"},
          {"form": "privilege", "pos": "n.", "zh": "特權", "entry": "privilege", "relation": "entry"},
          {"form": "recall", "pos": "n.", "zh": "記憶力、回想", "entry": "recall", "relation": "entry"},
        ],
        answer: 3,
        phrase: "powers of recall",
        clue: "能清楚描述童年入學當天，顯示祖父有出色的記憶力。此處 recall 作名詞。",
      },
      {
        options: [
          {"form": "provoke", "pos": "v.", "zh": "引起、激怒", "entry": "provoke", "relation": "entry"},
          {"form": "counter", "pos": "v.", "zh": "反駁、抵消", "entry": "counter", "relation": "entry"},
          {"form": "expose", "pos": "v.", "zh": "揭露、使暴露", "entry": "expose", "relation": "entry"},
          {"form": "convert", "pos": "v.", "zh": "轉換、改變信仰", "entry": "convert", "relation": "entry"},
        ],
        answer: 1,
        phrase: "counter a claim",
        clue: "研究證據與廠商的說法相反，能用來反駁其主張。counter 可以直接接受詞。",
      },
      {
        options: [
          {"form": "crippled", "pos": "v.", "zh": "使嚴重受損、癱瘓", "entry": "cripple", "relation": "inflection"},
          {"form": "accelerated", "pos": "v.", "zh": "加速", "entry": "accelerate", "relation": "inflection"},
          {"form": "rendered", "pos": "v.", "zh": "使成為、提供", "entry": "render", "relation": "inflection"},
          {"form": "ventured", "pos": "v.", "zh": "冒險嘗試", "entry": "venture", "relation": "inflection"},
        ],
        answer: 0,
        phrase: "cripple an economy",
        clue: "貪腐與政策失誤帶來沉重債務，語意指經濟運作嚴重受損。",
      },
      {
        options: [
          {"form": "choked", "pos": "v.", "zh": "堵塞、使窒息", "entry": "choke", "relation": "inflection"},
          {"form": "disturbed", "pos": "v.", "zh": "干擾、使不安", "entry": "disturb", "relation": "inflection"},
          {"form": "enclosed", "pos": "v.", "zh": "圍住、隨函附上", "entry": "enclose", "relation": "inflection"},
          {"form": "injected", "pos": "v.", "zh": "注入、注射", "entry": "inject", "relation": "inflection"},
        ],
        answer: 0,
        phrase: "be choked with traffic",
        clue: "球迷湧入使道路整天塞車。be choked with 表示被某物塞滿。",
      },
      {
        options: [
          {"form": "undoubtedly", "pos": "adv.", "zh": "無疑地", "entry": "undoubtedly", "relation": "entry"},
          {"form": "roughly", "pos": "adv.", "zh": "大約、粗略地", "entry": "roughly", "relation": "entry"},
          {"form": "understandably", "pos": "adv.", "zh": "可以理解地", "entry": "understand", "relation": "family"},
          {"form": "supposedly", "pos": "adv.", "zh": "據稱、按理說", "entry": "supposedly", "relation": "entry"},
        ],
        answer: 3,
        phrase: "supposedly fair",
        clue: "「據稱客觀」和後面研究發現的政治影響形成落差，supposedly 保留了說話者的懷疑。",
      },
    ],
  },
  "113": {
    answerUrl: "https://www.ceec.edu.tw/files/file_pool/1/0o051427843482078305/02-113%E5%AD%B8%E6%B8%AC%E8%8B%B1%E6%96%87%E7%AD%94%E6%A1%88.pdf",
    questions: [
      {
        options: [
          {"form": "spicy", "pos": "adj.", "zh": "辛辣的", "entry": "spicy", "relation": "entry"},
          {"form": "slender", "pos": "adj.", "zh": "細長的、苗條的", "entry": "slender", "relation": "entry"},
          {"form": "slight", "pos": "adj.", "zh": "輕微的、纖弱的", "entry": "slight", "relation": "entry"},
          {"form": "slippery", "pos": "adj.", "zh": "滑的", "entry": "slippery", "relation": "entry"},
        ],
        answer: 1,
        phrase: "a slender figure",
        clue: "figure 在這裡指體態，slender 形容外形纖細修長。",
      },
      {
        options: [
          {"form": "emerging", "pos": "v.", "zh": "出現、顯露", "entry": "emerge", "relation": "inflection"},
          {"form": "flashing", "pos": "v.", "zh": "閃爍、快速亮起", "entry": "flash", "relation": "inflection"},
          {"form": "rushing", "pos": "v.", "zh": "急奔、匆忙移動", "entry": "rush", "relation": "inflection"},
          {"form": "floating", "pos": "v.", "zh": "漂浮", "entry": "float", "relation": "inflection"},
        ],
        answer: 0,
        phrase: "emerge from",
        clue: "觀看日出時，太陽從雲後現身。emerge from 接原本遮蔽某物的位置。",
      },
      {
        options: [
          {"form": "apt", "pos": "adj.", "zh": "容易……的、恰當的", "entry": "apt", "relation": "entry"},
          {"form": "due", "pos": "adj.", "zh": "預定到達的、到期的", "entry": "due", "relation": "entry"},
          {"form": "bound", "pos": "adj.", "zh": "開往……的、必定的", "entry": "bound", "relation": "entry"},
          {"form": "docked", "pos": "v.", "zh": "靠岸、進入船塢", "entry": "dock", "relation": "inflection"},
        ],
        answer: 1,
        phrase: "be due at",
        clue: "問句想知道下一班車預定幾點抵達。due 可單獨放在 be 後表示預定到達。",
      },
      {
        options: [
          {"form": "density", "pos": "n.", "zh": "密度", "entry": "density", "relation": "entry"},
          {"form": "humidity", "pos": "n.", "zh": "濕度", "entry": "humidity", "relation": "entry"},
          {"form": "circulation", "pos": "n.", "zh": "循環、流通", "entry": "circulation", "relation": "entry"},
          {"form": "atmosphere", "pos": "n.", "zh": "大氣、氣氛", "entry": "atmosphere", "relation": "entry"},
        ],
        answer: 1,
        phrase: "high humidity",
        clue: "身體覺得又熱又黏，語境指向空氣中的水分，也就是濕度。",
      },
      {
        options: [
          {"form": "stay", "pos": "v.", "zh": "停留、保持", "entry": "stay", "relation": "entry"},
          {"form": "take", "pos": "v.", "zh": "拿取、接受", "entry": "take", "relation": "entry"},
          {"form": "serve", "pos": "v.", "zh": "服務、供應", "entry": "serve", "relation": "entry"},
          {"form": "stand", "pos": "v.", "zh": "承受、經得起", "entry": "stand", "relation": "entry"},
        ],
        answer: 3,
        phrase: "stand the test of time",
        clue: "談的是作品多年後仍有價值，stand 在這個搭配裡表示「經得起」。",
      },
      {
        options: [
          {"form": "forceful", "pos": "adj.", "zh": "強而有力的", "entry": "force", "relation": "family"},
          {"form": "realistic", "pos": "adj.", "zh": "實際的、寫實的", "entry": "realistic", "relation": "entry"},
          {"form": "compulsory", "pos": "adj.", "zh": "強制的、必修的", "entry": "compulsory", "relation": "entry"},
          {"form": "distinctive", "pos": "adj.", "zh": "獨特的、容易辨認的", "entry": "distinctive", "relation": "entry"},
        ],
        answer: 2,
        phrase: "be compulsory for",
        clue: "從有些人必須服役、有些人無須服役的對比，可判斷本題在談義務。",
      },
      {
        options: [
          {"form": "advantage", "pos": "n.", "zh": "優勢", "entry": "advantage", "relation": "entry"},
          {"form": "revenge", "pos": "n.", "zh": "報復", "entry": "revenge", "relation": "entry"},
          {"form": "remedy", "pos": "n.", "zh": "補救方法、療法", "entry": "remedy", "relation": "entry"},
          {"form": "credit", "pos": "n.", "zh": "功勞、肯定", "entry": "credit", "relation": "entry"},
        ],
        answer: 3,
        phrase: "take credit for",
        clue: "隊員做了辛苦的工作，領隊卻把功勞攬在自己身上。for 後面接成果或付出。",
      },
      {
        options: [
          {"form": "proposes", "pos": "v.", "zh": "提議", "entry": "propose", "relation": "inflection"},
          {"form": "contains", "pos": "v.", "zh": "包含、容納", "entry": "contain", "relation": "inflection"},
          {"form": "promises", "pos": "v.", "zh": "承諾、可望帶來", "entry": "promise", "relation": "inflection"},
          {"form": "confirms", "pos": "v.", "zh": "證實、確認", "entry": "confirm", "relation": "inflection"},
        ],
        answer: 2,
        phrase: "promise something",
        clue: "旅館的地理位置可望帶來便利。無生命的主詞也可以搭配 promise。",
      },
      {
        options: [
          {"form": "appeal", "pos": "n.", "zh": "呼籲、吸引力", "entry": "appeal", "relation": "entry"},
          {"form": "approach", "pos": "n.", "zh": "作法、接近", "entry": "approach", "relation": "entry"},
          {"form": "operation", "pos": "n.", "zh": "運作、手術", "entry": "operation", "relation": "entry"},
          {"form": "observation", "pos": "n.", "zh": "觀察、觀察所得", "entry": "observation", "relation": "entry"},
        ],
        answer: 0,
        phrase: "make an appeal for",
        clue: "庫存告急，醫院公開請大家捐血。appeal 在這裡是向公眾提出的懇求。",
      },
      {
        options: [
          {"form": "eligibly", "pos": "adv.", "zh": "以符合資格的方式", "entry": "eligible", "relation": "family"},
          {"form": "randomly", "pos": "adv.", "zh": "隨機地", "entry": "random", "relation": "family"},
          {"form": "apparently", "pos": "adv.", "zh": "看來、顯然", "entry": "apparent", "relation": "family"},
          {"form": "consequently", "pos": "adv.", "zh": "因此、結果", "entry": "consequent", "relation": "family"},
        ],
        answer: 1,
        phrase: "be randomly assigned",
        clue: "不能自行挑選組員，分組是隨機進行的。randomly 說明分配方式。",
      },
    ],
  },
  "114": {
    answerUrl: "https://www.ceec.edu.tw/files/file_pool/1/0p051545433631383724/02-114%E5%AD%B8%E6%B8%AC%E8%8B%B1%E6%96%87%E7%AD%94%E6%A1%88.pdf",
    questions: [
      {
        options: [
          {"form": "border", "pos": "n.", "zh": "邊界、邊緣", "entry": "border", "relation": "entry"},
          {"form": "timer", "pos": "n.", "zh": "計時器", "entry": "time", "relation": "family"},
          {"form": "container", "pos": "n.", "zh": "容器", "entry": "container", "relation": "entry"},
          {"form": "marker", "pos": "n.", "zh": "標記物、麥克筆", "entry": "marker", "relation": "entry"},
        ],
        answer: 2,
        phrase: "an empty container",
        clue: "要接住滴下的水，需要能盛裝液體的東西。",
      },
      {
        options: [
          {"form": "produce", "pos": "n.", "zh": "農產品、蔬果（不可數）", "entry": "produce", "relation": "entry"},
          {"form": "fashion", "pos": "n.", "zh": "時尚、流行款式", "entry": "fashion", "relation": "entry"},
          {"form": "brand", "pos": "n.", "zh": "品牌", "entry": "brand", "relation": "entry"},
          {"form": "trend", "pos": "n.", "zh": "趨勢、風潮", "entry": "trend", "relation": "entry"},
        ],
        answer: 0,
        phrase: "fresh produce",
        clue: "農夫市集販售當季蔬果。produce 在這裡作不可數名詞，名詞讀音重音在第一音節。",
      },
      {
        options: [
          {"form": "blurring", "pos": "v.", "zh": "變得模糊、使模糊", "entry": "blur", "relation": "inflection"},
          {"form": "trimming", "pos": "v.", "zh": "修剪、裁去", "entry": "trim", "relation": "inflection"},
          {"form": "draining", "pos": "v.", "zh": "排出液體、耗盡", "entry": "drain", "relation": "inflection"},
          {"form": "glaring", "pos": "v.", "zh": "怒視、發出刺眼的光", "entry": "glare", "relation": "inflection"},
        ],
        answer: 0,
        phrase: "a memory begins to blur",
        clue: "後半句提到已無法清楚回憶，對應記憶逐漸模糊。",
      },
      {
        options: [
          {"form": "excessive", "pos": "adj.", "zh": "過度的", "entry": "excessive", "relation": "entry"},
          {"form": "furious", "pos": "adj.", "zh": "盛怒的", "entry": "furious", "relation": "entry"},
          {"form": "offensive", "pos": "adj.", "zh": "冒犯人的、令人反感的", "entry": "offensive", "relation": "entry"},
          {"form": "stubborn", "pos": "adj.", "zh": "固執的", "entry": "stubborn", "relation": "entry"},
        ],
        answer: 2,
        phrase: "find a remark offensive",
        clue: "傷人的言語會使人感到受辱，offensive 修飾造成冒犯的言詞或行為。",
      },
      {
        options: [
          {"form": "text", "pos": "n.", "zh": "文字、文本", "entry": "text", "relation": "entry"},
          {"form": "brush", "pos": "n.", "zh": "刷子、畫筆", "entry": "brush", "relation": "entry"},
          {"form": "draft", "pos": "n.", "zh": "草稿、初稿", "entry": "draft", "relation": "entry"},
          {"form": "plot", "pos": "n.", "zh": "情節、小塊土地", "entry": "plot", "relation": "entry"},
        ],
        answer: 2,
        phrase: "a first draft",
        clue: "文章在繳交前經過多次修改，因此一開始寫出來的是草稿。",
      },
      {
        options: [
          {"form": "casual", "pos": "adj.", "zh": "隨意的、非正式的", "entry": "casual", "relation": "entry"},
          {"form": "fragile", "pos": "adj.", "zh": "易碎的、脆弱的", "entry": "fragile", "relation": "entry"},
          {"form": "remote", "pos": "adj.", "zh": "偏遠的、遙遠的", "entry": "remote", "relation": "entry"},
          {"form": "vacant", "pos": "adj.", "zh": "空著的、無人使用的", "entry": "vacant", "relation": "entry"},
        ],
        answer: 3,
        phrase: "remain vacant",
        clue: "房子廢棄多年，積了厚厚的灰塵。vacant 描述房子沒有住戶的狀態。",
      },
      {
        options: [
          {"form": "gigantic", "pos": "adj.", "zh": "巨大的、龐大的", "entry": "gigantic", "relation": "entry"},
          {"form": "exclusive", "pos": "adj.", "zh": "專屬的、獨家的", "entry": "exclusive", "relation": "entry"},
          {"form": "multiple", "pos": "adj.", "zh": "多個的、多重的", "entry": "multiple", "relation": "entry"},
          {"form": "enormous", "pos": "adj.", "zh": "極大的、巨大的", "entry": "enormous", "relation": "entry"},
        ],
        answer: 3,
        phrase: "show enormous courage",
        clue: "這裡形容勇氣的程度。enormous 可以修飾 courage 這類抽象名詞，gigantic 較常形容可想像其尺寸的事物。",
      },
      {
        options: [
          {"form": "halted", "pos": "v.", "zh": "使停下、中止", "entry": "halt", "relation": "inflection"},
          {"form": "hatched", "pos": "v.", "zh": "孵化、策劃", "entry": "hatch", "relation": "inflection"},
          {"form": "possessed", "pos": "v.", "zh": "擁有", "entry": "possess", "relation": "inflection"},
          {"form": "reinforced", "pos": "v.", "zh": "加強、鞏固", "entry": "reinforce", "relation": "inflection"},
        ],
        answer: 0,
        phrase: "bring work to a halt",
        clue: "資源不足會使計畫暫停，和句中的「延遲」屬於相關結果。",
      },
      {
        options: [
          {"form": "praised", "pos": "v.", "zh": "稱讚", "entry": "praise", "relation": "inflection"},
          {"form": "graced", "pos": "v.", "zh": "使增光、使增色", "entry": "grace", "relation": "inflection"},
          {"form": "addressed", "pos": "v.", "zh": "向人致詞、處理", "entry": "address", "relation": "inflection"},
          {"form": "credited", "pos": "v.", "zh": "歸功於、相信", "entry": "credit", "relation": "inflection"},
        ],
        answer: 1,
        phrase: "grace an event with one's presence",
        clue: "受邀者親臨典禮，使活動增光。address an audience 可以指對聽眾致詞，搭配結構不同。",
      },
      {
        options: [
          {"form": "verbally", "pos": "adv.", "zh": "以言語、口頭上", "entry": "verbal", "relation": "family"},
          {"form": "dominantly", "pos": "adv.", "zh": "以支配性的方式", "entry": "dominant", "relation": "family"},
          {"form": "legitimately", "pos": "adv.", "zh": "合法地、正當地", "entry": "legitimate", "relation": "family"},
          {"form": "relevantly", "pos": "adv.", "zh": "切題地、相關地", "entry": "relevant", "relation": "family"},
        ],
        answer: 0,
        phrase: "verbally abuse someone",
        clue: "題目舉出辱罵同事時說的話，因此用 verbally 表示傷害人的方式是言語。",
      },
    ],
  },
  "115": {
    answerUrl: "https://www.ceec.edu.tw/files/file_pool/1/0Q034479019252011195/02-115%E5%AD%B8%E6%B8%AC%E8%8B%B1%E6%96%87%E7%AD%94%E6%A1%88.pdf",
    questions: [
      {
        options: [
          {"form": "hasty", "pos": "adj.", "zh": "倉促的", "entry": "hasty", "relation": "entry"},
          {"form": "tight", "pos": "adj.", "zh": "緊湊的、緊的", "entry": "tight", "relation": "entry"},
          {"form": "diligent", "pos": "adj.", "zh": "勤奮的", "entry": "diligent", "relation": "entry"},
          {"form": "routine", "pos": "adj.", "zh": "例行的", "entry": "routine", "relation": "entry"},
        ],
        answer: 1,
        phrase: "a tight schedule",
        clue: "訪問要等好幾週才能排進去，說明行程排得很滿。hasty 則形容決定或動作過於匆忙。",
      },
      {
        options: [
          {"form": "official", "pos": "adj.", "zh": "官方的、正式的", "entry": "official", "relation": "entry"},
          {"form": "instant", "pos": "adj.", "zh": "即時的、立即的", "entry": "instant", "relation": "entry"},
          {"form": "amateur", "pos": "adj.", "zh": "業餘的", "entry": "amateur", "relation": "entry"},
          {"form": "elementary", "pos": "adj.", "zh": "基礎的、初級的", "entry": "elementary", "relation": "entry"},
        ],
        answer: 2,
        phrase: "an amateur designer",
        clue: "後半句提到她如今有專業工作室，可推知早期是業餘設計者。",
      },
      {
        options: [
          {"form": "career", "pos": "n.", "zh": "職涯、事業", "entry": "career", "relation": "entry"},
          {"form": "vacancy", "pos": "n.", "zh": "職缺、空缺", "entry": "vacancy", "relation": "entry"},
          {"form": "expectation", "pos": "n.", "zh": "期望、預期", "entry": "expectation", "relation": "entry"},
          {"form": "inspiration", "pos": "n.", "zh": "靈感、啟發", "entry": "inspiration", "relation": "entry"},
        ],
        answer: 1,
        phrase: "a teaching vacancy",
        clue: "學校引來許多申請者，表示有教師職位等待填補。",
      },
      {
        options: [
          {"form": "initially", "pos": "adv.", "zh": "起初、最初", "entry": "initial", "relation": "family"},
          {"form": "genuinely", "pos": "adv.", "zh": "真心地、確實地", "entry": "genuine", "relation": "family"},
          {"form": "alternatively", "pos": "adv.", "zh": "或者、作為另一選擇", "entry": "alternative", "relation": "family"},
          {"form": "fundamentally", "pos": "adv.", "zh": "從根本上", "entry": "fundamental", "relation": "family"},
        ],
        answer: 0,
        phrase: "than initially expected",
        clue: "產品後來的利潤超出原先預期。initially 標示前後比較所用的起始時間。",
      },
      {
        options: [
          {"form": "dimension", "pos": "n.", "zh": "尺寸、面向", "entry": "dimension", "relation": "entry"},
          {"form": "integration", "pos": "n.", "zh": "整合、融合", "entry": "integration", "relation": "entry"},
          {"form": "provision", "pos": "n.", "zh": "供應、條款", "entry": "provision", "relation": "entry"},
          {"form": "consumption", "pos": "n.", "zh": "食用量、消耗量", "entry": "consumption", "relation": "entry"},
        ],
        answer: 3,
        phrase: "the consumption of fruit",
        clue: "題目談的是人吃進多少蔬果。consumption 關注食用或使用，provision 則偏向供應。",
      },
      {
        options: [
          {"form": "dreads", "pos": "v.", "zh": "十分害怕、畏懼", "entry": "dread", "relation": "inflection"},
          {"form": "stresses", "pos": "v.", "zh": "強調、使緊張", "entry": "stress", "relation": "inflection"},
          {"form": "wanders", "pos": "v.", "zh": "徘徊、漫遊", "entry": "wander", "relation": "inflection"},
          {"form": "escapes", "pos": "v.", "zh": "逃離、避開", "entry": "escape", "relation": "inflection"},
        ],
        answer: 0,
        phrase: "dread doing something",
        clue: "主角生性害羞，想到要在眾人面前說話就畏懼。dread 可直接接名詞或動名詞。",
      },
      {
        options: [
          {"form": "resource", "pos": "n.", "zh": "資源", "entry": "resource", "relation": "entry"},
          {"form": "impact", "pos": "n.", "zh": "影響、衝擊", "entry": "impact", "relation": "entry"},
          {"form": "passion", "pos": "n.", "zh": "熱愛、熱情", "entry": "passion", "relation": "entry"},
          {"form": "emphasis", "pos": "n.", "zh": "強調、重點", "entry": "emphasis", "relation": "entry"},
        ],
        answer: 2,
        phrase: "a passion for music",
        clue: "得獎者全心投入音樂，語境描述的是長久的熱愛。for 後面接熱愛的對象。",
      },
      {
        options: [
          {"form": "shattered", "pos": "v.", "zh": "打碎、使破滅", "entry": "shatter", "relation": "inflection"},
          {"form": "assaulted", "pos": "v.", "zh": "襲擊、毆打", "entry": "assault", "relation": "inflection"},
          {"form": "overturned", "pos": "v.", "zh": "推翻、翻覆", "entry": "overturn", "relation": "inflection"},
          {"form": "condemned", "pos": "v.", "zh": "譴責、宣判", "entry": "condemn", "relation": "inflection"},
        ],
        answer: 1,
        phrase: "assault someone",
        clue: "動詞的受詞是路人，後文說警方將人逮捕。assault 表示對人發動攻擊。",
      },
      {
        options: [
          {"form": "crash", "pos": "v.", "zh": "碰撞、猛撞", "entry": "crash", "relation": "entry"},
          {"form": "tumble", "pos": "v.", "zh": "跌倒、滾落", "entry": "tumble", "relation": "entry"},
          {"form": "elbow", "pos": "v.", "zh": "用手肘推擠", "entry": "elbow", "relation": "entry"},
          {"form": "struggle", "pos": "v.", "zh": "掙扎、奮力", "entry": "struggle", "relation": "entry"},
        ],
        answer: 2,
        phrase: "elbow one's way through",
        clue: "車站人潮擁擠，主角為了上車得用手肘擠出一條路。one's 要隨主詞換成 my、her 等。",
      },
      {
        options: [
          {"form": "swift", "pos": "adj.", "zh": "迅速的", "entry": "swift", "relation": "entry"},
          {"form": "brutal", "pos": "adj.", "zh": "殘酷的", "entry": "brutal", "relation": "entry"},
          {"form": "harsh", "pos": "adj.", "zh": "嚴厲的、嚴酷的", "entry": "harsh", "relation": "entry"},
          {"form": "grave", "pos": "adj.", "zh": "嚴重的、重大的", "entry": "grave", "relation": "entry"},
        ],
        answer: 3,
        phrase: "raise grave concerns",
        clue: "嚴重的校園事件引發深切憂慮。grave 在 concerns 前是形容詞，同形名詞則指墳墓。",
      },
    ],
  },
};
