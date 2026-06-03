import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

try {
  const { parsePastedCourses } = await server.ssrLoadModule("/src/app/parsing/transcriptParser.ts");
  const { getRequirementProfile } = await server.ssrLoadModule("/src/app/data/requirements.ts");
  const profile = getRequirementProfile("外國語文學系");

  const mobilePaste = `
選課
號碼
0242
課程別
選
科目名稱
鋼琴演奏入門
Introduction to Piano Playing
課程分類
人文領域
開課系所
通識中心
學分
2
成績
89
等第
A
EMI
N
選課號碼
12345
課程別
必
科目名稱
英語口語訓練(一)
開課系所
外文系
學分
2
成績
92
等第
A+
EMI
N
`;

  const courses = parsePastedCourses(mobilePaste, profile);

  assert.equal(courses.length, 2);
  assert.equal(courses[0].courseNo, "0242");
  assert.equal(courses[0].name, "鋼琴演奏入門Introduction to Piano Playing");
  assert.equal(courses[0].credits, 2);
  assert.equal(courses[0].grade, "A");
  assert.equal(courses[0].offeredBy, "通識中心");
  assert.equal(courses[1].courseNo, "12345");
  assert.equal(courses[1].type, "必");
  assert.equal(courses[1].grade, "A+");

  const simplePaste = "鋼琴演奏入門,2,A";
  assert.equal(parsePastedCourses(simplePaste, profile).length, 1);

  console.log("transcript parser tests passed: 10");
} finally {
  await server.close();
}
