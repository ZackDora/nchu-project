import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { CreditCalculator } from "./components/CreditCalculator";
import { CourseAnalysis } from "./components/CourseAnalysis";
import { PersonalProfile } from "./components/PersonalProfile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: CreditCalculator },
      { path: "course-analysis", Component: CourseAnalysis },
      { path: "profile", Component: PersonalProfile },
    ],
  },
]);