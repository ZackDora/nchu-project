import {
  dfllGeneralEdOverflowExternalLimit,
  isCommonEnglishCourse,
  isDfllCollegeEmiCourseForAdmissionYear,
  isDfllDepartmentRequirementCourse,
  isDfllDigitalHumanitiesCourseForAdmissionYear,
  isDfllProfile,
} from "./dfll";
import {
  getMechanicalAdditionalCollegeRequirement,
  getMechanicalGeneralEducationRequirement,
  getMechanicalProfessionalElectiveRequirement,
  getMechanicalRequiredProfessionalRequirement,
  isEngineeringTechnologyGeneralCourse,
  isMechanicalExcludedGeneralEducationCourse,
  isMechanicalProfile,
} from "./mechanical";
import {
  getPlantPathologyGeneralEducationRequirement,
  getPlantPathologyOtherGraduationRequirement,
  getPlantPathologyProfessionalElectiveRequirement,
  getPlantPathologyRequiredProfessionalRequirement,
  isPlantPathologyLifeScienceGeneralCourse,
  isPlantPathologyProfile,
} from "./plantPathology";
import {
  compactCourseText,
  countableCredits,
  getChoiceRequirementOption,
  getCourseCategory,
  isGeneralEducationCourse,
  isGeneralRequirementCategory,
  isHomeDepartmentCourse,
  isLiteratureCollegeGeneralCourse,
  matchesAnyName,
  sortCoursesChronologically,
} from "./courseUtils";
import type { TranscriptCourse } from "../context/TranscriptContext";
import { defaultPlanId, type RequirementProfile } from "../data/requirements";

export const getPrimaryCreditAudit = (courses: TranscriptCourse[], profile: RequirementProfile, studentStatus: "local" | "foreign", admissionYear: number) => {
  const countableCourses = sortCoursesChronologically(
    courses.filter((course) => course.planId === defaultPlanId && countableCredits(course, profile) > 0),
  );
  const choiceRequirementAudits = profile.choiceCreditRequirements.map((requirement) => {
    const optionCredits = Object.fromEntries(requirement.options.map((option) => [option.id, 0])) as Record<string, number>;

    for (const course of countableCourses) {
      const option = getChoiceRequirementOption(course, requirement);
      if (option) optionCredits[option.id] += countableCredits(course, profile);
    }

    const selectedOption = requirement.options
      .map((option) => ({ ...option, credits: optionCredits[option.id] }))
      .sort((a, b) => b.credits - a.credits)[0];

    return {
      requirement,
      optionCredits,
      selectedOptionId: selectedOption?.credits > 0 ? selectedOption.id : "",
      protectedCredits: Math.min(selectedOption?.credits ?? 0, requirement.requiredCredits),
    };
  });

  const remainingProtectedCredits = Object.fromEntries(
    choiceRequirementAudits.map((audit) => [audit.requirement.title, audit.protectedCredits]),
  ) as Record<string, number>;
  let baseCredits = 0;
  let externalCredits = 0;
  let generalEducationCredits = 0;
  let excludedCredits = 0;
  let nationalDefenseCoursesAccepted = 0;
  let literatureCollegeGeneralCoursesAccepted = 0;
  let engineeringTechnologyGeneralCoursesAccepted = 0;
  const externalCourseCandidates: { course: TranscriptCourse; credits: number }[] = [];
  const generalEducationCandidates: { course: TranscriptCourse; credits: number }[] = [];
  const uncountedCourseAudits: { course: TranscriptCourse; acceptedCredits: number; uncountedCredits: number; note: string }[] = [];

  const addUncountedCourseAudit = (course: TranscriptCourse, acceptedCredits: number, uncountedCredits: number, note: string) => {
    if (uncountedCredits <= 0) return;
    uncountedCourseAudits.push({ course, acceptedCredits, uncountedCredits, note });
  };

  for (const course of countableCourses) {
    const credits = countableCredits(course, profile);
    const category = getCourseCategory(course, profile);
    const isGeneralEducation = isGeneralEducationCourse(course, profile);

    if (isDfllProfile(profile) && isCommonEnglishCourse(course, compactCourseText)) {
      excludedCredits += credits;
      addUncountedCourseAudit(course, 0, credits, "外文系學生選修全校共同英文課程，不計入畢業學分。");
      continue;
    }

    if (isGeneralEducation) {
      if (course.genEdProfessorFromMajorDepartment) {
        excludedCredits += credits;
        addUncountedCourseAudit(course, 0, credits, "本系教師於通識中心所開課程，不列入畢業學分。");
        continue;
      }
      if (isMechanicalProfile(profile) && isMechanicalExcludedGeneralEducationCourse(course, matchesAnyName)) {
        excludedCredits += credits;
        addUncountedCourseAudit(course, 0, credits, "機械系114學年度規定此課程不列入通識畢業學分。");
        continue;
      }
      if (category === "國防教育") {
        if (nationalDefenseCoursesAccepted >= 1) {
          excludedCredits += credits;
          addUncountedCourseAudit(course, 0, credits, "國防教育類課程至多採計1門為通識畢業學分。");
          continue;
        }
        nationalDefenseCoursesAccepted += 1;
      }
      if (isDfllProfile(profile) && isLiteratureCollegeGeneralCourse(course, profile)) {
        if (literatureCollegeGeneralCoursesAccepted >= 1) {
          excludedCredits += credits;
          addUncountedCourseAudit(course, 0, credits, "文學學群通識課程至多採計1門，超修不採計為外系學分。");
          continue;
        }
        literatureCollegeGeneralCoursesAccepted += 1;
      }
      if (isMechanicalProfile(profile) && isEngineeringTechnologyGeneralCourse(course, compactCourseText)) {
        if (engineeringTechnologyGeneralCoursesAccepted >= 1) {
          excludedCredits += credits;
          addUncountedCourseAudit(course, 0, credits, "機械系隸屬工程科技學群，該學群通識至多採計1門。");
          continue;
        }
        engineeringTechnologyGeneralCoursesAccepted += 1;
      }
      if (isPlantPathologyProfile(profile) && isPlantPathologyLifeScienceGeneralCourse(course, compactCourseText)) {
        if (engineeringTechnologyGeneralCoursesAccepted >= 1) {
          excludedCredits += credits;
          addUncountedCourseAudit(course, 0, credits, "植物病理學系隸屬生命科學學群，該學群通識至多採計1門。");
          continue;
        }
        engineeringTechnologyGeneralCoursesAccepted += 1;
      }
      generalEducationCandidates.push({ course, credits });
      continue;
    }

    let protectedRequirementCredits = 0;
    let matchedChoiceRequirement = false;

    for (const audit of choiceRequirementAudits) {
      const option = getChoiceRequirementOption(course, audit.requirement);
      if (!option) continue;
      matchedChoiceRequirement = true;
      const remaining = remainingProtectedCredits[audit.requirement.title] ?? 0;
      const protectedForThisRequirement =
        option.id === audit.selectedOptionId && remaining > 0
          ? Math.min(credits - protectedRequirementCredits, remaining)
          : 0;

      if (protectedForThisRequirement > 0) {
        protectedRequirementCredits += protectedForThisRequirement;
        remainingProtectedCredits[audit.requirement.title] = remaining - protectedForThisRequirement;
      }
    }

    if (protectedRequirementCredits > 0) {
      baseCredits += protectedRequirementCredits;
    }

    const remainingCredits = credits - protectedRequirementCredits;
    if (remainingCredits <= 0) continue;

    const countsAsExternal =
      matchedChoiceRequirement ||
      (!isHomeDepartmentCourse(course, profile) &&
        !(isDfllProfile(profile) && isDfllDepartmentRequirementCourse(course, matchesAnyName)) &&
        !(isDfllProfile(profile) && isDfllDigitalHumanitiesCourseForAdmissionYear(course, admissionYear, { compactCourseText, matchesAnyName })) &&
        !(isDfllProfile(profile) && isDfllCollegeEmiCourseForAdmissionYear(course, admissionYear, { compactCourseText, matchesAnyName })) &&
        !isGeneralRequirementCategory(category, profile));

    if (countsAsExternal) {
      externalCredits += remainingCredits;
      externalCourseCandidates.push({ course, credits: remainingCredits });
    } else {
      baseCredits += remainingCredits;
    }
  }

  generalEducationCredits = generalEducationCandidates.reduce((sum, candidate) => sum + candidate.credits, 0);

  const buildExternalCourseAudits = (acceptedExternalCredits: number) => {
    let remainingAcceptedCredits = acceptedExternalCredits;
    return externalCourseCandidates.map(({ course, credits }) => {
      const acceptedCredits = Math.min(credits, remainingAcceptedCredits);
      remainingAcceptedCredits -= acceptedCredits;
      const uncountedCredits = Math.max(credits - acceptedCredits, 0);
      addUncountedCourseAudit(course, acceptedCredits, uncountedCredits, `外系學分超過${profile.externalCreditLimit ?? acceptedExternalCredits}學分上限，超出部分不計入畢業學分。`);
      return {
        course,
        credits,
        acceptedCredits,
        uncountedCredits,
      };
    });
  };

  if (isDfllProfile(profile)) {
    const languageLiteracyRequired = profile.languageLiteracyRequirements.reduce((sum, requirement) => sum + requirement.requiredCredits, 0);
    const infoRequired = studentStatus === "foreign" ? 0 : 1;
    const requiredGeneralEducationCredits = languageLiteracyRequired + 3 + infoRequired + 6 + 4;
    const acceptedGeneralEducationCredits = Math.min(
      generalEducationCredits,
      requiredGeneralEducationCredits + dfllGeneralEdOverflowExternalLimit,
    );
    const generalEducationOverflowCredits = Math.max(generalEducationCredits - requiredGeneralEducationCredits, 0);
    const acceptedGeneralEducationOverflowCredits = Math.min(generalEducationOverflowCredits, dfllGeneralEdOverflowExternalLimit);
    baseCredits += acceptedGeneralEducationCredits;
    excludedCredits += Math.max(generalEducationCredits - acceptedGeneralEducationCredits, 0);
    let remainingAcceptedGeneralEducationCredits = acceptedGeneralEducationCredits;
    for (const { course, credits } of generalEducationCandidates) {
      const acceptedCredits = Math.min(credits, remainingAcceptedGeneralEducationCredits);
      remainingAcceptedGeneralEducationCredits -= acceptedCredits;
      addUncountedCourseAudit(
        course,
        acceptedCredits,
        Math.max(credits - acceptedCredits, 0),
        `通識課程已超過需求，通識課程超修最多採計${dfllGeneralEdOverflowExternalLimit}學分。`,
      );
    }

    const acceptedExternalCredits = Math.min(externalCredits, profile.externalCreditLimit ?? externalCredits);
    const externalCourseAudits = buildExternalCourseAudits(acceptedExternalCredits);
    return {
      completed: baseCredits + acceptedExternalCredits,
      externalCredits,
      acceptedExternalCredits,
      externalOverLimit: Math.max(externalCredits - (profile.externalCreditLimit ?? externalCredits), 0),
      externalCourseAudits,
      generalEducationCredits,
      acceptedGeneralEducationOverflowCredits,
      generalEducationOverflowCredits,
      excludedCredits,
      choiceRequirementAudits,
      uncountedCourseAudits,
    };
  }

  const acceptedGeneralEducationCredits = Math.min(generalEducationCredits, profile.generalEducationCreditLimit ?? generalEducationCredits);
  baseCredits += acceptedGeneralEducationCredits;
  excludedCredits += Math.max(generalEducationCredits - acceptedGeneralEducationCredits, 0);
  if (profile.generalEducationCreditLimit !== undefined) {
    let remainingAcceptedGeneralEducationCredits = acceptedGeneralEducationCredits;
    for (const { course, credits } of generalEducationCandidates) {
      const acceptedCredits = Math.min(credits, remainingAcceptedGeneralEducationCredits);
      remainingAcceptedGeneralEducationCredits -= acceptedCredits;
      addUncountedCourseAudit(
        course,
        acceptedCredits,
        Math.max(credits - acceptedCredits, 0),
        `通識課程已超過${profile.generalEducationCreditLimit}學分上限，超出部分不計入畢業學分。`,
      );
    }
  }

  if (isMechanicalProfile(profile)) {
    const helpers = {
      compactCourseText,
      countableCredits,
      getCourseCategory,
      isHomeDepartmentCourse,
      matchesAnyName,
      sortCoursesChronologically,
    };
    const generalEducationRequirement = getMechanicalGeneralEducationRequirement({ courses, helpers, requirementProfile: profile });
    const requiredProfessionalRequirement = getMechanicalRequiredProfessionalRequirement({ courses, helpers, requirementProfile: profile });
    const professionalElectiveRequirement = getMechanicalProfessionalElectiveRequirement({ courses, helpers, requirementProfile: profile });
    const additionalCollegeRequirement = getMechanicalAdditionalCollegeRequirement({ courses, helpers, requirementProfile: profile });
    const completed =
      Math.min(generalEducationRequirement?.completed ?? 0, generalEducationRequirement?.required ?? 0) +
      Math.min(requiredProfessionalRequirement?.completed ?? 0, requiredProfessionalRequirement?.required ?? 0) +
      Math.min(professionalElectiveRequirement?.completed ?? 0, professionalElectiveRequirement?.required ?? 0) +
      Math.min(additionalCollegeRequirement?.completed ?? 0, additionalCollegeRequirement?.required ?? 0);
    return {
      completed,
      externalCredits,
      acceptedExternalCredits: 0,
      externalOverLimit: 0,
      externalCourseAudits: [],
      generalEducationCredits,
      acceptedGeneralEducationOverflowCredits: 0,
      generalEducationOverflowCredits: 0,
      excludedCredits,
      choiceRequirementAudits,
      uncountedCourseAudits,
    };
  }

  if (isPlantPathologyProfile(profile)) {
    const helpers = {
      compactCourseText,
      countableCredits,
      getCourseCategory,
      isHomeDepartmentCourse,
      matchesAnyName,
      sortCoursesChronologically,
    };
    const generalEducationRequirement = getPlantPathologyGeneralEducationRequirement({ courses, helpers, requirementProfile: profile, studentStatus });
    const requiredProfessionalRequirement = getPlantPathologyRequiredProfessionalRequirement({ courses, helpers, requirementProfile: profile });
    const professionalElectiveRequirement = getPlantPathologyProfessionalElectiveRequirement({
      courses,
      helpers,
      requirementProfile: profile,
      requiredProfessionalCourses: requiredProfessionalRequirement?.acceptedCourses ?? [],
    });
    const otherGraduationRequirement = getPlantPathologyOtherGraduationRequirement({
      courses,
      helpers,
      requirementProfile: profile,
      usedCourses: [
        ...(generalEducationRequirement?.courses ?? []),
        ...(requiredProfessionalRequirement?.acceptedCourses ?? []),
        ...(professionalElectiveRequirement?.acceptedCourses ?? []),
      ],
    });
    const completed =
      Math.min(generalEducationRequirement?.completed ?? 0, generalEducationRequirement?.required ?? 0) +
      Math.min(requiredProfessionalRequirement?.completed ?? 0, requiredProfessionalRequirement?.required ?? 0) +
      Math.min(professionalElectiveRequirement?.completed ?? 0, professionalElectiveRequirement?.required ?? 0) +
      Math.min(otherGraduationRequirement?.completed ?? 0, otherGraduationRequirement?.required ?? 0);
    return {
      completed,
      externalCredits,
      acceptedExternalCredits: Math.min(externalCredits, profile.externalCreditLimit ?? externalCredits),
      externalOverLimit: Math.max(externalCredits - (profile.externalCreditLimit ?? externalCredits), 0),
      externalCourseAudits: [],
      generalEducationCredits,
      acceptedGeneralEducationOverflowCredits: 0,
      generalEducationOverflowCredits: 0,
      excludedCredits,
      choiceRequirementAudits,
      uncountedCourseAudits,
    };
  }

  const acceptedExternalCredits = Math.min(externalCredits, profile.externalCreditLimit ?? externalCredits);
  const externalCourseAudits = buildExternalCourseAudits(acceptedExternalCredits);
  return {
    completed: baseCredits + acceptedExternalCredits,
    externalCredits,
    acceptedExternalCredits,
    externalOverLimit: Math.max(externalCredits - (profile.externalCreditLimit ?? externalCredits), 0),
    externalCourseAudits,
    generalEducationCredits,
    acceptedGeneralEducationOverflowCredits: 0,
    generalEducationOverflowCredits: 0,
    excludedCredits,
    choiceRequirementAudits,
    uncountedCourseAudits,
  };
};
