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

  const mobileWrappedTablePaste = `
0313	通
Gen	語言、文化與溝通
Language, Culture and Communication	人文領域
Humanistic Category	通識中心
General Education Center	2	90	A+	Y
0456	通
Gen	數位媒體與第二外語習得
Digital Media and Second Language Acquisition	社會科學領域
Social Science Category	通識中心
General Education Center	2	95	A+	Y
0959	選
Elec	實用華語(二)
Practical Chinese(II)	全校可選修
Other Elective Course	語言中心
Language Center	3
`;

  const wrappedCourses = parsePastedCourses(mobileWrappedTablePaste, profile);
  assert.equal(wrappedCourses.length, 2);
  assert.equal(wrappedCourses[0].courseNo, "0313");
  assert.equal(wrappedCourses[0].type, "通");
  assert.equal(wrappedCourses[0].name, "語言、文化與溝通");
  assert.equal(wrappedCourses[0].category, "人文領域");
  assert.equal(wrappedCourses[0].offeredBy, "通識中心");
  assert.equal(wrappedCourses[0].credits, 2);
  assert.equal(wrappedCourses[0].score, "90");
  assert.equal(wrappedCourses[0].grade, "A+");
  assert.equal(wrappedCourses[0].emi, true);
  assert.equal(wrappedCourses[1].courseNo, "0456");
  assert.equal(wrappedCourses[1].category, "社會科學領域");

  console.log("transcript parser tests passed: 21");
} finally {
  await server.close();
}
