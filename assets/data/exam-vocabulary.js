"use strict";

// Printed choices in A–D order. The answer index is zero-based.
// Explanations and bilingual examples are original learning material.
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
        examples: [
          {"en": "The village store had our groceries delivered before noon because the last bus left early that day.", "focus": "delivered", "zh": "村裡的商店安排在中午前把我們買的食物送到，因為那天末班公車很早就開走了。"},
          {"en": "When the bridge reopened, the driver made his first delivery to the families across the river.", "focus": "delivery", "zh": "橋重新開放後，那位司機首次送貨給河對岸的住戶。"},
          {"en": "A library boat delivers books to children who would otherwise spend an entire morning traveling to the nearest town.", "focus": "delivers", "zh": "一艘圖書船把書送給孩子，否則他們得花整個上午前往最近的城鎮。"},
        ],
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
        examples: [
          {"en": "Whenever two visitors arrived together, the shop owner asked her assistant to help one of them.", "focus": "assistant", "zh": "每當兩位客人一起進店，店主就請她的助手接待其中一位。"},
          {"en": "The student who assisted the photographer held a white sheet to reflect sunlight onto the model's face.", "focus": "assisted", "zh": "協助攝影師的學生拿著白布，將陽光反射到模特兒臉上。"},
          {"en": "Letters from the painter's assistant describe how much work went into mixing colors before a single flower was painted.", "focus": "assistant", "zh": "畫家助手的信寫到，光是畫一朵花之前的調色工作就有多費工。"},
        ],
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
        examples: [
          {"en": "The child thought the fox was alive until the actor slipped her hand out of the puppet.", "focus": "puppet", "zh": "孩子一直以為狐狸是活的，直到演員把手從戲偶裡抽出來。"},
          {"en": "The puppets that our class made from old socks each had a different voice in the play.", "focus": "puppets", "zh": "班上用舊襪子做的戲偶，在劇中各有不同的聲音。"},
          {"en": "By moving one wooden puppet between a lamp and a white screen, the artist told a story entirely in shadows.", "focus": "puppet", "zh": "藝術家在燈與白幕間移動一個木偶，只用影子就說完了一個故事。"},
        ],
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
        examples: [
          {"en": "Even a shallow stream is potentially dangerous when heavy rain falls high in the mountains.", "focus": "potentially", "zh": "即使是淺溪，山區下大雨時也可能變得危險。"},
          {"en": "Although the island has few roads, its community gardens have the potential to feed many more families.", "focus": "potential", "zh": "儘管島上道路不多，島上的社區菜園仍有能力供應更多家庭所需的食物。"},
          {"en": "A picture taken at sea can reveal a potentially important change that people on land have yet to notice.", "focus": "potentially", "zh": "一張在海上拍的照片可能揭示一項重要變化，而陸地上的人還沒察覺。"},
        ],
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
        examples: [
          {"en": "Tagging each recording with a village name helped the students find the interviews they needed for their map.", "focus": "Tagging", "zh": "學生替每段錄音加上村名標籤，就能找到製作地圖所需的訪談。"},
          {"en": "The jacket that a volunteer tagged with my name was waiting for me at the front desk.", "focus": "tagged", "zh": "志工替夾克掛上寫有我名字的標籤，我在櫃檯就拿到了。"},
          {"en": "Researchers tag pictures of whales with the date and place so they can follow the animals across seasons.", "focus": "tag", "zh": "研究人員在鯨魚照片上標註日期和地點，以便跨季節追蹤牠們。"},
        ],
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
        examples: [
          {"en": "Our new neighbor was so agreeable that even my quiet brother felt comfortable talking with her.", "focus": "agreeable", "zh": "新鄰居很隨和，連我那個寡言的弟弟都能自在地和她聊天。"},
          {"en": "We finally found a date that was agreeable to both families, although it meant changing our train tickets.", "focus": "agreeable", "zh": "我們終於找到兩家都能接受的日期，雖然這意味著要更改火車票。"},
          {"en": "Travelers once described the town as an agreeable place to spend the summer because a cool wind reached every street.", "focus": "agreeable", "zh": "旅人過去形容這裡是適合避暑的小鎮，因為每條街都吹得到涼風。"},
        ],
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
        examples: [
          {"en": "We knew the boat was close because its red light was still visible through the morning fog.", "focus": "visible", "zh": "我們知道船離得很近，因為晨霧中還看得到它的紅燈。"},
          {"en": "As visibility improved, the hikers could finally see where the path turned away from the river.", "focus": "visibility", "zh": "能見度改善後，健行者終於看清楚小徑在哪裡轉彎離開河道。"},
          {"en": "At low tide, parts of an old stone wall become visible and show where the village once met the sea.", "focus": "visible", "zh": "退潮時，一部分古老石牆會露出來，顯示村落過去與海洋交界的位置。"},
        ],
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
        examples: [
          {"en": "We bought cheaper seats, but the eventual cost of the concert trip still surprised the whole family.", "focus": "eventual", "zh": "我們買了較便宜的座位，但全家人還是對這趟演唱會之旅最終的花費感到意外。"},
          {"en": "Although the search lasted all afternoon, we eventually found the missing key inside a folded blanket.", "focus": "eventually", "zh": "雖然整個下午都在找，我們最後還是在摺好的毯子裡找到遺失的鑰匙。"},
          {"en": "Interviews with former players show that the team's eventual success began with changes made during its worst season.", "focus": "eventual", "zh": "從前球員的訪談可以看出，這支隊伍最終的成功始於戰績最差那季做出的改變。"},
        ],
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
        examples: [
          {"en": "An old letter sent the twins on a quest for the house where their grandmother had grown up.", "focus": "quest", "zh": "一封舊信讓雙胞胎踏上尋找祖母兒時故居的旅程。"},
          {"en": "The writer, whose quest began with a faded photograph, interviewed dozens of people before she found the family.", "focus": "quest", "zh": "這位作家從一張褪色的照片展開尋訪，訪問了幾十人，才找到那家人。"},
          {"en": "A city's quest for cleaner air can change ordinary habits, from the way people travel to how they heat their homes.", "focus": "quest", "zh": "一座城市為了追求更乾淨的空氣，可能改變居民從交通到住家供暖的日常習慣。"},
        ],
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
        examples: [
          {"en": "When her painting won first prize, the shy girl blushed and hid a smile behind her hands.", "focus": "blushed", "zh": "畫作拿到首獎時，那個害羞的女孩紅了臉，用手遮住笑容。"},
          {"en": "He tried to explain the sudden blush on his face, but his little sister had already guessed the reason.", "focus": "blush", "zh": "他想解釋自己為何突然臉紅，妹妹卻早已猜到原因。"},
          {"en": "In the final scene of the poem, the pale sky blushes as the first light touches the empty harbor.", "focus": "blushes", "zh": "詩的最後一幕中，第一道曙光照亮空蕩的港口，淡色的天空也泛起了紅暈。"},
        ],
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
        examples: [
          {"en": "The label left a sticky mark on the jar, so I washed it again with warm water.", "focus": "sticky", "zh": "標籤在罐子上留下黏黏的痕跡，我便又用溫水洗了一次。"},
          {"en": "After the children finished cutting paper, small stars stuck to the wet glue on their fingers.", "focus": "stuck", "zh": "孩子們剪完紙後，小星星黏在了他們指尖未乾的膠水上。"},
          {"en": "Tiny seeds with sticky surfaces can travel far from their parent plants by riding on an animal's fur.", "focus": "sticky", "zh": "表面帶黏性的小種子可以附著在動物毛皮上，旅行到離母株很遠的地方。"},
        ],
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
        examples: [
          {"en": "The photographer asked us to hold the same pose until the little boy looked up at the camera.", "focus": "pose", "zh": "攝影師請我們保持同一個姿勢，等小男孩抬頭看鏡頭。"},
          {"en": "Although the team posed for a formal picture, the photo everyone liked best showed the players laughing afterward.", "focus": "posed", "zh": "雖然球隊擺好姿勢拍了正式合照，大家最喜歡的卻是球員後來大笑的那張。"},
          {"en": "The dancer's unusual pose helps visitors recognize her in several paintings, even when her face is turned away.", "focus": "pose", "zh": "這位舞者獨特的姿勢，讓參觀者即使在畫中看不到她的正臉也能認出她。"},
        ],
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
        examples: [
          {"en": "Our ancestors left their names on the temple wall, giving us a starting point for our family history.", "focus": "ancestors", "zh": "祖先把名字留在廟牆上，讓我們有了追查家族歷史的起點。"},
          {"en": "The sailor whom my uncle recognized in the photograph turned out to be an ancestor of ours.", "focus": "ancestor", "zh": "叔叔在照片裡認出的那位水手，原來是我們家的一位祖先。"},
          {"en": "Stories passed down by island families tell us which crops their ancestors grew before large ships began to visit.", "focus": "ancestors", "zh": "島上世代相傳的故事，讓我們知道大型船隻出現以前，他們的祖先種些什麼。"},
        ],
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
        examples: [
          {"en": "Only one loaf of bread remained on the bare shelves when we reached the shop that evening.", "focus": "bare", "zh": "當晚我們到店裡時，空空的貨架上只剩下一條麵包。"},
          {"en": "The tree looked almost bare after the storm, although a few bright leaves still hung near the top.", "focus": "bare", "zh": "暴風雨過後，那棵樹看起來幾乎光禿了，不過樹梢附近還掛著幾片鮮豔的葉子。"},
          {"en": "An early photograph shows a bare slope where thick forest now provides homes for many kinds of birds.", "focus": "bare", "zh": "一張早年的照片裡是片光禿的山坡，如今茂密的樹林為許多鳥類提供了棲身之所。"},
        ],
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
        examples: [
          {"en": "I doubted the sincerity of his apology until he stayed after school to repair the broken shelf.", "focus": "sincerity", "zh": "我原本懷疑他道歉的誠意，直到他放學後留下來修理壞掉的架子。"},
          {"en": "Her thanks sounded sincere because she remembered exactly what each volunteer had done for the children.", "focus": "sincere", "zh": "她記得每位志工為孩子做了哪些事，所以她的感謝聽來格外真誠。"},
          {"en": "In the interview, long pauses and simple words gave her account a sincerity that polished speeches sometimes lack.", "focus": "sincerity", "zh": "在訪談中，長時間的停頓和平實的用字讓她的敘述流露出精心打磨的演說有時欠缺的真誠。"},
        ],
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
        examples: [
          {"en": "Without checking a single note, our guide named every sailor, and her powers of recall amazed us.", "focus": "recall", "zh": "導覽員沒看一眼筆記就說出每位水手的名字，她的記憶力讓我們驚嘆。"},
          {"en": "I recalled where I had left the tickets only after my sister mentioned the jacket I wore yesterday.", "focus": "recalled", "zh": "直到妹妹提起我昨天穿的外套，我才想起把票放在哪裡。"},
          {"en": "Researchers compared the children's recall of a story after some had read it silently and others had heard it aloud.", "focus": "recall", "zh": "有些孩子默讀故事，有些聽人朗讀，研究人員比較了兩組孩子對故事的記憶。"},
        ],
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
        examples: [
          {"en": "To counter the rumor that the pool would close, the coach showed us next month's practice schedule.", "focus": "counter", "zh": "為了反駁泳池即將關閉的傳聞，教練讓我們看下個月的練習時間表。"},
          {"en": "The student countered that the figures covered only weekdays, so they could tell us little about weekend travel.", "focus": "countered", "zh": "那位學生反駁說，數據只涵蓋平日，因此難以說明週末的出行情形。"},
          {"en": "Tall trees beside a city street help counter the summer heat by keeping sunlight off the road.", "focus": "counter", "zh": "市區道路旁的高樹遮住照向路面的陽光，有助於減輕暑熱。"},
        ],
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
        examples: [
          {"en": "A week without power crippled the small factory, leaving its workers unable to fill even the oldest orders.", "focus": "crippled", "zh": "停電一週使小工廠陷入癱瘓，工人連最早接到的訂單也無法完成。"},
          {"en": "The town faced crippling repair costs after a flood swept away the only road to the harbor.", "focus": "crippling", "zh": "洪水沖斷通往港口的唯一一條道路後，這座小鎮面臨難以負擔的維修費用。"},
          {"en": "A broken link in a busy trade route can cripple businesses hundreds of miles from the original trouble.", "focus": "cripple", "zh": "繁忙商路上有一環中斷，就可能讓遠在數百英里外的企業陷入癱瘓。"},
        ],
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
        examples: [
          {"en": "On market day the narrow street was choked with carts, and even people on foot could barely move.", "focus": "choked", "zh": "市集那天，狹窄的街上塞滿手推車，連行人都幾乎動彈不得。"},
          {"en": "Leaves that collect against the bridge can choke the stream when a sudden storm carries them toward the town.", "focus": "choke", "zh": "突來的暴風雨把樹葉往城鎮方向沖時，堆在橋邊的葉子可能堵住小溪。"},
          {"en": "The report describes how floating waste chokes rivers and slows the small boats that carry children to school.", "focus": "chokes", "zh": "報告描述漂浮的廢棄物如何堵塞河道，拖慢載孩子上學的小船。"},
        ],
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
        examples: [
          {"en": "The supposedly empty house surprised the visitors when a light came on behind an upstairs window.", "focus": "supposedly", "zh": "這棟房子據說無人居住，樓上一扇窗卻亮起了燈，讓訪客吃了一驚。"},
          {"en": "The clock was supposed to ring at noon, but the tower remained silent while the crowd waited below.", "focus": "supposed", "zh": "鐘原本應該在中午敲響，但群眾在下方等待時，鐘樓卻一片寂靜。"},
          {"en": "The writer follows a supposedly simple recipe to show how much local knowledge even an ordinary meal can require.", "focus": "supposedly", "zh": "作者照著一道據說簡單的食譜做菜，讓人看見一道平常的菜也可能需要許多在地知識。"},
        ],
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
        examples: [
          {"en": "From a distance, only the slender tower rising above the trees showed us where the village stood.", "focus": "slender", "zh": "從遠處望去，只有那座高過樹梢的細長塔樓能讓我們辨認村落的位置。"},
          {"en": "The dancer wore a dress whose slender blue lines made each turn of her body easier to see.", "focus": "slender", "zh": "舞者穿著的洋裝上有細長的藍線，讓人更容易看清她身體的每一次旋轉。"},
          {"en": "Some shore birds use their long, slender bills to reach food hidden deep in the wet sand.", "focus": "slender", "zh": "有些岸鳥用細長的喙探進濕沙深處，取出藏在裡面的食物。"},
        ],
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
        examples: [
          {"en": "From the bridge we watched a small boat emerging from the mist with its lights still on.", "focus": "emerging", "zh": "我們站在橋上，看著一艘小船從霧中現身，船上的燈還亮著。"},
          {"en": "Once the students compared their notes, a pattern emerged that none of them had noticed during the walk.", "focus": "emerged", "zh": "學生們比對筆記後，一個大家先前散步時都沒察覺的規律便顯現出來。"},
          {"en": "Letters from ordinary families offer a picture of daily life that rarely emerges from official records alone.", "focus": "emerges", "zh": "一般家庭的書信描繪出日常生活的樣貌，單靠官方紀錄很少能看見這樣的景象。"},
        ],
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
        examples: [
          {"en": "The supply boat is due at six, so the shopkeeper has gone down to wait at the harbor.", "focus": "due", "zh": "補給船預定六點到，店主已到港口等候。"},
          {"en": "Because the report was due before the holiday, we divided the remaining work among all four members.", "focus": "due", "zh": "報告必須在假期前繳交，我們便把剩下的工作分給四位成員。"},
          {"en": "An arrival board tells passengers when a train is due, even if the printed schedule has changed since morning.", "focus": "due", "zh": "即使印好的時刻表從早上起就有異動，到站資訊看板仍能告訴旅客列車預定幾點到。"},
        ],
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
        examples: [
          {"en": "The heat was familiar, but the high humidity kept our shirts damp long after we stopped walking.", "focus": "humidity", "zh": "高溫我們很熟悉，但濕度很高，停下腳步很久後襯衫仍然潮濕。"},
          {"en": "Since the afternoon was too humid for the paint to dry, we left the signs indoors overnight.", "focus": "humid", "zh": "由於下午太潮濕，油漆乾不了，我們把告示牌留在室內過夜。"},
          {"en": "Museum workers measure the humidity inside glass cases because sudden changes can damage old paper and wooden frames.", "focus": "humidity", "zh": "博物館人員測量展示櫃內的濕度，因為濕度驟變可能損壞舊紙張和木框。"},
        ],
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
        examples: [
          {"en": "The old song has stood the test of time because each generation finds a different reason to sing it.", "focus": "stood", "zh": "這首老歌經得起時間考驗，因為每一代人都找得到不同的理由來唱它。"},
          {"en": "Few wooden bridges can stand years of winter storms unless someone checks the joints and replaces broken boards.", "focus": "stand", "zh": "除非有人檢查接合處並更換壞木板，否則少有木橋能承受年復一年的冬季風暴。"},
          {"en": "A scientific explanation stands the test of time when it continues to account for evidence gathered by later generations.", "focus": "stands", "zh": "一種科學解釋若能持續說明後世蒐集到的證據，就經得起時間考驗。"},
        ],
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
        examples: [
          {"en": "Safety training is compulsory for every new club member, so nobody can skip the first meeting.", "focus": "compulsory", "zh": "每位新社員都必須接受安全訓練，因此誰也不能缺席第一次集會。"},
          {"en": "When swimming became compulsory at our school, several parents offered to help beginners feel comfortable in the water.", "focus": "compulsory", "zh": "游泳成為校內必修課後，幾位家長主動協助初學者適應水中環境。"},
          {"en": "A display of old schoolbooks shows how compulsory education once brought children from distant farms into the same classroom.", "focus": "compulsory", "zh": "一場舊課本展覽呈現義務教育當年如何讓來自偏遠農場的孩子們走進同一間教室。"},
        ],
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
        examples: [
          {"en": "The captain gave the youngest player credit for noticing the open space that led to the final goal.", "focus": "credit", "zh": "隊長把最後那一球的功勞歸給最年輕的球員，因為是他注意到可利用的空檔。"},
          {"en": "The nurse who first noticed the pattern was finally credited with making an important discovery at the hospital.", "focus": "credited", "zh": "最先發現該規律的護理師終於獲得肯定，大家將這項院內的重要發現歸功於她。"},
          {"en": "A look at old maps shows how often local guides received little credit for the routes they helped explorers find.", "focus": "credit", "zh": "翻閱古地圖會發現，探險家在當地嚮導的協助下找到路線，嚮導的功勞卻往往被忽略。"},
        ],
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
        examples: [
          {"en": "The new trail promises a fine view of the lake, so we packed a camera for the walk.", "focus": "promises", "zh": "新步道可望讓人欣賞到漂亮的湖景，我們便帶了相機去健行。"},
          {"en": "Although the plan looked promising, the team waited for a second test before ordering more materials.", "focus": "promising", "zh": "雖然計畫看來很有希望，團隊仍等到第二次測試後才增訂材料。"},
          {"en": "A map that promises an easy walk may leave out a steep hill that matters to people carrying heavy bags.", "focus": "promises", "zh": "一張讓人以為路程輕鬆的地圖，可能漏掉一段對背重物的人影響很大的陡坡。"},
        ],
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
        examples: [
          {"en": "After the storm, the village sent out an appeal for blankets because several families had lost their homes.", "focus": "appeal", "zh": "暴風雨過後，村裡呼籲大家捐贈毯子，因為有幾戶人家失去了住所。"},
          {"en": "The volunteers appealed to local shops for boxes after they ran out of bags for the donated clothes.", "focus": "appealed", "zh": "用來裝捐贈衣物的袋子用完後，志工向當地商家徵求紙箱。"},
          {"en": "The story has lasting appeal for young readers because its hero asks the same questions that trouble them.", "focus": "appeal", "zh": "這個故事長久以來都吸引著年輕讀者，因為主角提出的問題正是他們自己的困惑。"},
        ],
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
        examples: [
          {"en": "The names were chosen randomly from a box, so the quietest student had the same chance as everyone else.", "focus": "randomly", "zh": "名字是從盒中隨機抽出的，因此最安靜的學生和大家有相同的機會。"},
          {"en": "Although the marks looked random at first, the children found that a simple rule explained where each one appeared.", "focus": "random", "zh": "雖然這些記號起初看似毫無規律，孩子們卻發現一條簡單規則能解釋它們出現的位置。"},
          {"en": "In a survey, calling people randomly gives residents outside the town center a chance to share their views too.", "focus": "randomly", "zh": "在調查中隨機致電，也能讓住在市中心以外的居民有機會表達看法。"},
        ],
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
        examples: [
          {"en": "I put an empty container beside the sink so we could collect the water used to wash vegetables.", "focus": "container", "zh": "我把一個空容器放在水槽旁，以便收集洗菜用過的水。"},
          {"en": "The glass jars that once contained fruit now hold the colored pencils we use for drawing maps.", "focus": "contained", "zh": "那些曾經裝過水果的玻璃罐，現在放著我們畫地圖用的色鉛筆。"},
          {"en": "The shape of a cooking container can tell historians whether people usually boiled their food or heated it over a fire.", "focus": "container", "zh": "烹飪容器的形狀能讓歷史學家推斷，人們通常是水煮食物，還是架在火上加熱。"},
        ],
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
        examples: [
          {"en": "The kitchen buys fresh produce from nearby farms, so the soup changes with the season.", "focus": "produce", "zh": "廚房向附近農場購買新鮮蔬果，因此湯品會隨季節更換。"},
          {"en": "Farmers who produce several kinds of fruit can keep their stalls open after the early peach season ends.", "focus": "produce", "zh": "種植多種水果的農民在產期較早的桃子收成結束後，仍可以繼續擺攤。"},
          {"en": "A survey of market stalls found that local produce often reached customers on the same day it was picked.", "focus": "produce", "zh": "對市集攤位的調查發現，在地蔬果往往在採收當天就送到顧客手中。"},
        ],
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
        examples: [
          {"en": "Rain was blurring the words on the sign, so I moved closer to read the last line.", "focus": "blurring", "zh": "雨水讓告示上的字變得模糊，我只好走近一點讀最後一行。"},
          {"en": "By the time she reached home, the faces she had seen at the station were already a blur.", "focus": "blur", "zh": "等她回到家，在車站見過的那些臉孔在記憶中已是一片模糊。"},
          {"en": "When two towns grow toward each other, the line between them can blur even though their names stay the same.", "focus": "blur", "zh": "當兩座城鎮向彼此擴張，即使各自的名稱依舊，兩地的界線也可能逐漸模糊。"},
        ],
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
        examples: [
          {"en": "We asked the host to remove the offensive joke because it made fun of a guest's accent.", "focus": "offensive", "zh": "我們請主持人刪掉那則冒犯人的笑話，因為它取笑了一位來賓的口音。"},
          {"en": "When the speaker realized that his comment had offended several listeners, he asked them how he could put things right.", "focus": "offended", "zh": "講者發現自己的評論冒犯了幾位聽眾後，便詢問可以如何補救。"},
          {"en": "Museum guides explain why a word that once appeared on official maps may sound offensive to local people today.", "focus": "offensive", "zh": "博物館導覽員說明，為何一個曾出現在官方地圖上的用詞，如今可能讓當地人覺得受到冒犯。"},
        ],
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
        examples: [
          {"en": "My first draft had a clear ending, but I still needed a reason for the two friends to meet.", "focus": "draft", "zh": "我的初稿已經有明確的結局，但還得替兩個朋友安排一個相遇的理由。"},
          {"en": "After the children drafted a letter to the mayor, their teacher helped them check the dates and names.", "focus": "drafted", "zh": "孩子們擬好寫給市長的信後，老師幫他們核對日期和姓名。"},
          {"en": "A poet's early draft shows how changing a single word can make the sea seem calm or full of danger.", "focus": "draft", "zh": "詩人的早期草稿顯示，只改一個字就能讓海洋顯得平靜，或是充滿危險。"},
        ],
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
        examples: [
          {"en": "The seat beside me stayed vacant until a woman with a sleepy child got on at the next stop.", "focus": "vacant", "zh": "我旁邊的位子一直空著，直到下一站有位女士帶著昏昏欲睡的孩子上車。"},
          {"en": "As soon as a vacancy appeared in the evening class, the teacher called the first person on her waiting list.", "focus": "vacancy", "zh": "晚班課程一有空缺，老師就打電話給候補名單上的第一位。"},
          {"en": "The article follows neighbors who turned a vacant lot beside the railway into a place for growing food together.", "focus": "vacant", "zh": "這篇文章記錄了居民如何把鐵路旁的空地改成一座大家能一起種菜的園地。"},
        ],
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
        examples: [
          {"en": "It took enormous courage for the young singer to start again after her voice broke in the opening line.", "focus": "enormous", "zh": "年輕歌手唱第一句就破音，能重新開口需要極大的勇氣。"},
          {"en": "The two designs looked similar, although they differed enormously in the amount of wood each one required.", "focus": "enormously", "zh": "兩款設計外觀相似，所需的木料數量卻有極大差異。"},
          {"en": "The enormous roots of an old tree can spread well beyond its branches and change the ground around nearby houses.", "focus": "enormous", "zh": "老樹巨大的樹根可以延伸到樹冠之外很遠的地方，甚至改變附近房屋周圍的地面。"},
        ],
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
        examples: [
          {"en": "The workers halted the show when water reached the stage, and the audience waited quietly in the hall.", "focus": "halted", "zh": "水淹到舞台時，工作人員中止演出，觀眾便在廳裡安靜等候。"},
          {"en": "When a stone fell across the track, the little train came to a halt just outside the village.", "focus": "halt", "zh": "一塊石頭落在鐵軌上，小火車便在村外停了下來。"},
          {"en": "A dry season can halt trade along a river if the water becomes too shallow for boats carrying heavy loads.", "focus": "halt", "zh": "旱季時，河水若淺到載重船隻無法通行，沿河貿易就有可能中斷。"},
        ],
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
        examples: [
          {"en": "The retired coach graced our small celebration with a visit, bringing the team photograph she had kept for years.", "focus": "graced", "zh": "退休教練特地出席，為我們的小型慶祝會增光，還帶來保存多年的球隊合照。"},
          {"en": "The bird that graces the cover of this book is one the artist watched every morning as a child.", "focus": "graces", "zh": "為這本書封面增色的那隻鳥，就是畫家兒時每天早晨觀察的鳥。"},
          {"en": "For many years, paintings by local children have graced the library walls and given visitors a picture of village life.", "focus": "graced", "zh": "多年來，當地孩子的畫作點綴著圖書館的牆面，也讓訪客一窺村落生活。"},
        ],
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
        examples: [
          {"en": "The twins agreed verbally to share the room, but they never wrote down who would clean it.", "focus": "verbally", "zh": "雙胞胎口頭約定共用房間，卻從沒寫下由誰打掃。"},
          {"en": "Since the wind carried our voices away, verbal instructions were much harder to follow than the guide's hand signals.", "focus": "verbal", "zh": "風把說話聲吹散，和導覽員的手勢相比，口頭指示難懂得多。"},
          {"en": "Long before their stories appeared in books, island families passed them on verbally during quiet evenings at home.", "focus": "verbally", "zh": "早在故事被寫進書裡之前，島上的家族就會在家中寧靜的夜晚口耳相傳。"},
        ],
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
        examples: [
          {"en": "Our tight schedule left only ten minutes for lunch before the bus took us to the second museum.", "focus": "tight", "zh": "我們的行程很緊湊，只有十分鐘可以吃午餐，接著就得搭車去第二間博物館。"},
          {"en": "Because the hall was small, the chairs were packed so tightly together that we had to enter in single file.", "focus": "tightly", "zh": "場地太小，座椅排得很密，我們只好排成一列依序入場。"},
          {"en": "A village bus service running on a tight budget may keep only the routes that residents use most often.", "focus": "tight", "zh": "預算吃緊的村落公車服務，可能只能保留居民最常搭乘的路線。"},
        ],
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
        examples: [
          {"en": "My aunt began as an amateur singer, practicing after work and performing for friends on Saturday nights.", "focus": "amateur", "zh": "阿姨起初是業餘歌手，下班後練唱，週六晚上唱給朋友聽。"},
          {"en": "Several amateurs who learned to use a camera at our club now sell their photographs in local shops.", "focus": "amateurs", "zh": "幾位在我們社團學攝影的業餘人士，如今已在當地商店販售自己的作品。"},
          {"en": "Records kept by amateur bird watchers help scientists compare when different birds return to the same lake each spring.", "focus": "amateur", "zh": "業餘賞鳥者留下的紀錄，幫助科學家比較各種鳥類每年春季返回同一座湖的時間。"},
        ],
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
        examples: [
          {"en": "The bakery posted a vacancy in its window after the morning cook announced that she would retire.", "focus": "vacancy", "zh": "早餐時段的廚師宣布即將退休後，麵包店便在櫥窗貼出徵才啟事。"},
          {"en": "Although the position had been vacant for months, the museum waited for someone who knew the local language.", "focus": "vacant", "zh": "雖然這個職位已懸缺數月，博物館仍繼續等候會說當地語言的人。"},
          {"en": "In a small town, a single vacancy at the railway station could draw applications from several nearby villages.", "focus": "vacancy", "zh": "在小鎮上，火車站的一個職缺就可能吸引附近好幾個村子的人前來應徵。"},
        ],
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
        examples: [
          {"en": "We initially planned to stay for one night, but the village festival persuaded us to spend the weekend.", "focus": "initially", "zh": "我們起初只打算住一晚，但村裡的節慶讓我們決定留下來過週末。"},
          {"en": "Although her initial answer was wrong, the diagram she drew helped everyone understand how to solve the problem.", "focus": "initial", "zh": "雖然她最初的答案不對，但她畫的圖幫助大家理解了這道題的解法。"},
          {"en": "A field that initially looks empty may reveal insects, fallen seeds and tiny flowers to someone who sits quietly.", "focus": "initially", "zh": "一片乍看空無一物的田野，在靜坐觀察的人眼前，可能逐漸顯露出昆蟲、落下的種子和小花。"},
        ],
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
        examples: [
          {"en": "The school measured water consumption for a week to find out how much the garden actually needed.", "focus": "consumption", "zh": "學校測量了一週的用水量，想知道花園實際需要多少水。"},
          {"en": "Households that consume less electricity during the hottest hours can help reduce pressure on the local power system.", "focus": "consume", "zh": "在一天最熱的時段用電較少的家庭，可以幫忙減輕當地供電系統的負擔。"},
          {"en": "A study of food consumption found that people bought more fruit when shops sold it in smaller portions.", "focus": "consumption", "zh": "一項飲食消費研究發現，當商店把水果分成較小份量販售時，人們反而買得更多。"},
        ],
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
        examples: [
          {"en": "My brother dreads reading aloud in class because he fears losing his place while everyone is listening.", "focus": "dreads", "zh": "弟弟很怕在班上朗讀，因為他擔心大家都在聽時，自己卻找不到讀到哪裡了。"},
          {"en": "Although I had dreaded meeting the other players on my new team, their easy conversation made the afternoon pass quickly.", "focus": "dreaded", "zh": "我原本很怕和新隊友見面，但他們聊起天來很自在，那個下午很快就過去了。"},
          {"en": "The writer describes the dread she felt each winter when rough seas kept fishing boats from returning on time.", "focus": "dread", "zh": "作者描述了每年冬天海象惡劣、漁船未能準時返港時，她心裡所感到的恐懼。"},
        ],
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
        examples: [
          {"en": "Her passion for dance was clear from the hours she spent practicing alone after the studio closed.", "focus": "passion", "zh": "舞蹈教室關門後，她仍獨自練習好幾個小時，足見她對舞蹈的熱愛。"},
          {"en": "The neighbor who taught me to cook was passionate about choosing fruit at exactly the right stage.", "focus": "passionate", "zh": "教我做菜的鄰居非常熱衷於挑選熟度恰到好處的水果。"},
          {"en": "The film follows a train driver whose passion for drawing has given passengers a fresh view of ordinary stations for years.", "focus": "passion", "zh": "這部電影跟拍一位熱愛畫畫的火車司機，多年來，他的畫讓乘客重新看見平凡車站的樣貌。"},
        ],
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
        examples: [
          {"en": "The witness told the court that a stranger had assaulted a passenger while the train was stopped.", "focus": "assaulted", "zh": "證人在法庭上說，列車停靠時，一名陌生人襲擊了一位乘客。"},
          {"en": "After the assault was reported, the station manager asked witnesses to describe only what they had seen themselves.", "focus": "assault", "zh": "襲擊事件通報後，站長請目擊者只描述親眼看到的情況。"},
          {"en": "The article describes a support center where people who have been assaulted can ask for practical help in private.", "focus": "assaulted", "zh": "文章介紹一間支援中心，讓曾遭襲擊的人能在保有隱私的情況下尋求實際協助。"},
        ],
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
        examples: [
          {"en": "The reporter had to elbow her way through a group of excited fans to reach the interview area.", "focus": "elbow", "zh": "記者得用手肘擠過一群興奮的球迷，才能抵達採訪區。"},
          {"en": "As more people elbowed their way toward the front, the guide opened a second entrance for families with children.", "focus": "elbowed", "zh": "越來越多人往前推擠，導覽員便為帶孩子的家庭另開一個入口。"},
          {"en": "In the cartoon, a small bird uses its wing like an elbow to make room beside its larger brothers.", "focus": "elbow", "zh": "漫畫中，一隻小鳥把翅膀當手肘用，在體型比自己大的哥哥們身旁擠出位置。"},
        ],
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
        examples: [
          {"en": "The cracks in the school wall raised grave concerns, so the principal moved the class to another building.", "focus": "grave", "zh": "校舍牆上的裂縫引起嚴重疑慮，校長便讓這個班級移到另一棟樓。"},
          {"en": "When the guide spoke gravely about the rising river, even the children at the back stopped talking.", "focus": "gravely", "zh": "導覽員神情嚴肅地談起上漲的河水時，就連後排的孩子也停止了交談。"},
          {"en": "The report calls the loss of nesting beaches a grave threat to the future of an island bird.", "focus": "grave", "zh": "報告指出，可供築巢的海灘消失，對一種島嶼鳥類的未來構成嚴重威脅。"},
        ],
      },
    ],
  },
};
