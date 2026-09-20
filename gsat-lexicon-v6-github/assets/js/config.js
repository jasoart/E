"use strict";

const LEVELS = [1,2,3,4,5,6];
const PAGE_SIZE = 60;
const AI_MODEL_ID = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
const AI_LIBRARY_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1";
const AI_INDEX_KEY = "gsat-v6-minilm-l12-6012-patterns-2500-v1";
const FAVORITES_KEY = "gsat-standalone-favorites-v1";
const SEARCH_FEEDBACK_KEY = "gsat-v2-search-feedback-v1";
const PRACTICE_KEY = "gsat-v2-collocation-practice-v1";
const RECENT_SEARCH_KEY = "gsat-v3-recent-searches-v1";
const REVIEW_KEY = "gsat-v3-review-queue-v1";
const API_ENDPOINTS = Object.freeze({
  dictionary:"https://api.dictionaryapi.dev/api/v2/entries/en/",
  wiktionary:"https://en.wiktionary.org/api/rest_v1/page/definition/",
  freeDictionary:"https://freedictionaryapi.com/api/v1/entries/en/",
  tatoeba:"https://api.tatoeba.org/v1/sentences",
  wiktionaryAction:"https://en.wiktionary.org/w/api.php",
  commonsAction:"https://commons.wikimedia.org/w/api.php",
  datamuse:"https://api.datamuse.com/words",
  googleTranslate:"https://translate.googleapis.com/translate_a/single"
});
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
