"use client";

import { X } from "lucide-react";
import { useState } from "react";
import type { Action } from "@/builder/apply";
import type { Course } from "@/builder/draft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CREDITS_PATTERN = /^\d+$/;

export default function CoursePanel({
  course,
  dispatch,
  onClose,
}: {
  course: Course;
  dispatch: (action: Action) => void;
  onClose: () => void;
}) {
  const [creditsText, setCreditsText] = useState(String(course.credits));
  const hasValidCredits = CREDITS_PATTERN.test(creditsText);

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 border-l p-4">
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
          value={course.name}
          onChange={(event) =>
            dispatch({
              type: "editCourse",
              courseId: course.id,
              changes: { name: event.target.value },
            })
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
              dispatch({
                type: "editCourse",
                courseId: course.id,
                changes: { credits: Number(text) },
              });
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
    </aside>
  );
}
