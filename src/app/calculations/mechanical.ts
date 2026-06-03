import type { TranscriptCourse } from "../context/TranscriptContext";
import type { RequirementProfile } from "../data/requirements";

export const mechanicalDepartmentName = "機械工程學系";

const mechanicalRequiredProfessionalCourses = [
  { name: "微積分(一)", requiredCredits: 3, aliases: ["微積分(一)", "微積分（一）"] },
  { name: "微積分(二)", requiredCredits: 3, aliases: ["微積分(二)", "微積分（二）"] },
  { name: "普通物理學", requiredCredits: 6, aliases: ["普通物理學"] },
  { name: "靜力學", requiredCredits: 3, aliases: ["靜力學"] },
  { name: "動力學", requiredCredits: 3, aliases: ["動力學"] },
  { name: "工程圖學", requiredCredits: 2, aliases: ["工程圖學"] },
  { name: "工場實習(一)", requiredCredits: 1, aliases: ["工場實習(一)", "工場實習（一）"] },
  { name: "電腦輔助機械製圖", requiredCredits: 2, aliases: ["電腦輔助機械製圖"] },
  { name: "計算機程式", requiredCredits: 2, aliases: ["計算機程式"] },
  { name: "工場實習(二)", requiredCredits: 1, aliases: ["工場實習(二)", "工場實習（二）"] },
  { name: "熱力學", requiredCredits: 3, aliases: ["熱力學"] },
  { name: "工程數學(一)", requiredCredits: 3, aliases: ["工程數學(一)", "工程數學（一）"] },
  { name: "材料力學", requiredCredits: 3, aliases: ["材料力學"] },
  { name: "機動學", requiredCredits: 3, aliases: ["機動學"] },
  { name: "機械材料", requiredCredits: 3, aliases: ["機械材料"] },
  { name: "工程數學(二)", requiredCredits: 3, aliases: ["工程數學(二)", "工程數學（二）"] },
  { name: "機械製造", requiredCredits: 3, aliases: ["機械製造"] },
  { name: "機械工程實驗(一)", requiredCredits: 1, aliases: ["機械工程實驗(一)", "機械工程實驗（一）"] },
  { name: "機械設計原理", requiredCredits: 3, aliases: ["機械設計原理"] },
  { name: "流體力學", requiredCredits: 3, aliases: ["流體力學"] },
  { name: "電路學", requiredCredits: 3, aliases: ["電路學"] },
  { name: "自動控制", requiredCredits: 3, aliases: ["自動控制"] },
  { name: "熱傳學", requiredCredits: 3, aliases: ["熱傳學"] },
  { name: "機械工程實驗(二)", requiredCredits: 1, aliases: ["機械工程實驗(二)", "機械工程實驗（二）"] },
  { name: "機械工程實驗(三)", requiredCredits: 1, aliases: ["機械工程實驗(三)", "機械工程實驗（三）"] },
  { name: "普通化學", requiredCredits: 3, aliases: ["普通化學"] },
  { name: "普通物理學實驗", requiredCredits: 2, aliases: ["普通物理學實驗"] },
  { name: "電子學", requiredCredits: 3, aliases: ["電子學"] },
  { name: "機械領域概論", requiredCredits: 1, aliases: ["機械領域概論"] },
];

const mechanicalRequiredElectiveProjectCourses = [
  "機械設計與製作專題(a)",
  "機械設計與製作專題(b)",
  "機械設計與製作專題(c)",
  "機械設計與製作專題(d)",
  "機械設計與製作專題(e)",
  "機械設計與製作專題(f)",
  "機械設計與製作專題(g)",
  "機械設計與製作專題(h)",
  "機械設計與製作專題(i)",
  "機械設計與製作專題(j)",
  "機械設計與製作專題(k)",
  "機械設計與製作專題-PBL實作(I)",
  "機械設計與製作專題-PBL實作(II)",
];

const mechanicalBasicElectiveCourses = ["進階程式設計", "工程數學(三)", "工程數學（三）", "數值分析"];

const mechanicalElectiveGroups = ["固力設計組", "熱流科技組", "系統控制組", "製造科技組"] as const;

const mechanicalGroupedElectiveCourses: { name: string; groups: (typeof mechanicalElectiveGroups)[number][] }[] = [
  { name: "中等材料力學", groups: ["固力設計組"] },
  { name: "中等機動學", groups: ["固力設計組"] },
  { name: "創意性工程設計", groups: ["固力設計組"] },
  { name: "系統動力學", groups: ["固力設計組", "系統控制組"] },
  { name: "機器人運動學", groups: ["固力設計組", "系統控制組"] },
  { name: "精密機械工程導論", groups: ["固力設計組", "製造科技組"] },
  { name: "中等動力學", groups: ["固力設計組", "系統控制組"] },
  { name: "電腦輔助工程", groups: ["固力設計組", "熱流科技組", "製造科技組"] },
  { name: "機械振動學", groups: ["固力設計組", "系統控制組"] },
  { name: "能量轉換工程", groups: ["熱流科技組"] },
  { name: "內燃機", groups: ["熱流科技組"] },
  { name: "冷凍空調", groups: ["熱流科技組"] },
  { name: "飛機設計與試驗", groups: ["熱流科技組"] },
  { name: "液壓氣壓工程", groups: ["熱流科技組"] },
  { name: "空氣動力學", groups: ["熱流科技組"] },
  { name: "流體機械", groups: ["熱流科技組"] },
  { name: "電子系統熱傳技術", groups: ["熱流科技組"] },
  { name: "再生能源導論", groups: ["熱流科技組"] },
  { name: "真空系統概論", groups: ["熱流科技組", "製造科技組"] },
  { name: "微流體系統與其在生醫之應用", groups: ["熱流科技組", "製造科技組"] },
  { name: "電腦控制系統", groups: ["系統控制組"] },
  { name: "單晶片控制", groups: ["系統控制組"] },
  { name: "電機機械", groups: ["系統控制組"] },
  { name: "工程電磁學", groups: ["系統控制組"] },
  { name: "機電系統整合", groups: ["系統控制組"] },
  { name: "智慧製造技術概論", groups: ["系統控制組", "製造科技組"] },
  { name: "電機機械實驗", groups: ["系統控制組"] },
  { name: "製造聯網整合技術", groups: ["系統控制組", "製造科技組"] },
  { name: "熱處理", groups: ["製造科技組"] },
  { name: "製造自動化", groups: ["製造科技組"] },
  { name: "自動化機械", groups: ["製造科技組"] },
  { name: "量測導論", groups: ["製造科技組"] },
  { name: "工具機原理", groups: ["製造科技組"] },
  { name: "非傳統加工", groups: ["製造科技組"] },
  { name: "彈性製造系統", groups: ["製造科技組"] },
  { name: "電腦輔助設計與製造", groups: ["製造科技組"] },
  { name: "模具設計與製造", groups: ["製造科技組"] },
  { name: "金屬成型原理", groups: ["製造科技組"] },
  { name: "成型機械原理", groups: ["製造科技組"] },
  { name: "數值控制加工法", groups: ["製造科技組"] },
  { name: "半導體製程設備導論", groups: ["系統控制組", "製造科技組"] },
  { name: "微奈米技術導論", groups: ["製造科技組"] },
  { name: "數位影像處理導論", groups: ["製造科技組"] },
  { name: "半導體製造技術", groups: ["製造科技組"] },
  { name: "奈微米製造技術", groups: ["製造科技組"] },
  { name: "基礎光學", groups: ["製造科技組"] },
  { name: "工具機工程與加工應用", groups: ["製造科技組"] },
  { name: "精密加工", groups: ["製造科技組"] },
  { name: "量測系統原理與設計", groups: ["固力設計組", "熱流科技組", "系統控制組", "製造科技組"] },
  { name: "動態系統", groups: ["固力設計組", "熱流科技組", "系統控制組", "製造科技組"] },
  { name: "精密工具機技術專論", groups: ["固力設計組", "系統控制組", "製造科技組"] },
  { name: "高等熱力學", groups: ["熱流科技組"] },
  { name: "燃燒工程", groups: ["熱流科技組"] },
  { name: "有限元素法", groups: ["固力設計組"] },
  { name: "光學原理", groups: ["製造科技組"] },
  { name: "黏性流體力學", groups: ["熱流科技組"] },
  { name: "生醫微機電", groups: ["系統控制組", "製造科技組"] },
  { name: "微尺度操控技術", groups: ["熱流科技組"] },
  { name: "機械製造分析", groups: ["製造科技組"] },
  { name: "智慧型機器人", groups: ["固力設計組", "系統控制組"] },
  { name: "高等金屬成型理論", groups: ["固力設計組", "製造科技組"] },
  { name: "應用塑性力學", groups: ["固力設計組", "製造科技組"] },
  { name: "光機電工程概論", groups: ["製造科技組"] },
  { name: "現代控制工程", groups: ["系統控制組"] },
  { name: "伺服控制工程", groups: ["系統控制組"] },
  { name: "虛實整合數位化工廠", groups: ["固力設計組", "熱流科技組", "系統控制組", "製造科技組"] },
  { name: "數據分析與機器學習", groups: ["固力設計組", "熱流科技組", "系統控制組", "製造科技組"] },
  { name: "工具機製造品質工程", groups: ["固力設計組", "熱流科技組", "系統控制組", "製造科技組"] },
  { name: "營運管理與製造執行系統", groups: ["固力設計組", "熱流科技組", "系統控制組", "製造科技組"] },
  { name: "工具機系統設計分析", groups: ["固力設計組", "系統控制組", "製造科技組"] },
  { name: "整線整合之伺服控制工程", groups: ["系統控制組"] },
  { name: "複合製程整線智慧診斷", groups: ["熱流科技組", "系統控制組", "製造科技組"] },
  { name: "產線加工應用之誤差分析、量測與補償", groups: ["固力設計組", "系統控制組", "製造科技組"] },
  { name: "半導體製程設備與技術", groups: ["固力設計組", "熱流科技組", "系統控制組", "製造科技組"] },
  { name: "無人機技術", groups: ["固力設計組", "熱流科技組", "系統控制組", "製造科技組"] },
  { name: "機器學習運營與實踐", groups: ["固力設計組", "熱流科技組", "系統控制組", "製造科技組"] },
];

type MechanicalHelpers = {
  compactCourseText: (value: string) => string;
  countableCredits: (course: TranscriptCourse, profile: RequirementProfile) => number;
  getCourseCategory: (course: TranscriptCourse, profile: RequirementProfile) => string;
  isHomeDepartmentCourse: (course: Pick<TranscriptCourse, "offeredBy">, profile: RequirementProfile) => boolean;
  matchesAnyName: (courseName: string, names: string[]) => boolean;
  sortCoursesChronologically: <T extends Pick<TranscriptCourse, "semester">>(items: T[]) => T[];
};

export const isMechanicalProfile = (profile: RequirementProfile) => profile.departmentName === mechanicalDepartmentName;

export const isMechanicalExcludedGeneralEducationCourse = (
  course: TranscriptCourse,
  matchesAnyName: (courseName: string, names: string[]) => boolean,
) =>
  matchesAnyName(course.name, ["資訊素養：程式設計與AI應用", "程式設計與AI應用", "工具原理與應用", "環境與能源", "實用生活化學", "物理世界的奧秘"]);

export const isEngineeringTechnologyGeneralCourse = (
  course: TranscriptCourse,
  compactCourseText: (value: string) => string,
) =>
  /(工學院|工程|機械|土木|環境工程|化學工程|材料|電機|資訊|Engineering|Mechanical|Civil|Chemical|Materials|Electrical|Computer)/i.test(
    compactCourseText(course.offeredBy),
  );

const isMechanicalRequiredProfessionalCourse = (course: Pick<TranscriptCourse, "name">, helpers: Pick<MechanicalHelpers, "matchesAnyName">) =>
  mechanicalRequiredProfessionalCourses.some((requirement) => helpers.matchesAnyName(course.name, requirement.aliases));

const isMechanicalProjectCourse = (course: Pick<TranscriptCourse, "name">, helpers: Pick<MechanicalHelpers, "matchesAnyName">) =>
  helpers.matchesAnyName(course.name, mechanicalRequiredElectiveProjectCourses);

const isMechanicalBasicElectiveCourse = (course: Pick<TranscriptCourse, "name">, helpers: Pick<MechanicalHelpers, "matchesAnyName">) =>
  helpers.matchesAnyName(course.name, mechanicalBasicElectiveCourses);

const getMechanicalGroupedElectiveRule = (course: Pick<TranscriptCourse, "name">, helpers: Pick<MechanicalHelpers, "matchesAnyName">) =>
  mechanicalGroupedElectiveCourses.find((rule) => helpers.matchesAnyName(course.name, [rule.name]));

const uniqueCourses = (courses: TranscriptCourse[]) => Array.from(new Set(courses));

const isScienceEngineeringEecsCourse = (
  course: Pick<TranscriptCourse, "offeredBy">,
  requirementProfile: RequirementProfile,
  helpers: Pick<MechanicalHelpers, "compactCourseText" | "isHomeDepartmentCourse">,
) => {
  if (helpers.isHomeDepartmentCourse(course, requirementProfile)) return true;
  return /(理學院|工學院|電資學院|物理|化學|應用數學|統計|資料科學|土木|環境工程|化學工程|材料|精密工程|電機|資訊|通訊|光電|CollegeofScience|CollegeofEngineering|ElectricalEngineering|ComputerScience)/i.test(
    helpers.compactCourseText(course.offeredBy),
  );
};

export const getMechanicalGeneralEducationRequirement = ({
  courses,
  helpers,
  requirementProfile,
}: {
  courses: TranscriptCourse[];
  helpers: MechanicalHelpers;
  requirementProfile: RequirementProfile;
}) => {
  if (!isMechanicalProfile(requirementProfile)) return undefined;
  const generalCourses = helpers.sortCoursesChronologically(
    courses.filter((course) => {
      if (course.planId !== "major" || helpers.countableCredits(course, requirementProfile) <= 0) return false;
      const category = helpers.getCourseCategory(course, requirementProfile);
      return (
        ["核心素養", "語言素養課程", "人文領域", "社會科學領域", "自然科學領域", "統合領域", "國防教育", "共同必修/通識"].includes(category) &&
        !course.genEdProfessorFromMajorDepartment &&
        !isMechanicalExcludedGeneralEducationCourse(course, helpers.matchesAnyName)
      );
    }),
  );
  const sumByCategory = (category: string) =>
    generalCourses
      .filter((course) => helpers.getCourseCategory(course, requirementProfile) === category)
      .reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const countByCategory = (category: string) =>
    generalCourses.filter((course) => helpers.getCourseCategory(course, requirementProfile) === category).length;
  const humanSocialNaturalCredits = sumByCategory("人文領域") + sumByCategory("社會科學領域") + sumByCategory("自然科學領域");
  const completed = Math.min(generalCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0), 28);
  return {
    completed,
    required: 28,
    remaining: Math.max(28 - completed, 0),
    progress: Math.min((completed / 28) * 100, 100),
    subRequirements: [
      { id: "core", label: "核心素養", completed: sumByCategory("核心素養"), required: 3 },
      { id: "language", label: "語文素養", completed: sumByCategory("語言素養課程"), required: 10 },
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

export const getMechanicalCoreRequirement = ({
  courses,
  helpers,
  requirementProfile,
}: {
  courses: TranscriptCourse[];
  helpers: MechanicalHelpers;
  requirementProfile: RequirementProfile;
}) => {
  if (!isMechanicalProfile(requirementProfile)) return undefined;
  const coursesForRequirement = helpers.sortCoursesChronologically(
    courses.filter(
      (course) =>
        course.planId === "major" &&
        helpers.countableCredits(course, requirementProfile) > 0 &&
        helpers.getCourseCategory(course, requirementProfile) === "核心素養" &&
        !isMechanicalExcludedGeneralEducationCourse(course, helpers.matchesAnyName),
    ),
  );
  const completed = coursesForRequirement.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const required = 3;
  return {
    completed,
    required,
    remaining: Math.max(required - completed, 0),
    progress: Math.min((completed / required) * 100, 100),
    courses: coursesForRequirement,
  };
};

export const getMechanicalRequiredProfessionalRequirement = ({
  courses,
  helpers,
  requirementProfile,
}: {
  courses: TranscriptCourse[];
  helpers: MechanicalHelpers;
  requirementProfile: RequirementProfile;
}) => {
  if (!isMechanicalProfile(requirementProfile)) return undefined;
  const mainCourses = helpers.sortCoursesChronologically(
    courses.filter((course) => course.planId === "major" && helpers.countableCredits(course, requirementProfile) > 0),
  );
  const courseRequirements = mechanicalRequiredProfessionalCourses.map((requirement) => {
    const matchedCourses = mainCourses.filter((course) => helpers.matchesAnyName(course.name, requirement.aliases));
    const rawCompleted = matchedCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
    const completed = Math.min(rawCompleted, requirement.requiredCredits);
    return {
      ...requirement,
      completed,
      remaining: Math.max(requirement.requiredCredits - completed, 0),
      courses: matchedCourses,
    };
  });
  const completed = courseRequirements.reduce((sum, requirement) => sum + requirement.completed, 0);
  const required = mechanicalRequiredProfessionalCourses.reduce((sum, requirement) => sum + requirement.requiredCredits, 0);
  return {
    completed,
    required,
    remaining: Math.max(required - completed, 0),
    progress: Math.min((completed / required) * 100, 100),
    courseRequirements,
    courses: courseRequirements.flatMap((requirement) => requirement.courses),
  };
};

export const getMechanicalProfessionalElectiveRequirement = ({
  courses,
  helpers,
  requirementProfile,
}: {
  courses: TranscriptCourse[];
  helpers: MechanicalHelpers;
  requirementProfile: RequirementProfile;
}) => {
  if (!isMechanicalProfile(requirementProfile)) return undefined;
  const electiveCourses = helpers.sortCoursesChronologically(
    courses.filter(
      (course) =>
        course.planId === "major" &&
        helpers.countableCredits(course, requirementProfile) > 0 &&
        helpers.getCourseCategory(course, requirementProfile) === "專業課程" &&
        helpers.isHomeDepartmentCourse(course, requirementProfile) &&
        !isMechanicalRequiredProfessionalCourse(course, helpers),
    ),
  );
  const required = 25;
  const projectCourses = electiveCourses.filter((course) => isMechanicalProjectCourse(course, helpers));
  const projectCredits = projectCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const basicCourses = electiveCourses.filter((course) => isMechanicalBasicElectiveCourse(course, helpers));
  const basicCredits = basicCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const groupedElectiveCourseMatches = mechanicalGroupedElectiveCourses.map((rule) => {
    const matchedCourses = electiveCourses.filter((course) => helpers.matchesAnyName(course.name, [rule.name]));
    const credits = matchedCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
    return {
      ...rule,
      completed: Math.min(credits, 3),
      courses: matchedCourses,
    };
  });
  const groupedElectiveCourses = uniqueCourses(groupedElectiveCourseMatches.flatMap((rule) => rule.courses));
  const groupedElectiveCredits = groupedElectiveCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const groupedElectiveCourseCount = groupedElectiveCourseMatches.filter((rule) => rule.completed > 0).length;
  const groupRequirements = mechanicalElectiveGroups.map((group) => {
    const groupCourses = groupedElectiveCourseMatches
      .filter((rule) => rule.groups.includes(group))
      .flatMap((rule) => rule.courses);
    const credits = groupCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
    return {
      id: group,
      label: group,
      completed: Math.min(credits, 3),
      required: 3,
      courses: uniqueCourses(groupCourses),
    };
  });
  const projectAcceptedCredits = Math.min(projectCredits, 4);
  const basicAcceptedCredits = Math.min(basicCredits, 3);
  const groupedAcceptedCredits = Math.min(groupedElectiveCredits, 18);
  const completed = projectAcceptedCredits + basicAcceptedCredits + groupedAcceptedCredits;
  return {
    completed,
    accepted: Math.min(completed, required),
    required,
    remaining: Math.max(required - completed, 0),
    progress: Math.min((completed / required) * 100, 100),
    subRequirements: [
      {
        id: "project",
        label: "A 專業必選課程",
        description: "機械設計與製作專題須修滿4學分。",
        completed: projectAcceptedCredits,
        required: 4,
        courses: projectCourses,
      },
      {
        id: "basic",
        label: "B 基礎選修",
        description: "基礎選修課程至少修滿一門課程（3學分）。",
        completed: basicAcceptedCredits,
        required: 3,
        courses: basicCourses,
      },
      {
        id: "grouped",
        label: "C 專業選修學群",
        description: "至少六門課程（18學分），且四個學群各至少3學分。",
        completed: groupedAcceptedCredits,
        required: 18,
        courses: groupedElectiveCourses,
        courseCount: groupedElectiveCourseCount,
        requiredCourseCount: 6,
        groupRequirements,
      },
    ],
    courses: uniqueCourses([...projectCourses, ...basicCourses, ...groupedElectiveCourses]),
  };
};

export const getMechanicalAdditionalCollegeRequirement = ({
  courses,
  helpers,
  requirementProfile,
}: {
  courses: TranscriptCourse[];
  helpers: MechanicalHelpers;
  requirementProfile: RequirementProfile;
}) => {
  if (!isMechanicalProfile(requirementProfile)) return undefined;
  const mainCourses = helpers.sortCoursesChronologically(
    courses.filter((course) => course.planId === "major" && helpers.countableCredits(course, requirementProfile) > 0),
  );
  const eligibleCollegeCourses = mainCourses.filter((course) =>
    isScienceEngineeringEecsCourse(course, requirementProfile, helpers) &&
    !isMechanicalRequiredProfessionalCourse(course, helpers) &&
    !isMechanicalProjectCourse(course, helpers)
  );
  const basicCourses = eligibleCollegeCourses.filter((course) => isMechanicalBasicElectiveCourse(course, helpers));
  const basicCredits = basicCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const groupedCourses = eligibleCollegeCourses.filter((course) => getMechanicalGroupedElectiveRule(course, helpers));
  const groupedCredits = groupedCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const generalCourses = eligibleCollegeCourses.filter(
    (course) =>
      !isMechanicalBasicElectiveCourse(course, helpers) &&
      !getMechanicalGroupedElectiveRule(course, helpers),
  );
  const generalCredits = generalCourses.reduce((sum, course) => sum + helpers.countableCredits(course, requirementProfile), 0);
  const basicOverageCredits = Math.max(basicCredits - 3, 0);
  const groupedOverageCredits = Math.max(groupedCredits - 18, 0);
  const completed = basicOverageCredits + groupedOverageCredits + generalCredits;
  const required = 9;
  return {
    completed,
    required,
    remaining: Math.max(required - completed, 0),
    progress: Math.min((completed / required) * 100, 100),
    basicOverageCredits,
    groupedOverageCredits,
    generalCredits,
    courses: eligibleCollegeCourses,
    generalCourses,
  };
};
