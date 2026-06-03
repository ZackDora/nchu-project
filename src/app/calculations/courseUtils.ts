import {
  dfllBritishAmericanLiteratureCourses,
  dfllCollegeEmiCourses,
  dfllDigitalHumanitiesCourses,
  dfllRequiredProfessionalCourses,
  isDfllProfile,
} from "./dfll";
import type { TranscriptCourse } from "../context/TranscriptContext";
import {
  defaultPlanId,
  getRequirementProfile,
  type ChoiceCreditRequirement,
  type RequirementProfile,
} from "../data/requirements";

export const categoryOptions = [
  "人文領域",
  "社會科學領域",
  "自然科學領域",
  "統合領域",
  "核心素養",
  "資訊素養",
  "語言素養課程",
  "國防教育",
  "共同必修/通識",
  "體育/服務學習",
  "專業課程",
  "其他",
];

export const fallbackRequirementProfile = getRequirementProfile("外國語文學系");

const fullYearCourseAliases = [
  ...dfllRequiredProfessionalCourses.flatMap((course) => course.aliases),
  "大學國文",
  "大一英文",
];

export const firstSupportedAdmissionYear = 111;

export const getSemesterOptions = (admissionYear: number) =>
  Array.from({ length: 4 }, (_, yearOffset) => admissionYear + yearOffset).flatMap((year) => [`${year}-1`, `${year}-2`]);

export const getSemesterTerm = (semester: string) => semester.match(/-(1|2)$/)?.[1] ?? "";

export const getCourseChronology = (course: Pick<TranscriptCourse, "semester">) => {
  const match = course.semester.match(/^(\d{3})-(1|2)$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 10 + Number(match[2]);
};

export const sortCoursesChronologically = <T extends Pick<TranscriptCourse, "semester">>(items: T[]) =>
  [...items].sort((a, b) => getCourseChronology(a) - getCourseChronology(b));

export const compactCourseText = (value: string) =>
  value.normalize("NFKC").replace(/⻄/g, "西").replace(/\s+/g, "").trim().toLowerCase();

export const matchesAnyName = (courseName: string, names: string[]) => {
  const compactName = compactCourseText(courseName);
  return names.some((name) => compactName.includes(compactCourseText(name)));
};

const isFullYearCourseName = (name: string) => matchesAnyName(name, fullYearCourseAliases);

export const isWithdrawnCourse = (course: Pick<TranscriptCourse, "score" | "grade">) =>
  course.score.toUpperCase() === "W" || course.grade.toUpperCase() === "W";

export const isFailedCourse = (course: Pick<TranscriptCourse, "grade">) => course.grade.toUpperCase() === "F";

export const isUncountedOutcomeCourse = (course: Pick<TranscriptCourse, "score" | "grade">) =>
  isWithdrawnCourse(course) || isFailedCourse(course);

export const getScoreDisplay = (course: Pick<TranscriptCourse, "score" | "grade">) => {
  if (isWithdrawnCourse(course)) return "退選，不採計學分";
  if (isFailedCourse(course)) return "不及格，不採計學分";
  return course.score;
};

export const emptyCourse = (): TranscriptCourse => ({
  courseNo: "",
  semester: "",
  name: "",
  credits: 0,
  score: "",
  grade: "",
  type: "",
  typeLabel: "",
  category: "其他",
  offeredBy: "",
  emi: false,
  genEdProfessorFromMajorDepartment: false,
  planId: defaultPlanId,
});

export const normalizeGrade = (value: string) => value.trim().toUpperCase().replace("＋", "+").replace("－", "-");

export const inferCategory = (name: string, profile: RequirementProfile = fallbackRequirementProfile, offeredBy = "") => {
  if (profile.languageLiteracyRequirements.some((requirement) => compactCourseText(name).includes(compactCourseText(requirement.name)))) return "語言素養課程";
  if (/(國防|全民國防|軍訓)/.test(name)) return "國防教育";
  if (/(體育|服務)/.test(name)) return "體育/服務學習";
  if (isDfllProfile(profile) && dfllRequiredProfessionalCourses.some((course) => matchesAnyName(name, course.aliases))) return "專業課程";
  if (isDfllProfile(profile) && matchesAnyName(name, dfllBritishAmericanLiteratureCourses)) return "專業課程";
  if (isDfllProfile(profile) && matchesAnyName(name, dfllDigitalHumanitiesCourses)) return "專業課程";
  if (isDfllProfile(profile) && matchesAnyName(name, dfllCollegeEmiCourses)) return "專業課程";
  if (isDfllProfile(profile) && offeredBy && /(數位人文|Digital\s*Humanities)/i.test(name) && /(文學院|CollegeofLiberalArts)/i.test(compactCourseText(offeredBy))) return "專業課程";
  if (offeredBy && profile.homeDepartmentPatterns.some((pattern) => pattern.test(compactCourseText(offeredBy)))) return "專業課程";
  if (profile.choiceCreditRequirements.some((requirement) => requirement.options.some((option) => option.pattern.test(name)))) return "專業課程";
  if (/(通識|共同|語文)/.test(name)) return "共同必修/通識";
  return "其他";
};

export const categorySummaryKey = (category: string, profile: RequirementProfile = fallbackRequirementProfile) => {
  if (category === "體育") return profile.nonGraduationRequirement?.category ?? "體育/服務學習";
  if (["人文領域", "社會科學領域", "自然科學領域", "統合領域", "核心素養", "資訊素養", "語言素養課程", "國防教育"].includes(category)) {
    return category;
  }
  if (categoryOptions.includes(category)) return category;
  return "其他";
};

export const typeLabels: Record<string, string> = {
  必: "必修",
  選: "選修",
  通: "通識",
  體: "體育",
  服: "服務學習",
};

export const getCourseCategory = (course: Pick<TranscriptCourse, "category" | "name" | "offeredBy" | "type">, profile: RequirementProfile = fallbackRequirementProfile) => {
  if (course.type === "體" || course.type === "服") return profile.nonGraduationRequirement?.category ?? "體育/服務學習";
  return categorySummaryKey(course.category || inferCategory(course.name, profile, course.offeredBy), profile);
};

export const countableCredits = (course: Pick<TranscriptCourse, "category" | "credits" | "grade" | "name" | "score" | "type">, profile: RequirementProfile = fallbackRequirementProfile) =>
  isUncountedOutcomeCourse(course) || profile.nonGraduationCreditCategories.includes(getCourseCategory(course, profile)) ? 0 : course.credits;

export const getDuplicateKey = (course: Pick<TranscriptCourse, "courseNo" | "name" | "semester">) => {
  const name = compactCourseText(course.name);
  if (isFullYearCourseName(course.name)) {
    const term = getSemesterTerm(course.semester);
    return name && term ? `full-year:${name}:${term}` : "";
  }
  const courseNo = compactCourseText(course.courseNo);
  if (courseNo && name) return `no-name:${courseNo}:${name}`;
  if (courseNo) return `no:${courseNo}`;
  return name ? `name:${name}` : "";
};

export const getCourseDisplayName = (course: Pick<TranscriptCourse, "courseNo" | "name">) =>
  course.name || course.courseNo || "未命名課程";

export const getChoiceRequirementOption = (course: Pick<TranscriptCourse, "name">, requirement: ChoiceCreditRequirement) =>
  requirement.options.find((option) => option.pattern.test(course.name));

export const isHomeDepartmentCourse = (course: Pick<TranscriptCourse, "offeredBy">, profile: RequirementProfile) =>
  profile.homeDepartmentPatterns.some((pattern) => pattern.test(compactCourseText(course.offeredBy)));

export const isGeneralRequirementCategory = (category: string, profile: RequirementProfile) =>
  profile.generalRequirementCategories.includes(category);

export const isGeneralEducationCourse = (course: TranscriptCourse, profile: RequirementProfile) => {
  const category = getCourseCategory(course, profile);
  return isGeneralRequirementCategory(category, profile) || category === "統合領域" || category === "國防教育";
};

export const isLiteratureCollegeGeneralCourse = (course: TranscriptCourse, profile: RequirementProfile) =>
  isGeneralEducationCourse(course, profile) && /(文學院|外文系|外國語文學系|中國文學|中文系|歷史學系|歷史系)/.test(course.offeredBy);
