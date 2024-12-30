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

import RBDndCurriculum from "./rbdnd/dnd-curriculum";
import CurriculumForm from "./curriculum-form";
import useShortcuts from "@/hooks/use-shortcut";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Progress } from "../ui/progress";
import { toast } from "@/hooks/use-toast";

export default function ClientSideDashboard() {
  const {
    curriculums,
    activeCurriculumId,
    selectCurriculum,
    updateCurriculumEnrollments,
  } = useNewCurriculumStore();

  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [data, setData] = useState<CurriculumData | null>(null);
  const [history, setHistory] = useState<History<PeriodWithEnrollments[]>>({
    past: [],
    present: [],
    future: [],
  });

  useShortcuts([
    {
      keys: ["Control", "e"],
      handler: handleEditMode,
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

    if (curriculums.length > 0 && !activeCurriculumId) {
      selectCurriculum(curriculums[0]!.id);
      return;
    }

    if (isLoading && curriculums.length > 0) {
      const present = curriculums.find((c) => c.id === activeCurriculumId);

      if (!present) {
        setIsLoading(false);
        return;
      }

      const [institutionAcronym, programSlug] = present.path.split("/");

      if (!institutionAcronym || !programSlug) {
        setIsLoading(false);
        return;
      }

      getProgramData({
        institutionAcronym: institutionAcronym,
        programSlug: programSlug,
      })
        .then((data) => {
          const { periods } = getPeriodsWithEnrollments({
            enrollments: present.enrolledCourses,
          });

          setHistory({ ...history, present: periods });
          setData(data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          setIsLoading(false);
        });
    }

    if (
      !isLoading &&
      history.present.length === 0 &&
      curriculums.length > 0 &&
      data
    ) {
      const present = curriculums.find((c) => c.id === activeCurriculumId);

      if (!present) return;

      const { periods } = getPeriodsWithEnrollments({
        enrollments: present.enrolledCourses,
      });

      setHistory({ ...history, present: periods });
    }

    return () => clearTimeout(delay);
  }, [
    isLoading,
    data,
    curriculums,
    activeCurriculumId,
    selectCurriculum,
    history,
  ]);

  if (!isLoading && curriculums.length === 0)
    return <CurriculumForm setData={setData} />;

  if (isLoading || !data)
    return (
      <Loader2 className="absolute left-[50%] top-[40%] size-8 animate-spin" />
    );

  const { institution, program, areas, courses } = data;
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

  function handleEditMode() {
    if (history.past.length > 0) {
      toast({
        title: "⚠️ Cambios sin guardar",
        description:
          "Guarda los cambios realizados antes de finalizar la edición.",
      });
      return;
    }
    if (history.future.length > 0)
      setHistory({ ...history, past: [], future: [] });
    setEditMode(!editMode);
  }

  return (
    <SidebarProvider>
      <Sidebar
        editMode={editMode}
        setEditMode={handleEditMode}
        areas={areas}
        progress={progress}
        approvedCredits={approvedCredits}
      />

      <SidebarInset className="grid h-dvh min-h-dvh grid-rows-[auto_1fr]">
        <div>
          <header className="relative flex h-14 shrink-0 items-center justify-center gap-2 border-b bg-sidebar px-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <SidebarTrigger className="absolute left-2 md:hidden" />

            <div className="flex items-center justify-center px-2">
              <h1 className="font-bold">{program.name}</h1>
            </div>

            {editMode && (
              <Button
                aria-label="Save Changes"
                variant="outline"
                size="sm"
                className={cn(
                  "absolute right-4",
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
          </header>
          <Progress value={progress} className="h-1 rounded-none md:hidden" />
        </div>

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
    setHistory((prev) => {
      const currentData = [...prev.present];

      // Encontrar el índice del último período con inscripciones
      const lastWithEnrollmentsIndex = currentData
        .map((period) => period.enrollments.length > 0)
        .lastIndexOf(true);

      // Filtrar períodos vacíos después del último con inscripciones
      const newPresent = currentData.filter(
        (_, index) =>
          index <= lastWithEnrollmentsIndex || _.enrollments.length > 0,
      );

      updateCurriculumEnrollments(newPresent.flatMap((p) => p.enrollments));

      return { ...history, past: [], present: newPresent, future: [] };
    });
  }
}
