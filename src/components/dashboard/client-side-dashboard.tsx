"use client";
import { Loader2, Save, SquarePen } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CurriculumForm from "@/components/dashboard/curriculum-form";
import RBDndCurriculum from "@/components/dashboard/rbdnd/dnd-curriculum";
import Sidebar from "@/components/dashboard/sidebar";
import KbdModifier from "@/components/kbd-modifier";
import ScrollAreaWrapper from "@/components/scroll-area-wrapper";
import { Button } from "@/components/ui/button";
import { KbdGroup } from "@/components/ui/kbd";
import { Progress } from "@/components/ui/progress";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toggle } from "@/components/ui/toggle";
import useShortcuts from "@/hooks/use-shortcut";
import { useNewCurriculumStore } from "@/stores/newCurriculum";
import type {
  CurriculumData,
  History,
  PeriodWithEnrollments,
} from "@/types/curriculum";
import {
  extractCourseIds,
  getCurriculumStats,
  getPeriodsWithEnrollments,
} from "@/utils/curriculum";
import { getProgramData } from "@/utils/curriculum-data";
import { parsePeriodKey } from "@/utils/period-key";

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
  const [history, setHistory] = useState<History<PeriodWithEnrollments[]>>({
    past: [],
    present: [],
    future: [],
  });

  useShortcuts([
    {
      keys: ["Control", "e"],
      callback: handleEditMode,
    },
    {
      keys: ["Control", "s"],
      callback: handleSaveChanges,
    },
    /*     {
      keys: ["Control", "escape"],
      handler: handleCancelEditMode(),
    }, */
  ]);

  // Wait for the store to be hydrated
  useEffect(() => {
    const delay = setTimeout(() => {
      if (curriculums.length === 0) {
        setIsLoading(false);
      }
    }, 500);

    const firstCurriculum = curriculums[0];
    if (firstCurriculum && !activeCurriculumId) {
      selectCurriculum(firstCurriculum.id);
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

  const { program, areas, courses } = data;

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

      <SidebarInset className="relative grid h-dvh min-h-dvh grid-rows-[auto_1fr] overflow-hidden">
        <div>
          <header className="relative flex h-14 shrink-0 items-center justify-center gap-2 border-b bg-card px-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <SidebarTrigger className="absolute left-2 md:hidden" />

            <div className="flex items-center justify-center px-2 font-bold">
              <h1>{program.name}</h1>
            </div>

            <div className="absolute right-2 flex flex-row items-center gap-2">
              {editMode && (
                <Button
                  aria-label="save changes"
                  variant="outline"
                  className="hidden bg-accent hover:brightness-110 disabled:bg-muted md:flex"
                  disabled={history.past.length === 0}
                  onClick={handleSaveChanges}
                >
                  <Save />
                  <span className="hidden md:inline">Guardar</span>
                  <KbdGroup className="sr-only">
                    <KbdModifier>+S</KbdModifier>
                  </KbdGroup>
                </Button>
              )}

              <Toggle
                aria-label="toggle edit mode"
                variant="outline"
                pressed={editMode}
                onPressedChange={() => handleEditMode()}
              >
                <SquarePen />
                <span className="hidden md:inline">Editar</span>
                <KbdGroup className="sr-only">
                  <KbdModifier>+E</KbdModifier>
                </KbdGroup>
              </Toggle>
            </div>
          </header>
          <Progress
            value={stats.progress}
            className="*:data-[slot=progress-track]:h-0.5 *:data-[slot=progress-track]:rounded-none md:hidden"
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
        const { term } = parsePeriodKey(p.id);

        const hasEnrollments = p.enrollments.length > 0;
        const isSemester = term === 1 || term === 3;

        return hasEnrollments || isSemester;
      });

      return { ...history, past: [], present: updatedPeriods, future: [] };
    });
    updateCurriculumEnrollments(history.present.flatMap((p) => p.enrollments));
  }
}
