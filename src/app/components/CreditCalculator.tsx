import { Calculator, ClipboardPaste, GraduationCap, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { dfllGeneralEdOverflowExternalLimit, getDfllRequirementAudits, getDfllRequirementRows, isDfllProfile, isDfllRequiredCourseForProgramRule } from "../calculations/dfll";
import { getMechanicalAdditionalCollegeRequirement, getMechanicalCoreRequirement, getMechanicalGeneralEducationRequirement, getMechanicalProfessionalElectiveRequirement, getMechanicalRequiredProfessionalRequirement } from "../calculations/mechanical";
import { getPlantPathologyGeneralEducationRequirement, getPlantPathologyOtherGraduationRequirement, getPlantPathologyProfessionalElectiveRequirement, getPlantPathologyRequiredProfessionalRequirement } from "../calculations/plantPathology";
import { getPrimaryCreditAudit } from "../calculations/primaryAudit";
import {
  categoryOptions,
  compactCourseText,
  countableCredits,
  emptyCourse,
  fallbackRequirementProfile,
  firstSupportedAdmissionYear,
  getChoiceRequirementOption,
  getCourseCategory,
  getCourseChronology,
  getCourseDisplayName,
  getDuplicateKey,
  getScoreDisplay,
  getSemesterOptions,
  getSemesterTerm,
  inferCategory,
  isFailedCourse,
  isGeneralEducationCourse,
  isHomeDepartmentCourse,
  isWithdrawnCourse,
  matchesAnyName,
  normalizeGrade,
  sortCoursesChronologically,
  typeLabels,
} from "../calculations/courseUtils";
import { useTranscript, type TranscriptCourse } from "../context/TranscriptContext";
import {
  allDepartments,
  defaultPlanId,
  departmentCredits,
  digitalHumanitiesProgramId,
  getProgramCourseRules,
  getRequirementProfile,
  isConfiguredProgramPlanCourse,
  optionalProgramPlans,
  planTypeLabels,
  type RequirementPlan,
} from "../data/requirements";
import { parsePastedCourses } from "../parsing/transcriptParser";
import { CourseTable } from "./credit-calculator/CourseTable";

export function CreditCalculator() {
  const { courses, profile, plans, setPlans, setTranscript, clearTranscript } = useTranscript();
  const [selectedDepartment, setSelectedDepartment] = useState(profile.department);
  const [studentStatus, setStudentStatus] = useState<"local" | "foreign">(profile.studentStatus ?? "local");
  const [admissionYear, setAdmissionYear] = useState(Math.max(profile.admissionYear ?? firstSupportedAdmissionYear, firstSupportedAdmissionYear));
  const semesterOptions = useMemo(() => getSemesterOptions(admissionYear), [admissionYear]);
  const [pasteSemester, setPasteSemester] = useState(`${Math.max(profile.admissionYear ?? firstSupportedAdmissionYear, firstSupportedAdmissionYear)}-1`);
  const [pasteText, setPasteText] = useState("");
  const [pasteMessage, setPasteMessage] = useState("");
  const [selectedCategorySummary, setSelectedCategorySummary] = useState("");
  const [showExternalCreditCourses, setShowExternalCreditCourses] = useState(false);
  const [selectedDfllRequirementDetail, setSelectedDfllRequirementDetail] = useState("");
  const [selectedPlanDetail, setSelectedPlanDetail] = useState("");
  const [selectedProgramPlanId, setSelectedProgramPlanId] = useState(optionalProgramPlans[0]?.id ?? "");
  const requirementProfile = useMemo(() => getRequirementProfile(selectedDepartment), [selectedDepartment]);
  const selectedDepartmentRequirement = useMemo(
    () => allDepartments.find((dept) => dept.name === selectedDepartment),
    [selectedDepartment],
  );
  const supportedAdmissionYears = selectedDepartmentRequirement?.supportedAdmissionYears ?? [admissionYear];

  const groupedCredits = useMemo(() => {
    const groups = Object.fromEntries(categoryOptions.map((category) => [category, 0])) as Record<string, number>;

    for (const course of courses) {
      const category = getCourseCategory(course, requirementProfile);
      groups[category] += countableCredits(course, requirementProfile);
    }
    return groups;
  }, [courses, requirementProfile]);

  const selectedCategoryCourses = useMemo(
    () =>
      selectedCategorySummary
        ? sortCoursesChronologically(courses.filter((course) => getCourseCategory(course, requirementProfile) === selectedCategorySummary))
        : [],
    [courses, requirementProfile, selectedCategorySummary],
  );
  const chronologicalCourseRows = useMemo(
    () =>
      courses
        .map((course, index) => ({ course, index }))
        .sort((a, b) => getCourseChronology(a.course) - getCourseChronology(b.course) || a.index - b.index),
    [courses],
  );

  const primaryPlan = plans.find((plan) => plan.id === defaultPlanId) ?? plans[0];
  const primaryCreditAudit = useMemo(() => getPrimaryCreditAudit(courses, requirementProfile, studentStatus, admissionYear), [admissionYear, courses, requirementProfile, studentStatus]);
  const primaryCompleted = primaryCreditAudit.completed;
  const primaryRemaining = Math.max((primaryPlan?.requiredCredits ?? 128) - primaryCompleted, 0);
  const primaryProgress = Math.min((primaryCompleted / (primaryPlan?.requiredCredits ?? 128)) * 100, 100);
  const uncountedCourseAuditMap = useMemo(
    () => new Map(primaryCreditAudit.uncountedCourseAudits.map((audit) => [audit.course, audit])),
    [primaryCreditAudit],
  );
  const getCourseCreditStatus = (course: TranscriptCourse) => {
    const category = getCourseCategory(course, requirementProfile);
    if (isWithdrawnCourse(course)) {
      return { isUncounted: true, note: "退選，學分不計入畢業學分。", acceptedCredits: 0, uncountedCredits: course.credits };
    }
    if (isFailedCourse(course)) {
      return { isUncounted: true, note: "不及格，學分不計入畢業學分。", acceptedCredits: 0, uncountedCredits: course.credits };
    }
    if (requirementProfile.nonGraduationCreditCategories.includes(category)) {
      return { isUncounted: true, note: "體育課程不計入畢業學分。", acceptedCredits: 0, uncountedCredits: course.credits };
    }
    const audit = uncountedCourseAuditMap.get(course);
    if (audit) return { isUncounted: true, note: audit.note, acceptedCredits: audit.acceptedCredits, uncountedCredits: audit.uncountedCredits };
    return { isUncounted: false, note: "", acceptedCredits: countableCredits(course, requirementProfile), uncountedCredits: 0 };
  };

  const planProgress = useMemo(
    () =>
      plans.map((plan) => {
        const assignedPlanCourses = sortCoursesChronologically(courses.filter((course) => course.planId === plan.id));
        const programRules = getProgramCourseRules(plan.id);
        const hasConfiguredProgramRules = programRules.length > 0;
        const planCourses =
          hasConfiguredProgramRules
            ? sortCoursesChronologically(courses)
            : assignedPlanCourses;
        const programRecognizedCourses =
          hasConfiguredProgramRules
            ? planCourses.filter((course) => isConfiguredProgramPlanCourse(plan.id, course, matchesAnyName) && normalizeGrade(course.grade) !== "抵")
            : planCourses;
        const countedPlanCourses = programRecognizedCourses.filter((course) => countableCredits(course, requirementProfile) > 0);
        const completed =
          plan.id === defaultPlanId
            ? primaryCreditAudit.completed
            : countedPlanCourses.reduce((sum, course) => sum + countableCredits(course, requirementProfile), 0);
        const nonRequiredCredits =
          plan.id === digitalHumanitiesProgramId
            ? countedPlanCourses
              .filter((course) =>
                !isDfllRequiredCourseForProgramRule(course, admissionYear, studentStatus, fallbackRequirementProfile, {
                  compactCourseText,
                  getCourseCategory,
                  matchesAnyName,
                }),
              )
              .reduce((sum, course) => sum + countableCredits(course, requirementProfile), 0)
            : 0;
        const unrecognizedCourses =
          hasConfiguredProgramRules
            ? assignedPlanCourses.filter((course) => !isConfiguredProgramPlanCourse(plan.id, course, matchesAnyName) || normalizeGrade(course.grade) === "抵")
            : [];
        const requirementRemaining =
          plan.id === digitalHumanitiesProgramId
            ? Math.max(Math.max(plan.requiredCredits - completed, 0), Math.max(6 - nonRequiredCredits, 0))
            : Math.max(plan.requiredCredits - completed, 0);
        return {
          ...plan,
          completed,
          remaining: requirementRemaining,
          progress: Math.min((completed / plan.requiredCredits) * 100, 100),
          nonRequiredCredits,
          countedCourses: countedPlanCourses,
          unrecognizedCourses,
        };
      }),
    [admissionYear, courses, plans, primaryCreditAudit, requirementProfile, studentStatus],
  );

  const nonGraduationRequirement = useMemo(() => {
    const configuredRequirement = requirementProfile.nonGraduationRequirement;
    if (!configuredRequirement) return undefined;
    const completed = courses.filter((course) => getCourseCategory(course, requirementProfile) === configuredRequirement.category).length;
    return {
      ...configuredRequirement,
      completed,
      done: completed >= configuredRequirement.requiredCourses,
    };
  }, [courses, requirementProfile]);

  const languageLiteracyRequirements = useMemo(
    () =>
      requirementProfile.languageLiteracyRequirements.map((requirement) => {
        const completed = courses
          .filter((course) => compactCourseText(course.name).includes(compactCourseText(requirement.name)))
          .reduce((sum, course) => sum + countableCredits(course, requirementProfile), 0);
        return {
          ...requirement,
          completed,
          remaining: Math.max(requirement.requiredCredits - completed, 0),
          progress: Math.min((completed / requirement.requiredCredits) * 100, 100),
        };
      }),
    [courses, requirementProfile],
  );

  const choiceRequirementViews = useMemo(
    () =>
      primaryCreditAudit.choiceRequirementAudits.map((audit) => {
        const options = audit.requirement.options.map((option) => {
          const completed = audit.optionCredits[option.id] ?? 0;
          return {
            ...option,
            completed,
            remaining: Math.max(audit.requirement.requiredCredits - completed, 0),
            progress: Math.min((completed / audit.requirement.requiredCredits) * 100, 100),
          };
        });
        return {
          requirement: audit.requirement,
          options,
          completedOption: options.find((option) => option.completed >= audit.requirement.requiredCredits),
        };
      }),
    [primaryCreditAudit],
  );

  const mechanicalCoreRequirement = useMemo(() => {
    return getMechanicalCoreRequirement({
      courses,
      requirementProfile,
      helpers: {
        compactCourseText,
        countableCredits,
        getCourseCategory,
        isHomeDepartmentCourse,
        matchesAnyName,
        sortCoursesChronologically,
      },
    });
  }, [courses, requirementProfile]);

  const mechanicalGeneralEducationRequirement = useMemo(() => {
    return getMechanicalGeneralEducationRequirement({
      courses,
      requirementProfile,
      helpers: {
        compactCourseText,
        countableCredits,
        getCourseCategory,
        isHomeDepartmentCourse,
        matchesAnyName,
        sortCoursesChronologically,
      },
    });
  }, [courses, requirementProfile]);

  const mechanicalRequiredProfessionalRequirement = useMemo(() => {
    return getMechanicalRequiredProfessionalRequirement({
      courses,
      requirementProfile,
      helpers: {
        compactCourseText,
        countableCredits,
        getCourseCategory,
        isHomeDepartmentCourse,
        matchesAnyName,
        sortCoursesChronologically,
      },
    });
  }, [courses, requirementProfile]);

  const mechanicalProfessionalElectiveRequirement = useMemo(() => {
    return getMechanicalProfessionalElectiveRequirement({
      courses,
      requirementProfile,
      helpers: {
        compactCourseText,
        countableCredits,
        getCourseCategory,
        isHomeDepartmentCourse,
        matchesAnyName,
        sortCoursesChronologically,
      },
    });
  }, [courses, requirementProfile]);

  const mechanicalAdditionalCollegeRequirement = useMemo(() => {
    return getMechanicalAdditionalCollegeRequirement({
      courses,
      requirementProfile,
      helpers: {
        compactCourseText,
        countableCredits,
        getCourseCategory,
        isHomeDepartmentCourse,
        matchesAnyName,
        sortCoursesChronologically,
      },
    });
  }, [courses, requirementProfile]);

  const plantPathologyGeneralEducationRequirement = useMemo(() => {
    return getPlantPathologyGeneralEducationRequirement({
      courses,
      requirementProfile,
      studentStatus,
      helpers: {
        compactCourseText,
        countableCredits,
        getCourseCategory,
        isHomeDepartmentCourse,
        matchesAnyName,
        sortCoursesChronologically,
      },
    });
  }, [courses, requirementProfile, studentStatus]);

  const plantPathologyRequiredProfessionalRequirement = useMemo(() => {
    return getPlantPathologyRequiredProfessionalRequirement({
      courses,
      requirementProfile,
      helpers: {
        compactCourseText,
        countableCredits,
        getCourseCategory,
        isHomeDepartmentCourse,
        matchesAnyName,
        sortCoursesChronologically,
      },
    });
  }, [courses, requirementProfile]);

  const plantPathologyProfessionalElectiveRequirement = useMemo(() => {
    return getPlantPathologyProfessionalElectiveRequirement({
      courses,
      requirementProfile,
      requiredProfessionalCourses: plantPathologyRequiredProfessionalRequirement?.acceptedCourses ?? [],
      helpers: {
        compactCourseText,
        countableCredits,
        getCourseCategory,
        isHomeDepartmentCourse,
        matchesAnyName,
        sortCoursesChronologically,
      },
    });
  }, [courses, plantPathologyRequiredProfessionalRequirement, requirementProfile]);

  const plantPathologyOtherGraduationRequirement = useMemo(() => {
    return getPlantPathologyOtherGraduationRequirement({
      courses,
      requirementProfile,
      usedCourses: [
        ...(plantPathologyGeneralEducationRequirement?.courses ?? []),
        ...(plantPathologyRequiredProfessionalRequirement?.acceptedCourses ?? []),
        ...(plantPathologyProfessionalElectiveRequirement?.acceptedCourses ?? []),
      ],
      helpers: {
        compactCourseText,
        countableCredits,
        getCourseCategory,
        isHomeDepartmentCourse,
        matchesAnyName,
        sortCoursesChronologically,
      },
    });
  }, [courses, plantPathologyGeneralEducationRequirement, plantPathologyProfessionalElectiveRequirement, plantPathologyRequiredProfessionalRequirement, requirementProfile]);

  const dfllRequirementAudits = useMemo(() => {
    return getDfllRequirementAudits({
      admissionYear,
      choiceRequirementViews,
      courses,
      primaryExternalCredits: primaryCreditAudit.externalCredits,
      requirementProfile,
      studentStatus,
      helpers: {
        compactCourseText,
        countableCredits,
        getChoiceRequirementOption,
        getCourseCategory,
        getSemesterTerm,
        isHomeDepartmentCourse,
        matchesAnyName,
        sortCoursesChronologically,
      },
    });
  }, [admissionYear, choiceRequirementViews, courses, primaryCreditAudit.externalCredits, requirementProfile, studentStatus]);

  const dfllRequirementRows = useMemo(() => getDfllRequirementRows(dfllRequirementAudits), [dfllRequirementAudits]);

  const selectedDfllRequirementRow = dfllRequirementRows.find((row) => row.id === selectedDfllRequirementDetail);
  const primaryRequirementsFulfilled = (() => {
    const languageDone = languageLiteracyRequirements.every((requirement) => requirement.completed >= requirement.requiredCredits);
    const nonGraduationDone = !nonGraduationRequirement || nonGraduationRequirement.done;
    const choiceRequirementsDone = choiceRequirementViews.every((view) => Boolean(view.completedOption));
    const mechanicalCoreDone = !mechanicalCoreRequirement || mechanicalCoreRequirement.completed >= mechanicalCoreRequirement.required;
    const mechanicalGeneralEducationDone =
      !mechanicalGeneralEducationRequirement ||
      (
        mechanicalGeneralEducationRequirement.completed >= mechanicalGeneralEducationRequirement.required &&
        mechanicalGeneralEducationRequirement.subRequirements.every((requirement) =>
          requirement.done === undefined ? requirement.completed >= requirement.required : requirement.done,
        )
      );
    const mechanicalRequiredProfessionalDone =
      !mechanicalRequiredProfessionalRequirement ||
      mechanicalRequiredProfessionalRequirement.completed >= mechanicalRequiredProfessionalRequirement.required;
    const mechanicalProfessionalElectiveDone =
      !mechanicalProfessionalElectiveRequirement ||
      (
        mechanicalProfessionalElectiveRequirement.completed >= mechanicalProfessionalElectiveRequirement.required &&
        mechanicalProfessionalElectiveRequirement.subRequirements.every((requirement) => {
          const creditsDone = requirement.completed >= requirement.required;
          const courseCountDone =
            requirement.requiredCourseCount === undefined ||
            (requirement.courseCount ?? 0) >= requirement.requiredCourseCount;
          const groupsDone =
            requirement.groupRequirements === undefined ||
            requirement.groupRequirements.every((group) => group.completed >= group.required);
          return creditsDone && courseCountDone && groupsDone;
        })
      );
    const mechanicalAdditionalCollegeDone =
      !mechanicalAdditionalCollegeRequirement ||
      mechanicalAdditionalCollegeRequirement.completed >= mechanicalAdditionalCollegeRequirement.required;
    const plantPathologyGeneralEducationDone =
      !plantPathologyGeneralEducationRequirement ||
      (
        plantPathologyGeneralEducationRequirement.completed >= plantPathologyGeneralEducationRequirement.required &&
        plantPathologyGeneralEducationRequirement.subRequirements.every((requirement) =>
          requirement.done === undefined ? requirement.completed >= requirement.required : requirement.done,
        )
      );
    const plantPathologyRequiredProfessionalDone =
      !plantPathologyRequiredProfessionalRequirement ||
      (
        plantPathologyRequiredProfessionalRequirement.completed >= plantPathologyRequiredProfessionalRequirement.required &&
        plantPathologyRequiredProfessionalRequirement.choiceRequirements.every((requirement) =>
          requirement.completedCourseCount >= requirement.requiredCourseCount,
        )
      );
    const plantPathologyProfessionalElectiveDone =
      !plantPathologyProfessionalElectiveRequirement ||
      plantPathologyProfessionalElectiveRequirement.completed >= plantPathologyProfessionalElectiveRequirement.required;
    const plantPathologyOtherGraduationDone =
      !plantPathologyOtherGraduationRequirement ||
      plantPathologyOtherGraduationRequirement.completed >= plantPathologyOtherGraduationRequirement.required;
    const baseRequirementsDone =
      languageDone &&
      nonGraduationDone &&
      choiceRequirementsDone &&
      mechanicalCoreDone &&
      mechanicalGeneralEducationDone &&
      mechanicalRequiredProfessionalDone &&
      mechanicalProfessionalElectiveDone &&
      mechanicalAdditionalCollegeDone &&
      plantPathologyGeneralEducationDone &&
      plantPathologyRequiredProfessionalDone &&
      plantPathologyProfessionalElectiveDone &&
      plantPathologyOtherGraduationDone;
    if (!dfllRequirementAudits) return baseRequirementsDone;

    const dfllDone =
      dfllRequirementAudits.core.completed >= dfllRequirementAudits.core.required &&
      dfllRequirementAudits.info.completed >= dfllRequirementAudits.info.required &&
      dfllRequirementAudits.humanities.completedCourses >= 1 &&
      dfllRequirementAudits.social.completedCourses >= 1 &&
      dfllRequirementAudits.natural.completedCourses >= 1 &&
      dfllRequirementAudits.humanSocialNaturalCredits >= 6 &&
      dfllRequirementAudits.comprehensive.completed >= dfllRequirementAudits.comprehensive.required &&
      dfllRequirementAudits.digitalHumanities.completed >= dfllRequirementAudits.digitalHumanities.required &&
      dfllRequirementAudits.collegeEmi.completed >= dfllRequirementAudits.collegeEmi.required &&
      dfllRequirementAudits.requiredProfessional.completed >= dfllRequirementAudits.requiredProfessional.required &&
      dfllRequirementAudits.britishAmericanLiterature.completed >= dfllRequirementAudits.britishAmericanLiterature.required &&
      dfllRequirementAudits.professionalElective.completed >= dfllRequirementAudits.professionalElective.required &&
      (!dfllRequirementAudits.professionalElectiveIfNoExternal.enabled ||
        dfllRequirementAudits.professionalElectiveIfNoExternal.completed >= dfllRequirementAudits.professionalElectiveIfNoExternal.required);

    return baseRequirementsDone && dfllDone;
  })();
  const primaryStatusIncomplete = primaryRemaining > 0 || !primaryRequirementsFulfilled;

  const updateTranscript = (nextCourses: TranscriptCourse[]) => {
    setTranscript({
      courses: nextCourses,
      rawText: "",
      profile: { name: "", department: selectedDepartment, studentStatus, admissionYear },
      plans,
    });
  };

  const updateCourse = (index: number, field: keyof TranscriptCourse, value: string) => {
    const nextCourses = courses.map((course, courseIndex) => {
      if (courseIndex !== index) return course;
      return {
        ...course,
        [field]:
          field === "credits"
            ? Number(value)
            : field === "grade"
              ? normalizeGrade(value)
            : field === "emi"
              ? value === "true"
              : field === "genEdProfessorFromMajorDepartment"
                ? value === "true"
                : field === "type"
                  ? value
                  : value,
        ...(field === "type" ? { typeLabel: typeLabels[value] ?? value } : {}),
      };
    });
    const changedCourse = nextCourses[index];
    const duplicateKey = changedCourse ? getDuplicateKey(changedCourse) : "";
    const hasDuplicate =
      duplicateKey &&
      nextCourses.some((course, courseIndex) => courseIndex !== index && getDuplicateKey(course) === duplicateKey);
    if (hasDuplicate && changedCourse) {
      setPasteMessage(`「${getCourseDisplayName(changedCourse)}」已經加入過，重複修習課程不會採計學分，因此不接受重複輸入。`);
      return;
    }
    updateTranscript(nextCourses);
  };

  const addCourse = () => {
    updateTranscript([...courses, { ...emptyCourse(), semester: pasteSemester }]);
  };

  const removeCourse = (index: number) => {
    updateTranscript(courses.filter((_, courseIndex) => courseIndex !== index));
  };

  const exportCoursesAsPlainText = () => {
    const cleanCell = (value: string | number | boolean) => String(value).replace(/\s+/g, " ").trim();
    const headers = [
      "選課號碼",
      "學期",
      "課程別",
      "課程名稱",
      "學分",
      "分數",
      "成績",
      "分類",
      "開課系所",
      "EMI",
      "通識本系教師",
      "採計",
      "備註",
    ];
    const rows = chronologicalCourseRows.map(({ course }) => {
      const creditStatus = getCourseCreditStatus(course);
      const plan = plans.find((item) => item.id === (course.planId || defaultPlanId));
      return [
        course.courseNo,
        course.semester || "未選",
        course.typeLabel || typeLabels[course.type] || course.type || "未分類",
        course.name,
        course.credits,
        getScoreDisplay(course),
        course.grade,
        getCourseCategory(course, requirementProfile),
        course.offeredBy,
        course.emi ? "Y" : "N",
        course.genEdProfessorFromMajorDepartment ? "是" : "否",
        plan?.name ?? "",
        creditStatus.note,
      ].map(cleanCell).join("\t");
    });
    const text = [headers.join("\t"), ...rows].join("\r\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nchu-courses-${admissionYear}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAdmissionYearChange = (year: number) => {
    const safeYear = supportedAdmissionYears.includes(year) ? year : supportedAdmissionYears[0] ?? firstSupportedAdmissionYear;
    const nextSemesterOptions = getSemesterOptions(safeYear);
    setAdmissionYear(safeYear);
    setPasteSemester(nextSemesterOptions[0]);
    const nextCourses = courses.map((course) =>
      nextSemesterOptions.includes(course.semester) ? course : { ...course, semester: "" },
    );
    const nextPlans = plans.map((plan) => (plan.id === defaultPlanId ? { ...plan, admissionYear: safeYear } : plan));
    setTranscript({
      courses: nextCourses,
      rawText: "",
      profile: { name: "", department: selectedDepartment, studentStatus, admissionYear: safeYear },
      plans: nextPlans,
    });
  };

  const addProgramPlan = (programId: string) => {
    const program = optionalProgramPlans.find((plan) => plan.id === programId);
    if (!program || plans.some((plan) => plan.id === program.id)) return;
    setPlans([...plans, program]);
  };

  const updatePlan = (id: string, field: keyof RequirementPlan, value: string) => {
    setPlans(
      plans.map((plan) =>
        plan.id === id
          ? {
            ...plan,
            [field]: field === "requiredCredits" ? Number(value) : value,
          }
          : plan,
      ),
    );
  };

  const removePlan = (id: string) => {
    if (id === defaultPlanId) return;
    const nextPlans = plans.filter((plan) => plan.id !== id);
    const nextCourses = courses.map((course) => (course.planId === id ? { ...course, planId: defaultPlanId } : course));
    setTranscript({
      courses: nextCourses,
      rawText: "",
      profile: { name: "", department: selectedDepartment, studentStatus, admissionYear },
      plans: nextPlans,
    });
  };

  const importPaste = () => {
    const imported = parsePastedCourses(pasteText, requirementProfile);
    if (imported.length === 0) {
      setPasteMessage("沒有讀到可匯入的課程。請複製 學生歷年成績查詢 的內容。");
      return;
    }
    const importedWithSemester = imported.map((course) => ({ ...course, semester: course.semester || pasteSemester }));
    const existingKeys = new Set(courses.map(getDuplicateKey).filter(Boolean));
    const accepted: TranscriptCourse[] = [];
    const duplicateNames: string[] = [];
    const seenImportKeys = new Set<string>();

    for (const course of importedWithSemester) {
      const key = getDuplicateKey(course);
      if (key && (existingKeys.has(key) || seenImportKeys.has(key))) {
        duplicateNames.push(getCourseDisplayName(course));
        continue;
      }
      if (key) seenImportKeys.add(key);
      accepted.push(course);
    }

    if (accepted.length === 0) {
      setPasteMessage(`沒有匯入新課程，因為貼上的課程都已經加入過：${duplicateNames.join("、")}`);
      return;
    }

    updateTranscript([...courses, ...accepted]);
    setPasteText("");
    setPasteMessage(
      `已匯入 ${accepted.length} 門課。${
        duplicateNames.length > 0 ? ` 已略過 ${duplicateNames.length} 門重複課程：${duplicateNames.join("、")}。` : ""
      }`,
    );
  };

  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
    const match = allDepartments.find((dept) => dept.name === department);
    const nextSupportedAdmissionYears = match?.supportedAdmissionYears ?? [match?.admissionYear ?? admissionYear];
    const nextAdmissionYear = nextSupportedAdmissionYears.includes(admissionYear)
      ? admissionYear
      : nextSupportedAdmissionYears[0] ?? match?.admissionYear ?? admissionYear;
    const nextSemesterOptions = getSemesterOptions(nextAdmissionYear);
    setAdmissionYear(nextAdmissionYear);
    setPasteSemester(nextSemesterOptions[0]);
    const nextCourses = courses.map((course) =>
      nextSemesterOptions.includes(course.semester) ? course : { ...course, semester: "" },
    );
    const nextPlans = plans.map((plan) =>
      plan.id === defaultPlanId
        ? {
          ...plan,
          name: department || "主修",
          requiredCredits: match?.credits ?? 128,
          source: match ? "catalog" : "custom",
          admissionYear: nextAdmissionYear,
          sourceUrl: match?.sourceUrl,
          notes: match?.notes,
          manualChecks: match?.manualChecks,
        }
        : plan,
    );
    setPlans(nextPlans);
    setTranscript({
      courses: nextCourses,
      rawText: "",
      profile: { name: "", department, studentStatus, admissionYear: nextAdmissionYear },
      plans: nextPlans,
    });
  };

  return (
    <div className="mx-auto max-w-[1600px] px-3 py-3 pb-24 sm:px-4 sm:py-4 lg:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4 sm:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500">
            <Calculator className="text-white" size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-gray-900 dark:text-white sm:text-xl">剩餘學分計算</h1>
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
              {selectedDepartment || "未選擇系所"} / {admissionYear} 入學
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:px-3">
          <span className="font-medium text-gray-900 dark:text-white">{primaryCompleted}</span>
          <span>/ {primaryPlan?.requiredCredits ?? 128} 學分</span>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          <div className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800 sm:p-4">
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">主修系所</label>
            <select
              value={selectedDepartment}
              onChange={(event) => handleDepartmentChange(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
            >
              {Object.entries(departmentCredits).map(([college, departments]) => (
                <optgroup key={college} label={college}>
                  {departments.map((department) => (
                    <option key={department.name} value={department.name}>
                      {department.name} / {department.credits} 學分
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">入學學年度</label>
                <select
                  value={admissionYear}
                  onChange={(event) => handleAdmissionYearChange(Number(event.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
                >
                  {supportedAdmissionYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">學生身分</label>
                <select
                  value={studentStatus}
                  onChange={(event) => {
                    const nextStatus = event.target.value as "local" | "foreign";
                    setStudentStatus(nextStatus);
                    setTranscript({
                      courses,
                      rawText: "",
                      profile: { name: "", department: selectedDepartment, studentStatus: nextStatus, admissionYear },
                      plans,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
                >
                  <option value="local">本國生</option>
                  <option value="foreign">{isDfllProfile(requirementProfile) ? "外籍生（資訊素養免修）" : "外籍生"}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800 sm:p-4">
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">畢業條件方案</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">主修來自系所總學分；學程可依需要加入。</p>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:items-center lg:justify-end">
                <select
                  value={selectedProgramPlanId}
                  onChange={(event) => setSelectedProgramPlanId(event.target.value)}
                  className="min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  aria-label="選擇學程"
                >
                  {optionalProgramPlans.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => addProgramPlan(selectedProgramPlanId)}
                  disabled={!selectedProgramPlanId || plans.some((plan) => plan.id === selectedProgramPlanId)}
                  className="min-h-10 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 active:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200 dark:active:bg-gray-700"
                >
                  加學程
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {plans.map((plan) => (
                <div key={plan.id} className="grid gap-2 rounded-lg border border-gray-100 p-2 dark:border-gray-700 sm:grid-cols-[90px_minmax(0,1fr)_90px_36px] sm:items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{planTypeLabels[plan.type]}</span>
                  <input
                    value={plan.name}
                    disabled={plan.id === defaultPlanId}
                    onChange={(event) => updatePlan(plan.id, "name", event.target.value)}
                    className="min-w-0 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
                  />
                  <input
                    type="number"
                    min="0"
                    value={plan.requiredCredits || ""}
                    onChange={(event) => updatePlan(plan.id, "requiredCredits", event.target.value)}
                    className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => removePlan(plan.id)}
                    disabled={plan.id === defaultPlanId}
                    aria-label="移除方案"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 active:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:active:bg-gray-700"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardPaste size={18} className="text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">貼上課程資料</p>
            </div>
            <textarea
              value={pasteText}
              onChange={(event) => setPasteText(event.target.value)}
              placeholder="貼上手機或電腦複製的歷年成績內容"
              className="min-h-44 w-full resize-y px-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base leading-6 transition-colors sm:min-h-28 sm:py-2 sm:text-sm"
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-[auto_auto_minmax(0,1fr)] sm:items-center">
              <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300 sm:inline-flex sm:items-center sm:gap-2">
                <span>貼上課程學期</span>
                <select
                  value={pasteSemester}
                  onChange={(event) => setPasteSemester(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:w-auto sm:px-2 sm:py-1.5 sm:text-sm"
                >
                  {semesterOptions.map((semester) => (
                    <option key={semester} value={semester}>{semester}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={importPaste}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white active:bg-blue-700 dark:bg-blue-500 dark:active:bg-blue-600 sm:w-auto"
              >
                <ClipboardPaste size={16} />
                匯入貼上的課程
              </button>
              {pasteMessage && (
                <p className="min-w-0 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-900/50 dark:text-gray-300">
                  {pasteMessage}
                </p>
              )}
            </div>
          </div>

          <CourseTable
            addCourse={addCourse}
            chronologicalCourseRows={chronologicalCourseRows}
            courses={courses}
            exportCoursesAsPlainText={exportCoursesAsPlainText}
            getCourseCreditStatus={getCourseCreditStatus}
            plans={plans}
            removeCourse={removeCourse}
            requirementProfile={requirementProfile}
            semesterOptions={semesterOptions}
            updateCourse={updateCourse}
          />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <div
            className={`rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg ${
              primaryStatusIncomplete
                ? "from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700"
                : "from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700"
            }`}
          >
            <div className="flex items-center justify-center mb-4">
              <GraduationCap size={32} className="opacity-90" />
            </div>
            <div className="text-center mb-4">
              <p className="text-xs opacity-75 mb-1">{selectedDepartment || "未選擇系所"}</p>
              <p className="text-sm opacity-90 mb-1">主修剩餘學分</p>
              <p className="text-5xl font-bold">{primaryRemaining}</p>
            </div>
            <div className={`w-full rounded-full h-2 mb-2 ${primaryStatusIncomplete ? "bg-orange-400/30" : "bg-blue-400/30"}`}>
              <div className="bg-white rounded-full h-2 transition-all duration-300" style={{ width: `${primaryProgress}%` }} />
            </div>
            <div className="flex justify-between text-xs opacity-90">
              <span>已完成 {primaryCompleted} 學分</span>
              <span>{primaryProgress.toFixed(1)}%</span>
            </div>
          </div>

          <div className="space-y-3">
            {planProgress.map((plan) => (
              <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <button
                  type="button"
                  onClick={() => setSelectedPlanDetail((current) => (current === plan.id ? "" : plan.id))}
                  className={`mb-2 flex w-full items-start justify-between gap-3 rounded-md text-left transition-colors ${
                    selectedPlanDetail === plan.id ? "bg-blue-50 p-2 dark:bg-blue-950/40" : ""
                  }`}
                >
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{planTypeLabels[plan.type]}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{plan.name}</p>
                    {(plan.admissionYear || plan.id === defaultPlanId) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{plan.id === defaultPlanId ? admissionYear : plan.admissionYear} 學年度適用</p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{plan.remaining} 缺</p>
                </button>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 mb-2">
                  <div className="h-2 rounded-full bg-blue-600 dark:bg-blue-400" style={{ width: `${plan.progress}%` }} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {plan.completed} / {plan.requiredCredits} 學分
                </p>
                {plan.id === digitalHumanitiesProgramId && (
                  <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <p>非原主修/雙主修必修：{plan.nonRequiredCredits} / 6 學分</p>
                  </div>
                )}
                {getProgramCourseRules(plan.id).length > 0 && plan.unrecognizedCourses.length > 0 && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    {plan.unrecognizedCourses.length} 門課未列入學程採計或為抵免課程
                  </p>
                )}
                {selectedPlanDetail === plan.id && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">已採計課程</p>
                    {plan.countedCourses.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">目前沒有採計到這個方案的課程。</p>
                    ) : (
                      plan.countedCourses.map((course, index) => {
                        const isNonRequiredProgramCourse =
                          plan.id === digitalHumanitiesProgramId &&
                          !isDfllRequiredCourseForProgramRule(course, admissionYear, studentStatus, fallbackRequirementProfile, {
                            compactCourseText,
                            getCourseCategory,
                            matchesAnyName,
                          });
                        return (
                          <div
                            key={`${course.courseNo}-${course.name}-${course.semester}-${index}`}
                            className="rounded-md border border-gray-100 p-3 text-sm dark:border-gray-700"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-medium text-gray-900 dark:text-white">{course.name || "未命名課程"}</p>
                              <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                                {countableCredits(course, requirementProfile)} 學分
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {course.semester || "未選學期"}{course.offeredBy ? ` / ${course.offeredBy}` : ""}
                            </p>
                            {isNonRequiredProgramCourse && (
                              <p className="mt-1 text-xs text-green-700 dark:text-green-300">列入非原主修/雙主修必修學分</p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
                {plan.notes && plan.notes.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-300">規則備註</summary>
                    <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      {plan.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </details>
                )}
                {plan.manualChecks && plan.manualChecks.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-300">需人工核對</summary>
                    <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      {plan.manualChecks.map((check) => (
                        <li key={check}>{check}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ))}
          </div>

          {languageLiteracyRequirements.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">必修</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">語言素養課程</p>
              </div>
              <div className="space-y-3">
                {languageLiteracyRequirements.map((requirement) => (
                  <div key={requirement.name}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{requirement.name}</span>
                      <span className={`text-xs font-medium ${requirement.remaining === 0 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                        {requirement.completed} / {requirement.requiredCredits} 學分
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                      <div className="h-2 rounded-full bg-green-600 dark:bg-green-400" style={{ width: `${requirement.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">成績為「抵」的課程會採計學分，但不列入 GPA。</p>
            </div>
          )}

          {choiceRequirementViews.map(({ requirement, options, completedOption }) => (
            <div key={requirement.title} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{requirementProfile.departmentName}必修</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{requirement.title}</p>
                </div>
                <p className={`text-sm font-semibold ${completedOption ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                  {completedOption ? `${completedOption.label}已達標` : `任一項${requirement.requiredCredits}學分`}
                </p>
              </div>
              <div className="space-y-3">
                {options.map((option) => (
                  <div key={option.id}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                      <span className={`text-xs font-medium ${option.remaining === 0 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                        {option.completed} / {requirement.requiredCredits} 學分
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                      <div className="h-2 rounded-full bg-green-600 dark:bg-green-400" style={{ width: `${option.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{requirement.description}</p>
            </div>
          ))}

          {mechanicalGeneralEducationRequirement && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">機械系114學年度</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">通識課程</p>
                </div>
                <p className={`text-sm font-semibold ${mechanicalGeneralEducationRequirement.remaining === 0 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                  {mechanicalGeneralEducationRequirement.completed} / {mechanicalGeneralEducationRequirement.required} 學分
                </p>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <div className="h-2 rounded-full bg-green-600 dark:bg-green-400" style={{ width: `${mechanicalGeneralEducationRequirement.progress}%` }} />
              </div>
              <div className="mt-3 space-y-3">
                {mechanicalGeneralEducationRequirement.subRequirements.map((requirement) => {
                  const done = requirement.done === undefined ? requirement.completed >= requirement.required : requirement.done;
                  return (
                    <div key={requirement.id}>
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{requirement.label}</p>
                          {requirement.detail && <p className="text-xs text-gray-500 dark:text-gray-400">{requirement.detail}</p>}
                        </div>
                        <span className={`shrink-0 text-xs font-medium ${done ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                          {requirement.completed} / {requirement.required}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                        <div
                          className="h-1.5 rounded-full bg-green-600 dark:bg-green-400"
                          style={{ width: `${Math.min((requirement.completed / requirement.required) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {mechanicalCoreRequirement && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">機械系114學年度</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">核心素養課程</p>
                </div>
                <p className={`text-sm font-semibold ${mechanicalCoreRequirement.remaining === 0 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                  {mechanicalCoreRequirement.completed} / {mechanicalCoreRequirement.required} 學分
                </p>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <div className="h-2 rounded-full bg-green-600 dark:bg-green-400" style={{ width: `${mechanicalCoreRequirement.progress}%` }} />
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                「資訊素養：程式設計與AI應用」免修；若修習，不採計為通識畢業學分。
              </p>
              {mechanicalCoreRequirement.courses.length > 0 && (
                <div className="mt-3 space-y-2">
                  {mechanicalCoreRequirement.courses.map((course, index) => (
                    <div
                      key={`${course.courseNo}-${course.name}-${course.semester}-${index}`}
                      className="rounded-md border border-gray-100 p-3 text-sm dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-gray-900 dark:text-white">{course.name || "未命名課程"}</p>
                        <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{countableCredits(course, requirementProfile)} 學分</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {course.semester || "未選學期"}{course.offeredBy ? ` / ${course.offeredBy}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {mechanicalRequiredProfessionalRequirement && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">機械系114學年度</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">系專業必修課程</p>
                </div>
                <p className={`text-sm font-semibold ${mechanicalRequiredProfessionalRequirement.remaining === 0 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                  {mechanicalRequiredProfessionalRequirement.completed} / {mechanicalRequiredProfessionalRequirement.required} 學分
                </p>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <div className="h-2 rounded-full bg-green-600 dark:bg-green-400" style={{ width: `${mechanicalRequiredProfessionalRequirement.progress}%` }} />
              </div>
              <div className="mt-3 space-y-2">
                {mechanicalRequiredProfessionalRequirement.courseRequirements.map((requirement) => (
                  <div key={requirement.name}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{requirement.name}</span>
                      <span className={`text-xs font-medium ${requirement.remaining === 0 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                        {requirement.completed} / {requirement.requiredCredits}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                      <div
                        className="h-1.5 rounded-full bg-green-600 dark:bg-green-400"
                        style={{ width: `${Math.min((requirement.completed / requirement.requiredCredits) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mechanicalProfessionalElectiveRequirement && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">機械系114學年度</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">系專業選修課程</p>
                </div>
                <p className={`text-sm font-semibold ${mechanicalProfessionalElectiveRequirement.remaining === 0 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                  {mechanicalProfessionalElectiveRequirement.completed} / {mechanicalProfessionalElectiveRequirement.required} 學分
                </p>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <div className="h-2 rounded-full bg-green-600 dark:bg-green-400" style={{ width: `${mechanicalProfessionalElectiveRequirement.progress}%` }} />
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                目前採計主修方案中由機械系開課、分類為專業課程，且不在74學分系專業必修清單內的課程。
              </p>
              <div className="mt-3 space-y-3">
                {mechanicalProfessionalElectiveRequirement.subRequirements.map((requirement) => (
                  <div key={requirement.id}>
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{requirement.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{requirement.description}</p>
                      </div>
                      <span className={`shrink-0 text-xs font-medium ${requirement.completed >= requirement.required ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                        {requirement.completed} / {requirement.required}
                        {requirement.requiredCourseCount !== undefined && `，${requirement.courseCount ?? 0} / ${requirement.requiredCourseCount} 門`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                      <div
                        className="h-1.5 rounded-full bg-green-600 dark:bg-green-400"
                        style={{ width: `${Math.min((requirement.completed / requirement.required) * 100, 100)}%` }}
                      />
                    </div>
                    {requirement.groupRequirements && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {requirement.groupRequirements.map((group) => (
                          <div key={group.id} className="rounded-md bg-gray-50 px-2 py-1.5 text-xs dark:bg-gray-900/40">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-gray-600 dark:text-gray-400">{group.label}</span>
                              <span className={group.completed >= group.required ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}>
                                {group.completed} / {group.required}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {mechanicalProfessionalElectiveRequirement.courses.length > 0 && (
                <div className="mt-3 space-y-2">
                  {mechanicalProfessionalElectiveRequirement.courses.map((course, index) => (
                    <div
                      key={`${course.courseNo}-${course.name}-${course.semester}-${index}`}
                      className="rounded-md border border-gray-100 p-3 text-sm dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-gray-900 dark:text-white">{course.name || "未命名課程"}</p>
                        <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{countableCredits(course, requirementProfile)} 學分</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {course.semester || "未選學期"}{course.offeredBy ? ` / ${course.offeredBy}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {mechanicalAdditionalCollegeRequirement && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">機械系114學年度</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">其餘9學分</p>
                </div>
                <p className={`text-sm font-semibold ${mechanicalAdditionalCollegeRequirement.remaining === 0 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                  {mechanicalAdditionalCollegeRequirement.completed} / {mechanicalAdditionalCollegeRequirement.required} 學分
                </p>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <div className="h-2 rounded-full bg-green-600 dark:bg-green-400" style={{ width: `${mechanicalAdditionalCollegeRequirement.progress}%` }} />
              </div>
              <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <p>限理學院、工學院（含本系）、電資學院修習。</p>
                <p>B 基礎選修超修：{mechanicalAdditionalCollegeRequirement.basicOverageCredits} 學分</p>
                <p>C 專業選修學群超修：{mechanicalAdditionalCollegeRequirement.groupedOverageCredits} 學分</p>
                <p>一般/其他符合學院限制課程：{mechanicalAdditionalCollegeRequirement.generalCredits} 學分</p>
              </div>
              {mechanicalAdditionalCollegeRequirement.generalCourses.length > 0 && (
                <div className="mt-3 space-y-2">
                  {mechanicalAdditionalCollegeRequirement.generalCourses.map((course, index) => (
                    <div
                      key={`${course.courseNo}-${course.name}-${course.semester}-${index}`}
                      className="rounded-md border border-gray-100 p-3 text-sm dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-gray-900 dark:text-white">{course.name || "未命名課程"}</p>
                        <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{countableCredits(course, requirementProfile)} 學分</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {course.semester || "未選學期"}{course.offeredBy ? ` / ${course.offeredBy}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {plantPathologyGeneralEducationRequirement && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">植物病理學系114學年度</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">通識課程</p>
                </div>
                <p className={`text-sm font-semibold ${plantPathologyGeneralEducationRequirement.remaining === 0 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                  {plantPathologyGeneralEducationRequirement.completed} / {plantPathologyGeneralEducationRequirement.required} 學分
                </p>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <div className="h-2 rounded-full bg-green-600 dark:bg-green-400" style={{ width: `${plantPathologyGeneralEducationRequirement.progress}%` }} />
              </div>
              <div className="mt-3 space-y-3">
                {plantPathologyGeneralEducationRequirement.subRequirements.map((requirement) => {
                  const done = requirement.done === undefined ? requirement.completed >= requirement.required : requirement.done;
                  return (
                    <div key={requirement.id}>
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{requirement.label}</p>
                          {requirement.detail && <p className="text-xs text-gray-500 dark:text-gray-400">{requirement.detail}</p>}
                        </div>
                        <span className={`shrink-0 text-xs font-medium ${done ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                          {requirement.completed} / {requirement.required}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                        <div
                          className="h-1.5 rounded-full bg-green-600 dark:bg-green-400"
                          style={{ width: `${requirement.required === 0 ? 100 : Math.min((requirement.completed / requirement.required) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                國防教育、生命科學學群通識至多各採計1門；超修通識不採計為外系學分。
              </p>
            </div>
          )}

          {plantPathologyRequiredProfessionalRequirement && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">植物病理學系114學年度</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">系專業必修課程</p>
                </div>
                <p className={`text-sm font-semibold ${plantPathologyRequiredProfessionalRequirement.remaining === 0 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                  {plantPathologyRequiredProfessionalRequirement.completed} / {plantPathologyRequiredProfessionalRequirement.required} 學分
                </p>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <div className="h-2 rounded-full bg-green-600 dark:bg-green-400" style={{ width: `${plantPathologyRequiredProfessionalRequirement.progress}%` }} />
              </div>
              <div className="mt-3 space-y-2">
                {plantPathologyRequiredProfessionalRequirement.fixedRequirements.map((requirement) => (
                  <div key={requirement.name}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{requirement.name}</span>
                      <span className={`text-xs font-medium ${requirement.remaining === 0 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                        {requirement.completed} / {requirement.requiredCredits}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                      <div
                        className="h-1.5 rounded-full bg-green-600 dark:bg-green-400"
                        style={{ width: `${Math.min((requirement.completed / requirement.requiredCredits) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {plantPathologyRequiredProfessionalRequirement.choiceRequirements.map((requirement) => (
                  <div key={requirement.id}>
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{requirement.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">必修 {requirement.requiredCourseCount} 科</p>
                      </div>
                      <span className={`shrink-0 text-xs font-medium ${requirement.completedCourseCount >= requirement.requiredCourseCount ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                        {requirement.completed} 學分，{requirement.completedCourseCount} / {requirement.requiredCourseCount} 科
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-xs text-gray-500 dark:text-gray-400">
                      {requirement.options.map((option) => (
                        <span key={option.name}>{option.name}: {option.completed} / {option.requiredCredits}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {plantPathologyProfessionalElectiveRequirement && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">植物病理學系114學年度</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">系專業選修課程</p>
                </div>
                <p className={`text-sm font-semibold ${plantPathologyProfessionalElectiveRequirement.remaining === 0 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                  {plantPathologyProfessionalElectiveRequirement.completed} / {plantPathologyProfessionalElectiveRequirement.required} 學分
                </p>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <div className="h-2 rounded-full bg-green-600 dark:bg-green-400" style={{ width: `${plantPathologyProfessionalElectiveRequirement.progress}%` }} />
              </div>
              <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <p>本系專業選修：{plantPathologyProfessionalElectiveRequirement.homeCredits} 學分</p>
                <p>外系專業選修採計：{plantPathologyProfessionalElectiveRequirement.acceptedExternalCredits} / 20 學分</p>
                {plantPathologyProfessionalElectiveRequirement.externalOverLimit > 0 && (
                  <p className="text-red-600 dark:text-red-300">外系學分超出 {plantPathologyProfessionalElectiveRequirement.externalOverLimit} 學分未採計。</p>
                )}
              </div>
            </div>
          )}

          {plantPathologyOtherGraduationRequirement && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">植物病理學系114學年度</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">其餘畢業學分</p>
                </div>
                <p className={`text-sm font-semibold ${plantPathologyOtherGraduationRequirement.remaining === 0 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                  {plantPathologyOtherGraduationRequirement.completed} / {plantPathologyOtherGraduationRequirement.required} 學分
                </p>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <div className="h-2 rounded-full bg-green-600 dark:bg-green-400" style={{ width: `${plantPathologyOtherGraduationRequirement.progress}%` }} />
              </div>
            </div>
          )}

          {dfllRequirementAudits && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">外文系111/112學年度</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">通識與專業需求檢查</p>
              </div>
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                {dfllRequirementRows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelectedDfllRequirementDetail((current) => (current === row.id ? "" : row.id))}
                    className={`flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left transition-colors ${
                      selectedDfllRequirementDetail === row.id
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        : "active:bg-gray-50 dark:active:bg-gray-700"
                    }`}
                  >
                    <span>{row.label}</span>
                    <span className="text-right">{row.summary}</span>
                  </button>
                ))}
              </div>
              {selectedDfllRequirementRow && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{selectedDfllRequirementRow.label} 課程</p>
                  {selectedDfllRequirementRow.courses.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">目前沒有符合此需求的課程。</p>
                  ) : (
                    sortCoursesChronologically(selectedDfllRequirementRow.courses).map((course, index) => {
                      const creditStatus = getCourseCreditStatus(course);
                      const isBritishAmericanLiteratureOverflow =
                        selectedDfllRequirementRow.id === "british-american-literature" &&
                        dfllRequirementAudits.britishAmericanLiterature.overflowCourses.includes(course);
                      const detailNote = isBritishAmericanLiteratureOverflow
                        ? "英美文學已達12學分，這門課改採計為系專業選修。"
                        : creditStatus.note;
                      return (
                      <div
                        key={`${course.courseNo}-${course.name}-${course.semester}-${index}`}
                        className={`rounded-md border p-3 text-sm ${
                          creditStatus.isUncounted || isBritishAmericanLiteratureOverflow
                            ? "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30"
                            : "border-gray-100 dark:border-gray-700"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium text-gray-900 dark:text-white">{course.name || "未命名課程"}</p>
                          <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{countableCredits(course, requirementProfile)} 學分</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {course.semester || "未選學期"}{course.offeredBy ? ` / ${course.offeredBy}` : ""}
                        </p>
                        {detailNote && <p className="mt-1 text-xs text-red-700 dark:text-red-300">{detailNote}</p>}
                      </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {requirementProfile.externalCreditLimit !== undefined && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setShowExternalCreditCourses((current) => !current)}
              className="mb-2 flex w-full items-start justify-between gap-3 text-left"
            >
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">上限</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">外系學分</p>
              </div>
              <p className={`text-sm font-semibold ${primaryCreditAudit.externalOverLimit > 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}>
                {primaryCreditAudit.acceptedExternalCredits} / {requirementProfile.externalCreditLimit} 學分
              </p>
            </button>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 mb-2">
              <div
                className={`h-2 rounded-full ${primaryCreditAudit.externalOverLimit > 0 ? "bg-red-600 dark:bg-red-400" : "bg-blue-600 dark:bg-blue-400"}`}
                style={{ width: `${Math.min((primaryCreditAudit.externalCredits / requirementProfile.externalCreditLimit) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              本系承認外系學分最多{requirementProfile.externalCreditLimit}學分{primaryCreditAudit.externalOverLimit > 0 ? `，目前有 ${primaryCreditAudit.externalOverLimit} 學分超出上限未計入主修總學分。` : "。"}
              {primaryCreditAudit.generalEducationOverflowCredits > 0 && ` 超修通識已採計 ${primaryCreditAudit.acceptedGeneralEducationOverflowCredits} / ${dfllGeneralEdOverflowExternalLimit} 學分。`}
            </p>
            {showExternalCreditCourses && (
              <div className="mt-3 space-y-2">
                {primaryCreditAudit.externalCourseAudits.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">目前沒有列入外系學分計算的課程。</p>
                ) : (
                  primaryCreditAudit.externalCourseAudits.map(({ course, credits, acceptedCredits, uncountedCredits }, index) => (
                    <div
                      key={`${course.courseNo}-${course.name}-${course.semester}-${index}`}
                      className={`rounded-md border p-3 text-sm ${
                        uncountedCredits > 0
                          ? "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30"
                          : "border-gray-100 dark:border-gray-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-gray-900 dark:text-white">{course.name || "未命名課程"}</p>
                        <span className={`shrink-0 text-xs font-medium ${uncountedCredits > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                          {acceptedCredits > 0 ? `採計 ${acceptedCredits}` : "不採計"} / {credits} 學分
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {course.semester || "未選學期"}{course.offeredBy ? ` / ${course.offeredBy}` : ""}{uncountedCredits > 0 ? ` / ${uncountedCredits} 學分超出上限` : ""}
                      </p>
                      {uncountedCredits > 0 && <p className="mt-1 text-xs text-red-700 dark:text-red-300">{getCourseCreditStatus(course).note}</p>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          )}

          {nonGraduationRequirement && nonGraduationRequirement.completed > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">不計畢業總學分</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{nonGraduationRequirement.title}</p>
                </div>
                <p className={`text-sm font-semibold ${nonGraduationRequirement.done ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                  {nonGraduationRequirement.done ? "已達標" : `${nonGraduationRequirement.requiredCourses - nonGraduationRequirement.completed} 門缺`}
                </p>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 mb-2">
                <div
                  className="h-2 rounded-full bg-green-600 dark:bg-green-400"
                  style={{
                    width: `${Math.min((nonGraduationRequirement.completed / nonGraduationRequirement.requiredCourses) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                已完成 {nonGraduationRequirement.completed} / {nonGraduationRequirement.requiredCourses} 門，保留在需求檢查中但不加進總學分。
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(groupedCredits).filter(([, credits]) => credits > 0).map(([groupName, credits]) => (
              <button
                key={groupName}
                type="button"
                onClick={() => setSelectedCategorySummary((current) => (current === groupName ? "" : groupName))}
                className={`rounded-lg border p-4 text-left shadow-sm transition-colors ${
                  selectedCategorySummary === groupName
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40"
                    : "border-gray-200 bg-white active:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:active:bg-gray-700"
                }`}
              >
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{groupName}</p>
                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{credits}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">學分</p>
              </button>
            ))}
          </div>

          {selectedCategorySummary && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedCategorySummary} 課程</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedCategoryCourses.length} 門</p>
              </div>
              <div className="space-y-2">
                {selectedCategoryCourses.map((course, index) => {
                  const creditStatus = getCourseCreditStatus(course);
                  return (
                  <div
                    key={`${course.courseNo}-${course.name}-${course.semester}-${index}`}
                    className={`rounded-md border p-3 text-sm ${
                      creditStatus.isUncounted
                        ? "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30"
                        : "border-gray-100 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-gray-900 dark:text-white">{course.name || "未命名課程"}</p>
                      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{course.semester || "未選學期"}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {course.credits} 學分 / {course.grade || "-"}{course.offeredBy ? ` / ${course.offeredBy}` : ""}
                    </p>
                    {creditStatus.note && <p className="mt-1 text-xs text-red-700 dark:text-red-300">{creditStatus.note}</p>}
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {courses.length > 0 && (
            <button
              type="button"
              onClick={clearTranscript}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 active:bg-gray-50 dark:active:bg-gray-700"
            >
              清空課程
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
