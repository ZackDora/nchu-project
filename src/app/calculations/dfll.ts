import type { TranscriptCourse } from "../context/TranscriptContext";
import {
  type RequirementProfile,
} from "../data/requirements";

export const dfllDepartmentName = "外國語文學系";
export const dfllGeneralEdOverflowExternalLimit = 10;

export const dfllDigitalHumanitiesCourses = [
  "數位人文概論",
  "影像處理與電腦繪畫",
  "網頁設計",
  "數位敘事應用",
  "數位內容策展",
  "數位人文GIS應用",
  "程式設計與人文應用",
];

export const dfllCollegeEmiCourses = ["歷史與電影", "文化臺中", "飲食與文化", "台灣語言與文化", "歐洲現代史導讀"];

export const dfllRequiredProfessionalCourses = [
  { name: "英語口語訓練(一)", requiredCredits: 4, aliases: ["英語口語訓練（一）", "英語口語訓練(一)"] },
  { name: "英語口語訓練(二)", requiredCredits: 4, aliases: ["英語口語訓練（二）", "英語口語訓練(二)"] },
  { name: "英文作文(一)", requiredCredits: 4, aliases: ["英文作文（一）", "英文作文(一)"] },
  { name: "英文作文(二)", requiredCredits: 4, aliases: ["英文作文（二）", "英文作文(二)"] },
  { name: "文學作品讀法", requiredCredits: 4, aliases: ["文學作品讀法"] },
  { name: "西洋文學概論", requiredCredits: 4, aliases: ["西洋文學概論"] },
  { name: "語言學概論", requiredCredits: 4, aliases: ["語言學概論"] },
];

export const dfllBritishAmericanLiteratureCourses = [
  "英國文學:中古與文藝復興時期",
  "英國文學:復辟與新古典時期",
  "英國文學:浪漫與維多利亞時期",
  "英國文學:二十世紀迄今",
  "美國文學:二十世紀前",
  "美國文學:二十世紀迄今",
];

type ChoiceRequirementView = {
  requirement: {
    requiredCredits: number;
    options: { id: string; label: string; pattern: RegExp }[];
  };
  options: { id: string; label: string; completed: number }[];
};

type DfllHelpers = {
  compactCourseText: (value: string) => string;
  countableCredits: (course: TranscriptCourse, profile: RequirementProfile) => number;
  getChoiceRequirementOption: (course: Pick<TranscriptCourse, "name">, requirement: RequirementProfile["choiceCreditRequirements"][number]) => unknown;
  getCourseCategory: (course: TranscriptCourse, profile: RequirementProfile) => string;
  getSemesterTerm: (semester: string) => string;
  isHomeDepartmentCourse: (course: Pick<TranscriptCourse, "offeredBy">, profile: RequirementProfile) => boolean;
  matchesAnyName: (courseName: string, names: string[]) => boolean;
  sortCoursesChronologically: <T extends Pick<TranscriptCourse, "semester">>(items: T[]) => T[];
};

export const isDfllProfile = (profile: RequirementProfile) => profile.departmentName === dfllDepartmentName;

export const isCommonEnglishCourse = (course: TranscriptCourse, compactCourseText: (value: string) => string) =>
  /(英文|英語|English)/i.test(course.name) &&
  !/大一英文/.test(course.name) &&
  /(語言中心|LanguageCenter)/i.test(compactCourseText(course.offeredBy));

export const isDfllDepartmentRequirementCourse = (
  course: Pick<TranscriptCourse, "name">,
  matchesAnyName: (courseName: string, names: string[]) => boolean,
) =>
  dfllRequiredProfessionalCourses.some((requirement) => matchesAnyName(course.name, requirement.aliases)) ||
  matchesAnyName(course.name, dfllBritishAmericanLiteratureCourses) ||
  matchesAnyName(course.name, dfllDigitalHumanitiesCourses) ||
  matchesAnyName(course.name, dfllCollegeEmiCourses);

export const isDfllRequiredNamedProfessionalCourse = (
  course: Pick<TranscriptCourse, "name">,
  matchesAnyName: (courseName: string, names: string[]) => boolean,
) => dfllRequiredProfessionalCourses.some((requirement) => matchesAnyName(course.name, requirement.aliases));

export const isDfllBritishAmericanLiteratureCourse = (
  course: Pick<TranscriptCourse, "name">,
  matchesAnyName: (courseName: string, names: string[]) => boolean,
) => matchesAnyName(course.name, dfllBritishAmericanLiteratureCourses);

const isCollegeOfLiberalArtsCourse = (course: Pick<TranscriptCourse, "offeredBy">, compactCourseText: (value: string) => string) =>
  /(文學院|CollegeofLiberalArts)/i.test(compactCourseText(course.offeredBy));

const isCollegeDigitalInformationDesignAiCourse = (course: Pick<TranscriptCourse, "name">) =>
  /(數位|資訊|設計|AI)/i.test(course.name);

export const isDfllDigitalHumanitiesCourseForAdmissionYear = (
  course: Pick<TranscriptCourse, "name" | "offeredBy">,
  admissionYear: number,
  helpers: Pick<DfllHelpers, "compactCourseText" | "matchesAnyName">,
) =>
  helpers.matchesAnyName(course.name, dfllDigitalHumanitiesCourses) ||
  (admissionYear >= 112 && isCollegeOfLiberalArtsCourse(course, helpers.compactCourseText) && isCollegeDigitalInformationDesignAiCourse(course));

export const isDfllCollegeEmiCourseForAdmissionYear = (
  course: Pick<TranscriptCourse, "name" | "offeredBy" | "emi">,
  admissionYear: number,
  helpers: Pick<DfllHelpers, "compactCourseText" | "matchesAnyName">,
) =>
  course.emi &&
  (helpers.matchesAnyName(course.name, dfllCollegeEmiCourses) ||
    (admissionYear >= 112 && isCollegeOfLiberalArtsCourse(course, helpers.compactCourseText)));

export const isDfllRequiredCourseForProgramRule = (
  course: TranscriptCourse,
  admissionYear: number,
  studentStatus: "local" | "foreign",
  fallbackRequirementProfile: RequirementProfile,
  helpers: Pick<DfllHelpers, "compactCourseText" | "getCourseCategory" | "matchesAnyName">,
) => {
  const category = helpers.getCourseCategory(course, fallbackRequirementProfile);
  const isInformationLiteracyCourse =
    category === "資訊素養" || helpers.compactCourseText(course.name).includes(helpers.compactCourseText("資訊素養"));
  return (
    course.type === "必" ||
    fallbackRequirementProfile.languageLiteracyRequirements.some((requirement) => helpers.matchesAnyName(course.name, [requirement.name])) ||
    (category === "核心素養" && !(studentStatus === "foreign" && isInformationLiteracyCourse)) ||
    (category === "資訊素養" && studentStatus !== "foreign") ||
    category === "共同必修/通識" ||
    isDfllRequiredNamedProfessionalCourse(course, helpers.matchesAnyName) ||
    isDfllBritishAmericanLiteratureCourse(course, helpers.matchesAnyName) ||
    isDfllDigitalHumanitiesCourseForAdmissionYear(course, admissionYear, helpers) ||
    isDfllCollegeEmiCourseForAdmissionYear(course, admissionYear, helpers)
  );
};

const getFullYearCompletedCredits = (
  courses: TranscriptCourse[],
  aliases: string[],
  requiredCredits: number,
  profile: RequirementProfile,
  helpers: Pick<DfllHelpers, "countableCredits" | "getSemesterTerm" | "matchesAnyName">,
) => {
  const perTermCap = requiredCredits / 2;
  const termCredits = { "1": 0, "2": 0 } as Record<string, number>;
  for (const course of courses) {
    if (!helpers.matchesAnyName(course.name, aliases)) continue;
    const term = helpers.getSemesterTerm(course.semester);
    if (term === "1" || term === "2") {
      termCredits[term] += helpers.countableCredits(course, profile);
    }
  }
  return Math.min(termCredits["1"], perTermCap) + Math.min(termCredits["2"], perTermCap);
};

export const getDfllRequirementAudits = ({
  admissionYear,
  choiceRequirementViews,
  courses,
  primaryExternalCredits,
  requirementProfile,
  studentStatus,
  helpers,
}: {
  admissionYear: number;
  choiceRequirementViews: ChoiceRequirementView[];
  courses: TranscriptCourse[];
  primaryExternalCredits: number;
  requirementProfile: RequirementProfile;
  studentStatus: "local" | "foreign";
  helpers: DfllHelpers;
}) => {
  if (!isDfllProfile(requirementProfile)) return undefined;
  const mainCourses = helpers.sortCoursesChronologically(courses.filter((course) => course.planId === "major"));
  const eligibleCourses = helpers.sortCoursesChronologically(
    mainCourses.filter(
      (course) =>
        helpers.countableCredits(course, requirementProfile) > 0 &&
        !isCommonEnglishCourse(course, helpers.compactCourseText) &&
        !course.genEdProfessorFromMajorDepartment,
    ),
  );
  const sumByCategory = (category: string) =>
    eligibleCourses
      .filter((course) => helpers.getCourseCategory(course, requirementProfile) === category)
      .reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const countByCategory = (category: string) =>
    eligibleCourses.filter((course) => helpers.getCourseCategory(course, requirementProfile) === category).length;
  const sumByNames = (names: string[]) =>
    eligibleCourses
      .filter((course) => helpers.matchesAnyName(course.name, names))
      .reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const detailByCategory = (category: string) =>
    eligibleCourses.filter((course) => helpers.getCourseCategory(course, requirementProfile) === category);
  const detailByNames = (names: string[]) =>
    eligibleCourses.filter((course) => helpers.matchesAnyName(course.name, names));
  const overflowByNames = (names: string[], protectedCredits: number) => {
    let remainingProtectedCredits = protectedCredits;
    return eligibleCourses.filter((course) => {
      if (!helpers.matchesAnyName(course.name, names)) return false;
      const credits = helpers.countableCredits(course, requirementProfile);
      const protectedForCourse = Math.min(credits, remainingProtectedCredits);
      remainingProtectedCredits -= protectedForCourse;
      return credits - protectedForCourse > 0;
    });
  };
  const isChoiceRequirementCourse = (course: TranscriptCourse) =>
    requirementProfile.choiceCreditRequirements.some((requirement) => helpers.getChoiceRequirementOption(course, requirement));
  const requiredProfessionalCourses = eligibleCourses.filter(
    (course) =>
      isDfllRequiredNamedProfessionalCourse(course, helpers.matchesAnyName) ||
      isDfllBritishAmericanLiteratureCourse(course, helpers.matchesAnyName) ||
      isChoiceRequirementCourse(course),
  );
  const professionalElectiveBaseCourses = eligibleCourses.filter(
    (course) =>
      helpers.isHomeDepartmentCourse(course, requirementProfile) &&
      !isDfllRequiredNamedProfessionalCourse(course, helpers.matchesAnyName) &&
      !isDfllBritishAmericanLiteratureCourse(course, helpers.matchesAnyName) &&
      !isChoiceRequirementCourse(course),
  );

  const humanSocialNaturalCredits =
    sumByCategory("人文領域") + sumByCategory("社會科學領域") + sumByCategory("自然科學領域");
  const infoLiteracyCourses = eligibleCourses.filter(
    (course) => helpers.getCourseCategory(course, requirementProfile) === "資訊素養" || helpers.compactCourseText(course.name).includes(helpers.compactCourseText("資訊素養")),
  );
  const infoLiteracyCredits = infoLiteracyCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const britishAmericanLiteratureCredits = sumByNames(dfllBritishAmericanLiteratureCourses);
  const britishAmericanLiteratureOverflowCredits = Math.max(britishAmericanLiteratureCredits - 12, 0);
  const digitalHumanitiesCourses = eligibleCourses.filter((course) =>
    isDfllDigitalHumanitiesCourseForAdmissionYear(course, admissionYear, helpers),
  );
  const digitalHumanitiesCredits = digitalHumanitiesCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const collegeEmiCourses = eligibleCourses.filter((course) =>
    isDfllCollegeEmiCourseForAdmissionYear(course, admissionYear, helpers),
  );
  const collegeEmiCredits = collegeEmiCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const requiredNamedCredits = dfllRequiredProfessionalCourses.reduce((sum, requirement) => {
    return sum + getFullYearCompletedCredits(eligibleCourses, requirement.aliases, requirement.requiredCredits, requirementProfile, helpers);
  }, 0);
  const secondLanguageCredits = Math.max(
    ...choiceRequirementViews.flatMap((view) => view.options.map((option) => Math.min(option.completed, view.requirement.requiredCredits))),
    0,
  );
  const requiredProfessionalCredits = requiredNamedCredits + Math.min(britishAmericanLiteratureCredits, 12) + secondLanguageCredits;
  const professionalElectiveBaseCredits = professionalElectiveBaseCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const professionalElectiveCredits = professionalElectiveBaseCredits + britishAmericanLiteratureOverflowCredits;
  const britishAmericanLiteratureOverflowCourses = overflowByNames(dfllBritishAmericanLiteratureCourses, 12);
  const professionalElectiveCourses =
    britishAmericanLiteratureOverflowCredits > 0
      ? [...professionalElectiveBaseCourses, ...britishAmericanLiteratureOverflowCourses]
      : professionalElectiveBaseCourses;
  const noExternalCourses = primaryExternalCredits === 0;

  return {
    core: { completed: sumByCategory("核心素養"), required: 3, courses: detailByCategory("核心素養") },
    info: { completed: infoLiteracyCredits, required: studentStatus === "foreign" ? 0 : 1, courses: infoLiteracyCourses },
    humanities: { completedCourses: countByCategory("人文領域"), completedCredits: sumByCategory("人文領域"), courses: detailByCategory("人文領域") },
    social: { completedCourses: countByCategory("社會科學領域"), completedCredits: sumByCategory("社會科學領域"), courses: detailByCategory("社會科學領域") },
    natural: { completedCourses: countByCategory("自然科學領域"), completedCredits: sumByCategory("自然科學領域"), courses: detailByCategory("自然科學領域") },
    humanSocialNaturalCredits,
    humanSocialNaturalCourses: [...detailByCategory("人文領域"), ...detailByCategory("社會科學領域"), ...detailByCategory("自然科學領域")],
    comprehensive: { completed: sumByCategory("統合領域"), required: 4, courses: detailByCategory("統合領域") },
    digitalHumanities: { completed: digitalHumanitiesCredits, required: 2, courses: digitalHumanitiesCourses },
    collegeEmi: {
      completed: collegeEmiCredits,
      required: 2,
      courses: collegeEmiCourses,
    },
    collegeRequired: {
      completed: Math.min(digitalHumanitiesCredits, 2) + Math.min(collegeEmiCredits, 2),
      required: 4,
      courses: Array.from(new Set([...digitalHumanitiesCourses, ...collegeEmiCourses])),
    },
    requiredProfessional: { completed: requiredProfessionalCredits, required: 46, courses: requiredProfessionalCourses },
    professionalElective: { completed: professionalElectiveCredits, required: 32, courses: professionalElectiveCourses },
    professionalElectiveIfNoExternal: {
      enabled: noExternalCourses,
      completed: professionalElectiveCredits,
      required: 52,
    },
    britishAmericanLiterature: {
      completed: britishAmericanLiteratureCredits,
      required: 12,
      courses: detailByNames(dfllBritishAmericanLiteratureCourses),
      overflowCourses: britishAmericanLiteratureOverflowCourses,
    },
  };
};

type DfllRequirementAudits = NonNullable<ReturnType<typeof getDfllRequirementAudits>>;

export const getDfllRequirementRows = (dfllRequirementAudits: DfllRequirementAudits | undefined) => {
  if (!dfllRequirementAudits) return [];
  const rows = [
    {
      id: "core",
      label: "核心素養",
      summary: `${dfllRequirementAudits.core.completed} / ${dfllRequirementAudits.core.required} 學分`,
      courses: dfllRequirementAudits.core.courses,
    },
    {
      id: "info",
      label: "資訊素養",
      summary: dfllRequirementAudits.info.required === 0 ? "外籍生免修" : `${dfllRequirementAudits.info.completed} / ${dfllRequirementAudits.info.required} 學分`,
      courses: dfllRequirementAudits.info.courses,
    },
    {
      id: "hsn",
      label: "人文/社會/自然",
      summary: `${dfllRequirementAudits.humanSocialNaturalCredits} / 6 學分`,
      courses: dfllRequirementAudits.humanSocialNaturalCourses,
    },
    {
      id: "comprehensive",
      label: "統合領域",
      summary: `${dfllRequirementAudits.comprehensive.completed} / ${dfllRequirementAudits.comprehensive.required} 學分`,
      courses: dfllRequirementAudits.comprehensive.courses,
    },
    {
      id: "college-required",
      label: "院專業必修課程",
      summary: `數位人文 ${dfllRequirementAudits.digitalHumanities.completed} / ${dfllRequirementAudits.digitalHumanities.required}，EMI ${dfllRequirementAudits.collegeEmi.completed} / ${dfllRequirementAudits.collegeEmi.required} 學分`,
      courses: dfllRequirementAudits.collegeRequired.courses,
    },
    {
      id: "required-professional",
      label: "系專業必修",
      summary: `${dfllRequirementAudits.requiredProfessional.completed} / ${dfllRequirementAudits.requiredProfessional.required} 學分`,
      courses: dfllRequirementAudits.requiredProfessional.courses,
    },
    {
      id: "british-american-literature",
      label: "英美文學",
      summary: `${dfllRequirementAudits.britishAmericanLiterature.completed} / ${dfllRequirementAudits.britishAmericanLiterature.required} 學分`,
      courses: dfllRequirementAudits.britishAmericanLiterature.courses,
    },
    {
      id: "professional-elective",
      label: "系專業選修",
      summary: `${dfllRequirementAudits.professionalElective.completed} / ${dfllRequirementAudits.professionalElective.required} 學分`,
      courses: dfllRequirementAudits.professionalElective.courses,
    },
  ];

  if (dfllRequirementAudits.professionalElectiveIfNoExternal.enabled) {
    rows.push({
      id: "professional-elective-no-external",
      label: "未選外系時本系專業選修",
      summary: `${dfllRequirementAudits.professionalElectiveIfNoExternal.completed} / ${dfllRequirementAudits.professionalElectiveIfNoExternal.required} 學分`,
      courses: dfllRequirementAudits.professionalElective.courses,
    });
  }
  return rows;
};
