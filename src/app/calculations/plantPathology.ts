import type { TranscriptCourse } from "../context/TranscriptContext";
import type { RequirementProfile } from "../data/requirements";

export const plantPathologyDepartmentName = "植物病理學系";

const plantPathologyFixedRequiredCourses = [
  { name: "普通化學", requiredCredits: 3, aliases: ["普通化學"] },
  { name: "普通化學實驗", requiredCredits: 1, aliases: ["普通化學實驗"] },
  { name: "植病導論", requiredCredits: 1, aliases: ["植病導論"] },
  { name: "有機化學", requiredCredits: 3, aliases: ["有機化學"] },
  { name: "有機化學實驗", requiredCredits: 1, aliases: ["有機化學實驗"] },
  { name: "普通微生物學", requiredCredits: 3, aliases: ["普通微生物學"] },
  { name: "普通微生物學實驗", requiredCredits: 1, aliases: ["普通微生物學實驗"] },
  { name: "生物化學", requiredCredits: 6, aliases: ["生物化學"] },
  { name: "遺傳學", requiredCredits: 3, aliases: ["遺傳學"] },
  { name: "植物生理學", requiredCredits: 3, aliases: ["植物生理學"] },
  { name: "植物生理學實驗", requiredCredits: 1, aliases: ["植物生理學實驗"] },
  { name: "真菌學(含實習1學分)", requiredCredits: 4, aliases: ["真菌學"] },
  { name: "植物病理學(含實習2學分)", requiredCredits: 6, aliases: ["植物病理學"] },
  { name: "害物藥劑學", requiredCredits: 3, aliases: ["害物藥劑學"] },
  { name: "植病防治學", requiredCredits: 2, aliases: ["植病防治學"] },
  { name: "生物統計學", requiredCredits: 3, aliases: ["生物統計學", "統計學"] },
  { name: "生物統計與試驗設計實習", requiredCredits: 1, aliases: ["生物統計與試驗設計實習"] },
  { name: "基礎植病研究法", requiredCredits: 2, aliases: ["基礎植病研究法"] },
];

const pathogenChoiceCourses = [
  { name: "植物線蟲學", requiredCredits: 2, aliases: ["植物線蟲學", "淺談植物線蟲"] },
  { name: "植物細菌學", requiredCredits: 2, aliases: ["植物細菌學"] },
  { name: "植物病毒學", requiredCredits: 3, aliases: ["植物病毒學"] },
];

const capstoneChoiceCourses = [
  { name: "專題研究(一)", requiredCredits: 1, aliases: ["專題研究(一)", "專題研究（一）"] },
  { name: "專題研究(二)", requiredCredits: 1, aliases: ["專題研究(二)", "專題研究（二）"] },
  { name: "專題討論(一)", requiredCredits: 1, aliases: ["專題討論(一)", "專題討論（一）"] },
  { name: "專題討論(二)", requiredCredits: 1, aliases: ["專題討論(二)", "專題討論（二）"] },
];

type PlantPathologyHelpers = {
  compactCourseText: (value: string) => string;
  countableCredits: (course: TranscriptCourse, profile: RequirementProfile) => number;
  getCourseCategory: (course: TranscriptCourse, profile: RequirementProfile) => string;
  isHomeDepartmentCourse: (course: Pick<TranscriptCourse, "offeredBy">, profile: RequirementProfile) => boolean;
  matchesAnyName: (courseName: string, names: string[]) => boolean;
  sortCoursesChronologically: <T extends Pick<TranscriptCourse, "semester">>(items: T[]) => T[];
};

export const isPlantPathologyProfile = (profile: RequirementProfile) => profile.departmentName === plantPathologyDepartmentName;

export const isPlantPathologyLifeScienceGeneralCourse = (
  course: Pick<TranscriptCourse, "offeredBy">,
  compactCourseText: (value: string) => string,
) =>
  /(生命科學|生科|生物|植物|植病|昆蟲|動物|獸醫|農藝|園藝|森林|食品|土壤|LifeScience|Biology|PlantPathology)/i.test(
    compactCourseText(course.offeredBy),
  );

const getMatchedCredits = (
  courses: TranscriptCourse[],
  aliases: string[],
  helpers: Pick<PlantPathologyHelpers, "countableCredits" | "matchesAnyName">,
  requirementProfile: RequirementProfile,
) =>
  courses
    .filter((course) => helpers.matchesAnyName(course.name, aliases))
    .reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);

const getMatchedCourses = (
  courses: TranscriptCourse[],
  aliases: string[],
  helpers: Pick<PlantPathologyHelpers, "matchesAnyName">,
) => courses.filter((course) => helpers.matchesAnyName(course.name, aliases));

const getChoiceRequirement = (
  courses: TranscriptCourse[],
  rules: typeof pathogenChoiceCourses,
  requiredCourseCount: number,
  helpers: Pick<PlantPathologyHelpers, "countableCredits" | "matchesAnyName">,
  requirementProfile: RequirementProfile,
) => {
  const options = rules.map((rule) => {
    const matchedCourses = getMatchedCourses(courses, rule.aliases, helpers);
    const completed = Math.min(
      matchedCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0),
      rule.requiredCredits,
    );
    return { ...rule, completed, courses: matchedCourses };
  });
  const selectedOptions = [...options]
    .filter((option) => option.completed > 0)
    .sort((a, b) => b.completed - a.completed)
    .slice(0, requiredCourseCount);
  const selectedCourses = selectedOptions.flatMap((option) => option.courses);
  const completedCourseCount = selectedOptions.length;
  const completed = selectedOptions.reduce((sum, option) => sum + option.completed, 0);
  return { options, selectedOptions, selectedCourses, completedCourseCount, completed, requiredCourseCount };
};

const uniqueCourses = (courses: TranscriptCourse[]) => Array.from(new Set(courses));

export const getPlantPathologyGeneralEducationRequirement = ({
  courses,
  helpers,
  requirementProfile,
  studentStatus,
}: {
  courses: TranscriptCourse[];
  helpers: PlantPathologyHelpers;
  requirementProfile: RequirementProfile;
  studentStatus: "local" | "foreign";
}) => {
  if (!isPlantPathologyProfile(requirementProfile)) return undefined;
  const generalCourses = helpers.sortCoursesChronologically(
    courses.filter((course) => {
      if (course.planId !== "major" || helpers.countableCredits(course, requirementProfile) <= 0) return false;
      const category = helpers.getCourseCategory(course, requirementProfile);
      return ["核心素養", "資訊素養", "語言素養課程", "人文領域", "社會科學領域", "自然科學領域", "統合領域", "國防教育", "共同必修/通識"].includes(category);
    }),
  );
  const sumByCategory = (category: string) =>
    generalCourses
      .filter((course) => helpers.getCourseCategory(course, requirementProfile) === category)
      .reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const countByCategory = (category: string) =>
    generalCourses.filter((course) => helpers.getCourseCategory(course, requirementProfile) === category).length;
  const coreCredits = sumByCategory("核心素養") + sumByCategory("資訊素養");
  const infoRequired = studentStatus === "foreign" ? 0 : 1;
  const humanSocialNaturalCredits = sumByCategory("人文領域") + sumByCategory("社會科學領域") + sumByCategory("自然科學領域");
  const completed = Math.min(generalCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0), 28);
  return {
    completed,
    required: 28,
    remaining: Math.max(28 - completed, 0),
    progress: Math.min((completed / 28) * 100, 100),
    subRequirements: [
      { id: "core", label: "核心素養", completed: coreCredits, required: 3 },
      { id: "info", label: "資訊素養", completed: sumByCategory("資訊素養"), required: infoRequired, detail: infoRequired === 0 ? "外籍生得免修。" : "資訊素養：程式設計與AI應用必修1學分。" },
      { id: "language", label: "語文素養", completed: sumByCategory("語言素養課程"), required: 8 },
      {
        id: "human-social-natural",
        label: "人文/社會/自然",
        completed: humanSocialNaturalCredits,
        required: 6,
        detail: `人文 ${countByCategory("人文領域")} 門、社會 ${countByCategory("社會科學領域")} 門、自然 ${countByCategory("自然科學領域")} 門`,
        done:
          humanSocialNaturalCredits >= 6 &&
          countByCategory("人文領域") >= 1 &&
          countByCategory("社會科學領域") >= 1 &&
          countByCategory("自然科學領域") >= 1,
      },
      { id: "comprehensive", label: "統合領域", completed: sumByCategory("統合領域"), required: 4 },
    ],
    courses: generalCourses,
  };
};

export const getPlantPathologyRequiredProfessionalRequirement = ({
  courses,
  helpers,
  requirementProfile,
}: {
  courses: TranscriptCourse[];
  helpers: PlantPathologyHelpers;
  requirementProfile: RequirementProfile;
}) => {
  if (!isPlantPathologyProfile(requirementProfile)) return undefined;
  const mainCourses = helpers.sortCoursesChronologically(
    courses.filter((course) => course.planId === "major" && helpers.countableCredits(course, requirementProfile) > 0),
  );
  const fixedRequirements = plantPathologyFixedRequiredCourses.map((requirement) => {
    const matchedCourses = getMatchedCourses(mainCourses, requirement.aliases, helpers);
    const rawCompleted = getMatchedCredits(mainCourses, requirement.aliases, helpers, requirementProfile);
    const completed = Math.min(rawCompleted, requirement.requiredCredits);
    return {
      ...requirement,
      completed,
      remaining: Math.max(requirement.requiredCredits - completed, 0),
      courses: matchedCourses,
    };
  });
  const pathogenChoice = getChoiceRequirement(mainCourses, pathogenChoiceCourses, 2, helpers, requirementProfile);
  const capstoneChoice = getChoiceRequirement(mainCourses, capstoneChoiceCourses, 1, helpers, requirementProfile);
  const fixedCompleted = fixedRequirements.reduce((sum, requirement) => sum + requirement.completed, 0);
  const rawCompleted = fixedCompleted + pathogenChoice.completed + capstoneChoice.completed;
  const required = 52;
  const acceptedCourses = uniqueCourses([
    ...fixedRequirements.flatMap((requirement) => requirement.courses),
    ...pathogenChoice.selectedCourses,
    ...capstoneChoice.selectedCourses,
  ]);
  return {
    completed: Math.min(rawCompleted, required),
    rawCompleted,
    required,
    remaining: Math.max(required - rawCompleted, 0),
    progress: Math.min((rawCompleted / required) * 100, 100),
    fixedRequirements,
    choiceRequirements: [
      { id: "pathogen", label: "植物線蟲學/植物細菌學/植物病毒學", requiredCourseCount: 2, ...pathogenChoice },
      { id: "capstone", label: "專題研究/專題討論", requiredCourseCount: 1, ...capstoneChoice },
    ],
    acceptedCourses,
  };
};

export const getPlantPathologyProfessionalElectiveRequirement = ({
  courses,
  helpers,
  requirementProfile,
  requiredProfessionalCourses,
}: {
  courses: TranscriptCourse[];
  helpers: PlantPathologyHelpers;
  requirementProfile: RequirementProfile;
  requiredProfessionalCourses: TranscriptCourse[];
}) => {
  if (!isPlantPathologyProfile(requirementProfile)) return undefined;
  const requiredCourseSet = new Set(requiredProfessionalCourses);
  const electiveCourses = helpers.sortCoursesChronologically(
    courses.filter(
      (course) =>
        course.planId === "major" &&
        helpers.countableCredits(course, requirementProfile) > 0 &&
        helpers.getCourseCategory(course, requirementProfile) === "專業課程" &&
        !requiredCourseSet.has(course),
    ),
  );
  const homeCourses = electiveCourses.filter((course) => helpers.isHomeDepartmentCourse(course, requirementProfile));
  const externalCourses = electiveCourses.filter((course) => !helpers.isHomeDepartmentCourse(course, requirementProfile));
  const homeCredits = homeCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const externalCredits = externalCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const acceptedExternalCredits = Math.min(externalCredits, 20);
  const rawCompleted = homeCredits + acceptedExternalCredits;
  const required = 36;
  let remainingAcceptedCredits = required;
  let remainingExternalCredits = acceptedExternalCredits;
  const acceptedCourses: TranscriptCourse[] = [];
  for (const course of [...homeCourses, ...externalCourses]) {
    if (remainingAcceptedCredits <= 0) break;
    const credits = helpers.countableCredits(course, requirementProfile);
    const isExternal = !helpers.isHomeDepartmentCourse(course, requirementProfile);
    if (isExternal && remainingExternalCredits <= 0) continue;
    const acceptedCredits = Math.min(credits, remainingAcceptedCredits, isExternal ? remainingExternalCredits : credits);
    if (acceptedCredits <= 0) continue;
    acceptedCourses.push(course);
    remainingAcceptedCredits -= acceptedCredits;
    if (isExternal) remainingExternalCredits -= acceptedCredits;
  }
  return {
    completed: Math.min(rawCompleted, required),
    rawCompleted,
    required,
    remaining: Math.max(required - rawCompleted, 0),
    progress: Math.min((rawCompleted / required) * 100, 100),
    homeCredits,
    externalCredits,
    acceptedExternalCredits,
    externalOverLimit: Math.max(externalCredits - 20, 0),
    courses: electiveCourses,
    acceptedCourses,
  };
};

export const getPlantPathologyOtherGraduationRequirement = ({
  courses,
  helpers,
  requirementProfile,
  usedCourses,
}: {
  courses: TranscriptCourse[];
  helpers: PlantPathologyHelpers;
  requirementProfile: RequirementProfile;
  usedCourses: TranscriptCourse[];
}) => {
  if (!isPlantPathologyProfile(requirementProfile)) return undefined;
  const usedCourseSet = new Set(usedCourses);
  const otherCourses = helpers.sortCoursesChronologically(
    courses.filter((course) => {
      if (course.planId !== "major" || helpers.countableCredits(course, requirementProfile) <= 0 || usedCourseSet.has(course)) return false;
      const category = helpers.getCourseCategory(course, requirementProfile);
      return !["體育/服務學習", "核心素養", "資訊素養", "語言素養課程", "人文領域", "社會科學領域", "自然科學領域", "統合領域", "國防教育", "共同必修/通識"].includes(category);
    }),
  );
  const rawCompleted = otherCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const required = 20;
  return {
    completed: Math.min(rawCompleted, required),
    rawCompleted,
    required,
    remaining: Math.max(required - rawCompleted, 0),
    progress: Math.min((rawCompleted / required) * 100, 100),
    courses: otherCourses,
  };
};
