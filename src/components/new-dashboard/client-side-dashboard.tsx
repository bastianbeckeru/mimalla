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
import type { EnrolledCourse } from "@/types/store";

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
      const activeCurriculum = curriculums.find(
        (c) => c.id === activeCurriculumId,
      );

      if (!activeCurriculum) return;

      const { periods } = getPeriodsWithEnrollments({
        enrollments: activeCurriculum.enrolledCourses,
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

  const { progress, earnedCredits, approvedCourses, failedCourses } =
    getProgress(
      history.present.flatMap((p) => p.enrollments),
      new Map(courses.map((c) => [c.id, c])),
    );

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
        approvedCredits={earnedCredits}
        setHistory={setHistory}
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
          courses={new Map(courses.map((c) => [c.id, c]))}
          approvedCourses={approvedCourses}
          failedCourses={failedCourses}
          approvedCredits={earnedCredits}
        />
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

function getProgress(
  enrollments: EnrolledCourse[],
  coursesMap: Map<number, CurriculumData["courses"][0]>,
) {
  const totalEnrollments = enrollments.length;

  const approvedEnrollments = enrollments.filter(
    (e) => e.status === "APPROVED",
  );
  const failedEnrollments = enrollments.filter((e) => e.status === "FAILED");

  const approvedCourses = approvedEnrollments
    .map((e) => e.courseId)
    .filter((id) => id !== null && id !== undefined);
  const failedCourses = failedEnrollments
    .map((e) => e.courseId)
    .filter((id) => id !== null && id !== undefined);

  const earnedCredits = approvedCourses.reduce(
    (acc, courseId) => acc + (coursesMap.get(courseId)?.credits ?? 0),
    0,
  );

  const progress = (approvedEnrollments.length / totalEnrollments) * 100;

  return { progress, earnedCredits, approvedCourses, failedCourses };
}
