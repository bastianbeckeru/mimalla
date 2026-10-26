"use client";

import { useState } from "react";
import type { Action } from "@/builder/apply";
import type { Course } from "@/builder/draft";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DURATION_PATTERN = /^\d+$/;

export default function DurationInput({
  course,
  maxDuration,
  dispatch,
}: {
  course: Course;
  maxDuration: number;
  dispatch: (action: Action, options?: { group?: string }) => void;
}) {
  const [text, setText] = useState(String(course.duration));
  const [prevDuration, setPrevDuration] = useState(course.duration);
  if (course.duration !== prevDuration) {
    setPrevDuration(course.duration);
    setText(String(course.duration));
  }

  const value = Number(text);
  const isValid =
    DURATION_PATTERN.test(text) && value >= 1 && value <= maxDuration;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="builder-course-duration">Duración (períodos)</Label>
      <Input
        id="builder-course-duration"
        inputMode="numeric"
        aria-invalid={!isValid}
        aria-describedby="builder-course-duration-error"
        value={text}
        onChange={(event) => {
          const next = event.target.value.trim();
          setText(next);
          const duration = Number(next);
          if (
            DURATION_PATTERN.test(next) &&
            duration >= 1 &&
            duration <= maxDuration
          )
            dispatch(
              {
                type: "editCourse",
                courseId: course.id,
                changes: { duration },
              },
              { group: `course-${course.id}-duration` },
            );
        }}
      />
      {!isValid && (
        <p
          id="builder-course-duration-error"
          className="text-destructive text-xs"
        >
          La duración debe ser un número entero entre 1 y {maxDuration}.
        </p>
      )}
    </div>
  );
}
