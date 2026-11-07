"use client";

import { cn } from "cn";
import { Pencil, RotateCcw } from "lucide-react";
import { type FocusEvent, useState } from "react";
import CommitInput from "@/components/trajectory/commit-input";
import { STATUS_LABELS } from "@/components/trajectory/enrollment-card";
import { Button } from "@/components/ui/button";
import type {
  Enrollment,
  EnrollmentStatus,
  GradesChange,
  GradingScale,
} from "@/types/trajectory";
import {
  formatGrade,
  getComputedGrade,
  getCourseGrade,
  getPartialAverage,
  getRequiredGrade,
  getSuggestedStatus,
  isValidGrade,
  parseGrade,
  roundGrade,
} from "@/utils/grades";

type Tone = "muted" | "success" | "warning" | "destructive";

const TONE_CLASS: Record<Tone, string> = {
  muted: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export default function GradeSummary({
  enrollment,
  scale,
  onChange,
  onSetStatus,
}: {
  enrollment: Enrollment;
  scale: GradingScale;
  onChange: (grades: GradesChange) => void;
  onSetStatus: (status: EnrollmentStatus) => void;
}) {
  const [isEditingGrade, setIsEditingGrade] = useState(false);
  const { status, courseGrade: entered, assessments = [] } = enrollment;
  const courseGrade = getCourseGrade(enrollment, scale);
  const computed = getComputedGrade(assessments, scale);
  const partial =
    courseGrade === null ? getPartialAverage(assessments, scale) : null;
  const required =
    courseGrade === null ? getRequiredGrade(assessments, scale) : null;
  const isPassing = courseGrade !== null && courseGrade >= scale.passing;
  const isEnteredValid = entered !== undefined && isValidGrade(entered, scale);
  const isBlank = entered === undefined && assessments.length === 0;
  const suggestion = getSuggestedStatus(enrollment, scale);

  const label = isEnteredValid
    ? "Nota oficial"
    : courseGrade !== null
      ? "Nota del curso"
      : partial !== null
        ? "Promedio parcial"
        : "Sin nota todavía";

  let message: { text: string; tone: Tone };
  if (entered !== undefined && !isEnteredValid) {
    message = {
      text: `La nota oficial debe estar entre ${formatGrade(scale.min)} y ${formatGrade(scale.max)}.`,
      tone: "destructive",
    };
  } else if (status === "APPROVED" && courseGrade !== null && !isPassing) {
    message = {
      text: `Está aprobado con una nota bajo ${formatGrade(scale.passing)}.`,
      tone: "warning",
    };
  } else if (status === "FAILED" && isPassing) {
    message = {
      text: `Está reprobado con una nota de ${formatGrade(scale.passing)} o más.`,
      tone: "warning",
    };
  } else if (suggestion) {
    message = {
      text: `Con esta nota, queda ${STATUS_LABELS[suggestion]}.`,
      tone: "muted",
    };
  } else if (courseGrade !== null) {
    message = { text: "Cuenta para tu promedio acumulado.", tone: "muted" };
  } else if (required?.status === "REACHED") {
    message = { text: "Ya alcanzas la nota de aprobación.", tone: "success" };
  } else if (required?.status === "UNREACHABLE") {
    message = {
      text: "Ya no alcanzas la nota de aprobación.",
      tone: "destructive",
    };
  } else if (required?.status === "NEEDED") {
    message = {
      text: `Necesitas ${formatGrade(required.grade)} en lo que falta para aprobar.`,
      tone: "muted",
    };
  } else {
    message = {
      text: isBlank
        ? "Ingrésala aquí si ya la conoces."
        : "Completa tus evaluaciones o ingresa la nota oficial.",
      tone: "muted",
    };
  }

  const computedNote =
    isEnteredValid && computed !== null && computed !== courseGrade
      ? ` Calculada: ${formatGrade(computed)}.`
      : "";

  function closeWhenFocusLeaves(event: FocusEvent) {
    const isStaying =
      event.relatedTarget instanceof Element &&
      event.relatedTarget.closest("[data-grade-field]") !== null;
    if (!isStaying) setIsEditingGrade(false);
  }

  const shownGrade = courseGrade ?? partial;

  return (
    <>
      <div className="min-w-0 flex-1 space-y-0.5 pr-2 text-sm">
        <p className="font-medium">{label}</p>
        <p className={TONE_CLASS[message.tone]}>
          {message.text}
          {computedNote}
        </p>
      </div>
      {suggestion && (
        <Button
          size="sm"
          className="mr-1 shrink-0 max-sm:order-last max-sm:mt-2.5 max-sm:mr-0 max-sm:basis-full"
          onClick={() => onSetStatus(suggestion)}
        >
          Marcar {STATUS_LABELS[suggestion]}
        </Button>
      )}
      {isBlank || isEditingGrade ? (
        <CommitInput
          aria-label="Nota oficial"
          data-grade-field
          onBlurCapture={closeWhenFocusLeaves}
          autoFocus={isEditingGrade}
          inputMode="decimal"
          placeholder="—"
          value={entered === undefined ? "" : formatGrade(entered)}
          className="h-11 w-16 shrink-0 bg-background text-center font-heading font-semibold text-xl! tabular-nums dark:bg-background"
          onCommit={(text) => {
            const grade = parseGrade(text);
            if (Number.isNaN(grade)) return;
            onChange({ courseGrade: grade ?? undefined });
            if (grade === null) setIsEditingGrade(false);
          }}
        />
      ) : (
        <span
          className={cn(
            "shrink-0 px-2 font-heading font-semibold text-3xl tabular-nums",
            courseGrade === null
              ? shownGrade === null && "text-muted-foreground"
              : isPassing
                ? "text-success"
                : "text-destructive",
          )}
        >
          {shownGrade === null ? "—" : formatGrade(roundGrade(shownGrade))}
        </span>
      )}
      {isEditingGrade && entered !== undefined ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Volver a la nota calculada"
          title="Volver a la nota calculada"
          data-grade-field
          className="shrink-0 text-muted-foreground"
          onBlur={closeWhenFocusLeaves}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            onChange({ courseGrade: undefined });
            setIsEditingGrade(false);
          }}
        >
          <RotateCcw />
        </Button>
      ) : isBlank || isEditingGrade ? (
        <span aria-hidden className="w-2 shrink-0" />
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Editar nota oficial"
          title="Nota oficial"
          className="shrink-0 text-muted-foreground"
          onClick={() => setIsEditingGrade(true)}
        >
          <Pencil />
        </Button>
      )}
    </>
  );
}
