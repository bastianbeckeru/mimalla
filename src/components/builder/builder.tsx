"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { Loader2, Monitor, Redo2, Undo2 } from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";
import { findCourse } from "@/builder/draft";
import { getMaxDuration } from "@/builder/grid";
import AreasBar from "@/components/builder/areas-bar";
import CoursePanel from "@/components/builder/course-panel";
import CurriculaSidebar from "@/components/builder/curricula-sidebar";
import CurriculumGrid from "@/components/builder/curriculum-grid";
import CurriculumStart from "@/components/builder/curriculum-start";
import DetailsForm from "@/components/builder/details-form";
import DownloadButton from "@/components/builder/download-button";
import PrerequisitesField from "@/components/builder/prerequisites-field";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useBuilderHasHydrated, useBuilderStore } from "@/stores/builder";
import type { Draft } from "@/types/builder";

export default function Builder() {
  return (
    <div className="h-dvh w-dvw overflow-hidden">
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center md:hidden">
        <Monitor className="size-10 text-muted-foreground" />
        <p className="max-w-xs text-balance">
          El constructor de mallas necesita un computador. Ábrelo en una
          pantalla más grande para armar tu malla curricular.
        </p>
      </div>
      <SidebarProvider
        className="hidden h-full min-h-0 md:flex"
        style={{ "--sidebar-width": "16.5rem" } as CSSProperties}
      >
        <BuilderWorkspace />
      </SidebarProvider>
    </div>
  );
}

function SidebarOpener() {
  const { open } = useSidebar();
  if (open) return null;
  return (
    <SidebarTrigger
      aria-label="Mostrar barra lateral"
      className="text-muted-foreground"
    />
  );
}

function BuilderWorkspace() {
  const hasHydrated = useBuilderHasHydrated();
  const curricula = useBuilderStore((state) => state.curricula);
  const activeId = useBuilderStore((state) => state.activeId);
  const draft = useBuilderStore((state) => state.draft);
  const history = useBuilderStore((state) => state.history);
  const dispatch = useBuilderStore((state) => state.dispatch);
  const create = useBuilderStore((state) => state.create);
  const add = useBuilderStore((state) => state.add);
  const select = useBuilderStore((state) => state.select);
  const duplicate = useBuilderStore((state) => state.duplicate);
  const remove = useBuilderStore((state) => state.remove);
  const undo = useBuilderStore((state) => state.undo);
  const redo = useBuilderStore((state) => state.redo);
  const endGroup = useBuilderStore((state) => state.endGroup);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const isStarting = isCreating || activeId === null;
  const isEditing = hasHydrated && !isStarting;

  useEffect(() => {
    document.addEventListener("focusout", endGroup);
    return () => document.removeEventListener("focusout", endGroup);
  }, [endGroup]);

  useHotkey("Mod+Z", undo, { enabled: isEditing, ignoreInputs: true });
  useHotkey("Mod+Shift+Z", redo, { enabled: isEditing, ignoreInputs: true });
  useHotkey(
    "Mod+D",
    () => {
      if (activeId !== null) openCurriculum(() => duplicate(activeId));
    },
    { enabled: isEditing, ignoreInputs: true },
  );
  useHotkey(
    "Delete",
    () => {
      if (selectedCourseId === null) return;
      dispatch({ type: "deleteCourse", courseId: selectedCourseId });
      setSelectedCourseId(null);
    },
    { enabled: isEditing && selectedCourseId !== null, ignoreInputs: true },
  );

  function openCurriculum(change: () => void) {
    change();
    setIsCreating(false);
    setSelectedCourseId(null);
  }

  function loadDraft(loadedDraft: Draft) {
    openCurriculum(() => add(loadedDraft));
  }

  if (!hasHydrated) return <Loader2 className="m-auto size-8 animate-spin" />;

  const selectedCourse =
    selectedCourseId === null || isStarting
      ? undefined
      : findCourse(draft.curriculum, selectedCourseId);

  return (
    <>
      <CurriculaSidebar
        curricula={curricula}
        activeId={activeId}
        isCreating={isStarting}
        onCreate={() => {
          setIsCreating(true);
          setSelectedCourseId(null);
        }}
        onSelect={(id) => openCurriculum(() => select(id))}
        onEditDetails={(id) => {
          openCurriculum(() => select(id));
          setIsDetailsOpen(true);
        }}
        onDuplicate={(id) => openCurriculum(() => duplicate(id))}
        onRemove={(id) => {
          if (id === activeId) setSelectedCourseId(null);
          remove(id);
        }}
        onLoad={loadDraft}
      />
      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarOpener />
          {isStarting ? (
            <h1 className="px-2 font-heading font-semibold text-base">
              Nueva malla
            </h1>
          ) : (
            <>
              <h1 className="sr-only">Constructor de mallas</h1>
              <DetailsForm
                curriculum={draft.curriculum}
                dispatch={dispatch}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
              />
              <div className="ml-auto flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Deshacer"
                  title="Deshacer (⌘ Z)"
                  className="text-muted-foreground"
                  disabled={history.past.length === 0}
                  onClick={undo}
                >
                  <Undo2 />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Rehacer"
                  title="Rehacer (⌘ ⇧ Z)"
                  className="text-muted-foreground"
                  disabled={history.future.length === 0}
                  onClick={redo}
                >
                  <Redo2 />
                </Button>
                <Separator
                  orientation="vertical"
                  className="self-center! mx-2 h-5"
                />
                <DownloadButton draft={draft} />
              </div>
            </>
          )}
        </header>
        {isStarting ? (
          <div className="flex min-h-0 flex-1 overflow-auto">
            <CurriculumStart
              onCreate={(termSystem, details) =>
                openCurriculum(() => create(termSystem, details))
              }
              onLoad={loadDraft}
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex flex-1 items-start gap-4 overflow-auto px-6 pt-6 pb-2">
                <CurriculumGrid
                  draft={draft}
                  dispatch={dispatch}
                  selectedCourseId={selectedCourse?.id ?? null}
                  onSelectCourse={setSelectedCourseId}
                />
              </div>
              <AreasBar draft={draft} dispatch={dispatch} />
            </div>
            {selectedCourse && (
              // Slides in once when the panel opens; switching courses only
              // swaps its content, so it stays instant.
              <aside className="slide-in-from-right w-84 shrink-0 animate-in overflow-y-auto border-l duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:animate-none">
                <CoursePanel
                  key={selectedCourse.id}
                  course={selectedCourse}
                  areas={draft.curriculum.areas}
                  maxDuration={getMaxDuration(draft.curriculum, selectedCourse)}
                  termSystem={draft.curriculum.termSystem}
                  dispatch={dispatch}
                  onClose={() => setSelectedCourseId(null)}
                >
                  <PrerequisitesField
                    curriculum={draft.curriculum}
                    course={selectedCourse}
                    dispatch={dispatch}
                  />
                </CoursePanel>
              </aside>
            )}
          </div>
        )}
      </SidebarInset>
    </>
  );
}
