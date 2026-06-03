import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { CreditCalculator } from "./components/CreditCalculator";
import { CourseAnalysis } from "./components/CourseAnalysis";
import { InstructionManual } from "./components/InstructionManual";

const routerBaseName = import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL.replace(/\/$/, "");

export const router = createBrowserRouter(
  [
    {
      path: "/",
      Component: RootLayout,
      children: [
        { index: true, Component: CreditCalculator },
        { path: "course-analysis", Component: CourseAnalysis },
        { path: "manual", Component: InstructionManual },
      ],
    },
  ],
  {
    basename: routerBaseName,
  }
);
