"use client";

import { Coins, Hash, Minus, Plus, Trash2, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { getPeriodTitle } from "@/builder/periods";
import { courseNameSchema } from "@/builder/schemas";
import AreaSelect from "@/components/builder/area-select";
import DurationSelect from "@/components/builder/duration-select";
import ElectiveSlots from "@/components/builder/elective-slots";
import PropertyRow, {
  propertyControlClassName,
} from "@/components/builder/property-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import type { Action, Area, Course, TermSystem } from "@/types/builder";

const CREDITS_PATTERN = /^\d+$/;

function CreditsStepper({
  course,
  dispatch,
}: {
  course: Course;
  dispatch: (action: Action, options?: { group?: string }) => void;
}) {
  const [creditsText, setCreditsText] = useState(String(course.credits));
  const [prevCredits, setPrevCredits] = useState(course.credits);
  if (course.credits !== prevCredits) {
    setPrevCredits(course.credits);
    setCreditsText(String(course.credits));
  }
  const hasValidCredits = CREDITS_PATTERN.test(creditsText);

  function setCredits(credits: number) {
    dispatch(
      { type: "editCourse", courseId: course.id, changes: { credits } },
      { group: `course-${course.id}-credits` },
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-7 w-fit items-center rounded-md border border-input">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Restar un crédito"
          disabled={course.credits <= 0}
          onClick={() => setCredits(course.credits - 1)}
        >
          <Minus />
        </Button>
        <input
          id="builder-course-credits"
          inputMode="numeric"
          className="w-9 bg-transparent text-center text-sm tabular-nums outline-none aria-invalid:text-destructive"
          aria-invalid={!hasValidCredits}
          aria-describedby="builder-course-credits-error"
          value={creditsText}
          onChange={(event) => {
            const text = event.target.value.trim();
            setCreditsText(text);
            if (CREDITS_PATTERN.test(text)) setCredits(Number(text));
          }}
        />
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Sumar un crédito"
          onClick={() => setCredits(course.credits + 1)}
        >
          <Plus />
        </Button>
      </div>
      {!hasValidCredits && (
        <p
          id="builder-course-credits-error"
          className="text-destructive text-xs"
        >
          Debe ser un número entero mayor o igual a 0.
        </p>
      )}
    </div>
  );
}

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
  const area = areas.find((area) => area.id === course.areaId);
  const [firstSlot] = course.slots;
  const meta = [
    area?.name ?? "Sin área",
    firstSlot && getPeriodTitle(termSystem, firstSlot),
  ].filter(Boolean);

  return (
    <div className="flex min-h-full flex-col">
      <div className="relative flex flex-col gap-1 px-6 pt-5 pb-4">
        <p className="flex items-center gap-2 pr-8 text-muted-foreground text-xs">
          <span
            className="size-2 shrink-0 rounded-[3px] bg-muted ring-1 ring-foreground/15"
            style={area && { backgroundColor: area.color }}
          />
          <span className="truncate">{meta.join(" · ")}</span>
        </p>
        <input
          aria-label="Nombre del curso"
          required
          aria-invalid={!courseNameSchema.safeParse(course.name).success}
          placeholder="Nombre del curso"
          className="-mx-1 rounded-md bg-transparent px-1 font-heading font-semibold text-xl outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:ring-2 aria-invalid:ring-destructive/40"
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
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-muted-foreground"
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
      <div className="flex flex-col gap-0.5 px-4 pb-5">
        <PropertyRow icon={Hash} label="Código" htmlFor="builder-course-code">
          <Input
            id="builder-course-code"
            placeholder="Opcional"
            className={`${propertyControlClassName} px-2 font-mono`}
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
        </PropertyRow>
        <PropertyRow
          icon={Coins}
          label="Créditos"
          htmlFor="builder-course-credits"
        >
          <CreditsStepper course={course} dispatch={dispatch} />
        </PropertyRow>
        <AreaSelect course={course} areas={areas} dispatch={dispatch} />
        <DurationSelect
          course={course}
          maxDuration={maxDuration}
          termSystem={termSystem}
          dispatch={dispatch}
        />
        <ElectiveSlots
          course={course}
          termSystem={termSystem}
          dispatch={dispatch}
        />
      </div>
      <div className="flex-1 border-t px-6 py-5">{children}</div>
      <div className="sticky bottom-0 flex items-center justify-between border-t bg-background px-4 py-3">
        <Button
          variant="destructive"
          onClick={() =>
            dispatch({ type: "deleteCourse", courseId: course.id })
          }
        >
          <Trash2 />
          Eliminar curso
        </Button>
        <Kbd>Supr</Kbd>
      </div>
    </div>
  );
}
