import { BookOpen, FileUp } from "lucide-react";
import { Link } from "react-router";
import { useMemo } from "react";
import { useTranscript } from "../context/TranscriptContext";

const gradePoints: Record<string, number> = {
  "A+": 4.3,
  A: 4,
  "A-": 3.7,
  "B+": 3.3,
  B: 3,
  "B-": 2.7,
  "C+": 2.3,
  C: 2,
  "C-": 1.7,
  D: 1,
  F: 0,
};

const isNonGraduationCredit = (course: { category: string; name: string; type: string }) =>
  course.type === "體" || course.type === "服" || course.category === "體育" || course.category === "體育/服務學習" || /(體育|服務|軍訓)/.test(course.name);

const isUncountedOutcomeCourse = (course: { score: string; grade: string }) =>
  course.score.toUpperCase() === "W" || course.grade.toUpperCase() === "W" || course.grade.toUpperCase() === "F";

export function CourseAnalysis() {
  const { courses, profile } = useTranscript();

  const stats = useMemo(() => {
    const completedCredits = courses.reduce((sum, course) => sum + (isNonGraduationCredit(course) || isUncountedOutcomeCourse(course) ? 0 : course.credits), 0);
    const gradedCourses = courses.filter((course) => gradePoints[course.grade] !== undefined);
    const gradedCredits = gradedCourses.reduce((sum, course) => sum + course.credits, 0);
    const weightedPoints = gradedCourses.reduce(
      (sum, course) => sum + gradePoints[course.grade] * course.credits,
      0,
    );
    const gpa = gradedCredits > 0 ? weightedPoints / gradedCredits : 0;

    const bySemester = courses.reduce<Record<string, { credits: number; count: number }>>((groups, course) => {
      const key = course.semester || "未辨識學期";
      groups[key] = groups[key] ?? { credits: 0, count: 0 };
      groups[key].credits += isNonGraduationCredit(course) || isUncountedOutcomeCourse(course) ? 0 : course.credits;
      groups[key].count += 1;
      return groups;
    }, {});

    return {
      completedCredits,
      gpa,
      bySemester: Object.entries(bySemester).sort(([a], [b]) => a.localeCompare(b)),
    };
  }, [courses]);

  if (courses.length === 0) {
    return (
      <div className="px-2 py-3 md:px-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
            <BookOpen className="text-white" size={18} />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">課表分析</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <FileUp className="mx-auto mb-3 text-blue-600 dark:text-blue-400" size={32} />
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">尚未有可分析的成績資料</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            請先上傳歷年成績查詢 PDF，系統會用辨識出的課程資料產生分析。
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white active:bg-blue-700 dark:bg-blue-500 dark:active:bg-blue-600"
          >
            前往上傳
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 py-3 md:px-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
          <BookOpen className="text-white" size={18} />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">課表分析</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {profile.name || "未辨識姓名"} / {profile.department || "未辨識系所"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">總學分</p>
          <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">{stats.completedCredits}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">估算 GPA</p>
          <p className="text-xl font-semibold text-green-600 dark:text-green-400">{stats.gpa.toFixed(2)}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">修課數</p>
          <p className="text-xl font-semibold text-purple-600 dark:text-purple-400">{courses.length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">各學期修課量</p>
        <div className="space-y-3">
          {stats.bySemester.map(([semester, value]) => (
            <div key={semester}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 dark:text-gray-300">{semester}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {value.count} 門 / {value.credits} 學分
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className="h-2 rounded-full bg-blue-600 dark:bg-blue-400"
                  style={{ width: `${Math.min((value.credits / 25) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {courses.map((course, index) => (
          <div
            key={`${course.semester}-${course.name}-${index}`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors"
          >
            <div className="flex justify-between items-start mb-2 gap-3">
              <h3 className="font-medium text-gray-800 dark:text-white">{course.name}</h3>
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                {course.grade}
              </span>
            </div>
            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{course.semester || "-"}</span>
              <span>•</span>
              {course.typeLabel && (
                <>
                  <span>{course.typeLabel}</span>
                  <span>•</span>
                </>
              )}
              <span>{course.category || "未分類"}</span>
              <span>•</span>
              <span>{course.credits} 學分</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
