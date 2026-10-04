"use strict";

const LEVELS = [1,2,3,4,5,6];
const PAGE_SIZE = 60;
const FAVORITES_KEY = "gsat-standalone-favorites-v1";
const SEARCH_FEEDBACK_KEY = "gsat-v2-search-feedback-v1";
const PRACTICE_KEY = "gsat-v2-collocation-practice-v1";
const RECENT_SEARCH_KEY = "gsat-v3-recent-searches-v1";
const REVIEW_KEY = "gsat-v3-review-queue-v1";
const CURRENT_EXAM_MODEL = Object.freeze({
  version:"GSAT V6 · 111–115 真題＋自編情境",
  effectiveFrom:"111–115 真題語料＋現行詞表",
  coreLevels:[1,2,3,4,5],
  extendedLevel:6,
  passageWords:[180,400],
  discourseStructure:{blanks:4,options:5},
  referenceWeight:{multipleChoice:62,mixed:10,nonSelection:28},
  abilities:["字形語意搭配","篇章語法與轉承","語境詞彙","篇章組織","整合理解推論","讀寫整合","中譯英","短文寫作"]
});
