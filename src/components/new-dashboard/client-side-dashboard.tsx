"use client";

import type {
  CurriculumData,
  History,
  PeriodWithEnrollments,
} from "@/types/curriculum";
import { useNewCurriculumStore } from "@/stores/newCurriculum";
import { getPeriodsWithEnrollments } from "@/utils/curriculum";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { getProgramData } from "../../utils/curriculum-data";
import Sidebar from "./sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../ui/sidebar";

/* import DndKitCurriculum from "./dndkit/dnd-curriculum"; */
import RBDndCurriculum from "./rbdnd/dnd-curriculum";
import CurriculumForm from "./curriculum-form";
import useShortcuts from "@/hooks/use-shortcut";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Progress } from "../ui/progress";

export default function ClientSideDashboard() {
  const {
    curriculums,
    activeCurriculumId,
    selectCurriculum,
    updateCurriculumEnrollments,
  } = useNewCurriculumStore();

  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [programData, setProgramData] = useState<CurriculumData | null>(null);
  const [history, setHistory] = useState<History<PeriodWithEnrollments[]>>({
    past: [],
    present: [],
    future: [],
  });

  useShortcuts([
    {
      keys: ["Control", "e"],
      handler: () => setEditMode(!editMode),
    },
    {
      keys: ["Control", "s"],
      handler: handleSaveChanges,
    },
  ]);

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
  const progress = (approvedEnrollments.length / totalEnrollments) * 100;

  return (
    <SidebarProvider>
      <Sidebar
        editMode={editMode}
        setEditMode={setEditMode}
        areas={areas}
        progress={progress}
        approvedCredits={approvedCredits}
      />

      <SidebarInset className="grid min-h-dvh grid-rows-[auto_1fr]">
        <header className="relative flex h-14 shrink-0 items-center justify-center gap-2 border-b bg-sidebar transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <SidebarTrigger className="absolute left-2" />

          <div className="flex items-center justify-center px-2">
            <h1 className="font-bold">{program.name}</h1>
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center justify-center gap-2 px-2">
            {editMode && (
              <Button
                aria-label="Save Changes"
                variant="outline"
                size="sm"
                className={cn(
                  history.past.length !== 0 &&
                    "bg-secondary hover:bg-secondary/80",
                )}
                disabled={history.past.length === 0}
                onClick={handleSaveChanges}
              >
                <Save />
                <span className="hidden md:inline">Guardar</span>
              </Button>
            )}
          </div>
        </header>
        <Progress value={progress} className="h-1 rounded-none md:hidden" />

        <RBDndCurriculum
          editMode={editMode}
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

  function handleSaveChanges() {
    setEditMode(!editMode);
    updateCurriculumEnrollments(history.present.flatMap((p) => p.enrollments));
    setHistory({ ...history, past: [], future: [] });
  }
}
