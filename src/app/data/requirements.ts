export type RequirementPlanType = "major" | "minor" | "double-major" | "program";

export interface DepartmentRequirement {
  college: string;
  name: string;
  credits: number;
  admissionYear?: number;
  supportedAdmissionYears?: number[];
  sourceUrl?: string;
  notes?: string[];
  manualChecks?: string[];
}

export interface RequirementPlan {
  id: string;
  type: RequirementPlanType;
  name: string;
  requiredCredits: number;
  source: "catalog" | "custom";
  admissionYear?: number;
  sourceUrl?: string;
  notes?: string[];
  manualChecks?: string[];
}

export interface NamedCreditRequirement {
  name: string;
  requiredCredits: number;
}

export interface PatternRequirementOption {
  id: string;
  label: string;
  pattern: RegExp;
}

export interface ChoiceCreditRequirement {
  title: string;
  description: string;
  requiredCredits: number;
  options: PatternRequirementOption[];
  overageCountsAsExternal: boolean;
}

export interface NonGraduationRequirement {
  title: string;
  requiredCourses: number;
  category: string;
}

export interface ProgramCourseRule {
  name: string;
  credits: number;
  offeredBy?: string;
}

export interface RequirementProfile {
  departmentName: string;
  nonGraduationCreditCategories: string[];
  nonGraduationRequirement?: NonGraduationRequirement;
  languageLiteracyRequirements: NamedCreditRequirement[];
  choiceCreditRequirements: ChoiceCreditRequirement[];
  externalCreditLimit?: number;
  generalEducationCreditLimit?: number;
  homeDepartmentPatterns: RegExp[];
  generalRequirementCategories: string[];
}

export const departmentCredits: Record<string, DepartmentRequirement[]> = {
  文學院: [{ college: "文學院", name: "外國語文學系", credits: 128, supportedAdmissionYears: [111, 112, 113, 114, 115, 116] }],
  農業暨自然資源學院: [
    {
      college: "農業暨自然資源學院",
      name: "植物病理學系",
      credits: 136,
      admissionYear: 114,
      supportedAdmissionYears: [114],
      notes: [
        "114學年度起入學植物病理學系學士班最低畢業總學分136學分，不含體育課程。",
        "通識課程28學分；系專業必修52學分；系專業選修36學分。",
        "資訊素養：程式設計與AI應用必修1學分，外籍生得免修。",
        "生命科學學群通識課程至多採計1門；超修通識課程不採計為外系學分。",
        "承認外系學分上限以20學分為原則。",
      ],
      manualChecks: [
        "體育課程必修2學分，不計入畢業學分；超修體育課程至多採計為外系2學分，需人工確認。",
        "英文能力檢定0學分，學系如另訂更高標準需人工確認。",
        "入學資格屬修業年限少於國內高級中等學校及專科學校之國外同等學校畢業生，畢業學分數應增加至少12學分，需人工確認。",
      ],
    },
  ],
  工學院: [
    {
      college: "工學院",
      name: "機械工程學系",
      credits: 136,
      admissionYear: 114,
      supportedAdmissionYears: [114],
      sourceUrl: "https://www.me.nchu.edu.tw/student.php?tag_id=sBachelor",
      notes: [
        "114學年度起入學機械工程學系學士班最低畢業總學分136學分，不含體育課程。",
        "通識課程28學分；系專業必修74學分；系專業選修25學分。",
        "體育課程必修2學分，不計入畢業學分；超修體育課程至多採計為外系2學分，需由人工確認。",
        "資訊素養：程式設計與AI應用免修；若修習，不採計為通識畢業學分。",
        "通識課程中，工程科技學群至多採計1門；工具原理與應用、環境與能源、實用生活化學、物理世界的奧秘不列入通識學分。",
      ],
      manualChecks: [
        "選修本系碩士班課程經申請亦可列入專業選修學群，需人工確認申請結果。",
        "入學資格屬修業年限少於國內高級中等學校及專科學校之國外同等學校畢業生，畢業學分數應增加至少12學分，需人工確認。",
      ],
    },
  ],
};

export const allDepartments = Object.values(departmentCredits).flat();

export const planTypeLabels: Record<RequirementPlanType, string> = {
  major: "主修",
  minor: "輔修",
  "double-major": "雙主修",
  program: "學程",
};

export const defaultPlanId = "major";

export const defaultRequirementProfile: RequirementProfile = {
  departmentName: "通用規則",
  nonGraduationCreditCategories: ["體育/服務學習"],
  nonGraduationRequirement: {
    title: "體育 / 服務學習",
    requiredCourses: 2,
    category: "體育/服務學習",
  },
  languageLiteracyRequirements: [],
  choiceCreditRequirements: [],
  homeDepartmentPatterns: [],
  generalRequirementCategories: [
    "人文領域",
    "社會科學領域",
    "自然科學領域",
    "統合領域",
    "核心素養",
    "資訊素養",
    "語言素養課程",
    "國防教育",
    "共同必修/通識",
  ],
};

export const requirementProfiles: Record<string, RequirementProfile> = {
  外國語文學系: {
    ...defaultRequirementProfile,
    departmentName: "外國語文學系",
    languageLiteracyRequirements: [
      { name: "大一英文", requiredCredits: 4 },
      { name: "大學國文", requiredCredits: 4 },
    ],
    choiceCreditRequirements: [
      {
        title: "第二外語（一）",
        description: "任選日文、德文、西班牙文、法文一種語言達6學分；同語言超過6學分及其他第二外語學分列入外系學分計算。",
        requiredCredits: 6,
        overageCountsAsExternal: true,
        options: [
          { id: "japanese", label: "日文", pattern: /(日文|日本語|Japanese)/i },
          { id: "german", label: "德文", pattern: /(德文|德語|German)/i },
          { id: "spanish", label: "西班牙文", pattern: /(西班牙文|西班牙語|Spanish)/i },
          { id: "french", label: "法文", pattern: /(法文|法語|French)/i },
        ],
      },
    ],
    externalCreditLimit: 18,
    homeDepartmentPatterns: [
      /外文系/i,
      /夜外文/i,
      /外國語文學系/i,
      /ForeignLanguages/i,
      /ForeignLanguagesandLiteratures/i,
      /DepartmentofForeignLanguages/i,
    ],
  },
  機械工程學系: {
    ...defaultRequirementProfile,
    departmentName: "機械工程學系",
    generalEducationCreditLimit: 28,
    languageLiteracyRequirements: [
      { name: "大學國文", requiredCredits: 4 },
      { name: "大一英文", requiredCredits: 4 },
      { name: "學術英語聽講", requiredCredits: 2 },
    ],
    homeDepartmentPatterns: [
      /機械工程學系/i,
      /機械系/i,
      /機械工程/i,
      /MechanicalEngineering/i,
      /DepartmentofMechanicalEngineering/i,
    ],
  },
  植物病理學系: {
    ...defaultRequirementProfile,
    departmentName: "植物病理學系",
    generalEducationCreditLimit: 28,
    externalCreditLimit: 20,
    languageLiteracyRequirements: [
      { name: "敘事表達：語文素養", requiredCredits: 2 },
      { name: "敘事表達：語文應用", requiredCredits: 2 },
      { name: "英語溝通與表達", requiredCredits: 2 },
      { name: "學術英文聽讀", requiredCredits: 2 },
    ],
    homeDepartmentPatterns: [
      /植物病理學系/i,
      /植物病理/i,
      /植病系/i,
      /PlantPathology/i,
      /DepartmentofPlantPathology/i,
    ],
  },
};

export const getRequirementProfile = (departmentName: string) =>
  requirementProfiles[departmentName] ?? defaultRequirementProfile;

export const digitalHumanitiesProgramId = "program-digital-humanities";

export const digitalHumanitiesProgramCourses: ProgramCourseRule[] = [
  { name: "數位人文專題製作", credits: 3, offeredBy: "文學院" },
  { name: "數位人文概論", credits: 2, offeredBy: "文學院" },
  { name: "影像處理與電腦繪圖", credits: 2, offeredBy: "文學院" },
  { name: "影像處理與電腦繪畫", credits: 2, offeredBy: "文學院" },
  { name: "動態圖像設計", credits: 2, offeredBy: "文學院" },
  { name: "網頁設計", credits: 2, offeredBy: "文學院" },
  { name: "3D建模與動畫", credits: 2, offeredBy: "文學院" },
  { name: "互動遊戲設計", credits: 2, offeredBy: "文學院" },
  { name: "數位敘事應用", credits: 2, offeredBy: "文學院" },
  { name: "視覺傳達設計", credits: 2, offeredBy: "文學院" },
  { name: "數位內容策展", credits: 2, offeredBy: "文學院" },
  { name: "數位人文的人工智慧", credits: 2, offeredBy: "文學院" },
  { name: "數位人文GIS應用", credits: 2, offeredBy: "文學院" },
  { name: "資訊視覺設計", credits: 2, offeredBy: "文學院" },
  { name: "數位攝影", credits: 2, offeredBy: "文學院" },
  { name: "數位人文產業實習", credits: 1, offeredBy: "文學院" },
  { name: "虛擬創作與人文應用", credits: 2, offeredBy: "文學院" },
  { name: "AI協作人文學研究入門", credits: 2, offeredBy: "文學院" },
  { name: "數位傳播與出版", credits: 2, offeredBy: "文學院" },
  { name: "數位時代下的文化旅遊", credits: 3, offeredBy: "台灣人文創新學士學位學程" },
  { name: "程式設計與人文應用", credits: 3, offeredBy: "外國語文學系" },
];

export const digitalHumanitiesProgramRecognizedCourses: ProgramCourseRule[] = [
  { name: "資訊素養：程式設計與AI應用", credits: 1, offeredBy: "通識中心" },
  { name: "生成式AI探索與應用", credits: 2, offeredBy: "通識中心" },
  { name: "行動載具程式設計", credits: 2, offeredBy: "通識中心" },
  { name: "設計思考", credits: 2, offeredBy: "通識中心" },
];

export const animalScienceIndustryProgramId = "program-animal-science-industry";

export const animalScienceIndustryProgramCourses: ProgramCourseRule[] = [
  { name: "伴侶動物營養觀念建立及應用", credits: 1, offeredBy: "動物科學系" },
  { name: "實驗動物技術與應用", credits: 2, offeredBy: "動物科學系" },
  { name: "課外實習", credits: 1, offeredBy: "動物科學系" },
  { name: "酪農業與豬隻產業之現況", credits: 1, offeredBy: "動物科學系" },
  { name: "豬隻飼養管理與品牌行銷", credits: 2, offeredBy: "動物科學系" },
  { name: "動物產業管理與行銷", credits: 2, offeredBy: "動物科學系" },
  { name: "企業實習（一）", credits: 3, offeredBy: "動物科學系" },
  { name: "企業實習（二）", credits: 3, offeredBy: "動物科學系" },
  { name: "馬術產業管理", credits: 2, offeredBy: "動物科學系" },
  { name: "環境與動物生產", credits: 2, offeredBy: "動物科學系" },
];

export const programCourseRulesByPlanId: Record<string, ProgramCourseRule[]> = {
  [digitalHumanitiesProgramId]: [...digitalHumanitiesProgramCourses, ...digitalHumanitiesProgramRecognizedCourses],
  [animalScienceIndustryProgramId]: animalScienceIndustryProgramCourses,
};

export const getProgramCourseRules = (planId: string) => programCourseRulesByPlanId[planId] ?? [];

export const isConfiguredProgramPlanCourse = (
  planId: string,
  course: Pick<{ name: string }, "name">,
  matchesAnyName: (courseName: string, names: string[]) => boolean,
) => getProgramCourseRules(planId).some((rule) => matchesAnyName(course.name, [rule.name]));

export const optionalProgramPlans: RequirementPlan[] = [
  {
    id: digitalHumanitiesProgramId,
    type: "program",
    name: "數位人文與資訊應用學程",
    requiredCredits: 12,
    source: "catalog",
    admissionYear: 111,
    sourceUrl:
      "https://sites.google.com/email.nchu.edu.tw/cla/%E7%89%B9%E8%89%B2%E8%AA%B2%E7%A8%8B/%E6%95%B8%E4%BD%8D%E4%BA%BA%E6%96%87%E8%88%87%E8%B3%87%E8%A8%8A%E6%87%89%E7%94%A8%E5%AD%B8%E5%88%86%E5%AD%B8%E7%A8%8B",
    notes: [
      "完整學分學程證書標準為12學分，跨領域學分學程合計修習達12學分即可獲頒證書。",
      "至少有6學分不屬於原主修、雙主修必修之課程。",
      "凡曾修習數位人文與典藏應用學程課程之學分皆得抵認本學程學分。",
      "114-2起不再認列：資訊科技與社會、Python程式設計、物件導向程式設計、大數據分析程式實作。",
      "學程未修畢不影響畢業年限，亦無須辦理退出。",
      "分數欄為「抵」的課程不可抵免學程學分。",
    ],
  },
  {
    id: animalScienceIndustryProgramId,
    type: "program",
    name: "動物科學產業微學分學程",
    requiredCredits: 6,
    source: "catalog",
    admissionYear: 114,
    notes: [
      "依114年4月28日公告之動物科學產業微學分學程課程規劃表建立。",
      "本學程至少須修習所列必修與選修課程共6學分，方授予「動物科學產業微學分學程」證書。",
      "合作開設單位包含動物科學系、樂斯科生物科技股份有限公司、青欣牧場、中美嘉吉公司等產業與公民營單位。",
      "本工具目前採計課程名稱符合規劃表所列科目，抵免課程不採計。",
    ],
  },
];

export const defaultUserPlans: RequirementPlan[] = [
  {
    id: defaultPlanId,
    type: "major",
    name: "外國語文學系",
    requiredCredits: 128,
    source: "catalog",
    admissionYear: 111,
    sourceUrl: "https://dfll.nchu.edu.tw/news_detail.php?Key=224",
    notes: [
      "111、112學年度入學外文系學士班先以總學分128建立主修門檻。",
      "系辦公告提醒：教務系統選修課程會自動分類，大一英文、院必修、第二外語會放在本系專業必修課程中，教務處每年4月人工維護。",
      "通識人文、社會、自然三領域需各1門，合計至少6學分；文學學群通識至多採計1門。",
      "語言素養課程：大一英文4學分、大學國文4學分；成績欄為「抵」代表以其他證明抵免，學分仍採計。",
      "外文系必修第二外語（一）：日文、德文、西班牙文、法文任一語言6學分；同語言超修學分列入外系學分計算。",
      "核心素養課程至少3學分，其中資訊素養必修1學分；外籍生免修資訊素養。",
      "通識人文、社會、自然三領域各1門，合計至少6學分；統合領域至少4學分。",
      "國防教育類課程非必修，至多採計1門為通識畢業學分，超修不採計為外系學分。",
      "本系屬文學學群，文學學群通識課程至多採計1門，超修不採計為外系學分。",
      "超修通識課程可採計為外系學分，最多10學分。",
      "本系教師於通識中心所開課程不列入畢業學分。",
      "本系承認外系學分最多18學分。",
      "若外文系學生選修全校共同英文課程，則不計入畢業學分。",
    ],
  },
];
