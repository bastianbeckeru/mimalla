"use client";

import type {
  CurriculumData,
  History,
  PeriodWithEnrollments,
} from "@/types/curriculum";
import { useNewCurriculumStore } from "@/stores/newCurriculum";
import { getPeriodsWithEnrollments } from "@/utils/curriculum";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getProgramData } from "../../utils/curriculum-data";
import Sidebar from "./sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../ui/sidebar";

/* import DndKitCurriculum from "./dndkit/dnd-curriculum"; */
import RBDndCurriculum from "./rbdnd/dnd-curriculum";
import CurriculumForm from "./curriculum-form";

export default function ClientSideDashboard() {
  const { curriculums, activeCurriculumId, selectCurriculum } =
    useNewCurriculumStore();

  const [isLoading, setIsLoading] = useState(true);
  const [programData, setProgramData] = useState<CurriculumData | null>(null);
  const [history, setHistory] = useState<History<PeriodWithEnrollments[]>>({
    past: [],
    present: [],
    future: [],
  });

  // Wait for the store to be hydrated
  useEffect(() => {
    const delay = setTimeout(() => {
      if (curriculums.length === 0) {
        setIsLoading(false);
      }
    }, 500);

    if (isLoading && curriculums.length > 0) {
      if (!activeCurriculumId) {
        selectCurriculum(curriculums[0]!.id);
        return;
      }

      const present = curriculums.find((c) => c.id === activeCurriculumId);

      if (!present) {
        setIsLoading(false);
        return;
      }

      getProgramData({
        institutionAcronym: "udp",
        programSlug: present.programSlug,
      })
        .then((data) => {
          const { periods } = getPeriodsWithEnrollments({
            enrollments: present.enrolledCourses,
          });

          setProgramData(data);
          setHistory({ ...history, present: periods });
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          setIsLoading(false);
        });
    }

    return () => clearTimeout(delay);
  }, [isLoading, curriculums, activeCurriculumId, selectCurriculum, history]);

  if (!isLoading && curriculums.length === 0) return <CurriculumForm />;

  if (!programData)
    return (
      <Loader2 className="absolute left-[50%] top-[40%] size-8 animate-spin" />
    );

  const { institution, program, areas, courses } = programData;
  const coursesMap = new Map(courses.map((c) => [c.id, c]));

  /* PROGRESS */
  const enrollments = history.present.flatMap((p) => p.enrollments);
  const totalEnrollments = enrollments.length;
  const approvedEnrollments = enrollments.filter(
    (e) => e.status === "APPROVED",
  );
  const approvedCourses = approvedEnrollments
    .map((e) => coursesMap.get(e.courseId))
    .filter((c) => c !== null && c !== undefined);
  const approvedCredits = approvedCourses.reduce(
    (acc, course) => acc + (course?.credits ?? 0),
    0,
  );

  return (
    <SidebarProvider>
      <Sidebar
        areas={areas}
        progress={(approvedEnrollments.length / totalEnrollments) * 100}
        approvedCredits={approvedCredits}
      />

      <SidebarInset className="grid min-h-dvh grid-rows-[auto_1fr]">
        <header className="relative flex h-14 shrink-0 items-center justify-center gap-2 border-b bg-sidebar transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <SidebarTrigger className="absolute inset-4 -ml-1 md:hidden" />
          <div className="flex flex-col items-center justify-center space-y-px px-2">
            <h1 className="text-sm font-semibold">{program.name}</h1>
            <p className="text-xs/3 text-muted-foreground">
              {institution.name}
            </p>
          </div>
        </header>

        <RBDndCurriculum
          history={history}
          setHistory={setHistory}
          areas={areas}
          courses={coursesMap}
          approvedCourses={approvedCourses.map((c) => c.id)}
          approvedCredits={approvedCredits}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
