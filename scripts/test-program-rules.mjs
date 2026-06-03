import assert from "node:assert/strict";
import {
  animalScienceIndustryProgramCourses,
  animalScienceIndustryProgramId,
  getProgramCourseRules,
  isConfiguredProgramPlanCourse,
} from "../src/app/data/requirements.ts";

const compactCourseText = (value) => value.replace(/[()\s（）:：-]/g, "").toLowerCase();
const matchesAnyName = (courseName, names) => {
  const compactName = compactCourseText(courseName);
  return names.some((name) => {
    const compactTarget = compactCourseText(name);
    return compactName === compactTarget || compactName.includes(compactTarget) || compactTarget.includes(compactName);
  });
};

assert.equal(getProgramCourseRules(animalScienceIndustryProgramId).length, 10);
assert.equal(animalScienceIndustryProgramCourses.reduce((sum, course) => sum + course.credits, 0), 19);

const recognized = [
  "伴侶動物營養觀念建立及應用",
  "實驗動物技術與應用",
  "課外實習",
  "酪農業與豬隻產業之現況",
  "豬隻飼養管理與品牌行銷",
  "動物產業管理與行銷",
  "企業實習（一）",
  "企業實習（二）",
  "馬術產業管理",
  "環境與動物生產",
];

for (const name of recognized) {
  assert.equal(isConfiguredProgramPlanCourse(animalScienceIndustryProgramId, { name }, matchesAnyName), true, name);
}

assert.equal(isConfiguredProgramPlanCourse(animalScienceIndustryProgramId, { name: "普通動物學" }, matchesAnyName), false);

const countProgramCredits = (courses) =>
  courses
    .filter((course) => course.grade !== "抵")
    .filter((course) => isConfiguredProgramPlanCourse(animalScienceIndustryProgramId, course, matchesAnyName))
    .reduce((sum, course) => sum + course.credits, 0);

assert.equal(countProgramCredits([
  { name: "伴侶動物營養觀念建立及應用", credits: 1, grade: "A" },
  { name: "實驗動物技術與應用", credits: 2, grade: "A" },
]), 3);

assert.equal(countProgramCredits([
  { name: "企業實習（一）", credits: 3, grade: "A" },
  { name: "企業實習（二）", credits: 3, grade: "A" },
]), 6);

assert.equal(countProgramCredits([
  { name: "企業實習（一）", credits: 3, grade: "抵" },
  { name: "企業實習（二）", credits: 3, grade: "A" },
]), 3);

console.log(`program rule tests passed: ${recognized.length + 6}`);
