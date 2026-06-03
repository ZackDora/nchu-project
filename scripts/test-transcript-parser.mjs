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

  const compactMobilePaste = `
0016 籃球4C
Basketball 體育
Physical Education 體育室
Office of Physical Education and Sports 必修
Required 1 94 94 A+ N 查看級距
0503 半導體通識講座：與我們息息相關的半導體
Semiconductor in Our Life 自然科學領域
Natural Science Category 通識中心
General Education Center 必修
Required 2 - 81 A- N 查看級距
0924 英語溝通與表達
English Communication and Expression 外國語文
Foreign Languages 語言中心
Language Center 必修
Required 2 92 92 A+ N 查看級距
1169 普通化學
General Chemistry -
化學系
Department of Chemistry 必修
Required 3 78 78 B+ N 查看級距
9996 英文能力檢定及輔導
English Proficiency Requirement 全校英外語
English Language Courses 語言中心
Language Center 必修
Required 0 - I - N 查看級距
9999 操行
Conduct Mark -
學務處
Office of Student Affairs 必修
Required 0 - 85 A N -
`;

  const compactCourses = parsePastedCourses(compactMobilePaste, profile);
  assert.equal(compactCourses.length, 6);
  assert.equal(compactCourses[0].courseNo, "0016");
  assert.equal(compactCourses[0].name, "籃球4C");
  assert.equal(compactCourses[0].type, "必");
  assert.equal(compactCourses[0].category, "體育");
  assert.equal(compactCourses[0].offeredBy, "體育室");
  assert.equal(compactCourses[0].credits, 1);
  assert.equal(compactCourses[0].score, "94");
  assert.equal(compactCourses[0].grade, "A+");
  assert.equal(compactCourses[1].category, "自然科學領域");
  assert.equal(compactCourses[1].score, "81");
  assert.equal(compactCourses[2].category, "語言素養課程");
  assert.equal(compactCourses[3].offeredBy, "化學系");
  assert.equal(compactCourses[4].credits, 0);
  assert.equal(compactCourses[4].grade, "-");
  assert.equal(compactCourses[5].name, "操行");

  const copiedTranscriptWithHeaders = `
選課
號碼
Course No	課程別
Category	科目名稱
Course Name	課程分類
Classify	開課系所
Offered Dept.	學分
Credits	成績
Score	等第
GPA	EMI
課程
EMI
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
Language Center	3	96	A+	N
1062	必
Req	英語口語訓練(一)
English Oral Training (I)	-
外文系
Department of Foreign Languages and Literatures	2	92	A+	N
1752	必
Req	大學國文
College Chinese	敘事表達/大學國文
College Chinese	通識中心
General Education Center	2	88	A	N
1903	必
Req	數位人文概論
Introduction to Digital Humanities	-
文學院
College of Liberal Arts	2	83	A-	N
1904	必
Req	歷史與電影
History and Films	-
文學院
College of Liberal Arts	1	89	A	Y
1905	必
Req	台灣語言與文化
Taiwanese Languages and Cultures	-
文學院
College of Liberal Arts	1	90	A+	Y
2224	選
Elec	商業談判
Commercial Negotiation	-
行銷系
Department of Marketing	3	86	A	Y
6112	選
Elec	中國商法導論專題
Introduction to Chinese Business Law	-
法律系
Department of Law	2	80	A-	Y
9996	必
Req	英文能力檢定及輔導
English Proficiency Requirement	全校英外語
English Language Courses	語言中心
Language Center	0	P		N
抵	通
Gen	大一英文
Freshman English	-
-	2	抵		-
`;

  const headerCourses = parsePastedCourses(copiedTranscriptWithHeaders, profile);
  assert.equal(headerCourses.length, 12);
  assert.deepEqual(
    headerCourses.map((course) => course.courseNo),
    ["0313", "0456", "0959", "1062", "1752", "1903", "1904", "1905", "2224", "6112", "9996", ""],
  );
  assert.equal(headerCourses[0].name, "語言、文化與溝通");
  assert.equal(headerCourses[0].category, "人文領域");
  assert.equal(headerCourses[0].offeredBy, "通識中心");
  assert.equal(headerCourses[0].emi, true);
  assert.equal(headerCourses[2].category, "其他");
  assert.equal(headerCourses[10].name, "英文能力檢定及輔導");
  assert.equal(headerCourses[10].credits, 0);
  assert.equal(headerCourses[10].score, "P");
  assert.equal(headerCourses[10].grade, "-");
  assert.equal(headerCourses[11].name, "大一英文");
  assert.equal(headerCourses[11].credits, 2);
  assert.equal(headerCourses[11].grade, "抵");

  const separatedTransferTranscript = `
0041	體
P.E.	游泳2C
Swimming	體育
Physical Education	體育室
Office of Physical Education and Sports	1	88	A	N
0208	通
Gen	國際禮儀與專業形象
International Etiquette and Professional Image	通識自由選修/統合領域
Integrated Domains	通識中心
General Education Center	2	88	A	N
0558	通
Gen	數學世界的奧秘
The Mystery of Mathematics	自然科學領域
Natural Science Category	通識中心
General Education Center	2	87	A	Y
0643	通
Gen	探索我們的亞洲鄰居：政治、經濟、社會
Exploring Our Asian Neighbors: Politics, Economics and Society	核心素養
Core Competencies	通識中心
General Education Center	2	94	A+	Y
0644	通
Gen	開放教育中的全球素養
Open Education and Global Competence	核心素養
Core Competencies	通識中心
General Education Center	2	100	A+	Y
1008	服
Service	服務學習(二)：勞作教育
Service-LearningII:Student Labor Education and Work-Study Management	服務學習
Service Learning	學務處
Office of Student Affairs	0	74		N
1052	必
Req	英文作文(一)
English Composition (I)	-
外文系
Department of Foreign Languages and Literatures	2	92	A+	N
1056	必
Req	文學作品讀法
Approaches to Literature	-
外文系
Department of Foreign Languages and Literatures	2	87	A	N
1062	必
Req	英語口語訓練(一)
English Oral Training (I)	-
外文系
Department of Foreign Languages and Literatures	2	95	A+	N
1066	選
Elec	發音練習
Pronunciation Drills	-
外文系
Department of Foreign Languages and Literatures	2	87	A	N
1752	必
Req	大學國文
College Chinese	敘事表達/大學國文
College Chinese	通識中心
General Education Center	2	87	A	N
抵	通
Gen	大一英文
Freshman English	-
-
2	抵		-
`;

  const separatedTransferCourses = parsePastedCourses(separatedTransferTranscript, profile);
  assert.equal(separatedTransferCourses.length, 12);
  assert.equal(separatedTransferCourses[0].courseNo, "0041");
  assert.equal(separatedTransferCourses[0].type, "體");
  assert.equal(separatedTransferCourses[0].category, "體育");
  assert.equal(separatedTransferCourses[1].courseNo, "0208");
  assert.equal(separatedTransferCourses[1].category, "統合領域");
  assert.equal(separatedTransferCourses[5].courseNo, "1008");
  assert.equal(separatedTransferCourses[5].category, "體育/服務學習");
  assert.equal(separatedTransferCourses[5].credits, 0);
  assert.equal(separatedTransferCourses[11].name, "大一英文");
  assert.equal(separatedTransferCourses[11].credits, 2);
  assert.equal(separatedTransferCourses[11].grade, "抵");

  const narrowWrappedTranscript = `
0313 通
Gen
語言、文化與溝通
Language, Culture
and Communication
人文領域
Humanistic
Category
通識中心
General Education
Center
2 90 A+ Y
0456 通
Gen
數位媒體與第二外
語習得
Digital Media and
Second Language
Acquisition
社會科學領
域
Social
Science
Category
通識中心
General Education
Center
2 95 A+ Y
0959 選
Elec
實用華語(二)
Practical Chinese(II)
全校可選修
Other
Elective
Course
語言中心
Language Center
3 96 A+ N
1062 必
Req
英語口語訓練(一)
English Oral Training
(I)
-
外文系
Department of
Foreign
Languages and
Literatures
2 92 A+ N
1752 必
Req
大學國文
College Chinese
敘事表達/
大學國文
College
Chinese
通識中心
General Education
Center
2 88 A N
1903 必
Req
數位人文概論
Introduction to
Digital Humanities
-
文學院
College of Liberal
Arts
2 83 A- N
1904 必
Req
歷史與電影
History and Films -
文學院
College of Liberal
Arts
1 89 A Y
1905 必
Req
台灣語言與文化
Taiwanese Languages
and Cultures
-
文學院
College of Liberal
Arts
1 90 A+ Y
2224 選
Elec
商業談判
Commercial
Negotiation
-
行銷系
Department of
Marketing
3 86 A Y
6112 選
Elec
中國商法導論專題
Introduction to
Chinese Business Law
-
法律系
Department of
Law
2 80 A- Y
9996 必
Req
英文能力檢定及輔
導
English Proficiency
Requirement
全校英外語
English
Language
Courses
語言中心
Language Center
0 P N
抵 通
Gen
大一英文
Freshman English - - 2 抵
`;

  const narrowWrappedCourses = parsePastedCourses(narrowWrappedTranscript, profile);
  assert.equal(narrowWrappedCourses.length, 12);
  assert.equal(narrowWrappedCourses[1].name, "數位媒體與第二外語習得");
  assert.equal(narrowWrappedCourses[1].category, "社會科學領域");
  assert.equal(narrowWrappedCourses[4].name, "大學國文");
  assert.equal(narrowWrappedCourses[4].category, "敘事表達/大學國文");
  assert.equal(narrowWrappedCourses[10].name, "英文能力檢定及輔導");
  assert.equal(narrowWrappedCourses[10].category, "語言素養課程");
  assert.equal(narrowWrappedCourses[11].name, "大一英文");
  assert.equal(narrowWrappedCourses[11].grade, "抵");

  console.log("transcript parser tests passed: 70");
} finally {
  await server.close();
}
