"use strict";

// Learning notes keyed by academic year and printed question number.
const GSAT_PAPER_LESSONS = {
  "111-1": {
    examples: [
      {"en": "The village store had our groceries delivered before noon because the last bus left early that day.", "focus": "delivered", "zh": "村裡的商店安排在中午前把我們買的食物送到，因為那天末班公車很早就開走了。"},
      {"en": "When the bridge reopened, the driver made his first delivery to the families across the river.", "focus": "delivery", "zh": "橋重新開放後，那位司機首次送貨給河對岸的住戶。"},
      {"en": "A library boat delivers books to children who would otherwise spend an entire morning traveling to the nearest town.", "focus": "delivers", "zh": "一艘圖書船把書送給孩子，否則他們得花整個上午前往最近的城鎮。"},
    ],
    alternatives: {
      A: {"en": "The train company advanced the departure time by an hour, so we had to leave home before the sun rose.", "zh": "鐵路公司把發車時間提早一小時，我們只好在日出前出門。", "why": "advance 可以把時間提前。原題的受詞是披薩，空格後又接目的地，重點是食物如何送到家。"},
      C: {"en": "The shop offered a free paper bag to anyone who bought more books than they could carry.", "zh": "書店會免費提供紙袋給買書多到拿不動的客人。", "why": "offer 描寫主動提供，常說 offer something to someone。原題已經點完餐，接下來要安排的是把餐點送到住處。"},
      D: {"en": "We stretched a white sheet between two trees so everyone could watch the film after dark.", "zh": "我們把白布拉開掛在兩棵樹之間，讓大家天黑後可以看電影。", "why": "stretch 涉及長度或範圍。雖然麵團可以拉長，題目說的是外送目的地。"},
    },
  },
  "111-2": {
    examples: [
      {"en": "Whenever two visitors arrived together, the shop owner asked her assistant to help one of them.", "focus": "assistant", "zh": "每當兩位客人一起進店，店主就請她的助手接待其中一位。"},
      {"en": "The student who assisted the photographer held a white sheet to reflect sunlight onto the model's face.", "focus": "assisted", "zh": "協助攝影師的學生拿著白布，將陽光反射到模特兒臉上。"},
      {"en": "Letters from the painter's assistant describe how much work went into mixing colors before a single flower was painted.", "focus": "assistant", "zh": "畫家助手的信寫到，光是畫一朵花之前的調色工作就有多費工。"},
    ],
    alternatives: {
      B: {"en": "Her grandfather was a quiet influence on her writing, especially when she described people working at sea.", "zh": "祖父默默影響了她的寫作，尤其是她描寫在海上工作的人時。", "why": "influence 可指影響或有影響力的人。這裡的線索是協助處理辦公室事務，因此要選職務名稱。"},
      C: {"en": "The club thanked Mei for her contribution to the concert because she had found a piano for the hall.", "zh": "小美替禮堂找到一架鋼琴，社團因此感謝她對音樂會的貢獻。", "why": "contribution 是人做出的貢獻。原題用人名作主詞，後句還用 her 指那位實際幫忙的人。"},
      D: {"en": "The young politician visited our school and answered questions about the town's plan for a new sports center.", "zh": "這位年輕的政治人物到校回答問題，說明鎮上興建運動中心的計畫。", "why": "politician 指從政者。辦公室仰賴她協助的線索支持「助理」，題內沒有參與政治的線索。"},
    },
  },
  "111-3": {
    examples: [
      {"en": "The child thought the fox was alive until the actor slipped her hand out of the puppet.", "focus": "puppet", "zh": "孩子一直以為狐狸是活的，直到演員把手從戲偶裡抽出來。"},
      {"en": "The puppets that our class made from old socks each had a different voice in the play.", "focus": "puppets", "zh": "班上用舊襪子做的戲偶，在劇中各有不同的聲音。"},
      {"en": "By moving one wooden puppet between a lamp and a white screen, the artist told a story entirely in shadows.", "focus": "puppet", "zh": "藝術家在燈與白幕間移動一個木偶，只用影子就說完了一個故事。"},
    ],
    alternatives: {
      A: {"en": "A short chat with the old boat owner helped the students understand why the harbor closed so early.", "zh": "學生跟老船主簡短聊過後，才了解港口為什麼那麼早關閉。", "why": "chat 可組成 chat show「談話節目」。原題的 hand 提示觀眾看到的是以手操縱的表演。"},
      B: {"en": "We turned the map lesson into a quiz and asked each team to name the rivers marked in blue.", "zh": "我們把地圖課變成問答比賽，請各隊說出標成藍色的河流名稱。", "why": "quiz show 是益智問答節目。它能和 show 搭配，但解釋不了前面的 hand。"},
      D: {"en": "The small theater offered a variety of performances, from a silent play to a concert for children.", "zh": "這間小劇場提供多樣的演出，從默劇到兒童音樂會都有。", "why": "variety show 是綜藝節目。原題已經列出多種表演，最後要用 hand 點出其中一種傳統戲偶。"},
    },
  },
  "111-4": {
    examples: [
      {"en": "Even a shallow stream is potentially dangerous when heavy rain falls high in the mountains.", "focus": "potentially", "zh": "即使是淺溪，山區下大雨時也可能變得危險。"},
      {"en": "Although the island has few roads, its community gardens have the potential to feed many more families.", "focus": "potential", "zh": "儘管島上道路不多，島上的社區菜園仍有能力供應更多家庭所需的食物。"},
      {"en": "A picture taken at sea can reveal a potentially important change that people on land have yet to notice.", "focus": "potentially", "zh": "一張在海上拍的照片可能揭示一項重要變化，而陸地上的人還沒察覺。"},
    ],
    alternatives: {
      B: {"en": "The painter lifted the wet paper delicately so that the bright blue ink would stay inside the frame.", "zh": "畫家小心地拿起濕紙，讓鮮藍色的墨水留在畫框範圍內。", "why": "delicately 多形容動作輕柔細緻。fatal 描寫後果的嚴重性，題目要表達這個後果有可能發生。"},
      C: {"en": "The notice was written so ambiguously that some families arrived early while others thought the event was canceled.", "zh": "通知寫得模稜兩可，有些家庭提早到了，有些卻以為活動取消。", "why": "ambiguously 描寫話語或訊息有歧義。題目談副作用可能致命，沒有指出相關敘述有兩種解讀。"},
      D: {"en": "Readers can optionally add a short note beside each picture when they build their own travel album.", "zh": "讀者製作自己的旅遊相簿時，可以自行決定是否在每張照片旁加上短註。", "why": "optionally 表示某人可以自由選擇。致命副作用是一種可能發生的風險，當事人無法自行選擇。"},
    },
  },
  "111-5": {
    examples: [
      {"en": "Tagging each recording with a village name helped the students find the interviews they needed for their map.", "focus": "Tagging", "zh": "學生替每段錄音加上村名標籤，就能找到製作地圖所需的訪談。"},
      {"en": "The jacket that a volunteer tagged with my name was waiting for me at the front desk.", "focus": "tagged", "zh": "志工替夾克掛上寫有我名字的標籤，我在櫃檯就拿到了。"},
      {"en": "Researchers tag pictures of whales with the date and place so they can follow the animals across seasons.", "focus": "tag", "zh": "研究人員在鯨魚照片上標註日期和地點，以便跨季節追蹤牠們。"},
    ],
    alternatives: {
      B: {"en": "Flocking to the lake before the sun rose, the visitors hoped to hear the first birds calling across the water.", "zh": "遊客在日出前成群湧向湖邊，希望聽到第一批鳥兒的鳴聲傳過水面。", "why": "flock to a place 描寫人或動物群聚到某地。原題要求對照片加上可用來分類的資訊。"},
      C: {"en": "Rolling each map around a paper tube kept the corners flat while the students carried their work home.", "zh": "把每張地圖繞著紙筒捲起來，學生將作品帶回家時，邊角就不會折到。", "why": "roll 可以捲起紙張。日期和關鍵字是可供搜尋的標記，與捲起實體照片無關。"},
      D: {"en": "Snapping a picture of the bus schedule saved us a second walk to the station later that evening.", "zh": "當場拍下公車時刻表，讓我們當晚不必再走一趟車站。", "why": "snap a photo 是迅速拍照。原題的照片已經存在，現在要加上日期和關鍵字來整理。"},
    },
  },
  "111-6": {
    examples: [
      {"en": "Our new neighbor was so agreeable that even my quiet brother felt comfortable talking with her.", "focus": "agreeable", "zh": "新鄰居很隨和，連我那個寡言的弟弟都能自在地和她聊天。"},
      {"en": "We finally found a date that was agreeable to both families, although it meant changing our train tickets.", "focus": "agreeable", "zh": "我們終於找到兩家都能接受的日期，雖然這意味著要更改火車票。"},
      {"en": "Travelers once described the town as an agreeable place to spend the summer because a cool wind reached every street.", "focus": "agreeable", "zh": "旅人過去形容這裡是適合避暑的小鎮，因為每條街都吹得到涼風。"},
    ],
    alternatives: {
      A: {"en": "The new sports hall looked enormous from outside, but it filled up within minutes of the doors opening.", "zh": "新體育館從外面看很大，但開門後才幾分鐘就擠滿了人。", "why": "enormous 形容規模或程度很大。描述一個人容易相處時，需要能表達其性情的字。"},
      B: {"en": "Only a few intimate friends knew why the artist had painted the same empty chair every winter.", "zh": "只有幾位親密好友知道，那位畫家為何每年冬天都畫同一張空椅子。", "why": "intimate 描述彼此親密的關係。一個人可以待人隨和，即使對方與他並不熟識。"},
      D: {"en": "For the young runner, the ultimate goal was to finish a whole season without missing a single race.", "zh": "對那位年輕跑者而言，最終目標是整季一場比賽也不缺席。", "why": "ultimate 表示最終或最高程度，常修飾 goal。原題描述日常相處時讓人感到愉快的個性。"},
    },
  },
  "111-7": {
    examples: [
      {"en": "We knew the boat was close because its red light was still visible through the morning fog.", "focus": "visible", "zh": "我們知道船離得很近，因為晨霧中還看得到它的紅燈。"},
      {"en": "As visibility improved, the hikers could finally see where the path turned away from the river.", "focus": "visibility", "zh": "能見度改善後，健行者終於看清楚小徑在哪裡轉彎離開河道。"},
      {"en": "At low tide, parts of an old stone wall become visible and show where the village once met the sea.", "focus": "visible", "zh": "退潮時，一部分古老石牆會露出來，顯示村落過去與海洋交界的位置。"},
    ],
    alternatives: {
      A: {"en": "The two keys looked identical, so we tied a red string to the one that opened the garden gate.", "zh": "兩把鑰匙看起來一模一樣，我們便在能打開花園大門的那把上面綁了紅繩。", "why": "identical 通常涉及兩者完全相同。題目只描述一個藏在小巷裡的入口，關鍵在行人能否看見。"},
      C: {"en": "A quiet room is available after lunch for students who need a place to record their voices.", "zh": "午餐後有一間安靜的房間可供需要錄音的學生使用。", "why": "available 表示可取得或可使用。入口藏得深影響的是可見度，題目沒有說它暫停開放。"},
      D: {"en": "The guide had a remarkable memory for faces and recognized a visitor she had met ten years earlier.", "zh": "導覽員記人臉的本領驚人，竟認得出十年前見過的一位訪客。", "why": "remarkable 表示值得注意或非凡。巷子和小店遮住了入口，線索指向「幾乎看不見」。"},
    },
  },
  "111-8": {
    examples: [
      {"en": "We bought cheaper seats, but the eventual cost of the concert trip still surprised the whole family.", "focus": "eventual", "zh": "我們買了較便宜的座位，但全家人還是對這趟演唱會之旅最終的花費感到意外。"},
      {"en": "Although the search lasted all afternoon, we eventually found the missing key inside a folded blanket.", "focus": "eventually", "zh": "雖然整個下午都在找，我們最後還是在摺好的毯子裡找到遺失的鑰匙。"},
      {"en": "Interviews with former players show that the team's eventual success began with changes made during its worst season.", "focus": "eventual", "zh": "從前球員的訪談可以看出，這支隊伍最終的成功始於戰績最差那季做出的改變。"},
    ],
    alternatives: {
      A: {"en": "The shop charged a moderate fee for fixing the old lamp, so we asked them to repair another one.", "zh": "店家修舊燈的收費適中，我們於是又請他們修了另一盞。", "why": "moderate 比較費用的高低是否適中。題句是在比較最初預算與旅行最後可能花的金額。"},
      B: {"en": "The room fell into absolute silence when the director raised her hand for the last scene to begin.", "zh": "導演舉手示意最後一幕開始時，房間裡頓時鴉雀無聲。", "why": "absolute 有「完全的、絕對的」之意。absolute cost 有特定比較用法，題裡需要的是「最後的」費用。"},
      C: {"en": "The first test gave us promising results, so we kept the small garden open for another growing season.", "zh": "第一次試驗的結果令人看好，因此我們決定讓小菜園再開放一個生長季。", "why": "promising 帶有發展可期的意思。超出預算的金額是估算結果，沒有表示前景看好。"},
    },
  },
  "111-9": {
    examples: [
      {"en": "An old letter sent the twins on a quest for the house where their grandmother had grown up.", "focus": "quest", "zh": "一封舊信讓雙胞胎踏上尋找祖母兒時故居的旅程。"},
      {"en": "The writer, whose quest began with a faded photograph, interviewed dozens of people before she found the family.", "focus": "quest", "zh": "這位作家從一張褪色的照片展開尋訪，訪問了幾十人，才找到那家人。"},
      {"en": "A city's quest for cleaner air can change ordinary habits, from the way people travel to how they heat their homes.", "focus": "quest", "zh": "一座城市為了追求更乾淨的空氣，可能改變居民從交通到住家供暖的日常習慣。"},
    ],
    alternatives: {
      A: {"en": "During the trial of the new bus service, passengers wrote down how long they waited at each stop.", "zh": "新公車路線試辦期間，乘客記下在每個站牌等了多久。", "why": "trial 可以是試驗或審判。主人翁的目的是去找化石，題內沒有要測試的方法或產品。"},
      B: {"en": "The shortest route to the old tower crosses a wooden bridge that closes when the river rises.", "zh": "通往古塔的最短路線會經過一座木橋，水位上升時木橋會關閉。", "why": "route 說明從哪裡走，常見 route to a place。原題的 for 後面接想找到的化石。"},
      C: {"en": "The train drivers called off their strike after both sides reached an agreement about working hours.", "zh": "勞資雙方就工時達成協議後，火車司機取消了罷工。", "why": "go on strike 是罷工。這裡主人翁受到節目啟發，準備踏上一段尋找化石的旅程。"},
    },
  },
  "111-10": {
    examples: [
      {"en": "When her painting won first prize, the shy girl blushed and hid a smile behind her hands.", "focus": "blushed", "zh": "畫作拿到首獎時，那個害羞的女孩紅了臉，用手遮住笑容。"},
      {"en": "He tried to explain the sudden blush on his face, but his little sister had already guessed the reason.", "focus": "blush", "zh": "他想解釋自己為何突然臉紅，妹妹卻早已猜到原因。"},
      {"en": "In the final scene of the poem, the pale sky blushes as the first light touches the empty harbor.", "focus": "blushes", "zh": "詩的最後一幕中，第一道曙光照亮空蕩的港口，淡色的天空也泛起了紅暈。"},
    ],
    alternatives: {
      A: {"en": "The ball bounces higher on the stone path than it does on the soft grass beside our house.", "zh": "球在石板路上彈得比在我們家旁邊的柔軟草地上高。", "why": "bounce 描寫物體彈起。題目把粉紅色的花海比作新娘，視覺線索是臉上泛紅。"},
      C: {"en": "My uncle polishes the old silver cup before each family dinner because he likes to see it shine.", "zh": "叔叔每次家庭聚餐前都會擦亮那只舊銀杯，因為他喜歡看它閃閃發亮。", "why": "polish 作及物動詞常接被擦亮的東西。原題在 like 前沒有這類受詞，描述的是山谷自身泛紅。"},
      D: {"en": "The machine transfers each drawing onto cloth, so the children can wear the pictures they made in class.", "zh": "這台機器把每幅畫轉印到布上，讓孩子可以把課堂作品穿在身上。", "why": "transfer 的核心義是轉移或轉送。題句沒有移動人或物，櫻花帶給山谷的是顏色的變化。"},
    },
  },
  "112-1": {
    examples: [
      {"en": "The label left a sticky mark on the jar, so I washed it again with warm water.", "focus": "sticky", "zh": "標籤在罐子上留下黏黏的痕跡，我便又用溫水洗了一次。"},
      {"en": "After the children finished cutting paper, small stars stuck to the wet glue on their fingers.", "focus": "stuck", "zh": "孩子們剪完紙後，小星星黏在了他們指尖未乾的膠水上。"},
      {"en": "Tiny seeds with sticky surfaces can travel far from their parent plants by riding on an animal's fur.", "focus": "sticky", "zh": "表面帶黏性的小種子可以附著在動物毛皮上，旅行到離母株很遠的地方。"},
    ],
    alternatives: {
      B: {"en": "The paper under the fried bread felt greasy, and a dark spot slowly spread across the menu.", "zh": "炸麵包底下的紙摸起來油油的，一塊深色油漬慢慢暈到了菜單上。", "why": "greasy 描寫表面帶油。座椅下的口香糖難以移除，是因為它黏住了表面。"},
      C: {"en": "I felt clumsy in the heavy boots and knocked over a bucket while trying to climb the steps.", "zh": "穿著笨重的靴子，我覺得動作很不靈活，試著爬上階梯時還踢翻了水桶。", "why": "clumsy 常形容人動作笨拙，也可形容設計不便。題目要找的是口香糖黏附的特性。"},
      D: {"en": "A mighty wave lifted the little boat so high that we could see over the harbor wall.", "zh": "一道巨浪把小船托得很高，我們甚至看得見港牆另一側。", "why": "mighty 形容力量強大。題幹問口香糖為什麼難以清除，重點在它和座椅表面的接觸。"},
    },
  },
  "112-2": {
    examples: [
      {"en": "The photographer asked us to hold the same pose until the little boy looked up at the camera.", "focus": "pose", "zh": "攝影師請我們保持同一個姿勢，等小男孩抬頭看鏡頭。"},
      {"en": "Although the team posed for a formal picture, the photo everyone liked best showed the players laughing afterward.", "focus": "posed", "zh": "雖然球隊擺好姿勢拍了正式合照，大家最喜歡的卻是球員後來大笑的那張。"},
      {"en": "The dancer's unusual pose helps visitors recognize her in several paintings, even when her face is turned away.", "focus": "pose", "zh": "這位舞者獨特的姿勢，讓參觀者即使在畫中看不到她的正臉也能認出她。"},
    ],
    alternatives: {
      A: {"en": "A sudden clap of thunder sent the children running indoors before the first drops of rain fell.", "zh": "一聲突然的雷鳴，讓孩子們在第一滴雨落下前就跑進屋內。", "why": "clap 可指拍手聲或雷鳴，搭配 give a clap 等。模特兒面對鏡頭要擺出的是能維持的姿勢。"},
      B: {"en": "A gentle toss sent the ball just high enough for my little sister to catch it with both hands.", "zh": "我輕輕一拋，球的高度正好讓妹妹能用雙手接住。", "why": "toss 是拋擲的動作。adopt 後面需要能採取的姿態，題目也沒有可拋擲的物品。"},
      D: {"en": "With a sharp snap, the dry branch broke beneath my shoe and the birds above us flew away.", "zh": "乾樹枝在我腳下喀嚓一聲折斷，頭頂的鳥兒隨即飛走。", "why": "snap 也可指快照，常說 take a snap。模特兒自己能 adopt 的是 pose，按快門拍照的是攝影者。"},
    },
  },
  "112-3": {
    examples: [
      {"en": "Our ancestors left their names on the temple wall, giving us a starting point for our family history.", "focus": "ancestors", "zh": "祖先把名字留在廟牆上，讓我們有了追查家族歷史的起點。"},
      {"en": "The sailor whom my uncle recognized in the photograph turned out to be an ancestor of ours.", "focus": "ancestor", "zh": "叔叔在照片裡認出的那位水手，原來是我們家的一位祖先。"},
      {"en": "Stories passed down by island families tell us which crops their ancestors grew before large ships began to visit.", "focus": "ancestors", "zh": "島上世代相傳的故事，讓我們知道大型船隻出現以前，他們的祖先種些什麼。"},
    ],
    alternatives: {
      A: {"en": "My younger siblings share a bedroom, but each keeps a separate box for letters and small treasures.", "zh": "我的弟妹共用一間臥房，但各自用一個盒子收信和珍愛的小物。", "why": "siblings 指同一代的兄弟姊妹。家譜在這裡要往過去追溯到家族遷入北美的那一代。"},
      B: {"en": "Morning commuters filled the platform before seven, each hoping to find a seat for the long ride.", "zh": "早上七點前，月台已擠滿通勤者，人人都希望在漫長的車程中有位子可坐。", "why": "commuters 是固定往返住家與工作或學校的人。題目給的是家族血緣與遷徙歷史的線索。"},
      D: {"en": "The swimming instructors divided the beginners into small groups so each child could practice at a comfortable pace.", "zh": "游泳教練把初學者分成小組，讓每個孩子都能按適合自己的步調練習。", "why": "instructors 指教導課程或技能的人。這個身分無法說明家譜上的世代關係。"},
    },
  },
  "112-4": {
    examples: [
      {"en": "Only one loaf of bread remained on the bare shelves when we reached the shop that evening.", "focus": "bare", "zh": "當晚我們到店裡時，空空的貨架上只剩下一條麵包。"},
      {"en": "The tree looked almost bare after the storm, although a few bright leaves still hung near the top.", "focus": "bare", "zh": "暴風雨過後，那棵樹看起來幾乎光禿了，不過樹梢附近還掛著幾片鮮豔的葉子。"},
      {"en": "An early photograph shows a bare slope where thick forest now provides homes for many kinds of birds.", "focus": "bare", "zh": "一張早年的照片裡是片光禿的山坡，如今茂密的樹林為許多鳥類提供了棲身之所。"},
    ],
    alternatives: {
      A: {"en": "The teacher left one page blank so that each student could draw a map of the neighborhood from memory.", "zh": "老師留了一頁空白，讓每個學生能憑記憶畫出社區地圖。", "why": "blank 常用於沒有文字、圖像的頁面或螢幕。架上的商品被買光時，英語慣用 bare shelves。"},
      C: {"en": "The fallen tree was hollow inside, and a family of small birds had built a nest in it.", "zh": "倒下的樹幹內部中空，一家小鳥已在裡面築巢。", "why": "hollow 描述物體內部有空腔。題目說空的是貨架上擺商品的位置。"},
      D: {"en": "There was a queer smell coming from the cupboard, so we checked every bag of fruit inside.", "zh": "櫥櫃裡傳出一股怪味，我們便檢查了裡面的每一袋水果。", "why": "queer 在這個形容詞義項可指古怪。貨物快賣光直接說明架上缺貨，沒有暗示貨架外觀異常。"},
    },
  },
  "112-5": {
    examples: [
      {"en": "I doubted the sincerity of his apology until he stayed after school to repair the broken shelf.", "focus": "sincerity", "zh": "我原本懷疑他道歉的誠意，直到他放學後留下來修理壞掉的架子。"},
      {"en": "Her thanks sounded sincere because she remembered exactly what each volunteer had done for the children.", "focus": "sincere", "zh": "她記得每位志工為孩子做了哪些事，所以她的感謝聽來格外真誠。"},
      {"en": "In the interview, long pauses and simple words gave her account a sincerity that polished speeches sometimes lack.", "focus": "sincerity", "zh": "在訪談中，長時間的停頓和平實的用字讓她的敘述流露出精心打磨的演說有時欠缺的真誠。"},
    ],
    alternatives: {
      A: {"en": "For the small theater, a roof that leaked every winter became a serious liability when the audience grew.", "zh": "對這間小劇場來說，觀眾變多後，每到冬天就漏水的屋頂成了沉重負擔。", "why": "liability 可指負擔或責任。聽到道歉後想知道對方是否出自真心，問的是態度的真誠程度。"},
      B: {"en": "Thanks to the baker's generosity, every child who joined the reading club went home with a fresh roll.", "zh": "多虧麵包師慷慨相贈，每位參加讀書會的孩子都帶了一個剛出爐的小麵包回家。", "why": "generosity 著重願意付出或分享。這個情境檢驗的是說「對不起」時有沒有誠意。"},
      C: {"en": "The judge showed integrity by reporting a gift that arrived at her office before the competition began.", "zh": "比賽開始前，有人送禮到評審辦公室，她主動通報，展現了正直的品格。", "why": "integrity 側重一個人恪守原則的品格。原題聚焦在眼前這一次道歉是否真心。"},
    },
  },
  "112-6": {
    examples: [
      {"en": "Without checking a single note, our guide named every sailor, and her powers of recall amazed us.", "focus": "recall", "zh": "導覽員沒看一眼筆記就說出每位水手的名字，她的記憶力讓我們驚嘆。"},
      {"en": "I recalled where I had left the tickets only after my sister mentioned the jacket I wore yesterday.", "focus": "recalled", "zh": "直到妹妹提起我昨天穿的外套，我才想起把票放在哪裡。"},
      {"en": "Researchers compared the children's recall of a story after some had read it silently and others had heard it aloud.", "focus": "recall", "zh": "有些孩子默讀故事，有些聽人朗讀，研究人員比較了兩組孩子對故事的記憶。"},
    ],
    alternatives: {
      A: {"en": "The second storm tested the team's resolve, but nobody suggested leaving before the bridge was repaired.", "zh": "第二場暴風雨考驗團隊的決心，但橋修好前，沒有人提議離開。", "why": "resolve 作名詞是決心。祖父能細述童年往事，展現的是把過去的資訊想起來的能力。"},
      B: {"en": "Only a small fraction of the tickets were sold online because most villagers bought theirs at the door.", "zh": "只有一小部分門票在網路售出，因為大多數村民都到門口才買票。", "why": "fraction 表示一部分，常用 a fraction of。它無法說明為何祖父能生動描述童年。"},
      C: {"en": "It was a privilege to hear the old artist explain how she mixed the blue in her paintings.", "zh": "有機會聽那位年長的藝術家解說她如何調配畫中的藍色，是一份榮幸。", "why": "privilege 指特權或難得的榮幸。題句稱讚祖父的記憶表現，線索是他記得的具體細節。"},
    },
  },
  "112-7": {
    examples: [
      {"en": "To counter the rumor that the pool would close, the coach showed us next month's practice schedule.", "focus": "counter", "zh": "為了反駁泳池即將關閉的傳聞，教練讓我們看下個月的練習時間表。"},
      {"en": "The student countered that the figures covered only weekdays, so they could tell us little about weekend travel.", "focus": "countered", "zh": "那位學生反駁說，數據只涵蓋平日，因此難以說明週末的出行情形。"},
      {"en": "Tall trees beside a city street help counter the summer heat by keeping sunlight off the road.", "focus": "counter", "zh": "市區道路旁的高樹遮住照向路面的陽光，有助於減輕暑熱。"},
    ],
    alternatives: {
      A: {"en": "A single question about the empty field might provoke a lively debate among neighbors who want different things.", "zh": "只要問到那塊空地的用途，就可能引起鄰居間的熱烈辯論，因為大家各有期待。", "why": "provoke a debate 是引發辯論。原題裡廠商的主張已經存在，研究證據是用來回應、反駁它的。"},
      C: {"en": "The photographer used a bright lamp to expose the cracks that were hard to see on the dark wall.", "zh": "攝影師用亮燈照出暗色牆面上原本很難察覺的裂縫。", "why": "expose 可用在 expose a false claim，表示揭穿不實說法。原題著重相反證據如何反駁廠商已公開的主張。"},
      D: {"en": "The town plans to convert the old post office into a reading room with space for local artists.", "zh": "鎮上打算把舊郵局改建成閱覽室，並為當地藝術家保留空間。", "why": "convert 著重改變形態或用途，常見 convert A into B。研究證據的作用是反駁一項主張。"},
    },
  },
  "112-8": {
    examples: [
      {"en": "A week without power crippled the small factory, leaving its workers unable to fill even the oldest orders.", "focus": "crippled", "zh": "停電一週使小工廠陷入癱瘓，工人連最早接到的訂單也無法完成。"},
      {"en": "The town faced crippling repair costs after a flood swept away the only road to the harbor.", "focus": "crippling", "zh": "洪水沖斷通往港口的唯一一條道路後，這座小鎮面臨難以負擔的維修費用。"},
      {"en": "A broken link in a busy trade route can cripple businesses hundreds of miles from the original trouble.", "focus": "cripple", "zh": "繁忙商路上有一環中斷，就可能讓遠在數百英里外的企業陷入癱瘓。"},
    ],
    alternatives: {
      B: {"en": "Adding a second door accelerated the loading process because two groups could bring in boxes at the same time.", "zh": "多開一道門加快了裝貨速度，因為兩組人可以同時搬箱子進來。", "why": "accelerated 表示加快。原題描述政策失誤及債務造成的經濟損害，「加快經濟」也不是此處的自然搭配。"},
      C: {"en": "The broken wheel rendered the cart unsafe to use until a neighbor brought a spare one from his farm.", "zh": "車輪壞了，推車用起來不安全，直到鄰居從農場帶來備用輪才解決。", "why": "render 表「使成為」時通常要補出結果，如 rendered the cart unsafe。原句的 economy 後直接接 and 與另一個動詞。"},
      D: {"en": "We ventured beyond the last farm only after the guide showed us a clear path back to town.", "zh": "導覽員指給我們一條能清楚辨認的回城小徑後，我們才敢走過最後一座農場。", "why": "venture 表示冒險前往或嘗試，如 venture into a new market。原題要表達政策使經濟受創。"},
    },
  },
  "112-9": {
    examples: [
      {"en": "On market day the narrow street was choked with carts, and even people on foot could barely move.", "focus": "choked", "zh": "市集那天，狹窄的街上塞滿手推車，連行人都幾乎動彈不得。"},
      {"en": "Leaves that collect against the bridge can choke the stream when a sudden storm carries them toward the town.", "focus": "choke", "zh": "突來的暴風雨把樹葉往城鎮方向沖時，堆在橋邊的葉子可能堵住小溪。"},
      {"en": "The report describes how floating waste chokes rivers and slows the small boats that carry children to school.", "focus": "chokes", "zh": "報告描述漂浮的廢棄物如何堵塞河道，拖慢載孩子上學的小船。"},
    ],
    alternatives: {
      B: {"en": "The sudden light disturbed the birds resting near the shore, and several rose from the water at once.", "zh": "突如其來的燈光驚動了岸邊棲息的鳥，有好幾隻立刻從水面飛起。", "why": "disturb 表示打擾、擾亂。若說交通造成干擾，通常另交代受影響的活動。原句要用 be choked with 寫車輛塞滿道路。"},
      C: {"en": "A low stone wall enclosed the garden, leaving just enough room for a narrow gate beside the house.", "zh": "一道矮石牆圍住花園，只在屋旁留了剛好放得下一扇窄門的位置。", "why": "enclose 表示從外圍圈住。球迷的車輛佔滿道路，描述的是堵塞，沒有構成包圍道路的邊界。"},
      D: {"en": "The actor injected humor into the long speech by making each character tell the story a different way.", "zh": "演員讓每個角色用不同方式說故事，為冗長的演說注入幽默感。", "why": "inject 常用 inject A into B 或 inject B with A，表示注入。描述道路被車輛擠得水洩不通，慣用 choked with traffic。"},
    },
  },
  "112-10": {
    examples: [
      {"en": "The supposedly empty house surprised the visitors when a light came on behind an upstairs window.", "focus": "supposedly", "zh": "這棟房子據說無人居住，樓上一扇窗卻亮起了燈，讓訪客吃了一驚。"},
      {"en": "The clock was supposed to ring at noon, but the tower remained silent while the crowd waited below.", "focus": "supposed", "zh": "鐘原本應該在中午敲響，但群眾在下方等待時，鐘樓卻一片寂靜。"},
      {"en": "The writer follows a supposedly simple recipe to show how much local knowledge even an ordinary meal can require.", "focus": "supposedly", "zh": "作者照著一道據說簡單的食譜做菜，讓人看見一道平常的菜也可能需要許多在地知識。"},
    ],
    alternatives: {
      A: {"en": "The second route is undoubtedly shorter, since it takes us straight across the bridge instead of around the lake.", "zh": "第二條路線無疑比較短，因為它讓我們直接過橋，省去繞湖一圈。", "why": "undoubtedly 表示說話者確信。後文指出媒體其實受到政治影響，顯示作者對「客觀」這項說法有所保留。"},
      B: {"en": "The walk takes roughly forty minutes, though we usually stop at the bridge to watch the boats.", "zh": "這段路步行大約四十分鐘，不過我們通常會停在橋上看船。", "why": "roughly 常用於概估數值或表示大致情形。原題比較外界的說法與研究觀察，沒有要表達估計。"},
      C: {"en": "The children were understandably disappointed when thick fog kept the visiting team from reaching their island.", "zh": "濃霧讓客隊無法抵達島上，孩子們感到失望是可以理解的。", "why": "understandably 對某種反應給出理由。原題想保留「據稱客觀」與「實際受影響」之間的距離。"},
    },
  },
  "113-1": {
    examples: [
      {"en": "From a distance, only the slender tower rising above the trees showed us where the village stood.", "focus": "slender", "zh": "從遠處望去，只有那座高過樹梢的細長塔樓能讓我們辨認村落的位置。"},
      {"en": "The dancer wore a dress whose slender blue lines made each turn of her body easier to see.", "focus": "slender", "zh": "舞者穿著的洋裝上有細長的藍線，讓人更容易看清她身體的每一次旋轉。"},
      {"en": "Some shore birds use their long, slender bills to reach food hidden deep in the wet sand.", "focus": "slender", "zh": "有些岸鳥用細長的喙探進濕沙深處，取出藏在裡面的食物。"},
    ],
    alternatives: {
      A: {"en": "The soup seemed too spicy for my little brother, so the cook offered him a bowl of plain rice.", "zh": "這碗湯對弟弟來說似乎太辣了，廚師便給他一碗白飯。", "why": "spicy 的常見義是食物辛辣。題句的 figure 指身形，下一句則談運動與飲食習慣。"},
      C: {"en": "There was a slight change in her voice whenever she spoke about the village where she had grown up.", "zh": "每當她說起自己長大的村莊，聲音總會有一點變化。", "why": "a slight figure 也可以形容身形瘦小。slender 更直接帶出題目中希望維持的修長體態，因此是官方答案。"},
      D: {"en": "We held the rail as we crossed the slippery bridge because rain had fallen throughout the night.", "zh": "雨下了一整夜，過那座濕滑的橋時，我們一路扶著欄杆。", "why": "slippery 描述表面容易使人滑倒，也可比喻難以捉摸。原題在談運動與飲食對體態的影響。"},
    },
  },
  "113-2": {
    examples: [
      {"en": "From the bridge we watched a small boat emerging from the mist with its lights still on.", "focus": "emerging", "zh": "我們站在橋上，看著一艘小船從霧中現身，船上的燈還亮著。"},
      {"en": "Once the students compared their notes, a pattern emerged that none of them had noticed during the walk.", "focus": "emerged", "zh": "學生們比對筆記後，一個大家先前散步時都沒察覺的規律便顯現出來。"},
      {"en": "Letters from ordinary families offer a picture of daily life that rarely emerges from official records alone.", "focus": "emerges", "zh": "一般家庭的書信描繪出日常生活的樣貌，單靠官方紀錄很少能看見這樣的景象。"},
    ],
    alternatives: {
      B: {"en": "The guide kept flashing her light toward the trees until the children noticed the bird above them.", "zh": "導覽員不斷讓手電筒的光朝樹木閃動，直到孩子們注意到頭上的鳥。", "why": "flash 著重光線突然一亮或閃爍。日出時太陽從雲海中慢慢現身，emerge from 能表達這段過程。"},
      C: {"en": "We heard water rushing under the wooden bridge long before we reached the bend in the path.", "zh": "我們還沒走到小徑的轉彎處，就已聽見水流從木橋底下奔湧而過。", "why": "rush 表示迅速向某處衝去。觀日出的景象著重太陽從遮蔽中露出，缺少急速移動的線索。"},
      D: {"en": "We noticed a red leaf floating on the pond while the rest of the garden was covered in snow.", "zh": "花園其餘地方都已覆雪時，我們注意到池塘上還漂著一片紅葉。", "why": "float 常描寫物體漂浮在水面或空中。原句的 from 連著雲海，著重太陽從中出現。"},
    },
  },
  "113-3": {
    examples: [
      {"en": "The supply boat is due at six, so the shopkeeper has gone down to wait at the harbor.", "focus": "due", "zh": "補給船預定六點到，店主已到港口等候。"},
      {"en": "Because the report was due before the holiday, we divided the remaining work among all four members.", "focus": "due", "zh": "報告必須在假期前繳交，我們便把剩下的工作分給四位成員。"},
      {"en": "An arrival board tells passengers when a train is due, even if the printed schedule has changed since morning.", "focus": "due", "zh": "即使印好的時刻表從早上起就有異動，到站資訊看板仍能告訴旅客列車預定幾點到。"},
    ],
    alternatives: {
      A: {"en": "The wooden door is apt to stick after several days of rain, so please close it gently.", "zh": "連下幾天雨後，那扇木門很容易卡住，所以請輕輕關門。", "why": "be apt to do something 表示容易做某事。問句要的是公車的預定到站時間，apt 後也沒有不定詞可以承接。"},
      C: {"en": "Passengers bound for the coast should wait on the lower platform until the driver opens the gate.", "zh": "要到海岸的乘客應在下層月台等候，直到司機把門打開。", "why": "bound for 接目的地。問句用 what time 詢問時間，沒有在問公車開往哪裡。"},
      D: {"en": "The island ferry docked beside the old fish market just as the morning crowd began to arrive.", "zh": "渡輪靠在島上老魚市場旁時，早市的人潮恰好開始湧入。", "why": "dock 通常指船隻靠岸或接合。題目要知道在站牌等候的下一班公車預定何時抵達。"},
    },
  },
  "113-4": {
    examples: [
      {"en": "The heat was familiar, but the high humidity kept our shirts damp long after we stopped walking.", "focus": "humidity", "zh": "高溫我們很熟悉，但濕度很高，停下腳步很久後襯衫仍然潮濕。"},
      {"en": "Since the afternoon was too humid for the paint to dry, we left the signs indoors overnight.", "focus": "humid", "zh": "由於下午太潮濕，油漆乾不了，我們把告示牌留在室內過夜。"},
      {"en": "Museum workers measure the humidity inside glass cases because sudden changes can damage old paper and wooden frames.", "focus": "humidity", "zh": "博物館人員測量展示櫃內的濕度，因為濕度驟變可能損壞舊紙張和木框。"},
    ],
    alternatives: {
      A: {"en": "The island's population density falls sharply as the road climbs away from the busy towns near the coast.", "zh": "沿路離開熱鬧的沿海城鎮往山上走，島上的人口密度便明顯降低。", "why": "density 表示每單位空間有多少物質或人口。身上感到熱而黏的線索直接指向空氣的濕度。"},
      C: {"en": "Opening the two small windows improved air circulation enough to make the crowded art room more comfortable.", "zh": "打開那兩扇小窗改善了空氣流通，讓原本擁擠的美術教室舒服多了。", "why": "air circulation 是空氣流通。題目把高溫與另一個令人黏膩的因素並列，用 high humidity 最自然。"},
      D: {"en": "The warm lights and soft music gave the empty station a peaceful atmosphere on that rainy evening.", "zh": "那個雨夜，暖色燈光和輕柔音樂讓空蕩的車站有種寧靜的氣氛。", "why": "atmosphere 可指氣氛或大氣。high atmosphere 不能自然表達悶濕程度，humidity 才能配合 high 並解釋黏膩感。"},
    },
  },
  "113-5": {
    examples: [
      {"en": "The old song has stood the test of time because each generation finds a different reason to sing it.", "focus": "stood", "zh": "這首老歌經得起時間考驗，因為每一代人都找得到不同的理由來唱它。"},
      {"en": "Few wooden bridges can stand years of winter storms unless someone checks the joints and replaces broken boards.", "focus": "stand", "zh": "除非有人檢查接合處並更換壞木板，否則少有木橋能承受年復一年的冬季風暴。"},
      {"en": "A scientific explanation stands the test of time when it continues to account for evidence gathered by later generations.", "focus": "stands", "zh": "一種科學解釋若能持續說明後世蒐集到的證據，就經得起時間考驗。"},
    ],
    alternatives: {
      A: {"en": "We decided to stay beside the lake until the last boat returned, even though the evening air was cold.", "zh": "即使傍晚天氣寒冷，我們還是決定留在湖畔，等最後一艘船回來。", "why": "stay 常表示停留或保持某種狀態。作品歷久彌新的固定說法是 stand the test of time。"},
      B: {"en": "Students who take the reading test on Friday may borrow a dictionary for practice earlier in the week.", "zh": "週五要參加閱讀測驗的學生，可以在當週稍早借字典練習。", "why": "take a test 是人去應試。主詞是藝術作品，所謂時間的考驗要用 stand the test of time。"},
      C: {"en": "The new bridge will serve both villages by giving children a shorter walk to school on winter mornings.", "zh": "新橋會造福兩個村莊，讓孩子們冬天早晨能少走一段上學路。", "why": "serve 有服務或發揮作用之意，例如 serve a purpose。這裡要表達藝術作品能經得起時間考驗。"},
    },
  },
  "113-6": {
    examples: [
      {"en": "Safety training is compulsory for every new club member, so nobody can skip the first meeting.", "focus": "compulsory", "zh": "每位新社員都必須接受安全訓練，因此誰也不能缺席第一次集會。"},
      {"en": "When swimming became compulsory at our school, several parents offered to help beginners feel comfortable in the water.", "focus": "compulsory", "zh": "游泳成為校內必修課後，幾位家長主動協助初學者適應水中環境。"},
      {"en": "A display of old schoolbooks shows how compulsory education once brought children from distant farms into the same classroom.", "focus": "compulsory", "zh": "一場舊課本展覽呈現義務教育當年如何讓來自偏遠農場的孩子們走進同一間教室。"},
    ],
    alternatives: {
      A: {"en": "Her forceful speech persuaded the board to listen again to the families who lived beside the empty field.", "zh": "她強而有力的演說說服委員會再次聆聽空地旁住戶的意見。", "why": "forceful 形容說話、行動有力量。題目談法律或制度要求哪些人服役，要選表示具有強制性的字。"},
      B: {"en": "Our teacher helped us set a realistic goal after we saw how little time remained before the concert.", "zh": "發現距離演奏會只剩很短的時間後，老師幫我們訂下一個可行的目標。", "why": "realistic 說明是否符合實情或可行。男女服役義務的比較指向是否必須履行，而非可行性。"},
      D: {"en": "The bird has a distinctive call that even a new visitor can recognize after hearing it only once.", "zh": "這種鳥的叫聲很有特色，即使是初次到訪的人，只聽一次也能認出。", "why": "distinctive 表示有辨識度。原題用另一群人無須服役來補充說明，線索落在義務的有無。"},
    },
  },
  "113-7": {
    examples: [
      {"en": "The captain gave the youngest player credit for noticing the open space that led to the final goal.", "focus": "credit", "zh": "隊長把最後那一球的功勞歸給最年輕的球員，因為是他注意到可利用的空檔。"},
      {"en": "The nurse who first noticed the pattern was finally credited with making an important discovery at the hospital.", "focus": "credited", "zh": "最先發現該規律的護理師終於獲得肯定，大家將這項院內的重要發現歸功於她。"},
      {"en": "A look at old maps shows how often local guides received little credit for the routes they helped explorers find.", "focus": "credit", "zh": "翻閱古地圖會發現，探險家在當地嚮導的協助下找到路線，嚮導的功勞卻往往被忽略。"},
    ],
    alternatives: {
      A: {"en": "A map gave our team an advantage over the others when thick fog hid the signs along the road.", "zh": "濃霧遮住沿路的標誌時，有地圖讓我們這隊比其他隊更占優勢。", "why": "take advantage of 可表示利用，要接 of。原題接 for，後面交代的是誰付出努力、誰把功勞領走。"},
      B: {"en": "In the story, the fisherman gives up his plan for revenge after the stranger helps his youngest child.", "zh": "在故事裡，陌生人幫了漁夫最小的孩子後，漁夫便放棄復仇的計畫。", "why": "take revenge for 可以接引發報復的事。隊員抱怨的是隊長搶走成果的肯定，並未描述報復事件。"},
      C: {"en": "The class found a simple remedy for the noise outside by moving their reading circle to the quiet garden.", "zh": "班上找到一個解決外頭噪音的簡單辦法，就是把閱讀活動移到安靜的花園。", "why": "a remedy for 是針對問題的補救辦法。成員的努力在這裡是一項成果，題句問的是成果歸誰。"},
    },
  },
  "113-8": {
    examples: [
      {"en": "The new trail promises a fine view of the lake, so we packed a camera for the walk.", "focus": "promises", "zh": "新步道可望讓人欣賞到漂亮的湖景，我們便帶了相機去健行。"},
      {"en": "Although the plan looked promising, the team waited for a second test before ordering more materials.", "focus": "promising", "zh": "雖然計畫看來很有希望，團隊仍等到第二次測試後才增訂材料。"},
      {"en": "A map that promises an easy walk may leave out a steep hill that matters to people carrying heavy bags.", "focus": "promises", "zh": "一張讓人以為路程輕鬆的地圖，可能漏掉一段對背重物的人影響很大的陡坡。"},
    ],
    alternatives: {
      A: {"en": "The writer proposes a later opening time for the market so farmers can collect their fruit before leaving home.", "zh": "作者提議市場晚一點開門，好讓農民出門前能先採收水果。", "why": "propose a plan 是提出構想。飯店在介紹入住者可享有的服務和交通條件，沒有提出一項待討論的方案。"},
      B: {"en": "The wooden box contains several letters that describe an ordinary school day more than a hundred years ago.", "zh": "木盒裡裝著幾封信，描寫了一百多年前一個普通的上學日。", "why": "contain 表示內部裝有。便利的大眾運輸是旅館位置帶給旅客的好處，並非裝在旅館裡的物件。"},
      D: {"en": "The mark on the back confirms that the two cups once belonged to the same family.", "zh": "杯底的記號證實這兩只杯子以前屬於同一戶人家。", "why": "confirm 用來證實既有的消息或安排。這段介紹預告旅客可以享有的便利，用 promises 較合語境。"},
    },
  },
  "113-9": {
    examples: [
      {"en": "After the storm, the village sent out an appeal for blankets because several families had lost their homes.", "focus": "appeal", "zh": "暴風雨過後，村裡呼籲大家捐贈毯子，因為有幾戶人家失去了住所。"},
      {"en": "The volunteers appealed to local shops for boxes after they ran out of bags for the donated clothes.", "focus": "appealed", "zh": "用來裝捐贈衣物的袋子用完後，志工向當地商家徵求紙箱。"},
      {"en": "The story has lasting appeal for young readers because its hero asks the same questions that trouble them.", "focus": "appeal", "zh": "這個故事長久以來都吸引著年輕讀者，因為主角提出的問題正是他們自己的困惑。"},
    ],
    alternatives: {
      B: {"en": "The coach tried a new approach to teaching teamwork by asking the players to plan their own exercises.", "zh": "教練讓球員自行規劃練習，嘗試用新方法教他們團隊合作。", "why": "an approach to a problem 是處理問題的方法。醫院想讓公眾採取捐血行動，這種公開請求稱作 an appeal。"},
      C: {"en": "The rescue operation ended shortly after the last passenger reached the shore and found her family waiting nearby.", "zh": "最後一名乘客抵達岸邊、看見家人在附近等候後不久，救援行動便結束了。", "why": "operation 可指行動或手術。題目著眼於醫院公開請求大眾捐血，搭配 make an appeal for。"},
      D: {"en": "During our walk, one student made an observation about the different shapes of leaves on the same tree.", "zh": "散步時，一名學生說出了他的觀察，同一棵樹上的葉子有不同的形狀。", "why": "make an observation 是發表觀察所得。醫院此刻希望聽者捐血，語言功能是呼籲。"},
    },
  },
  "113-10": {
    examples: [
      {"en": "The names were chosen randomly from a box, so the quietest student had the same chance as everyone else.", "focus": "randomly", "zh": "名字是從盒中隨機抽出的，因此最安靜的學生和大家有相同的機會。"},
      {"en": "Although the marks looked random at first, the children found that a simple rule explained where each one appeared.", "focus": "random", "zh": "雖然這些記號起初看似毫無規律，孩子們卻發現一條簡單規則能解釋它們出現的位置。"},
      {"en": "In a survey, calling people randomly gives residents outside the town center a chance to share their views too.", "focus": "randomly", "zh": "在調查中隨機致電，也能讓住在市中心以外的居民有機會表達看法。"},
    ],
    alternatives: {
      A: {"en": "The teacher explained why “eligibly” sounds unusual and suggested writing “eligible to apply” in our letters.", "zh": "老師解釋了 eligibly 為什麼聽起來不自然，並建議我們在信中用 eligible to apply 表達「符合申請資格」。", "why": "eligibly 涉及資格，日常較常說 be eligible for 或 be eligible to do。不能挑選組員說明的是分配方式。"},
      C: {"en": "The hall was apparently empty, but a faint sound from behind the curtain made us wait before entering.", "zh": "大廳看來空無一人，但布幕後隱約傳來聲響，使我們等了一下才進去。", "why": "apparently 表示看來如此或據傳如此。題幹明確交代不能自選夥伴，所問的是怎麼分組。"},
      D: {"en": "The last bus had already left, and consequently several visitors decided to spend another night in the village.", "zh": "末班公車已經離開，因此幾位遊客決定在村裡多住一晚。", "why": "consequently 表示因果。「因此被分組」仍未說明人員如何分配，randomly 才能回應不能自行挑選的線索。"},
    },
  },
  "114-1": {
    examples: [
      {"en": "I put an empty container beside the sink so we could collect the water used to wash vegetables.", "focus": "container", "zh": "我把一個空容器放在水槽旁，以便收集洗菜用過的水。"},
      {"en": "The glass jars that once contained fruit now hold the colored pencils we use for drawing maps.", "focus": "contained", "zh": "那些曾經裝過水果的玻璃罐，現在放著我們畫地圖用的色鉛筆。"},
      {"en": "The shape of a cooking container can tell historians whether people usually boiled their food or heated it over a fire.", "focus": "container", "zh": "烹飪容器的形狀能讓歷史學家推斷，人們通常是水煮食物，還是架在火上加熱。"},
    ],
    alternatives: {
      A: {"en": "A low border of white stones marked the place where the school garden met the public path.", "zh": "一圈矮矮的白石標出校園花圃和公共步道交界的位置。", "why": "border 是邊界或邊緣。水龍頭下需要能接住並保留水的物品，單有邊界不足以裝水。"},
      B: {"en": "We set a timer for ten minutes so that every group would have an equal turn at the microphone.", "zh": "我們把計時器設為十分鐘，讓每一組都有同樣長的時間使用麥克風。", "why": "timer 可計算漏水的時間，但題目已給二十四小時，空格所指的是用來收集滴水的物品。"},
      D: {"en": "The guide placed a yellow marker beside the narrow trail to show us where the school grounds ended.", "zh": "導覽員在小徑旁放了一個黃色標記，讓我們看出校地的邊界在哪裡。", "why": "marker 可用來標記水位或位置。要累積二十四小時的水量，水龍頭下方需要的是容器。"},
    },
  },
  "114-2": {
    examples: [
      {"en": "The kitchen buys fresh produce from nearby farms, so the soup changes with the season.", "focus": "produce", "zh": "廚房向附近農場購買新鮮蔬果，因此湯品會隨季節更換。"},
      {"en": "Farmers who produce several kinds of fruit can keep their stalls open after the early peach season ends.", "focus": "produce", "zh": "種植多種水果的農民在產期較早的桃子收成結束後，仍可以繼續擺攤。"},
      {"en": "A survey of market stalls found that local produce often reached customers on the same day it was picked.", "focus": "produce", "zh": "對市集攤位的調查發現，在地蔬果往往在採收當天就送到顧客手中。"},
    ],
    alternatives: {
      B: {"en": "The bright wool hat soon came into fashion after a local singer wore it at the outdoor concert.", "zh": "一位本地歌手在戶外演唱會戴過那頂鮮豔的羊毛帽後，這種帽子很快就流行起來。", "why": "fashion 指時尚或流行款式。農民市場裡新鮮、當季、可供社區購買的東西是農產品。"},
      C: {"en": "The shop sells a local brand of rice whose bags show a picture of the farm where it grows.", "zh": "那間商店販售一個在地稻米品牌，米袋上印著稻田的照片。", "why": "brand 是品牌，可用 a brand of rice 指某品牌的米。fresh seasonal 直接描述的是當季蔬果本身。"},
      D: {"en": "The survey found a growing trend among families who now choose to buy fruit directly from local farms.", "zh": "調查發現，現在越來越多家庭選擇直接向在地農場買水果。", "why": "trend 說明人們行為或市場的趨勢。農夫市集實際陳列並供居民購買的是 produce。"},
    },
  },
  "114-3": {
    examples: [
      {"en": "Rain was blurring the words on the sign, so I moved closer to read the last line.", "focus": "blurring", "zh": "雨水讓告示上的字變得模糊，我只好走近一點讀最後一行。"},
      {"en": "By the time she reached home, the faces she had seen at the station were already a blur.", "focus": "blur", "zh": "等她回到家，在車站見過的那些臉孔在記憶中已是一片模糊。"},
      {"en": "When two towns grow toward each other, the line between them can blur even though their names stay the same.", "focus": "blur", "zh": "當兩座城鎮向彼此擴張，即使各自的名稱依舊，兩地的界線也可能逐漸模糊。"},
    ],
    alternatives: {
      B: {"en": "The gardener was trimming the bushes when she noticed a small nest hidden just above the gate.", "zh": "園丁修剪灌木時，注意到大門正上方藏著一個小鳥巢。", "why": "trim 是修剪或刪減，常接被修整的東西。題句的記憶隨時間自行變得不清晰，沒有誰在刻意刪減。"},
      C: {"en": "The workers started draining the pond so they could find the bicycle that had fallen through the ice.", "zh": "工人開始把池水抽掉，以便找出那輛穿破冰面掉進去的腳踏車。", "why": "drain 常指排水或耗盡精力。題目後面說想不起清楚的細節，重點是記憶的清晰度下降。"},
      D: {"en": "The boy stood by the broken gate, glaring at the goat that had eaten his prize flowers.", "zh": "男孩站在破損的門邊，怒瞪著那隻吃掉他得獎花朵的山羊。", "why": "glare 可指怒視或光線刺眼。記憶在變模糊，沒有注視別人的人或令人感到刺眼的光。"},
    },
  },
  "114-4": {
    examples: [
      {"en": "We asked the host to remove the offensive joke because it made fun of a guest's accent.", "focus": "offensive", "zh": "我們請主持人刪掉那則冒犯人的笑話，因為它取笑了一位來賓的口音。"},
      {"en": "When the speaker realized that his comment had offended several listeners, he asked them how he could put things right.", "focus": "offended", "zh": "講者發現自己的評論冒犯了幾位聽眾後，便詢問可以如何補救。"},
      {"en": "Museum guides explain why a word that once appeared on official maps may sound offensive to local people today.", "focus": "offensive", "zh": "博物館導覽員說明，為何一個曾出現在官方地圖上的用詞，如今可能讓當地人覺得受到冒犯。"},
    ],
    alternatives: {
      A: {"en": "The librarian asked us to remove the extra chairs because the excessive weight might damage the old wooden floor.", "zh": "館員請我們搬走多餘的椅子，因為過重可能會損壞老舊的木地板。", "why": "excessive 強調數量或程度超過限度。題目指出這類言論本身就會傷人，因此問的是冒犯性。"},
      B: {"en": "The farmer was furious when he discovered that someone had left the gate open during the night.", "zh": "農夫發現有人夜裡忘了關大門，氣得不得了。", "why": "furious 表示非常憤怒，也可指猛烈。hurtful 指向聽者受到的傷害，不能據此判定說話者正在盛怒。"},
      D: {"en": "The stubborn child kept trying to fit the square block into the round hole until her sister showed her another one.", "zh": "那個固執的孩子一直想把方積木塞進圓洞，直到姊姊指給她看另一個洞。", "why": "stubborn 表示固執或問題頑強難解。原題著重言論冒犯聽者，與說話者是否堅持己見無直接關聯。"},
    },
  },
  "114-5": {
    examples: [
      {"en": "My first draft had a clear ending, but I still needed a reason for the two friends to meet.", "focus": "draft", "zh": "我的初稿已經有明確的結局，但還得替兩個朋友安排一個相遇的理由。"},
      {"en": "After the children drafted a letter to the mayor, their teacher helped them check the dates and names.", "focus": "drafted", "zh": "孩子們擬好寫給市長的信後，老師幫他們核對日期和姓名。"},
      {"en": "A poet's early draft shows how changing a single word can make the sea seem calm or full of danger.", "focus": "draft", "zh": "詩人的早期草稿顯示，只改一個字就能讓海洋顯得平靜，或是充滿危險。"},
    ],
    alternatives: {
      A: {"en": "The text beneath the photograph gives the name of the bridge but leaves out the year it was built.", "zh": "照片下的文字列出橋名，卻沒有寫它的建造年份。", "why": "text 是文字內容的通稱。題句有 first、修改數次、最後交件，這串線索指向寫作階段的「初稿」。"},
      B: {"en": "A thin brush helped the students paint the smallest letters on the sign above the classroom door.", "zh": "學生用細筆刷，在教室門上方的牌子上畫出最小的幾個字母。", "why": "brush 是書寫或繪畫的工具。能被作者反覆修改、最後繳交的是文章草稿。"},
      D: {"en": "The plot of the play follows two neighbors who discover that their families once shared the same house.", "zh": "這齣戲的情節圍繞兩位鄰居，講述他們如何發現兩家人過去曾住在同一棟房子。", "why": "plot 是故事情節。題目說的是整篇作文寫完再修改的版本，也沒說這是有情節的故事。"},
    },
  },
  "114-6": {
    examples: [
      {"en": "The seat beside me stayed vacant until a woman with a sleepy child got on at the next stop.", "focus": "vacant", "zh": "我旁邊的位子一直空著，直到下一站有位女士帶著昏昏欲睡的孩子上車。"},
      {"en": "As soon as a vacancy appeared in the evening class, the teacher called the first person on her waiting list.", "focus": "vacancy", "zh": "晚班課程一有空缺，老師就打電話給候補名單上的第一位。"},
      {"en": "The article follows neighbors who turned a vacant lot beside the railway into a place for growing food together.", "focus": "vacant", "zh": "這篇文章記錄了居民如何把鐵路旁的空地改成一座大家能一起種菜的園地。"},
    ],
    alternatives: {
      A: {"en": "We chose casual clothes for the picnic because the invitation said we would spend the afternoon on the grass.", "zh": "我們挑了便服去野餐，因為邀請函說下午會在草地上活動。", "why": "casual 可形容穿著非正式或態度隨意。房子荒廢、長年積灰，線索指向沒有人居住。"},
      B: {"en": "The bowl looked too fragile to carry in my bag, so the artist wrapped it in several layers of paper.", "zh": "那只碗看起來太脆弱，不適合直接裝進袋子，藝術家於是拿好幾層紙把它包好。", "why": "fragile 表示容易破損。灰塵與潮味能說明久未使用，不能直接說明房屋結構脆弱。"},
      C: {"en": "A single bus connects the remote village to the coast, where most families sell their fruit on weekends.", "zh": "只有一班公車把偏遠村落和海岸地區連起來，大多數家庭週末都到海岸一帶賣水果。", "why": "remote 表示地點偏遠。偏遠的房子也可能一直有人住，題目說的是房子多年來的使用狀態。"},
    },
  },
  "114-7": {
    examples: [
      {"en": "It took enormous courage for the young singer to start again after her voice broke in the opening line.", "focus": "enormous", "zh": "年輕歌手唱第一句就破音，能重新開口需要極大的勇氣。"},
      {"en": "The two designs looked similar, although they differed enormously in the amount of wood each one required.", "focus": "enormously", "zh": "兩款設計外觀相似，所需的木料數量卻有極大差異。"},
      {"en": "The enormous roots of an old tree can spread well beyond its branches and change the ground around nearby houses.", "focus": "enormous", "zh": "老樹巨大的樹根可以延伸到樹冠之外很遠的地方，甚至改變附近房屋周圍的地面。"},
    ],
    alternatives: {
      A: {"en": "A gigantic paper bird hung from the ceiling, its wings reaching almost from one classroom wall to the other.", "zh": "天花板垂掛著一隻巨大的紙鳥，雙翼幾乎從教室一面牆延伸到另一面。", "why": "gigantic 多形容尺寸或規模驚人。形容救人時展現的勇氣，enormous courage 是較自然的搭配。"},
      B: {"en": "Members of the history club had exclusive access to the tower for one hour before the public tour began.", "zh": "公開導覽開始前，歷史社社員獲准獨自使用那座塔一小時。", "why": "exclusive 常指僅提供給某群人。題目強調救人所需的勇氣有多大，沒有排他或專屬的意思。"},
      C: {"en": "The teacher accepted multiple answers because the last question asked students to suggest their own ending for the story.", "zh": "老師接受多種答案，因為最後一題請學生替故事構思自己的結局。", "why": "multiple 強調數量有多個，通常接可數複數名詞。courage 在此是不可數的抽象名詞，要形容其程度。"},
    },
  },
  "114-8": {
    examples: [
      {"en": "The workers halted the show when water reached the stage, and the audience waited quietly in the hall.", "focus": "halted", "zh": "水淹到舞台時，工作人員中止演出，觀眾便在廳裡安靜等候。"},
      {"en": "When a stone fell across the track, the little train came to a halt just outside the village.", "focus": "halt", "zh": "一塊石頭落在鐵軌上，小火車便在村外停了下來。"},
      {"en": "A dry season can halt trade along a river if the water becomes too shallow for boats carrying heavy loads.", "focus": "halt", "zh": "旱季時，河水若淺到載重船隻無法通行，沿河貿易就有可能中斷。"},
    ],
    alternatives: {
      B: {"en": "Three of the duck eggs hatched during the night, and by breakfast the children could hear small sounds from the barn.", "zh": "三顆鴨蛋夜裡孵化，到了早餐時間，孩子們已聽得見穀倉裡傳出細小的聲音。", "why": "hatch 也可指策劃，例如 hatch a plan。資源短缺與 delayed 指向既有計畫停頓，而非新計畫正在形成。"},
      C: {"en": "The old shop possessed the only large oven in town, so neighbors brought their bread there before each festival.", "zh": "老店擁有鎮上唯一的大烤爐，因此每逢節慶前，鄰居都把麵包帶到那裡烘烤。", "why": "possess 指擁有。重點在缺乏資源使工程中止或延後，沒有在說工程由誰擁有。"},
      D: {"en": "The students reinforced their paper bridge by folding strips along its sides until it could hold six toy cars.", "zh": "學生沿著紙橋兩側摺上紙條來加固橋身，直到它能承受六輛玩具車的重量。", "why": "reinforce 指加強。資源不足造成工程受阻，與 delayed 並列的應是同樣妨礙進度的結果。"},
    },
  },
  "114-9": {
    examples: [
      {"en": "The retired coach graced our small celebration with a visit, bringing the team photograph she had kept for years.", "focus": "graced", "zh": "退休教練特地出席，為我們的小型慶祝會增光，還帶來保存多年的球隊合照。"},
      {"en": "The bird that graces the cover of this book is one the artist watched every morning as a child.", "focus": "graces", "zh": "為這本書封面增色的那隻鳥，就是畫家兒時每天早晨觀察的鳥。"},
      {"en": "For many years, paintings by local children have graced the library walls and given visitors a picture of village life.", "focus": "graced", "zh": "多年來，當地孩子的畫作點綴著圖書館的牆面，也讓訪客一窺村落生活。"},
    ],
    alternatives: {
      A: {"en": "The principal praised the students for welcoming new classmates and helping them find their way around the school.", "zh": "校長稱讚學生歡迎新同學，還幫他們熟悉校園。", "why": "praise someone for something 是稱讚某人做了某事。原題用 with his presence 表示貴賓蒞臨為典禮增光。"},
      C: {"en": "The artist addressed the audience in her first language and then invited a student to translate her opening remarks.", "zh": "藝術家先用母語對觀眾致詞，再邀請一名學生翻譯她的開場白。", "why": "address 可指向與會者致詞，後文確實提到演說。但 with his presence 是搭配 grace 的線索，修飾貴賓出席這件事。"},
      D: {"en": "The coach credited the final victory to the players who had spent extra hours practicing together after school.", "zh": "教練把最後的勝利歸功於放學後仍花時間一起練習的球員。", "why": "credit A to B 或 credit B with A 可用來歸功。原句描述貴賓到場讓典禮增色，沒有指定功勞歸屬。"},
    },
  },
  "114-10": {
    examples: [
      {"en": "The twins agreed verbally to share the room, but they never wrote down who would clean it.", "focus": "verbally", "zh": "雙胞胎口頭約定共用房間，卻從沒寫下由誰打掃。"},
      {"en": "Since the wind carried our voices away, verbal instructions were much harder to follow than the guide's hand signals.", "focus": "verbal", "zh": "風把說話聲吹散，和導覽員的手勢相比，口頭指示難懂得多。"},
      {"en": "Long before their stories appeared in books, island families passed them on verbally during quiet evenings at home.", "focus": "verbally", "zh": "早在故事被寫進書裡之前，島上的家族就會在家中寧靜的夜晚口耳相傳。"},
    ],
    alternatives: {
      B: {"en": "The chart in our science book shows how a dominantly inherited trait can appear in several generations of one family.", "zh": "自然課本裡的圖說明，一種顯性遺傳的特徵如何出現在同一家庭的好幾個世代。", "why": "dominantly 可描述主導性的方式，在遺傳語境也常見 dominantly inherited「以顯性方式遺傳」。題目用具體辱罵用語舉例，重點在傷害由言語造成。"},
      C: {"en": "People who bought their tickets legitimately were still asked to show them when they entered the crowded hall.", "zh": "即使是合法購票的人，進入擁擠的大廳時仍須出示門票。", "why": "legitimately 表示合法或有正當理由。題句列出主管罵人的原話，這是辨認辱罵方式的線索。"},
      D: {"en": "More relevantly for students who take the bus, the new rule moves the first bell back by ten minutes.", "zh": "對搭公車的學生來說，更切身相關的是，新規定把第一節上課鈴延後了十分鐘。", "why": "relevantly 說明事情與當前話題切題或相關。題目要分辨主管是透過什麼方式傷害同事。"},
    },
  },
  "115-1": {
    examples: [
      {"en": "Our tight schedule left only ten minutes for lunch before the bus took us to the second museum.", "focus": "tight", "zh": "我們的行程很緊湊，只有十分鐘可以吃午餐，接著就得搭車去第二間博物館。"},
      {"en": "Because the hall was small, the chairs were packed so tightly together that we had to enter in single file.", "focus": "tightly", "zh": "場地太小，座椅排得很密，我們只好排成一列依序入場。"},
      {"en": "A village bus service running on a tight budget may keep only the routes that residents use most often.", "focus": "tight", "zh": "預算吃緊的村落公車服務，可能只能保留居民最常搭乘的路線。"},
    ],
    alternatives: {
      A: {"en": "A hasty decision to paint the walls before checking the roof left us with wet paint after the storm.", "zh": "我們還沒檢查屋頂就匆忙決定刷牆，暴風雨後，牆上的新漆全濕了。", "why": "hasty 指決定或動作過於匆忙。要等好幾週才能約訪，說明市長的行程很滿。"},
      C: {"en": "The diligent student checked each name against the original list before sending the invitations to the printer.", "zh": "這名勤奮的學生把每個名字都和原名單核對過，才將邀請函送去印刷。", "why": "diligent 用來形容做事勤奮的人或其努力。schedule 在這裡需要能描述空檔很少的形容詞。"},
      D: {"en": "During a routine check of the stage lights, the team found a loose wire above the front row.", "zh": "工作人員例行檢查舞台燈光時，在第一排上方發現一條鬆動的電線。", "why": "routine schedule 可指例行的時程，但規律本身無法解釋為何一場訪問要排上好幾週。"},
    },
  },
  "115-2": {
    examples: [
      {"en": "My aunt began as an amateur singer, practicing after work and performing for friends on Saturday nights.", "focus": "amateur", "zh": "阿姨起初是業餘歌手，下班後練唱，週六晚上唱給朋友聽。"},
      {"en": "Several amateurs who learned to use a camera at our club now sell their photographs in local shops.", "focus": "amateurs", "zh": "幾位在我們社團學攝影的業餘人士，如今已在當地商店販售自己的作品。"},
      {"en": "Records kept by amateur bird watchers help scientists compare when different birds return to the same lake each spring.", "focus": "amateur", "zh": "業餘賞鳥者留下的紀錄，幫助科學家比較各種鳥類每年春季返回同一座湖的時間。"},
    ],
    alternatives: {
      A: {"en": "The official photographer for the school team took a picture after every match, even when the players lost.", "zh": "校隊的正式攝影師在每場比賽後都會拍照，即使球隊輸了也一樣。", "why": "official 表示經任命或正式認可。後半句的 professional 描述職業發展，前面用 amateur 才能呈現從業餘到專業的轉變。"},
      B: {"en": "The short film was an instant success, and the school had to add a second evening show.", "zh": "這部短片一推出就大受歡迎，學校只好加開第二場晚間放映。", "why": "instant 表示事情立即發生，常見 instant success。它無法說明設計師在開設專業工作室前的身分。"},
      D: {"en": "The course begins with elementary drawing exercises before students move on to portraits of people in motion.", "zh": "課程先從基礎繪畫練習開始，接著學生才畫人物的動態肖像。", "why": "elementary 通常形容課程、知識或技能的程度，如 elementary design skills。要稱呼業餘從事設計的人，用 amateur designer。"},
    },
  },
  "115-3": {
    examples: [
      {"en": "The bakery posted a vacancy in its window after the morning cook announced that she would retire.", "focus": "vacancy", "zh": "早餐時段的廚師宣布即將退休後，麵包店便在櫥窗貼出徵才啟事。"},
      {"en": "Although the position had been vacant for months, the museum waited for someone who knew the local language.", "focus": "vacant", "zh": "雖然這個職位已懸缺數月，博物館仍繼續等候會說當地語言的人。"},
      {"en": "In a small town, a single vacancy at the railway station could draw applications from several nearby villages.", "focus": "vacancy", "zh": "在小鎮上，火車站的一個職缺就可能吸引附近好幾個村子的人前來應徵。"},
    ],
    alternatives: {
      A: {"en": "Her teaching career began in a mountain village where four children from different grades shared one classroom.", "zh": "她的教學生涯從一個山村開始，當時四名不同年級的孩子共用一間教室。", "why": "teaching career 是教學生涯，涵蓋一段長期經歷。吸引多人應徵的是學校當下開出的特定職缺。"},
      C: {"en": "We entered the hall with the expectation that the concert would end before the last bus left town.", "zh": "我們走進大廳時，預期演奏會會在末班公車離開鎮上前結束。", "why": "expectation 指某人的預期或期望。applicants 是求職者，線索指向可供申請的職位。"},
      D: {"en": "The artist found inspiration for her new series in the shapes that fishing nets made against the evening sky.", "zh": "漁網映在傍晚天空上的形狀，為藝術家的新系列作品帶來了靈感。", "why": "inspiration 指引發創作的靈感，也可指鼓舞別人的人事物。教師資格與求職人數指的是徵才空缺。"},
    },
  },
  "115-4": {
    examples: [
      {"en": "We initially planned to stay for one night, but the village festival persuaded us to spend the weekend.", "focus": "initially", "zh": "我們起初只打算住一晚，但村裡的節慶讓我們決定留下來過週末。"},
      {"en": "Although her initial answer was wrong, the diagram she drew helped everyone understand how to solve the problem.", "focus": "initial", "zh": "雖然她最初的答案不對，但她畫的圖幫助大家理解了這道題的解法。"},
      {"en": "A field that initially looks empty may reveal insects, fallen seeds and tiny flowers to someone who sits quietly.", "focus": "initially", "zh": "一片乍看空無一物的田野，在靜坐觀察的人眼前，可能逐漸顯露出昆蟲、落下的種子和小花。"},
    ],
    alternatives: {
      B: {"en": "The guide seemed genuinely pleased when a quiet student noticed the tiny signature on the back of the picture.", "zh": "一名安靜的學生注意到畫背面的小簽名時，導覽員看起來是真心感到高興。", "why": "genuinely 說明感受或信念是真誠的。產品利潤和預期的比較重點在預測的時間點。"},
      C: {"en": "Visitors can walk back along the river or, alternatively, take a short bus ride through the old part of town.", "zh": "遊客可以沿河走回去，也可以改搭一小段公車穿過老城區。", "why": "alternatively 用來提出另一種做法。題目只比較實際利潤與先前的預估，沒有列出兩個方案。"},
      D: {"en": "The two maps look similar, although they are fundamentally different in the way they represent distance near the coast.", "zh": "兩張地圖看來相似，但它們在呈現海岸附近距離的方式上有根本差異。", "why": "fundamentally 表示從根本上。空格要指出「原先預期」與「後來獲利」的先後關係。"},
    },
  },
  "115-5": {
    examples: [
      {"en": "The school measured water consumption for a week to find out how much the garden actually needed.", "focus": "consumption", "zh": "學校測量了一週的用水量，想知道花園實際需要多少水。"},
      {"en": "Households that consume less electricity during the hottest hours can help reduce pressure on the local power system.", "focus": "consume", "zh": "在一天最熱的時段用電較少的家庭，可以幫忙減輕當地供電系統的負擔。"},
      {"en": "A study of food consumption found that people bought more fruit when shops sold it in smaller portions.", "focus": "consumption", "zh": "一項飲食消費研究發現，當商店把水果分成較小份量販售時，人們反而買得更多。"},
    ],
    alternatives: {
      A: {"en": "The new interview added a human dimension to the report by showing how the changes affected one family.", "zh": "新加入的訪談呈現這些變化如何影響一戶人家，讓報導多了人的面向。", "why": "dimension 可以是尺寸或議題的一個面向。飲食均衡的語境著重人實際吃進的蔬果。"},
      B: {"en": "The integration of music and history helped students hear how a song could reflect the events of its time.", "zh": "把音樂和歷史結合起來，幫助學生聽出一首歌如何反映它所處時代的事件。", "why": "integration 指把不同部分整合為整體。原題的健康線索指向飲食攝取，用 consumption of fruit and vegetables 較自然。"},
      C: {"en": "The kitchen's provision of free lunches made it possible for more children to stay for the afternoon activities.", "zh": "廚房提供免費午餐，使更多孩子能留下來參加下午的活動。", "why": "provision of fruit and vegetables 是供應蔬果，視角在提供者。此題關心的是影響個人健康的食用情形。"},
    },
  },
  "115-6": {
    examples: [
      {"en": "My brother dreads reading aloud in class because he fears losing his place while everyone is listening.", "focus": "dreads", "zh": "弟弟很怕在班上朗讀，因為他擔心大家都在聽時，自己卻找不到讀到哪裡了。"},
      {"en": "Although I had dreaded meeting the other players on my new team, their easy conversation made the afternoon pass quickly.", "focus": "dreaded", "zh": "我原本很怕和新隊友見面，但他們聊起天來很自在，那個下午很快就過去了。"},
      {"en": "The writer describes the dread she felt each winter when rough seas kept fishing boats from returning on time.", "focus": "dread", "zh": "作者描述了每年冬天海象惡劣、漁船未能準時返港時，她心裡所感到的恐懼。"},
    ],
    alternatives: {
      B: {"en": "The guide stresses the need to stay on the path because young plants grow close to its edges.", "zh": "導覽員強調必須留在步道上，因為兩側邊緣都有幼苗生長。", "why": "stress 作動詞可指強調。害羞和害怕公開露面說明的是心理上的畏懼，用 dread the thought of。"},
      C: {"en": "The river wanders through several small villages before it meets a larger stream near the railway bridge.", "zh": "這條河蜿蜒穿過幾座小村莊，在鐵路橋附近匯入一條較大的溪流。", "why": "wander 指漫步、蜿蜒或走神。主詞是男孩，後面直接接 the thought，句子要表達他對那個念頭的感受。"},
      D: {"en": "In the final chapter, the little dog escapes from the garden and follows a familiar voice down the street.", "zh": "在最後一章，小狗逃出花園，沿著街道循著熟悉的聲音跑去。", "why": "escape 著重逃離或避開。題目說男孩一想到公開演說就害怕，沒有說他成功避開了這個念頭或場合。"},
    },
  },
  "115-7": {
    examples: [
      {"en": "Her passion for dance was clear from the hours she spent practicing alone after the studio closed.", "focus": "passion", "zh": "舞蹈教室關門後，她仍獨自練習好幾個小時，足見她對舞蹈的熱愛。"},
      {"en": "The neighbor who taught me to cook was passionate about choosing fruit at exactly the right stage.", "focus": "passionate", "zh": "教我做菜的鄰居非常熱衷於挑選熟度恰到好處的水果。"},
      {"en": "The film follows a train driver whose passion for drawing has given passengers a fresh view of ordinary stations for years.", "focus": "passion", "zh": "這部電影跟拍一位熱愛畫畫的火車司機，多年來，他的畫讓乘客重新看見平凡車站的樣貌。"},
    ],
    alternatives: {
      A: {"en": "The town library became a valuable resource for families looking for old photographs of houses along the river.", "zh": "對想找河邊老房子照片的家庭而言，鎮立圖書館成了一項珍貴資源。", "why": "resource 是能利用的資源。把一生心力投入音樂，呈現的是對音樂長久而強烈的熱愛。"},
      B: {"en": "The new evening bus had an immediate impact on students who used to leave practice early to get home.", "zh": "新增的晚班公車立刻影響了那些過去為了回家而得提早離開練習的學生。", "why": "impact 常用 have an impact on 表示對某事的影響。原句著重音樂是他畢生熱愛的對象。"},
      D: {"en": "The teacher placed special emphasis on listening carefully before asking the children to describe the sounds they heard.", "zh": "老師請孩子們描述聽到的聲音前，特別強調要先仔細聆聽。", "why": "emphasis 指重點，常說 place emphasis on。全心奉獻的語意對應 a passion for music。"},
    },
  },
  "115-8": {
    examples: [
      {"en": "The witness told the court that a stranger had assaulted a passenger while the train was stopped.", "focus": "assaulted", "zh": "證人在法庭上說，列車停靠時，一名陌生人襲擊了一位乘客。"},
      {"en": "After the assault was reported, the station manager asked witnesses to describe only what they had seen themselves.", "focus": "assault", "zh": "襲擊事件通報後，站長請目擊者只描述親眼看到的情況。"},
      {"en": "The article describes a support center where people who have been assaulted can ask for practical help in private.", "focus": "assaulted", "zh": "文章介紹一間支援中心，讓曾遭襲擊的人能在保有隱私的情況下尋求實際協助。"},
    ],
    alternatives: {
      A: {"en": "A falling branch shattered the kitchen window, and pieces of glass landed all over the empty table.", "zh": "掉落的樹枝打碎了廚房窗戶，玻璃碎片灑滿空桌。", "why": "shatter 常指打碎玻璃等易碎物，也可比喻使人極度悲痛。原題的 them 指路人，瓶子是襲擊時使用的物品。"},
      C: {"en": "The committee overturned its earlier decision after residents showed how the new rule would affect the village market.", "zh": "居民說明新規定會如何影響村裡的市集後，委員會推翻了先前的決定。", "why": "overturn 可指把物體翻倒或推翻決定。題句描述以瓶子攻擊路人，overturn them 無法自然表達這個動作。"},
      D: {"en": "The coach condemned the cruel comments about the visiting team and asked the crowd to welcome both sides.", "zh": "教練譴責那些針對客隊的刻薄言論，並請觀眾歡迎雙方球員。", "why": "condemn 指嚴詞譴責。with glass bottles 說明實體物品被用來攻擊，呼應的是 assault。"},
    },
  },
  "115-9": {
    examples: [
      {"en": "The reporter had to elbow her way through a group of excited fans to reach the interview area.", "focus": "elbow", "zh": "記者得用手肘擠過一群興奮的球迷，才能抵達採訪區。"},
      {"en": "As more people elbowed their way toward the front, the guide opened a second entrance for families with children.", "focus": "elbowed", "zh": "越來越多人往前推擠，導覽員便為帶孩子的家庭另開一個入口。"},
      {"en": "In the cartoon, a small bird uses its wing like an elbow to make room beside its larger brothers.", "focus": "elbow", "zh": "漫畫中，一隻小鳥把翅膀當手肘用，在體型比自己大的哥哥們身旁擠出位置。"},
    ],
    alternatives: {
      A: {"en": "We heard waves crash against the harbor wall while the last fishing boat waited for a chance to enter.", "zh": "最後一艘漁船等待進港時，我們聽見海浪撞擊港牆的聲音。", "why": "crash 常描寫猛烈碰撞。題中的人要在擁擠車站擠出一條路，elbow 指出用手肘推擠的具體動作。"},
      B: {"en": "From the window we watched dry leaves tumble down the steps each time the wind swept across the yard.", "zh": "我們從窗邊看著院裡每起一陣風，乾葉就沿著階梯翻滾下去。", "why": "tumble 描寫跌落或翻滾。主角是有目的地穿過人群趕車，線索沒有提到跌倒。"},
      D: {"en": "Passengers with heavy bags often struggle to reach the far end of the platform before the train leaves.", "zh": "提著重行李的乘客常得費一番功夫，才能在發車前走到月台另一端。", "why": "struggle through a crowd 也能表示費力穿越人群。原題留有 my way，elbow my way through 更具體描寫擠過人群的方式。"},
    },
  },
  "115-10": {
    examples: [
      {"en": "The cracks in the school wall raised grave concerns, so the principal moved the class to another building.", "focus": "grave", "zh": "校舍牆上的裂縫引起嚴重疑慮，校長便讓這個班級移到另一棟樓。"},
      {"en": "When the guide spoke gravely about the rising river, even the children at the back stopped talking.", "focus": "gravely", "zh": "導覽員神情嚴肅地談起上漲的河水時，就連後排的孩子也停止了交談。"},
      {"en": "The report calls the loss of nesting beaches a grave threat to the future of an island bird.", "focus": "grave", "zh": "報告指出，可供築巢的海灘消失，對一種島嶼鳥類的未來構成嚴重威脅。"},
    ],
    alternatives: {
      A: {"en": "The librarian's swift response saved the papers because she moved them upstairs before the water reached the shelves.", "zh": "館員反應迅速，趕在水淹到架子前把文件搬上樓，因而保住了它們。", "why": "swift 描述動作迅速，如 a swift response。concerns 在此要用形容詞說明憂慮有多嚴重。"},
      B: {"en": "The novel describes a brutal winter during which several mountain villages lost their only road to the coast.", "zh": "小說描寫一個嚴酷的冬天，當時好幾個山村通往海岸的唯一道路都中斷了。", "why": "brutal 可形容事件或行為殘酷。空格修飾的是事件引發的 concerns，描述憂慮的嚴重性。"},
      C: {"en": "The writer removed a harsh comment from the review after reading the young actor's careful explanation of the scene.", "zh": "讀過那名年輕演員對該場戲的仔細說明後，作者刪掉了劇評裡一句尖銳的評語。", "why": "harsh 可形容批評嚴厲或環境嚴酷。和 concerns 搭配來表示重大疑慮時，慣用 grave。"},
    },
  },
};
