import { Download, Plus, Trash2 } from "lucide-react";
import {
  categoryOptions,
  getScoreDisplay,
  inferCategory,
  isGeneralEducationCourse,
  isUncountedOutcomeCourse,
  typeLabels,
} from "../../calculations/courseUtils";
import type { TranscriptCourse } from "../../context/TranscriptContext";
import { defaultPlanId, type RequirementPlan, type RequirementProfile } from "../../data/requirements";

type CourseCreditStatus = {
  isUncounted: boolean;
  note: string;
};

type CourseTableProps = {
  addCourse: () => void;
  chronologicalCourseRows: { course: TranscriptCourse; index: number }[];
  courses: TranscriptCourse[];
  exportCoursesAsPlainText: () => void;
  getCourseCreditStatus: (course: TranscriptCourse) => CourseCreditStatus;
  plans: RequirementPlan[];
  removeCourse: (index: number) => void;
  requirementProfile: RequirementProfile;
  semesterOptions: string[];
  updateCourse: (index: number, field: keyof TranscriptCourse, value: string) => void;
};

export function CourseTable({
  addCourse,
  chronologicalCourseRows,
  courses,
  exportCoursesAsPlainText,
  getCourseCreditStatus,
  plans,
  removeCourse,
  requirementProfile,
  semesterOptions,
  updateCourse,
}: CourseTableProps) {
  const fieldClass =
    "w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white";
  const labelClass = "mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800 sm:p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">課程清單</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{courses.length} 門課程</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
          <button
            onClick={exportCoursesAsPlainText}
            disabled={courses.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 active:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200 dark:active:bg-gray-700"
          >
            <Download size={16} />
            匯出文字
          </button>
          <button
            onClick={addCourse}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 active:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:active:bg-gray-700"
          >
            <Plus size={16} />
            新增
          </button>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">尚未輸入課程。可以貼上資料，或手動新增課程。</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {chronologicalCourseRows.map(({ course, index }) => {
              const creditStatus = getCourseCreditStatus(course);
              return (
                <details
                  key={index}
                  className={`rounded-lg border ${
                    creditStatus.isUncounted
                      ? "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                  }`}
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-3 marker:hidden">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{course.name || "未命名課程"}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        {course.courseNo && <span>{course.courseNo}</span>}
                        <span>{course.semester || "未選學期"}</span>
                        <span>{course.credits || 0} 學分</span>
                        {course.grade && <span>{course.grade}</span>}
                      </div>
                      {creditStatus.note && (
                        <p className={`mt-1 text-xs ${creditStatus.isUncounted ? "text-red-700 dark:text-red-300" : "text-gray-500 dark:text-gray-400"}`}>
                          {creditStatus.note}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                      編輯
                    </span>
                  </summary>

                  <div className="border-t border-gray-100 p-3 dark:border-gray-700">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <label className={labelClass}>課程名稱</label>
                      <input
                        value={course.name}
                        onChange={(event) => updateCourse(index, "name", event.target.value)}
                        placeholder="課程名稱"
                        className={fieldClass}
                      />
                    </div>
                    <button
                      onClick={() => removeCourse(index)}
                      aria-label="刪除課程"
                      className="mt-5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 active:bg-gray-100 dark:text-gray-400 dark:active:bg-gray-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className={labelClass}>選課號碼</span>
                    <input
                      value={course.courseNo}
                      onChange={(event) => updateCourse(index, "courseNo", event.target.value)}
                      placeholder="0313"
                      className={fieldClass}
                    />
                  </label>
                  <label>
                    <span className={labelClass}>學期</span>
                    <select
                      value={course.semester}
                      onChange={(event) => updateCourse(index, "semester", event.target.value)}
                      className={fieldClass}
                    >
                      <option value="">未選</option>
                      {semesterOptions.map((semester) => (
                        <option key={semester} value={semester}>{semester}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className={labelClass}>課程別</span>
                    <select
                      value={course.type}
                      onChange={(event) => updateCourse(index, "type", event.target.value)}
                      className={fieldClass}
                    >
                      <option value="">未分類</option>
                      {Object.entries(typeLabels).map(([type, label]) => (
                        <option key={type} value={type}>
                          {type} / {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className={labelClass}>分類</span>
                    <select
                      value={course.category || inferCategory(course.name, requirementProfile, course.offeredBy)}
                      onChange={(event) => updateCourse(index, "category", event.target.value)}
                      className={fieldClass}
                    >
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className={labelClass}>學分</span>
                    <input
                      type="number"
                      min="0"
                      max="6"
                      step="0.5"
                      value={course.credits || ""}
                      onChange={(event) => updateCourse(index, "credits", event.target.value)}
                      className={fieldClass}
                    />
                  </label>
                  <label>
                    <span className={labelClass}>成績</span>
                    <input
                      value={course.grade}
                      onChange={(event) => updateCourse(index, "grade", event.target.value)}
                      placeholder="A"
                      className={fieldClass}
                    />
                  </label>
                  <label>
                    <span className={labelClass}>分數</span>
                    <input
                      value={getScoreDisplay(course)}
                      onChange={(event) => updateCourse(index, "score", event.target.value)}
                      placeholder="90"
                      readOnly={isUncountedOutcomeCourse(course)}
                      className={`w-full rounded-md border px-2 py-1.5 text-sm ${
                        isUncountedOutcomeCourse(course)
                          ? "border-red-300 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
                          : "border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      }`}
                    />
                  </label>
                  <label>
                    <span className={labelClass}>採計方案</span>
                    <select
                      value={course.planId || defaultPlanId}
                      onChange={(event) => updateCourse(index, "planId", event.target.value)}
                      className={fieldClass}
                    >
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="sm:col-span-2">
                    <span className={labelClass}>開課系所</span>
                    <input
                      value={course.offeredBy}
                      onChange={(event) => updateCourse(index, "offeredBy", event.target.value)}
                      placeholder="通識中心"
                      className={fieldClass}
                    />
                  </label>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700">
                    <input
                      type="checkbox"
                      checked={course.emi}
                      onChange={(event) => updateCourse(index, "emi", event.target.checked ? "true" : "")}
                      className="h-4 w-4"
                    />
                    EMI
                  </label>
                  <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700">
                    <input
                      type="checkbox"
                      checked={course.genEdProfessorFromMajorDepartment}
                      disabled={!isGeneralEducationCourse(course, requirementProfile)}
                      onChange={(event) => updateCourse(index, "genEdProfessorFromMajorDepartment", event.target.checked ? "true" : "")}
                      title="通識課程若由主修系所教師開課，請勾選；未勾選時預設不是本系教師。"
                      className="h-4 w-4 disabled:opacity-30"
                    />
                    通識本系教師
                  </label>
                </div>

                {creditStatus.note && (
                  <p className={`mt-3 text-xs ${creditStatus.isUncounted ? "text-red-700 dark:text-red-300" : "text-gray-500 dark:text-gray-400"}`}>
                    {creditStatus.note}
                  </p>
                )}
                  </div>
                </details>
            );
            })}
          </div>

          <div className="hidden max-w-full overflow-x-auto lg:block">
            <table className="w-full min-w-[1320px] text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="py-2 pr-2">選課號碼</th>
                <th className="py-2 pr-2">學期</th>
                <th className="py-2 pr-2">課程別</th>
                <th className="py-2 pr-2">課程名稱</th>
                <th className="py-2 pr-2">學分</th>
                <th className="py-2 pr-2">分數</th>
                <th className="py-2 pr-2">成績</th>
                <th className="py-2 pr-2">分類</th>
                <th className="py-2 pr-2">開課系所</th>
                <th className="py-2 pr-2">EMI</th>
                <th className="py-2 pr-2">通識本系教師</th>
                <th className="py-2 pr-2">採計</th>
                <th className="py-2 pr-2">備註</th>
                <th className="py-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {chronologicalCourseRows.map(({ course, index }) => {
                const creditStatus = getCourseCreditStatus(course);
                return (
                  <tr
                    key={index}
                    className={`border-t ${
                      creditStatus.isUncounted
                        ? "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30"
                        : "border-gray-100 dark:border-gray-700"
                    }`}
                  >
                    <td className="py-2 pr-2">
                      <input
                        value={course.courseNo}
                        onChange={(event) => updateCourse(index, "courseNo", event.target.value)}
                        placeholder="0313"
                        className="w-24 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        value={course.semester}
                        onChange={(event) => updateCourse(index, "semester", event.target.value)}
                        className="w-24 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-gray-900 dark:text-white"
                      >
                        <option value="">未選</option>
                        {semesterOptions.map((semester) => (
                          <option key={semester} value={semester}>{semester}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        value={course.type}
                        onChange={(event) => updateCourse(index, "type", event.target.value)}
                        className="w-28 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-gray-900 dark:text-white"
                      >
                        <option value="">未分類</option>
                        {Object.entries(typeLabels).map(([type, label]) => (
                          <option key={type} value={type}>
                            {type} / {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={course.name}
                        onChange={(event) => updateCourse(index, "name", event.target.value)}
                        placeholder="課程名稱"
                        className="w-full min-w-56 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        min="0"
                        max="6"
                        step="0.5"
                        value={course.credits || ""}
                        onChange={(event) => updateCourse(index, "credits", event.target.value)}
                        className="w-20 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={getScoreDisplay(course)}
                        onChange={(event) => updateCourse(index, "score", event.target.value)}
                        placeholder="90"
                        readOnly={isUncountedOutcomeCourse(course)}
                        className={`w-44 rounded-md border px-2 py-1.5 ${
                          isUncountedOutcomeCourse(course)
                            ? "border-red-300 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
                            : "border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        }`}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={course.grade}
                        onChange={(event) => updateCourse(index, "grade", event.target.value)}
                        placeholder="A"
                        className="w-20 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        value={course.category || inferCategory(course.name, requirementProfile, course.offeredBy)}
                        onChange={(event) => updateCourse(index, "category", event.target.value)}
                        className="w-36 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-gray-900 dark:text-white"
                      >
                        {categoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        value={course.offeredBy}
                        onChange={(event) => updateCourse(index, "offeredBy", event.target.value)}
                        placeholder="通識中心"
                        className="w-32 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={course.emi}
                        onChange={(event) => updateCourse(index, "emi", event.target.checked ? "true" : "")}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={course.genEdProfessorFromMajorDepartment}
                        disabled={!isGeneralEducationCourse(course, requirementProfile)}
                        onChange={(event) => updateCourse(index, "genEdProfessorFromMajorDepartment", event.target.checked ? "true" : "")}
                        title="通識課程若由主修系所教師開課，請勾選；未勾選時預設不是本系教師。"
                        className="h-4 w-4 disabled:opacity-30"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        value={course.planId || defaultPlanId}
                        onChange={(event) => updateCourse(index, "planId", event.target.value)}
                        className="w-36 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-gray-900 dark:text-white"
                      >
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <span className={`block max-w-64 text-xs ${creditStatus.isUncounted ? "text-red-700 dark:text-red-300" : "text-gray-500 dark:text-gray-400"}`}>
                        {creditStatus.note}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => removeCourse(index)}
                        aria-label="刪除課程"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 active:bg-gray-100 dark:text-gray-400 dark:active:bg-gray-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
