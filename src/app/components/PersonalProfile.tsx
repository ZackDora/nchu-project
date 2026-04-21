import { User, Camera } from "lucide-react";
import { useState } from "react";

export function PersonalProfile() {
  const [formData, setFormData] = useState({
    name: "",
    realName: "",
    gender: "",
    department: "",
    studentId: "",
    email: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="p-4">
      {/* 標題 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-gray-900 dark:bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-white dark:text-gray-900 text-xs">⊕</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">個人檔案</h1>
      </div>

      {/* 頭像區域 */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-3">
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg active:bg-blue-700 dark:active:bg-blue-600 transition-colors">
            <Camera size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">點擊相機圖示上傳頭像</p>
      </div>

      {/* 表單 */}
      <div className="space-y-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            姓名
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="請輸入姓名"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            本名
          </label>
          <input
            type="text"
            name="realName"
            value={formData.realName}
            onChange={handleChange}
            placeholder="請輸入本名"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            性別
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
          >
            <option value="">請選擇</option>
            <option value="male">男</option>
            <option value="female">女</option>
            <option value="other">其他</option>
          </select>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            系所
          </label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="請輸入系所"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            學號
          </label>
          <input
            type="text"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            placeholder="請輸入學號"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            電子郵件
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="請輸入電子郵件"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            電話
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="請輸入電話"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 active:bg-gray-50 dark:active:bg-gray-700 transition-colors">
            取消
          </button>
          <button className="flex-1 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg active:bg-blue-700 dark:active:bg-blue-600 transition-colors">
            儲存
          </button>
        </div>
      </div>
    </div>
  );
}