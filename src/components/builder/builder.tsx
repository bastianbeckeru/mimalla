"use client";

import { Loader2, Monitor } from "lucide-react";
import { useState } from "react";
import AreasManager from "@/components/builder/areas-manager";
import CoursePanel from "@/components/builder/course-panel";
import CurriculumGrid from "@/components/builder/curriculum-grid";
import DetailsForm from "@/components/builder/details-form";
import DownloadButton from "@/components/builder/download-button";
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
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

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
          <DownloadButton draft={draft} />
        </header>
        <div className="flex-1 overflow-auto p-4">
          <CurriculumGrid
            curriculum={draft.curriculum}
            dispatch={dispatch}
            selectedCourseId={selectedCourse?.id ?? null}
            onSelectCourse={setSelectedCourseId}
          />
        </div>
      </div>
      {selectedCourse && (
        <CoursePanel
          key={selectedCourse.id}
          course={selectedCourse}
          areas={draft.curriculum.areas}
          dispatch={dispatch}
          onClose={() => setSelectedCourseId(null)}
        />
      )}
    </>
  );
}
