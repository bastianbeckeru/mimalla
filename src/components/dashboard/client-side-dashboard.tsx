"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { Loader2, Redo2, Undo2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import AreasLegend from "@/components/curriculum/areas-legend";
import NewTrajectoryFlow, {
  PROGRAM_PARAM,
} from "@/components/dashboard/new-trajectory-flow";
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
import type {
  ChangeNotice,
  Enrollment,
  GradingScale,
  Trajectory,
  TrajectoryContent,
} from "@/types/trajectory";
import {
  extendCourses,
  findCatalogProgram,
  getProgramPath,
} from "@/utils/curriculum";
import { fetchCurriculum } from "@/utils/curriculum-file";
import { getCumulativeAverage } from "@/utils/grades";
import { parseSidebarWidth } from "@/utils/sidebar-width";
import {
  createEnrollments,
  getTrajectoryStats,
  settleEnrollments,
} from "@/utils/trajectory";

type LoadedCurriculum = {
  path: string;
  curriculum: Curriculum | null;
};

export function DashboardLoader() {
  return (
    <Loader2 className="absolute top-[40%] left-[50%] size-8 animate-spin" />
  );
}

const NOTICE_MS = 4000;
const SIDEBAR_WIDTH_KEY = "dashboard-sidebar-width";

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
  const [importedId, setImportedId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const requested = findCatalogProgram(
    catalog,
    searchParams.get(PROGRAM_PARAM),
  );
  const isRequestedImported = useTrajectoryStore((state) =>
    state.trajectories.some(
      (trajectory) =>
        getProgramPath(trajectory.curriculumPath) === requested?.program.path,
    ),
  );

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

  if (!hasHydrated) return <DashboardLoader />;

  if (!activeTrajectory || (requested && !isRequestedImported)) {
    return (
      <NewTrajectoryFlow
        catalog={catalog}
        requested={requested}
        onImport={(path, curriculum) => {
          setLoaded({ path, curriculum });
          setImportedId(useTrajectoryStore.getState().activeTrajectoryId);
          window.history.replaceState(null, "", "/dashboard");
        }}
      />
    );
  }

  if (loaded?.path !== activeTrajectory.curriculumPath)
    return <DashboardLoader />;

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
      isNew={activeTrajectory.id === importedId}
    />
  );
}

function SidebarToggle() {
  const { open, isMobile } = useSidebar();
  return (
    <SidebarTrigger
      aria-label={
        open && !isMobile ? "Ocultar barra lateral" : "Mostrar barra lateral"
      }
      className="text-muted-foreground"
    />
  );
}

function TrajectoryDashboard({
  trajectory,
  curriculum,
  isNew,
}: {
  trajectory: Trajectory;
  curriculum: Curriculum;
  isNew: boolean;
}) {
  const updateActiveTrajectory = useTrajectoryStore(
    (state) => state.updateActiveTrajectory,
  );
  const context = { entry: trajectory.entry, curriculum };
  const history = useHistory<TrajectoryContent>(() => ({
    enrollments: settleEnrollments(trajectory.enrollments, context),
    gradingScale: trajectory.gradingScale,
  }));
  const isMobile = useIsMobile();
  const noticeId = useRef<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(() =>
    parseSidebarWidth(localStorage.getItem(SIDEBAR_WIDTH_KEY)),
  );

  const { enrollments, gradingScale } = history.present;
  const courses = extendCourses(curriculum.courses);
  const stats = {
    ...getTrajectoryStats(enrollments, courses),
    cumulativeAverage: getCumulativeAverage(enrollments, courses, gradingScale),
  };

  useEffect(() => {
    updateActiveTrajectory(history.present);
  }, [history.present, updateActiveTrajectory]);

  useHotkey("Mod+Z", history.undo, { enabled: !isMobile, ignoreInputs: true });
  useHotkey("Mod+Shift+Z", history.redo, {
    enabled: !isMobile,
    ignoreInputs: true,
  });

  // Changes without a notice, such as a grade, are undone from the header.
  function commitContent(next: TrajectoryContent, notice?: ChangeNotice) {
    history.commit(next);
    if (!notice || (!isMobile && !notice.isShownOnDesktop)) return;
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

  function commit(next: Enrollment[], notice?: ChangeNotice) {
    commitContent({ ...history.present, enrollments: next }, notice);
  }

  function changeGradingScale(next: GradingScale) {
    commitContent({ ...history.present, gradingScale: next });
  }

  function changeSidebarWidth(width: number) {
    setSidebarWidth(width);
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
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
    <SidebarProvider
      className="h-full min-h-0 data-resizing:**:data-[slot=sidebar-container]:transition-none data-resizing:**:data-[slot=sidebar-gap]:transition-none"
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <Sidebar
        programName={curriculum.programName}
        stats={stats}
        width={sidebarWidth}
        onWidthChange={changeSidebarWidth}
        gradingScale={gradingScale}
        onGradingScaleChange={changeGradingScale}
        onReset={resetCurriculum}
      />

      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarToggle />
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
        <TrajectoryBoard
          enrollments={enrollments}
          entry={trajectory.entry}
          curriculum={curriculum}
          gradingScale={gradingScale}
          isNew={isNew}
          onChange={commit}
        />
        {curriculum.areas.length > 0 && (
          <footer className="flex shrink-0 border-t px-4 py-3 lg:px-8">
            <AreasLegend areas={curriculum.areas} />
          </footer>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
