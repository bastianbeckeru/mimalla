"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { Loader2, Save, SquarePen } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Toggle } from "@/components/ui/toggle";
import { useHistory } from "@/hooks/use-history";
import {
  useActiveTrajectory,
  useHasHydrated,
  useHasHydrationFailed,
  useTrajectoryStore,
} from "@/stores/trajectory";
import type { CatalogInstitution, CurriculumData } from "@/types/curriculum";
import type { Trajectory } from "@/types/trajectory";
import { extendCourses } from "@/utils/curriculum";
import { fetchCurriculum } from "@/utils/curriculum-data";
import {
  createEnrollments,
  extractCourseIds,
  getTrajectoryStats,
  groupEnrollmentsByPeriod,
  trimEmptyPeriods,
} from "@/utils/trajectory";

type LoadedCurriculum = {
  curriculumId: number;
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
  const hasHydrationFailed = useHasHydrationFailed();
  const activeTrajectory = useActiveTrajectory();
  const { removeActiveTrajectory } = useTrajectoryStore();
  const [loaded, setLoaded] = useState<LoadedCurriculum | null>(null);

  const activeCurriculumId = activeTrajectory?.curriculumId;
  const loadedCurriculumId = loaded?.curriculumId;

  useEffect(() => {
    if (activeCurriculumId == null) return;
    if (loadedCurriculumId === activeCurriculumId) return;

    let isCurrent = true;

    fetchCurriculum(activeCurriculumId)
      .then((data) => {
        if (isCurrent) setLoaded({ curriculumId: activeCurriculumId, data });
      })
      .catch(() => {
        if (isCurrent) {
          setLoaded({ curriculumId: activeCurriculumId, data: null });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [activeCurriculumId, loadedCurriculumId]);

  if (hasHydrationFailed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-muted-foreground">
          No se pudieron cargar tus mallas. Revisa tu conexión e inténtalo de
          nuevo.
        </p>
        <Button onClick={() => useTrajectoryStore.persist.rehydrate()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!hasHydrated) return loader;

  if (!activeTrajectory) {
    return (
      <NewTrajectoryForm
        catalog={catalog}
        onImport={(data) =>
          setLoaded({ curriculumId: data.curriculum.id, data })
        }
      />
    );
  }

  const isMissing = activeTrajectory.curriculumId === null;

  if (
    !isMissing &&
    (!loaded || loaded.curriculumId !== activeTrajectory.curriculumId)
  ) {
    return loader;
  }

  if (isMissing || !loaded?.data) {
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
      data={loaded.data}
    />
  );
}

function TrajectoryDashboard({
  trajectory,
  data,
}: {
  trajectory: Trajectory;
  data: CurriculumData;
}) {
  const { updateActiveEnrollments } = useTrajectoryStore();
  const history = useHistory(() =>
    groupEnrollmentsByPeriod(trajectory.enrollments),
  );
  const [editMode, setEditMode] = useState(false);

  const courses = extendCourses(data.courses);
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
    const periods = trimEmptyPeriods(history.present);

    updateActiveEnrollments(periods.flatMap((p) => p.enrollments));
    history.reset(periods);
    setEditMode(false);
  }

  function resetCurriculum() {
    const officialEnrollments = createEnrollments({
      entry: trajectory.entry,
      curriculum: data,
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
            areas={data.areas}
            courses={courses}
            progress={{
              approvedCourseIds: extractCourseIds(
                enrollments,
                "APPROVED",
                courses,
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
