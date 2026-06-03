import { Outlet, NavLink } from "react-router";
import { Calculator, BookOpen, Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function RootLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-dvh bg-gray-100 dark:bg-gray-950 transition-colors">
      <div className="flex min-h-dvh w-full flex-col bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 py-2 md:px-4 flex items-center justify-between gap-2 transition-colors">
          <div className="hidden min-w-0 items-center gap-2 md:flex">
            <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300">
              NCHU Study Assistant
            </span>
          </div>
          <nav className="grid min-w-0 flex-1 grid-cols-2 gap-1 md:flex md:justify-center md:gap-3">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex min-w-0 items-center justify-center gap-1.5 md:gap-2 px-2 py-2 rounded-lg text-xs md:text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`
              }
            >
              <Calculator size={18} />
              <span>學分計算</span>
            </NavLink>

            <NavLink
              to="/course-analysis"
              className={({ isActive }) =>
                `flex min-w-0 items-center justify-center gap-1.5 md:gap-2 px-2 py-2 rounded-lg text-xs md:text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`
              }
            >
              <BookOpen size={18} />
              <span className="truncate">AI學習規劃</span>
            </NavLink>
          </nav>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
            aria-label="切換深色模式"
          >
            {theme === "light" ? (
              <Moon size={20} className="text-gray-700 dark:text-gray-300" />
            ) : (
              <Sun size={20} className="text-yellow-500" />
            )}
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
