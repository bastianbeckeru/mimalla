"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { Loader2, Redo2, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AreasLegend from "@/components/curriculum/areas-legend";
import NewTrajectoryForm from "@/components/dashboard/new-trajectory-form";
import Sidebar from "@/components/dashboard/sidebar";
import TrajectoryBoard from "@/components/trajectory/trajectory-board";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { toast } from "@/components/ui/toast";
import { useHistory } from "@/hooks/use-history";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useActiveTrajectory,
  useHasHydrated,
  useTrajectoryStore,
} from "@/stores/trajectory";
import type { Curriculum } from "@/types/builder";
import type { CatalogInstitution } from "@/types/curriculum";
import type { ChangeNotice, Enrollment, Trajectory } from "@/types/trajectory";
import { extendCourses } from "@/utils/curriculum";
import { fetchCurriculum } from "@/utils/curriculum-file";
import {
  createEnrollments,
  getTrajectoryStats,
  settleEnrollments,
} from "@/utils/trajectory";

type LoadedCurriculum = {
  path: string;
  curriculum: Curriculum | null;
};

const loader = (
  <Loader2 className="absolute top-[40%] left-[50%] size-8 animate-spin" />
);

const NOTICE_MS = 4000;

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

function SidebarOpener() {
  const { open, isMobile } = useSidebar();
  if (open && !isMobile) return null;
  return (
    <SidebarTrigger
      aria-label="Mostrar barra lateral"
      className="text-muted-foreground"
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
  const context = { entry: trajectory.entry, curriculum };
  const history = useHistory(() =>
    settleEnrollments(trajectory.enrollments, context),
  );
  const isMobile = useIsMobile();
  const noticeId = useRef<string | null>(null);

  const enrollments = history.present;
  const stats = getTrajectoryStats(
    enrollments,
    extendCourses(curriculum.courses),
  );

  useEffect(() => {
    updateActiveEnrollments(history.present);
  }, [history.present, updateActiveEnrollments]);

  useHotkey("Mod+Z", history.undo, { enabled: !isMobile, ignoreInputs: true });
  useHotkey("Mod+Shift+Z", history.redo, {
    enabled: !isMobile,
    ignoreInputs: true,
  });

  function commit(next: Enrollment[], notice: ChangeNotice) {
    history.commit(next);
    if (!isMobile && !notice.isShownOnDesktop) return;
    if (noticeId.current) toast.close(noticeId.current);
    noticeId.current = toast.add({
      title: notice.title,
      description: notice.description,
      timeout: NOTICE_MS,
      actionProps: {
        children: "Deshacer",
        onClick: () => {
          history.undo();
          if (noticeId.current) toast.close(noticeId.current);
        },
      },
    });
  }

  function resetCurriculum() {
    commit(
      settleEnrollments(
        createEnrollments({ entry: trajectory.entry, curriculum }),
        context,
      ),
      { title: "Malla reiniciada", isShownOnDesktop: true },
    );
  }

  return (
    <SidebarProvider className="h-full min-h-0">
      <Sidebar stats={stats} onReset={resetCurriculum} />

      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarOpener />
          <h1 className="min-w-0 truncate px-2 font-heading font-semibold text-base">
            {curriculum.programName}
          </h1>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Deshacer"
              title="Deshacer (⌘ Z)"
              className="text-muted-foreground"
              disabled={!history.canUndo}
              onClick={history.undo}
            >
              <Undo2 />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Rehacer"
              title="Rehacer (⌘ ⇧ Z)"
              className="text-muted-foreground"
              disabled={!history.canRedo}
              onClick={history.redo}
            >
              <Redo2 />
            </Button>
          </div>
        </header>
        <Progress
          value={stats.progress}
          className="*:data-[slot=progress-track]:h-0.5 *:data-[slot=progress-track]:rounded-none md:hidden"
        />
        <section
          aria-label="Mi malla"
          className="min-h-0 flex-1 overflow-auto px-4 pt-4 pb-2 lg:px-8"
        >
          <TrajectoryBoard
            enrollments={enrollments}
            entry={trajectory.entry}
            curriculum={curriculum}
            onChange={commit}
          />
        </section>
        {curriculum.areas.length > 0 && (
          <footer className="flex shrink-0 border-t px-4 py-3 lg:px-8">
            <AreasLegend areas={curriculum.areas} />
          </footer>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
