"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { Loader2, Monitor } from "lucide-react";
import { useState } from "react";
import { getMaxDuration } from "@/builder/grid";
import AreasManager from "@/components/builder/areas-manager";
import CoursePanel from "@/components/builder/course-panel";
import CurriculumGrid from "@/components/builder/curriculum-grid";
import DetailsForm from "@/components/builder/details-form";
import DownloadButton from "@/components/builder/download-button";
import NewCurriculumDialog from "@/components/builder/new-curriculum-dialog";
import ProgramYearControls from "@/components/builder/program-year-controls";
import TermSystemSelect from "@/components/builder/term-system-select";
import { Label } from "@/components/ui/label";
import { useBuilderHasHydrated, useBuilderStore } from "@/stores/builder";

export default function Builder() {
  return (
    <main className="h-dvh w-dvw overflow-hidden">
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center md:hidden">
        <Monitor className="size-10 text-muted-foreground" />
        <p className="max-w-xs text-balance">
          El constructor de mallas necesita un computador. Ábrelo en una
          pantalla más grande para armar tu malla curricular.
        </p>
      </div>
      <div className="hidden h-full md:flex">
        <BuilderWorkspace />
      </div>
    </main>
  );
}

function BuilderWorkspace() {
  const hasHydrated = useBuilderHasHydrated();
  const draft = useBuilderStore((state) => state.draft);
  const dispatch = useBuilderStore((state) => state.dispatch);
  const undo = useBuilderStore((state) => state.undo);
  const redo = useBuilderStore((state) => state.redo);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  useHotkey("Mod+Z", undo, { enabled: hasHydrated, ignoreInputs: true });
  useHotkey("Mod+Shift+Z", redo, { enabled: hasHydrated, ignoreInputs: true });
  useHotkey(
    "Delete",
    () => {
      if (selectedCourseId === null) return;
      dispatch({ type: "deleteCourse", courseId: selectedCourseId });
      setSelectedCourseId(null);
    },
    { enabled: hasHydrated && selectedCourseId !== null, ignoreInputs: true },
  );

  if (!hasHydrated) return <Loader2 className="m-auto size-8 animate-spin" />;

  const selectedCourse = draft.curriculum.courses.find(
    (course) => course.id === selectedCourseId,
  );

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-end gap-4 border-b p-4">
          <h1 className="mr-auto font-semibold text-lg">
            Constructor de mallas
          </h1>
          <DetailsForm curriculum={draft.curriculum} dispatch={dispatch} />
          <AreasManager draft={draft} dispatch={dispatch} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="builder-term-system">Régimen</Label>
            <TermSystemSelect
              id="builder-term-system"
              value={draft.curriculum.termSystem}
              disabled={draft.curriculum.courses.length > 0}
              onChange={(termSystem) =>
                dispatch({ type: "setTermSystem", termSystem })
              }
            />
          </div>
          <NewCurriculumDialog dispatch={dispatch} />
          <DownloadButton draft={draft} />
        </header>
        <div className="flex flex-1 items-start gap-4 overflow-auto p-4">
          <CurriculumGrid
            curriculum={draft.curriculum}
            dispatch={dispatch}
            selectedCourseId={selectedCourse?.id ?? null}
            onSelectCourse={setSelectedCourseId}
          />
          <ProgramYearControls
            curriculum={draft.curriculum}
            dispatch={dispatch}
          />
        </div>
      </div>
      {selectedCourse && (
        <CoursePanel
          key={selectedCourse.id}
          course={selectedCourse}
          areas={draft.curriculum.areas}
          maxDuration={getMaxDuration(draft.curriculum, selectedCourse)}
          termSystem={draft.curriculum.termSystem}
          dispatch={dispatch}
          onClose={() => setSelectedCourseId(null)}
        />
      )}
    </>
  );
}
