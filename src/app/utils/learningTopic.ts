const subjectAliases = [
  { canonical: "微積分", patterns: [/微積分/i, /calculus/i] },
  { canonical: "Python", patterns: [/python/i] },
  { canonical: "鋼琴", patterns: [/鋼琴/i, /piano/i] },
  { canonical: "英文", patterns: [/英文/i, /英語/i, /english/i] },
  { canonical: "日文", patterns: [/日文/i, /日語/i, /japanese/i] },
  { canonical: "統計", patterns: [/統計/i, /statistics?/i] },
  { canonical: "會計", patterns: [/會計/i, /accounting/i] },
  { canonical: "經濟學", patterns: [/經濟學/i, /economics?/i] },
  { canonical: "物理", patterns: [/物理/i, /physics?/i] },
  { canonical: "化學", patterns: [/化學/i, /chemistry/i] },
  { canonical: "生物", patterns: [/生物/i, /biology/i] },
  { canonical: "資料結構", patterns: [/資料結構/i, /data structures?/i] },
  { canonical: "機器學習", patterns: [/機器學習/i, /machine learning/i] },
  { canonical: "人工智慧", patterns: [/人工智慧/i, /\bAI\b/i] },
];

const topicLeadInPattern =
  /^(我想要|我想|想要|想|我要|請幫我|幫我|我要學|我想學習|我想學|學習|學|我對|對)\s*/i;
const improvementVerbPattern = /^(提高|加強|改善|補強|精進|提升|練習|複習|準備|學好)\s*(我的|我)?\s*/i;
const trailingIntentPattern =
  /(有興趣|感興趣|想開始|想入門|要怎樣|該怎麼辦|怎麼辦|怎麼學|如何開始|要如何開始|要開始學習要怎樣)\s*$/i;

const learningIntentPatterns = [
  /(?:我想|想要|想|我要|請幫我|幫我|我對|對).{0,30}(?:學|學習|入門|開始|提高|加強|改善|補強|精進|提升|練習|複習|準備|興趣|感興趣)/i,
  /(?:怎麼|如何|要怎樣|該怎麼辦).{0,30}(?:學|學習|入門|開始|提高|加強|改善|補強|精進|提升|練習|複習|準備)/i,
  /(?:learn|study|practice|improve|prepare|start|begin|get better at|interested in).{0,40}\w/i,
  /(?:課程|學習計畫|讀書計畫|入門路線|練習方式|推薦).{0,30}(?:嗎|呢|怎麼|如何|給|建議|安排|找|查|course|plan)/i,
  /(?:有沒有|有哪些|找|查|推薦).{0,40}(?:課程|活動|資源|course|activity|resource)/i,
  /(?:課程|活動|資源|course|activity|resource).{0,40}(?:有沒有|哪些|推薦|找|查)/i,
];

const nonLearningFeedbackPatterns = [
  /(?:垃圾|爛|廢|白痴|笨|沒用|不會給|看不懂|搞什麼|抱怨|投訴|bad|stupid|useless|trash|terrible)/i,
];

export const hasLearningIntent = (message: string) => {
  const compactMessage = message.trim();
  if (!compactMessage) return false;
  if (nonLearningFeedbackPatterns.some((pattern) => pattern.test(compactMessage))) {
    return learningIntentPatterns.some((pattern) => pattern.test(compactMessage));
  }
  return learningIntentPatterns.some((pattern) => pattern.test(compactMessage));
};

export const normalizeLearningTopic = (message: string) => {
  const compactMessage = message.trim();
  const alias = subjectAliases.find((subject) => subject.patterns.some((pattern) => pattern.test(compactMessage)));
  if (alias) return alias.canonical;

  const interestMatch = compactMessage.match(/我(?:對|想學|想學習)?\s*([^，,。.\n；;：:]+?)\s*(?:有興趣|感興趣|想開始|想入門)/i);
  if (interestMatch?.[1]?.trim()) return interestMatch[1].trim();

  const cleanedMessage = compactMessage
    .replace(/[。！？!?]+$/g, "")
    .replace(topicLeadInPattern, "")
    .replace(improvementVerbPattern, "")
    .replace(/^(一下|一些|一點)\s*/i, "")
    .replace(trailingIntentPattern, "")
    .trim();

  const splitTopic = cleanedMessage.split(/[，,。.\n；;：:]/)[0]?.trim();
  return splitTopic || compactMessage;
};

export const getLearningSearchTerms = (topic: string) => {
  const expandedTerms =
    /python/i.test(topic)
      ? ["Python", "程式"]
      : /微積分|calculus/i.test(topic)
      ? ["微積分"]
      : /鋼琴|音樂|樂器|吉他|管樂|合唱|演奏|piano|music/i.test(topic)
      ? ["鋼琴", "音樂", "樂器"]
      : [];
  const terms = [topic, ...expandedTerms]
    .map((term) => term.trim())
    .filter((term) => term.length > 0);
  return Array.from(new Set(terms));
};
