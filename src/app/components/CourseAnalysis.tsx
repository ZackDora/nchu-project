export function CourseAnalysis() {
  const courses = [
    { id: 1, name: "計算機概論", credits: 3, grade: "A", semester: "112-1" },
    { id: 2, name: "微積分", credits: 4, grade: "B+", semester: "112-1" },
    { id: 3, name: "程式設計", credits: 3, grade: "A-", semester: "112-1" },
    { id: 4, name: "英文閱讀", credits: 2, grade: "A", semester: "112-2" },
    { id: 5, name: "資料結構", credits: 3, grade: "B", semester: "112-2" },
  ];

  return (
    <div className="p-4">
      {/* 標題 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-gray-900 dark:bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-white dark:text-gray-900 text-xs">⊕</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">相關課表分析</h1>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">總學分</p>
          <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">15</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">平均成績</p>
          <p className="text-xl font-semibold text-green-600 dark:text-green-400">3.52</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">修課數</p>
          <p className="text-xl font-semibold text-purple-600 dark:text-purple-400">5</p>
        </div>
      </div>

      {/* 課程列表 */}
      <div className="space-y-3">
        {courses.map((course) => (
          <div key={course.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-800 dark:text-white">{course.name}</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                {course.grade}
              </span>
            </div>
            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{course.semester}</span>
              <span>•</span>
              <span>{course.credits} 學分</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
