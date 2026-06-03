import assert from "node:assert/strict";
import { getLearningSearchTerms, hasLearningIntent, normalizeLearningTopic } from "../src/app/utils/learningTopic.ts";

const topicCases = [
  ["我想提高我的微積分", "微積分"],
  ["我想加強 calculus", "微積分"],
  ["我對python有興趣，如果要開始學習要怎樣", "Python"],
  ["我想學鋼琴", "鋼琴"],
  ["我想提升英文口說", "英文"],
  ["請幫我準備統計", "統計"],
  ["我想學資料結構", "資料結構"],
  ["我想學機器學習三個月", "機器學習"],
];

for (const [input, expected] of topicCases) {
  assert.equal(normalizeLearningTopic(input), expected, input);
}

assert.deepEqual(getLearningSearchTerms("微積分"), ["微積分"]);
assert.deepEqual(getLearningSearchTerms("Python"), ["Python", "程式"]);
assert.deepEqual(getLearningSearchTerms("鋼琴"), ["鋼琴", "音樂", "樂器"]);

const intentCases = [
  ["我想學人工智慧", true],
  ["我想提高我的微積分", true],
  ["NCHU 有沒有鋼琴相關課程", true],
  ["幫我找 Python 相關活動", true],
  ["這個垃圾AI，你不會給東西嗎", false],
  ["AI", false],
  ["你在幹嘛", false],
];

for (const [input, expected] of intentCases) {
  assert.equal(hasLearningIntent(input), expected, input);
}

console.log(`learning topic tests passed: ${topicCases.length + 3 + intentCases.length}`);
