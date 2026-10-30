"use client";

import { cn } from "cn";
import { Check, Copy, RotateCcw, Trash2, TriangleAlert, X } from "lucide-react";
import { useId } from "react";
import { getCourseColor } from "@/builder/colors";
import CommitInput from "@/components/trajectory/commit-input";
import GradingSchemeEditor from "@/components/trajectory/grading-scheme-editor";
import {
  AdaptiveDialog,
  AdaptiveDialogBody,
  AdaptiveDialogContent,
  AdaptiveDialogDescription,
  AdaptiveDialogFooter,
  AdaptiveDialogHeader,
  AdaptiveDialogTitle,
} from "@/components/ui/adaptive-dialog";
import { Button } from "@/components/ui/button";
import type { Course, Curriculum } from "@/types/builder";
import type {
  Assessment,
  Enrollment,
  EnrollmentStatus,
  GradingScale,
  TrajectoryProgress,
} from "@/types/trajectory";
import {
  formatGrade,
  getComputedGrade,
  getCourseGrade,
  getPartialAverage,
  getRequiredGrade,
  isValidGrade,
  parseGrade,
} from "@/utils/grades";
import { copyScheme } from "@/utils/grading-scheme";

export type SchemeSource = { label: string; assessments: Assessment[] };

export default function CoursePanel({
  open,
  enrollment,
  course,
  curriculum,
  progress,
  gradingScale,
  schemeSource,
  isAvailable,
  isEditing,
  onOpenChange,
  onSetStatus,
  onGradesChange,
  onRemove,
}: {
  open: boolean;
  enrollment: Enrollment | null;
  course: Course | null;
  curriculum: Curriculum;
  progress: TrajectoryProgress;
  gradingScale: GradingScale;
  schemeSource: SchemeSource | null;
  isAvailable: boolean;
  isEditing: boolean;
  onOpenChange: (open: boolean) => void;
  onSetStatus: (status: EnrollmentStatus) => void;
  onGradesChange: (
    grades: Partial<Pick<Enrollment, "assessments" | "courseGrade">>,
  ) => void;
  onRemove: () => void;
}) {
  const area = curriculum.areas.find(({ id }) => id === course?.areaId);
  const prerequisites = (course?.prerequisiteIds ?? []).flatMap((id) => {
    const prerequisite = curriculum.courses.find((c) => c.id === id);
    return prerequisite ? [prerequisite] : [];
  });

  return (
    <AdaptiveDialog open={open} onOpenChange={onOpenChange}>
      <AdaptiveDialogContent className="sm:max-w-lg">
        {course && enrollment && (
          <>
            <AdaptiveDialogHeader>
              <AdaptiveDialogTitle>{course.name}</AdaptiveDialogTitle>
              <AdaptiveDialogDescription>
                {[course.code, `${course.credits} créditos`]
                  .filter(Boolean)
                  .join(" · ")}
              </AdaptiveDialogDescription>
            </AdaptiveDialogHeader>
            <AdaptiveDialogBody className="space-y-6 sm:max-h-[65vh] sm:overflow-y-auto">
              <Grades
                enrollment={enrollment}
                scale={gradingScale}
                schemeSource={schemeSource}
                isAvailable={isAvailable}
                onSetStatus={onSetStatus}
                onChange={onGradesChange}
              />
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Área</dt>
                <dd className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-[3px] ring-1 ring-foreground/15"
                    style={{
                      backgroundColor: getCourseColor(curriculum, course),
                    }}
                  />
                  <span className="truncate">{area?.name ?? "Sin área"}</span>
                </dd>
                <dt className="text-muted-foreground">Prerrequisitos</dt>
                <dd>
                  {prerequisites.length === 0 &&
                  course.prerequisiteCredits === 0 ? (
                    <span className="text-muted-foreground">Ninguno</span>
                  ) : (
                    <ul className="space-y-1">
                      {course.prerequisiteCredits > 0 && (
                        <Prerequisite
                          name={`${course.prerequisiteCredits} créditos aprobados`}
                          isApproved={
                            course.prerequisiteCredits <=
                            progress.approvedCredits
                          }
                        />
                      )}
                      {prerequisites.map((prerequisite) => (
                        <Prerequisite
                          key={prerequisite.id}
                          name={prerequisite.name}
                          isApproved={progress.approvedCourseIds.has(
                            prerequisite.id,
                          )}
                        />
                      ))}
                    </ul>
                  )}
                </dd>
              </dl>
            </AdaptiveDialogBody>
            <AdaptiveDialogFooter>
              {enrollment.status !== "PENDING" && (
                <Button
                  variant="outline"
                  onClick={() => onSetStatus("PENDING")}
                >
                  <RotateCcw />
                  Volver a pendiente
                </Button>
              )}
              {enrollment.status !== "FAILED" && (
                <Button variant="outline" onClick={() => onSetStatus("FAILED")}>
                  <X />
                  Marcar como reprobado
                </Button>
              )}
              {enrollment.status !== "APPROVED" && (
                <Button
                  disabled={!isAvailable}
                  onClick={() => onSetStatus("APPROVED")}
                >
                  <Check />
                  Marcar como aprobado
                </Button>
              )}
              {isEditing && (
                <Button variant="destructive" onClick={onRemove}>
                  <Trash2 />
                  Quitar curso
                </Button>
              )}
            </AdaptiveDialogFooter>
          </>
        )}
      </AdaptiveDialogContent>
    </AdaptiveDialog>
  );
}

function Prerequisite({
  name,
  isApproved,
}: {
  name: string;
  isApproved: boolean;
}) {
  return (
    <li className="flex items-center gap-2">
      {isApproved ? (
        <Check aria-label="Aprobado" className="size-4 shrink-0 text-success" />
      ) : (
        <span aria-hidden className="size-4 shrink-0" />
      )}
      <span className={isApproved ? undefined : "text-muted-foreground"}>
        {name}
      </span>
    </li>
  );
}

function Grades({
  enrollment,
  scale,
  schemeSource,
  isAvailable,
  onSetStatus,
  onChange,
}: {
  enrollment: Enrollment;
  scale: GradingScale;
  schemeSource: SchemeSource | null;
  isAvailable: boolean;
  onSetStatus: (status: EnrollmentStatus) => void;
  onChange: (
    grades: Partial<Pick<Enrollment, "assessments" | "courseGrade">>,
  ) => void;
}) {
  const { status, courseGrade: entered, assessments = [] } = enrollment;
  const courseGrade = getCourseGrade(enrollment, scale);
  const computed = getComputedGrade(assessments, scale);
  const partial =
    courseGrade === null ? getPartialAverage(assessments, scale) : null;
  const required =
    courseGrade === null ? getRequiredGrade(assessments, scale) : null;
  const isPassing = courseGrade !== null && courseGrade >= scale.passing;
  const isEnteredValid = entered !== undefined && isValidGrade(entered, scale);
  const enteredId = useId();

  return (
    <section aria-label="Notas" className="space-y-4">
      <div className="flex items-end justify-between gap-4 rounded-lg bg-muted/50 p-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Nota final</p>
          <p
            className={cn(
              "font-heading font-semibold text-3xl tabular-nums",
              courseGrade === null
                ? "text-muted-foreground"
                : isPassing
                  ? "text-success"
                  : "text-destructive",
            )}
          >
            {courseGrade === null ? "—" : formatGrade(courseGrade)}
          </p>
          {isEnteredValid && computed !== null && computed !== courseGrade && (
            <p className="text-muted-foreground text-xs">
              Calculada: {formatGrade(computed)}
            </p>
          )}
          {partial !== null && (
            <p className="text-muted-foreground text-xs">
              Promedio parcial: {formatGrade(Math.round(partial * 100) / 100)}
            </p>
          )}
          {required && (
            <p className="text-xs">
              {required.status === "REACHED"
                ? "Ya alcanzas la nota de aprobación."
                : required.status === "UNREACHABLE"
                  ? "Ya no alcanzas la nota de aprobación."
                  : `Necesitas ${formatGrade(required.grade)} en lo que falta.`}
            </p>
          )}
        </div>
        <div className="w-28 space-y-1 text-xs">
          <label htmlFor={enteredId} className="text-muted-foreground">
            Nota final oficial
          </label>
          <CommitInput
            id={enteredId}
            inputMode="decimal"
            placeholder={computed === null ? "—" : formatGrade(computed)}
            aria-invalid={entered !== undefined && !isEnteredValid}
            value={entered === undefined ? "" : formatGrade(entered)}
            className="text-right tabular-nums"
            onCommit={(text) => {
              const grade = parseGrade(text);
              if (Number.isNaN(grade)) return;
              onChange({ courseGrade: grade ?? undefined });
            }}
          />
        </div>
      </div>

      {courseGrade !== null && status === "PENDING" && (
        <div className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
          <p>
            Con un {formatGrade(courseGrade)}, este curso queda{" "}
            {isPassing ? "aprobado" : "reprobado"}.
          </p>
          <Button
            size="sm"
            variant={isPassing ? "default" : "outline"}
            disabled={isPassing && !isAvailable}
            onClick={() => onSetStatus(isPassing ? "APPROVED" : "FAILED")}
          >
            {isPassing ? "Marcar aprobado" : "Marcar reprobado"}
          </Button>
        </div>
      )}
      {courseGrade !== null &&
        ((status === "APPROVED" && !isPassing) ||
          (status === "FAILED" && isPassing)) && (
          <p className="flex items-center gap-1.5 text-sm text-warning">
            <TriangleAlert className="size-4 shrink-0" />
            {status === "APPROVED"
              ? `Está aprobado con una nota bajo ${formatGrade(scale.passing)}.`
              : `Está reprobado con una nota de ${formatGrade(scale.passing)} o más.`}
          </p>
        )}

      <div className="space-y-2">
        <h3 className="font-medium text-sm">Evaluaciones</h3>
        {assessments.length === 0 && schemeSource && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onChange({ assessments: copyScheme(schemeSource.assessments) })
            }
          >
            <Copy />
            Copiar evaluaciones de {schemeSource.label}
          </Button>
        )}
        <GradingSchemeEditor
          assessments={assessments}
          scale={scale}
          onChange={(next) => onChange({ assessments: next })}
        />
      </div>
    </section>
  );
}
