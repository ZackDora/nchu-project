import { ExternalLink, FileText, LogIn, MousePointerClick, PencilLine } from "lucide-react";

const manualSteps = [
  {
    icon: LogIn,
    title: "登入 NCHU Portal",
    description: "先到中興大學入口網站登入。",
    link: "https://portal.nchu.edu.tw/",
    linkLabel: "開啟 NCHU Portal",
  },
  {
    icon: MousePointerClick,
    title: "進入教務資訊系統",
    description: "登入後，從 Portal 進入「教務資訊系統」。",
  },
  {
    icon: FileText,
    title: "打開歷年成績",
    description: "在左側選單選擇「學生成績」，再點選「歷年成績」。",
  },
  {
    icon: MousePointerClick,
    title: "選擇正確學期並複製課程",
    description: "選好要匯入的學期，複製該學年或該學期對應的所有課程內容。",
  },
  {
    icon: PencilLine,
    title: "貼上並人工核對",
    description: "回到學分計算頁，把內容貼到匯入框。匯入後請檢查課程、學分、成績與分類；若有錯誤可以手動編輯。",
  },
];

export function InstructionManual() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-5 pb-24 sm:px-6 sm:py-8">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-950 dark:text-white sm:text-2xl">使用說明</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
          依照下面步驟取得歷年成績資料，再貼到學分計算頁匯入。圖片之後可以放在每個步驟下方。
        </p>
      </div>

      <div className="space-y-3">
        {manualSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <section
              key={step.title}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">步驟 {index + 1}</p>
                  <h2 className="mt-1 text-base font-semibold text-gray-950 dark:text-white">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{step.description}</p>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:border-blue-700"
                    >
                      {step.linkLabel}
                      <ExternalLink size={15} />
                    </a>
                  )}
                  <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-6 text-center text-xs text-gray-500 dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-400">
                    圖片位置
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
