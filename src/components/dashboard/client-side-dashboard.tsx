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
import { useHistory } from "@/hooks/use-history";
import useShortcuts from "@/hooks/use-shortcut";
import {
  useActiveCurriculum,
  useCurriculumStore,
  useHasHydrated,
} from "@/stores/curriculum";
import type {
  CatalogInstitution,
  CurriculumData,
  PeriodWithEnrollments,
} from "@/types/curriculum";
import type { StudentCurriculum } from "@/types/store";
import {
  createEnrollments,
  extendCourses,
  extractCourseIds,
  getCurriculumStats,
  groupEnrollmentsByPeriod,
} from "@/utils/curriculum";
import { fetchProgramData } from "@/utils/curriculum-data";
import { isSemester, parsePeriodKey } from "@/utils/period-key";

type LoadedProgram = {
  path: string;
  data: CurriculumData | null;
};

const loader = (
  <Loader2 className="absolute top-[40%] left-[50%] size-8 animate-spin" />
);

export default function ClientSideDashboard({
  catalog,
}: {
  catalog: CatalogInstitution[];
}) {
  const hasHydrated = useHasHydrated();
  const activeCurriculum = useActiveCurriculum();
  const { removeActiveCurriculum } = useCurriculumStore();
  const [program, setProgram] = useState<LoadedProgram | null>(null);

  const activePath = activeCurriculum?.path;
  const loadedPath = program?.path;

  useEffect(() => {
    if (!activePath || loadedPath === activePath) return;

    let isCurrent = true;

    fetchProgramData(activePath)
      .then((data) => {
        if (isCurrent) setProgram({ path: activePath, data });
      })
      .catch(() => {
        if (isCurrent) setProgram({ path: activePath, data: null });
      });

    return () => {
      isCurrent = false;
    };
  }, [activePath, loadedPath]);

  if (!hasHydrated) return loader;

  if (!activeCurriculum) {
    return (
      <CurriculumForm
        catalog={catalog}
        onImport={(path, data) => setProgram({ path, data })}
      />
    );
  }

  if (program?.path !== activeCurriculum.path) return loader;

  if (!program.data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-muted-foreground">No se pudo cargar tu malla.</p>
        <Button variant="destructive" onClick={removeActiveCurriculum}>
          Eliminar malla
        </Button>
      </div>
    );
  }

  return (
    <CurriculumDashboard
      key={activeCurriculum.id}
      curriculum={activeCurriculum}
      data={program.data}
    />
  );
}

function CurriculumDashboard({
  curriculum,
  data,
}: {
  curriculum: StudentCurriculum;
  data: CurriculumData;
}) {
  const { updateActiveEnrollments } = useCurriculumStore();
  const history = useHistory(() =>
    groupEnrollmentsByPeriod(curriculum.enrolledCourses),
  );
  const [editMode, setEditMode] = useState(false);

  const courses = extendCourses(data.courses);
  const enrollments = history.present.flatMap((p) => p.enrollments);
  const stats = getCurriculumStats(enrollments, courses);

  useShortcuts([
    { keys: ["Control", "e"], callback: toggleEditMode },
    { keys: ["Control", "s"], callback: saveChanges },
    {
      keys: ["Control", "z"],
      callback: () => {
        if (editMode) history.undo();
      },
    },
    {
      keys: ["Control", "Shift", "z"],
      callback: () => {
        if (editMode) history.redo();
      },
    },
  ]);

  function toggleEditMode() {
    if (history.canUndo) {
      toast("⚠️ Cambios sin guardar", {
        description:
          "Guarda los cambios realizados antes de finalizar la edición.",
      });
      return;
    }

    history.reset(history.present);
    setEditMode(!editMode);
  }

  function saveChanges() {
    if (!editMode) return;

    const periods = trimEmptyPeriods(history.present);

    updateActiveEnrollments(periods.flatMap((p) => p.enrollments));
    history.reset(periods);
    setEditMode(false);
  }

  function resetCurriculum() {
    const officialEnrollments = createEnrollments({
      year: curriculum.year,
      term: curriculum.term,
      slots: data.curriculum.structure,
    });

    updateActiveEnrollments(officialEnrollments);
    history.reset(groupEnrollmentsByPeriod(officialEnrollments));
    setEditMode(false);
  }

  return (
    <SidebarProvider>
      <Sidebar areas={data.areas} stats={stats} onReset={resetCurriculum} />

      <SidebarInset className="relative grid h-dvh min-h-dvh grid-rows-[auto_1fr] overflow-hidden">
        <div>
          <header className="relative flex h-14 shrink-0 items-center justify-center gap-2 border-b bg-card px-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <SidebarTrigger className="absolute left-2 md:hidden" />

            <div className="flex items-center justify-center px-2 font-bold">
              <h1>{data.program.name}</h1>
            </div>

            <div className="absolute right-2 flex flex-row items-center gap-2">
              {editMode && (
                <Button
                  aria-label="save changes"
                  variant="outline"
                  className="hidden bg-accent hover:brightness-110 disabled:bg-muted md:flex"
                  disabled={!history.canUndo}
                  onClick={saveChanges}
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
                onPressedChange={toggleEditMode}
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
            entry={curriculum}
            areas={data.areas}
            courses={courses}
            approvedCourseIds={extractCourseIds(enrollments, "APPROVED")}
            failedCourseIds={extractCourseIds(enrollments, "FAILED")}
            approvedCredits={stats.approvedCredits}
            onSave={saveChanges}
          />
        </ScrollAreaWrapper>
      </SidebarInset>
    </SidebarProvider>
  );
}

function trimEmptyPeriods(periods: PeriodWithEnrollments[]) {
  const lastIndex = periods.findLastIndex((p) => p.enrollments.length > 0);

  return periods
    .slice(0, lastIndex + 1)
    .filter(
      (p) => p.enrollments.length > 0 || isSemester(parsePeriodKey(p.id).term),
    );
}
