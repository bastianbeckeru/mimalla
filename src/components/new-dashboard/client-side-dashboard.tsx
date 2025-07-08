"use client";

import type {
  CurriculumData,
  History,
  PeriodWithEnrollments,
} from "@/types/curriculum";
import { useNewCurriculumStore } from "@/stores/newCurriculum";
import {
  extractCourseIds,
  getCurriculumStats,
  getPeriodsWithEnrollments,
} from "@/utils/curriculum";
import { Loader2, Lock, LockOpen, Save } from "lucide-react";
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
import { toast } from "sonner";
import { StudentEnrollment } from "@/types/store";
import ScrollAreaWrapper from "../scroll-area-wrapper";
import { Toggle } from "../ui/toggle";

export default function ClientSideDashboard() {
  const {
    activeCurriculumId,
    curriculums,
    selectCurriculum,
    updateCurriculumEnrollments,
  } = useNewCurriculumStore();

  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [data, setData] = useState<CurriculumData | null>(null);
  const [curriculum, setCurriculum] = useState<StudentEnrollment | null>(null);
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
      const activeCurriculum = curriculums.find(
        (c) => c.id === activeCurriculumId,
      );

      if (!activeCurriculum) {
        setIsLoading(false);
        return;
      }

      const [institutionAcronym, programSlug] =
        activeCurriculum.path.split("/");

      if (!institutionAcronym || !programSlug) {
        setIsLoading(false);
        return;
      }

      getProgramData({
        institutionAcronym: institutionAcronym,
        programSlug: programSlug,
      })
        .then((data) => {
          setCurriculum(activeCurriculum);
          const { periods, hasToSave } = getPeriodsWithEnrollments({
            year: activeCurriculum.year,
            enrollments: activeCurriculum.enrolledCourses,
          });

          if (hasToSave)
            updateCurriculumEnrollments(periods.flatMap((p) => p.enrollments));

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
      const activeCurriculum = curriculums.find(
        (c) => c.id === activeCurriculumId,
      );

      if (!activeCurriculum) return;

      setCurriculum(activeCurriculum);
      const { periods, hasToSave } = getPeriodsWithEnrollments({
        year: activeCurriculum.year,
        enrollments: activeCurriculum.enrolledCourses,
      });

      if (hasToSave)
        updateCurriculumEnrollments(periods.flatMap((p) => p.enrollments));

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
    updateCurriculumEnrollments,
  ]);

  if (!isLoading && curriculums.length === 0)
    return <CurriculumForm setData={setData} />;

  if (isLoading || !data)
    return (
      <Loader2 className="absolute top-[40%] left-[50%] size-8 animate-spin" />
    );

  const { institution, program, areas, courses } = data;

  const enrollments = history.present.flatMap((p) => p.enrollments);
  const coursesMap = new Map(courses.map((c) => [c.id, c]));

  const stats = getCurriculumStats(enrollments, coursesMap);

  const approvedCourseIds = extractCourseIds(enrollments, "APPROVED");
  const failedCourseIds = extractCourseIds(enrollments, "FAILED");

  function handleEditMode() {
    if (history.past.length > 0) {
      toast("⚠️ Cambios sin guardar", {
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
        stats={stats}
        setHistory={setHistory}
      />

      <SidebarInset className="grid h-dvh min-h-dvh grid-rows-[auto_1fr] overflow-hidden">
        <div>
          <header className="bg-card relative flex h-14 shrink-0 items-center justify-center gap-2 border-b px-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <SidebarTrigger className="absolute left-2 md:hidden" />

            <div className="flex items-center justify-center px-2 font-bold">
              <h1>{program.name}</h1>
            </div>

            <div className="absolute right-2 flex flex-row items-center gap-2">
              {editMode && (
                <Button
                  aria-label="save changes"
                  variant="outline"
                  className="disabled:bg-muted bg-accent hidden hover:brightness-110 md:flex"
                  disabled={history.past.length === 0}
                  onClick={handleSaveChanges}
                >
                  <Save />
                  <span className="sr-only hidden md:inline">Guardar</span>
                  <kbd className="bg-muted hidden h-5 items-center justify-center gap-1 rounded-sm border px-1.5 font-mono text-sm font-medium md:inline-flex">
                    <span className="text-[0.625rem]">⌘</span>S
                  </kbd>
                </Button>
              )}

              <Toggle
                title="Habilitar edición"
                aria-label="toggle edit mode"
                variant="outline"
                data-state={editMode ? "on" : "off"}
                onClick={handleEditMode}
              >
                {editMode ? <LockOpen /> : <Lock />}
                <span className="sr-only hidden md:inline">
                  {editMode ? "Deshabilitar" : "Habilitar"} edición
                </span>
                <kbd className="bg-muted hidden h-5 items-center justify-center gap-1 rounded-sm border px-1.5 font-mono text-sm font-medium md:inline-flex">
                  <span className="text-[0.625rem]">⌘</span>E
                </kbd>
              </Toggle>
            </div>
          </header>
          <Progress
            value={stats.progress}
            className="h-0.5 rounded-none md:hidden"
          />
        </div>

        <ScrollAreaWrapper className="h-[calc(100dvh-3.5rem)] w-dvw overflow-hidden lg:w-[calc(100dvw-18rem)]">
          <RBDndCurriculum
            editMode={editMode}
            history={history}
            setHistory={setHistory}
            areas={areas}
            courses={new Map(courses.map((c) => [c.id, c]))}
            approvedCourseIds={approvedCourseIds}
            failedCourseIds={failedCourseIds}
            approvedCredits={stats.approvedCredits}
            handleSaveChanges={handleSaveChanges}
          />
        </ScrollAreaWrapper>
      </SidebarInset>
    </SidebarProvider>
  );

  function handleSaveChanges() {
    setEditMode(!editMode);
    setHistory((prev) => {
      const newPresent = [...prev.present];

      const lastWithEnrollmentsIndex = newPresent
        .map((p) => p.enrollments.length > 0)
        .lastIndexOf(true);

      newPresent.splice(lastWithEnrollmentsIndex + 1);

      const updatedPeriods = newPresent.filter((p) => {
        const term = Number(p.id.split("-")[1]!);

        const hasEnrollments = p.enrollments.length > 0;
        const isSemester = term === 1 || term === 3;

        return hasEnrollments || isSemester;
      });

      return { ...history, past: [], present: updatedPeriods, future: [] };
    });
    updateCurriculumEnrollments(history.present.flatMap((p) => p.enrollments));
  }
}
