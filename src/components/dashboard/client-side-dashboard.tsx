"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { Loader2, Save, SquarePen } from "lucide-react";
import { useEffect, useState } from "react";
import NewTrajectoryForm from "@/components/dashboard/new-trajectory-form";
import Sidebar from "@/components/dashboard/sidebar";
import KbdHotkey from "@/components/kbd-hotkey";
import ScrollAreaWrapper from "@/components/scroll-area-wrapper";
import TrajectoryBoard from "@/components/trajectory/trajectory-board";
import { Button } from "@/components/ui/button";
import { KbdGroup } from "@/components/ui/kbd";
import { Progress } from "@/components/ui/progress";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { toast } from "@/components/ui/toast";
import { Toggle } from "@/components/ui/toggle";
import { useHistory } from "@/hooks/use-history";
import {
  useActiveTrajectory,
  useHasHydrated,
  useTrajectoryStore,
} from "@/stores/trajectory";
import type { Curriculum } from "@/types/builder";
import type { CatalogInstitution } from "@/types/curriculum";
import type { Trajectory } from "@/types/trajectory";
import { extendCourses } from "@/utils/curriculum";
import { fetchCurriculum } from "@/utils/curriculum-file";
import {
  createEnrollments,
  extractCourseIds,
  getTrajectoryStats,
  groupEnrollmentsByPeriod,
  trimEmptyPeriods,
} from "@/utils/trajectory";

type LoadedCurriculum = {
  path: string;
  curriculum: Curriculum | null;
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
  const activeTrajectory = useActiveTrajectory();
  const removeActiveTrajectory = useTrajectoryStore(
    (state) => state.removeActiveTrajectory,
  );
  const [loaded, setLoaded] = useState<LoadedCurriculum | null>(null);

  const activePath = activeTrajectory?.curriculumPath;
  const loadedPath = loaded?.path;

  useEffect(() => {
    if (!activePath || loadedPath === activePath) return;

    let isCurrent = true;

    fetchCurriculum(activePath)
      .then((curriculum) => {
        if (isCurrent) setLoaded({ path: activePath, curriculum });
      })
      .catch(() => {
        if (isCurrent) setLoaded({ path: activePath, curriculum: null });
      });

    return () => {
      isCurrent = false;
    };
  }, [activePath, loadedPath]);

  if (!hasHydrated) return loader;

  if (!activeTrajectory) {
    return (
      <NewTrajectoryForm
        catalog={catalog}
        onImport={(path, curriculum) => setLoaded({ path, curriculum })}
      />
    );
  }

  if (loaded?.path !== activeTrajectory.curriculumPath) return loader;

  if (!loaded.curriculum) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-muted-foreground">No se pudo cargar tu malla.</p>
        <Button variant="destructive" onClick={removeActiveTrajectory}>
          Eliminar malla
        </Button>
      </div>
    );
  }

  return (
    <TrajectoryDashboard
      key={activeTrajectory.id}
      trajectory={activeTrajectory}
      curriculum={loaded.curriculum}
    />
  );
}

function TrajectoryDashboard({
  trajectory,
  curriculum,
}: {
  trajectory: Trajectory;
  curriculum: Curriculum;
}) {
  const updateActiveEnrollments = useTrajectoryStore(
    (state) => state.updateActiveEnrollments,
  );
  const history = useHistory(() =>
    groupEnrollmentsByPeriod(trajectory.enrollments),
  );
  const [editMode, setEditMode] = useState(false);

  const courses = extendCourses(curriculum.courses);
  const enrollments = history.present.flatMap((p) => p.enrollments);
  const stats = getTrajectoryStats(enrollments, courses);

  useHotkey("Mod+E", toggleEditMode);
  useHotkey("Mod+S", saveChanges, { enabled: editMode });
  useHotkey("Mod+Z", history.undo, {
    enabled: editMode,
    ignoreInputs: true,
  });
  useHotkey("Mod+Shift+Z", history.redo, {
    enabled: editMode,
    ignoreInputs: true,
  });

  function toggleEditMode() {
    if (history.canUndo) {
      toast.add({
        type: "warning",
        title: "Cambios sin guardar",
        description:
          "Guarda los cambios realizados antes de finalizar la edición.",
      });
      return;
    }

    history.reset(history.present);
    setEditMode(!editMode);
  }

  function saveChanges() {
    const periods = trimEmptyPeriods(history.present);

    updateActiveEnrollments(periods.flatMap((p) => p.enrollments));
    history.reset(periods);
    setEditMode(false);
  }

  function resetCurriculum() {
    const officialEnrollments = createEnrollments({
      entry: trajectory.entry,
      curriculum,
    });

    updateActiveEnrollments(officialEnrollments);
    history.reset(groupEnrollmentsByPeriod(officialEnrollments));
    setEditMode(false);
  }

  return (
    <SidebarProvider>
      <Sidebar
        areas={curriculum.areas}
        stats={stats}
        onReset={resetCurriculum}
      />

      <SidebarInset className="relative grid h-dvh min-h-dvh grid-rows-[auto_1fr] overflow-hidden">
        <div>
          <header className="relative flex h-14 shrink-0 items-center justify-center gap-2 border-b bg-card px-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <SidebarTrigger className="absolute left-2 md:hidden" />

            <div className="flex items-center justify-center px-2 font-bold">
              <h1>{curriculum.programName}</h1>
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
                    <KbdHotkey hotkey="Mod+S" />
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
                  <KbdHotkey hotkey="Mod+E" />
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
          <TrajectoryBoard
            editMode={editMode}
            history={history}
            entry={trajectory.entry}
            areas={curriculum.areas}
            courses={courses}
            progress={{
              approvedCourseIds: new Set(
                extractCourseIds(enrollments, "APPROVED"),
              ),
              approvedCredits: stats.approvedCredits,
            }}
            onSave={saveChanges}
          />
        </ScrollAreaWrapper>
      </SidebarInset>
    </SidebarProvider>
  );
}
