"use client";

import { useNewCurriculumStore } from "@/stores/newCurriculum";
import { getPeriodsWithEnrollments } from "@/utils/curriculum";
import type { CurriculumData } from "@/types/curriculum";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getProgramData } from "../../utils/curriculum-data";
import Sidebar from "./sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../ui/sidebar";

/* import DndKitCurriculum from "./dndkit/dnd-curriculum"; */
import RBDndCurriculum from "./rbdnd/dnd-curriculum";
import CurriculumForm from "./curriculum-form";

export default function ClientSideDashboard() {
  const router = useRouter();
  const { curriculums, present } = useNewCurriculumStore();
  const [programData, setProgramData] = useState<CurriculumData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Wait for the store to be hydrated
  useEffect(() => {
    const delay = setTimeout(() => {
      if (curriculums.length === 0) {
        setIsLoading(false);
      }
    }, 500);

    if (present) {
      getProgramData({
        institutionAcronym: "udp",
        programSlug: present.programSlug,
      })
        .then((data) => {
          setProgramData(data);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          setIsLoading(false);
        });
    }

    return () => clearTimeout(delay);
  }, [present, isLoading, router, curriculums]);

  if (!isLoading && (!present || !programData)) return <CurriculumForm />;

  if (!present || !programData)
    return (
      <div className="relative h-dvh w-dvw">
        <Loader2 className="absolute left-[50%] top-[40%] size-8 animate-spin" />
      </div>
    );

  const { periods } = getPeriodsWithEnrollments({
    enrollments: present.enrolledCourses,
  });
  const { institution, program, areas, courses } = programData;
  const coursesMap = new Map(courses.map((c) => [c.id, c]));

  /* PROGRESS */
  const totalEnrollments = present.enrolledCourses.length;
  const approvedEnrollments = present.enrolledCourses.filter(
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
          curriculumId={present.id}
          areas={areas}
          courses={coursesMap}
          periods={periods}
          approvedCourses={approvedCourses.map((c) => c.id)}
          approvedCredits={approvedCredits}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
