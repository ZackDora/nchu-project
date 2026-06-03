import {
  inferCategory,
  normalizeGrade,
  typeLabels,
} from "../calculations/courseUtils";
import type { TranscriptCourse } from "../context/TranscriptContext";
import { defaultPlanId, type RequirementProfile } from "../data/requirements";

const withCourseDefaults = (
  course: Partial<TranscriptCourse> & Pick<TranscriptCourse, "name" | "credits" | "grade">,
  profile: RequirementProfile,
): TranscriptCourse => ({
  courseNo: course.courseNo ?? "",
  semester: course.semester ?? "",
  ...course,
  score: course.score ?? "",
  type: course.type ?? "",
  typeLabel: course.typeLabel ?? (course.type ? typeLabels[course.type] ?? course.type : ""),
  category: course.category ?? (course.type === "體" || course.type === "服" ? profile.nonGraduationRequirement?.category ?? "體育/服務學習" : inferCategory(course.name, profile, course.offeredBy)),
  offeredBy: course.offeredBy ?? "",
  emi: course.emi ?? false,
  genEdProfessorFromMajorDepartment: course.genEdProfessorFromMajorDepartment ?? false,
  planId: course.planId ?? defaultPlanId,
});

const normalizePasteText = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/⼀/g, "一")
    .replace(/⼆/g, "二")
    .replace(/⼤/g, "大")
    .replace(/⽤/g, "用")
    .replace(/⾔/g, "言")
    .replace(/⼼/g, "心")
    .replace(/⽬/g, "目")
    .replace(/⾨/g, "門")
    .replace(/⼯/g, "工")
    .replace(/⻄/g, "西")
    .replace(/[ \t　]+/g, " ")
    .trim();

const parseStructuredRows = (text: string, profile: RequirementProfile): TranscriptCourse[] => {
  const rows = text
    .split(/\r?\n/)
    .map((line) => normalizePasteText(line))
    .filter(Boolean);

  return rows
    .map((row) => {
      const columns = row
        .split(/\t|,|，/)
        .map((column) => column.trim())
        .filter(Boolean);

      if (columns.length >= 4) {
        const [semester, name, credits, grade] = columns;
        return withCourseDefaults({
          semester,
          name,
          credits: Number(credits),
          grade: normalizeGrade(grade),
        }, profile);
      }

      if (columns.length === 3) {
        const [name, credits, grade] = columns;
        return withCourseDefaults({
          name,
          credits: Number(credits),
          grade: normalizeGrade(grade),
        }, profile);
      }

      const looseMatch = row.match(/^(.+?)\s+([0-6](?:\.[05])?)\s+([A-F][+-]?|P|W|抵)$/i);
      if (!looseMatch) return undefined;

      return withCourseDefaults({
        name: looseMatch[1].trim(),
        credits: Number(looseMatch[2]),
        grade: normalizeGrade(looseMatch[3]),
      }, profile);
    })
    .filter((course): course is TranscriptCourse => Boolean(course?.name && course.credits > 0));
};

const parseNchuCopiedTranscript = (text: string, profile: RequirementProfile): TranscriptCourse[] => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizePasteText(line))
    .filter(Boolean);
  const courses: TranscriptCourse[] = [];
  let currentBlock: string[] = [];
  const categoryLabels = [
    "人文領域",
    "社會科學領域",
    "自然科學領域",
    "統合領域",
    "核心素養",
    "資訊素養",
    "全校可選修",
    "專業領域微課程",
    "體育",
  ];

  const isCourseStart = (line: string) => /^([A-Z]?\d{4,6}|抵)\s*(必|選|通|體|服|Req|Elec|Gen|P\.?E\.?|Service)?$/i.test(line);
  const scoreMatch = (line: string) =>
    line.match(/^([0-6](?:\.[05])?)\s+(\d{1,3}|I|W|-)\s*([A-F][+-]?|P|W|抵|-)\s*([YN-])(?:\s+.*)?$/i) ??
    line.match(/(?:^|\s)([0-6](?:\.[05])?)\s*(抵)$/i);
  const compactLine = (line: string) => line.replace(/\s+/g, "");
  const cleanOfferedBy = (line: string) =>
    line.match(/([\u4e00-\u9fff]*(?:體育室|學務處|中心|學程|系|所|院))$/)?.[1] ?? line;
  const isNoiseLine = (line: string) =>
    /^(選課|號碼|Course|No|課程別|Category|科目名稱|Course Name|課程分類|Classify|開課系所|Offered Dept\.?|學分|Credits|成績|Score|等|第|GPA|EMI|課|程)$/.test(line) ||
    /(人文領域|社會科學領域|自然科學領域|核心素養|通識自由選|全校可選修|統合領域|專業領域微課程|通識中心|語言中心|體育室|學務處|外文系|Department|College|Office|Center|Humanistic|General Education|Category)/i.test(line);

  const findWrappedCategory = (chineseLines: string[]) => {
    const domainLabels = ["統合領域", "人文領域", "社會科學領域", "自然科學領域", "核心素養", "資訊素養", "專業領域微課程", "體育"];

    for (let start = 0; start < chineseLines.length; start += 1) {
      let joined = "";
      for (let end = start; end < Math.min(start + 3, chineseLines.length); end += 1) {
        joined += compactLine(chineseLines[end]);
        const label = categoryLabels.find((category) => joined === category);
        if (label) return { label, start, end };

        const matchedDomain = domainLabels.find((category) => joined.endsWith(category));
        if (matchedDomain && /^通識自由選修?\//.test(joined)) {
          return { label: matchedDomain, start, end };
        }
      }
    }
    return undefined;
  };

  const flushBlock = () => {
    if (currentBlock.length === 0) return;
    const block = currentBlock;
    currentBlock = [];

    const scoreLine = block.find((line) => scoreMatch(line));
    const matchedScore = scoreLine ? scoreMatch(scoreLine) : undefined;
    if (!matchedScore) return;

    const startMatch = block[0].match(/^([A-Z]?\d{4,6}|抵)\s*(必|選|通|體|服)?/);
    const chineseLines = block
      .slice(1)
      .filter((line) => line !== scoreLine)
      .filter((line) => /[\u4e00-\u9fff]/.test(line));

    const categoryMatch = findWrappedCategory(chineseLines);
    const category =
      categoryMatch?.label === "體育"
        ? profile.nonGraduationRequirement?.category ?? "體育/服務學習"
        : categoryMatch?.label === "全校可選修"
          ? "其他"
          : categoryMatch?.label;
    const offeredByIndex = chineseLines.findIndex((line) => /(?:夜外文|系|所|學程|中心|院|體育室|學務處)$/.test(line) && line !== category);
    const offeredBy = offeredByIndex >= 0 ? cleanOfferedBy(chineseLines[offeredByIndex]) : "";
    const nameEnd =
      categoryMatch?.start ??
      (offeredByIndex >= 0 ? offeredByIndex : chineseLines.length);
    const name = chineseLines
      .slice(0, nameEnd)
      .filter((line) => !isNoiseLine(line))
      .map(compactLine)
      .join("");
    if (!name) return;

    courses.push(withCourseDefaults({
      courseNo: startMatch?.[1] === "抵" ? "" : startMatch?.[1] ?? "",
      type: startMatch?.[2] ?? "",
      semester: "",
      name,
      credits: Number(matchedScore[1]),
      score: matchedScore[3] ? matchedScore[2] : "",
      grade: normalizeGrade(matchedScore[3] ?? matchedScore[2]),
      category: category ?? inferCategory(name, profile, offeredBy),
      offeredBy: offeredBy ?? "",
      emi: matchedScore[4]?.toUpperCase() === "Y",
    }, profile));
  };

  for (const line of lines) {
    if (isCourseStart(line)) {
      flushBlock();
      currentBlock = [line];
      continue;
    }

    if (currentBlock.length > 0) {
      currentBlock.push(line);
      if (scoreMatch(line)) flushBlock();
    }
  }

  flushBlock();
  return courses;
};

type MobileCourseDraft = Partial<TranscriptCourse> & {
  credits?: number;
  grade?: string;
  name?: string;
};

const mobileFieldLabels: Record<string, keyof MobileCourseDraft> = {
  選課號碼: "courseNo",
  課程號碼: "courseNo",
  號碼: "courseNo",
  courseno: "courseNo",
  coursenumber: "courseNo",
  課程別: "type",
  category: "type",
  科目名稱: "name",
  課程名稱: "name",
  coursename: "name",
  課程分類: "category",
  classify: "category",
  開課系所: "offeredBy",
  offereddept: "offeredBy",
  offereddepartment: "offeredBy",
  學分: "credits",
  credits: "credits",
  成績: "score",
  score: "score",
  等第: "grade",
  grade: "grade",
  emi: "emi",
};

const compactMobileLabel = (value: string) => value.replace(/[.\s:：/]/g, "").toLowerCase();

const getMobileFieldLabel = (line: string, nextLine = "") => {
  const compactLine = compactMobileLabel(line);
  const compactPair = compactMobileLabel(`${line}${nextLine}`);
  return {
    field: mobileFieldLabels[compactLine] ?? mobileFieldLabels[compactPair],
    consumedLines: mobileFieldLabels[compactLine] ? 1 : mobileFieldLabels[compactPair] ? 2 : 0,
  };
};

const isValidMobileCourseDraft = (course: MobileCourseDraft): course is MobileCourseDraft & Pick<TranscriptCourse, "name" | "credits" | "grade"> =>
  Boolean(course.name && typeof course.credits === "number" && course.credits > 0 && course.grade);

const normalizeMobileCourseValue = (field: keyof MobileCourseDraft, value: string) => {
  if (field === "type") {
    const matchedType = value.match(/必|選|通|體|服|Req|Elec|Gen|P\.?E\.?|Service/i)?.[0] ?? value;
    return matchedType in typeLabels ? matchedType : value;
  }
  if (field === "credits") return Number(value.match(/[0-6](?:\.[05])?/)?.[0] ?? value);
  if (field === "grade") return normalizeGrade(value.match(/[A-F][+-]?|P|W|抵/i)?.[0] ?? value);
  if (field === "score") return value.match(/\d{1,3}|I|W|-/i)?.[0] ?? value;
  if (field === "emi") return /Y|是|Yes/i.test(value);
  return value;
};

const parseNchuMobileLabelValueTranscript = (text: string, profile: RequirementProfile): TranscriptCourse[] => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizePasteText(line))
    .filter(Boolean);
  const courses: TranscriptCourse[] = [];
  let currentCourse: MobileCourseDraft = {};
  let currentField: keyof MobileCourseDraft | undefined;

  const flushCourse = () => {
    if (!isValidMobileCourseDraft(currentCourse)) {
      currentCourse = {};
      currentField = undefined;
      return;
    }

    courses.push(withCourseDefaults({
      courseNo: currentCourse.courseNo ?? "",
      semester: currentCourse.semester ?? "",
      name: currentCourse.name,
      credits: currentCourse.credits,
      score: currentCourse.score ?? "",
      grade: normalizeGrade(currentCourse.grade),
      type: currentCourse.type ?? "",
      category: currentCourse.category,
      offeredBy: currentCourse.offeredBy ?? "",
      emi: currentCourse.emi ?? false,
    }, profile));
    currentCourse = {};
    currentField = undefined;
  };

  const assignField = (field: keyof MobileCourseDraft, rawValue: string) => {
    const normalizedValue = normalizeMobileCourseValue(field, rawValue);
    if (field === "courseNo" && isValidMobileCourseDraft(currentCourse)) flushCourse();
    if (field === "credits" && typeof normalizedValue === "number" && Number.isFinite(normalizedValue)) {
      currentCourse.credits = normalizedValue;
      return;
    }
    if (field === "emi" && typeof normalizedValue === "boolean") {
      currentCourse.emi = normalizedValue;
      return;
    }
    if (typeof normalizedValue !== "string" || !normalizedValue.trim()) return;
    const previousValue = currentCourse[field];
    currentCourse[field] = typeof previousValue === "string" && previousValue
      ? `${previousValue}${normalizedValue}` as never
      : normalizedValue as never;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nextLine = lines[index + 1] ?? "";
    const label = getMobileFieldLabel(line, nextLine);
    if (label.field) {
      currentField = label.field;
      index += label.consumedLines - 1;
      continue;
    }

    if (!currentField) continue;
    const nextLabel = getMobileFieldLabel(nextLine, lines[index + 2] ?? "");
    assignField(currentField, line);
    if (currentField === "grade" || currentField === "emi" || nextLabel.field) {
      currentField = undefined;
    }
  }

  flushCourse();
  return courses;
};

const getParsedCourseKey = (course: TranscriptCourse) =>
  [
    course.courseNo && course.courseNo !== "抵" ? course.courseNo : "",
    course.name.replace(/\s+/g, ""),
    course.credits,
    normalizeGrade(course.grade),
  ].join("|");

export const parsePastedCourses = (text: string, profile: RequirementProfile): TranscriptCourse[] => {
  const structuredCourses = parseStructuredRows(text, profile);
  const copiedTranscriptCourses = parseNchuCopiedTranscript(text, profile);
  const mobileLabelValueCourses = parseNchuMobileLabelValueTranscript(text, profile);
  const seen = new Set<string>();
  return [...structuredCourses, ...copiedTranscriptCourses, ...mobileLabelValueCourses].filter((course) => {
    const key = getParsedCourseKey(course);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
