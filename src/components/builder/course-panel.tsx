"use client";

import { Trash2, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { courseNameSchema } from "@/builder/schemas";
import AreaSelect from "@/components/builder/area-select";
import DurationInput from "@/components/builder/duration-input";
import ElectiveSlots from "@/components/builder/elective-slots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Action, Area, Course, TermSystem } from "@/types/builder";

const CREDITS_PATTERN = /^\d+$/;

export default function CoursePanel({
  course,
  areas,
  maxDuration,
  termSystem,
  dispatch,
  onClose,
  children,
}: {
  course: Course;
  areas: Area[];
  maxDuration: number;
  termSystem: TermSystem;
  dispatch: (action: Action, options?: { group?: string }) => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const [creditsText, setCreditsText] = useState(String(course.credits));
  const [prevCredits, setPrevCredits] = useState(course.credits);
  if (course.credits !== prevCredits) {
    setPrevCredits(course.credits);
    setCreditsText(String(course.credits));
  }
  const hasValidCredits = CREDITS_PATTERN.test(creditsText);

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Detalles del curso</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Cerrar"
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="builder-course-name">Nombre</Label>
        <Input
          id="builder-course-name"
          required
          aria-invalid={!courseNameSchema.safeParse(course.name).success}
          value={course.name}
          onChange={(event) =>
            dispatch(
              {
                type: "editCourse",
                courseId: course.id,
                changes: { name: event.target.value },
              },
              { group: `course-${course.id}-name` },
            )
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="builder-course-code">Código</Label>
        <Input
          id="builder-course-code"
          placeholder="Opcional"
          value={course.code}
          onChange={(event) =>
            dispatch(
              {
                type: "editCourse",
                courseId: course.id,
                changes: { code: event.target.value },
              },
              { group: `course-${course.id}-code` },
            )
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="builder-course-credits">Créditos</Label>
        <Input
          id="builder-course-credits"
          inputMode="numeric"
          aria-invalid={!hasValidCredits}
          aria-describedby="builder-course-credits-error"
          value={creditsText}
          onChange={(event) => {
            const text = event.target.value.trim();
            setCreditsText(text);
            if (CREDITS_PATTERN.test(text))
              dispatch(
                {
                  type: "editCourse",
                  courseId: course.id,
                  changes: { credits: Number(text) },
                },
                { group: `course-${course.id}-credits` },
              );
          }}
        />
        {!hasValidCredits && (
          <p
            id="builder-course-credits-error"
            className="text-destructive text-xs"
          >
            Los créditos deben ser un número entero mayor o igual a 0.
          </p>
        )}
      </div>
      <DurationInput
        course={course}
        maxDuration={maxDuration}
        dispatch={dispatch}
      />
      <AreaSelect course={course} areas={areas} dispatch={dispatch} />
      <ElectiveSlots
        course={course}
        termSystem={termSystem}
        dispatch={dispatch}
      />
      {children}
      <Button
        variant="destructive"
        className="mt-auto"
        onClick={() => dispatch({ type: "deleteCourse", courseId: course.id })}
      >
        <Trash2 />
        Eliminar curso
      </Button>
    </aside>
  );
}
