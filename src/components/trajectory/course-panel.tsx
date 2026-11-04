"use client";

import { cn } from "cn";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Circle,
  Lock,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { type FocusEvent, useRef, useState } from "react";
import { getCourseColor } from "@/builder/colors";
import CommitInput from "@/components/trajectory/commit-input";
import { STATUS_LABELS } from "@/components/trajectory/enrollment-card";
import GradingSchemeEditor from "@/components/trajectory/grading-scheme-editor";
import {
  AdaptiveDialog,
  AdaptiveDialogClose,
  AdaptiveDialogContent,
  AdaptiveDialogDescription,
  AdaptiveDialogFooter,
  AdaptiveDialogHeader,
  AdaptiveDialogTitle,
} from "@/components/ui/adaptive-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
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
  hasRecordedGrades,
  isValidGrade,
  parseGrade,
  roundGrade,
} from "@/utils/grades";
import { copyScheme } from "@/utils/grading-scheme";

export type SchemeSource = { label: string; assessments: Assessment[] };

type GradesChange = Partial<Pick<Enrollment, "assessments" | "courseGrade">>;

const STATUS_ORDER: EnrollmentStatus[] = ["FAILED", "PENDING", "APPROVED"];

const STATUS_DOT: Partial<Record<EnrollmentStatus, string>> = {
  APPROVED: "bg-success",
  FAILED: "bg-destructive",
};

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
  canOpenCourse,
  onOpenChange,
  onOpenCourse,
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
  canOpenCourse: (courseId: number) => boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCourse: (courseId: number) => void;
  onSetStatus: (status: EnrollmentStatus) => void;
  onGradesChange: (grades: GradesChange) => void;
  onRemove: () => void;
}) {
  const popupRef = useRef<HTMLDivElement>(null);

  return (
    <AdaptiveDialog open={open} onOpenChange={onOpenChange}>
      <AdaptiveDialogContent
        ref={popupRef}
        initialFocus={popupRef}
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-130"
      >
        {course && enrollment && (
          <PanelContent
            key={enrollment.id}
            enrollment={enrollment}
            course={course}
            curriculum={curriculum}
            progress={progress}
            scale={gradingScale}
            schemeSource={schemeSource}
            isAvailable={isAvailable}
            isEditing={isEditing}
            canOpenCourse={canOpenCourse}
            onOpenCourse={onOpenCourse}
            onSetStatus={onSetStatus}
            onGradesChange={onGradesChange}
            onRemove={onRemove}
          />
        )}
      </AdaptiveDialogContent>
    </AdaptiveDialog>
  );
}

function PanelContent({
  enrollment,
  course,
  curriculum,
  progress,
  scale,
  schemeSource,
  isAvailable,
  isEditing,
  canOpenCourse,
  onOpenCourse,
  onSetStatus,
  onGradesChange,
  onRemove,
}: {
  enrollment: Enrollment;
  course: Course;
  curriculum: Curriculum;
  progress: TrajectoryProgress;
  scale: GradingScale;
  schemeSource: SchemeSource | null;
  isAvailable: boolean;
  isEditing: boolean;
  canOpenCourse: (courseId: number) => boolean;
  onOpenCourse: (courseId: number) => void;
  onSetStatus: (status: EnrollmentStatus) => void;
  onGradesChange: (grades: GradesChange) => void;
  onRemove: () => void;
}) {
  const isLocked = !isAvailable && enrollment.status === "PENDING";
  const hasGrades = hasRecordedGrades(enrollment);
  const prerequisites = getPrerequisites(course, curriculum, progress);
  const assessments = enrollment.assessments ?? [];
  const lockedGrade =
    getCourseGrade(enrollment, scale) ?? getPartialAverage(assessments, scale);

  const removeButton = isEditing && (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2.5 text-destructive hover:text-destructive"
      onClick={onRemove}
    >
      <Trash2 />
      Quitar de mi malla
    </Button>
  );

  return (
    <>
      <AdaptiveDialogHeader className="shrink-0 flex-row items-start justify-between gap-3 pt-5 pr-4 pb-3 pl-6 text-left group-data-[swipe-axis=y]/drawer-popup:text-left">
        <div className="min-w-0 space-y-1.5">
          <AdaptiveDialogTitle className="font-semibold text-xl leading-tight">
            {course.name}
          </AdaptiveDialogTitle>
          <AdaptiveDialogDescription>
            {[
              course.code,
              `${course.credits} ${course.credits === 1 ? "crédito" : "créditos"}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </AdaptiveDialogDescription>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isLocked ? (
            <span className="flex h-7 items-center gap-1.5 rounded-lg bg-muted px-2.5 font-medium text-muted-foreground text-xs">
              <Lock className="size-3" />
              Bloqueado
            </span>
          ) : (
            <StatusMenu
              status={enrollment.status}
              isAvailable={isAvailable}
              onSetStatus={onSetStatus}
            />
          )}
          <AdaptiveDialogClose
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Cerrar" />
            }
          >
            <X />
          </AdaptiveDialogClose>
        </div>
      </AdaptiveDialogHeader>

      {isLocked && !hasGrades ? (
        <>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 pt-3 pb-5">
            <div className="space-y-1 text-sm">
              <p className="font-medium">Aún no puedes cursarlo</p>
              <p className="text-muted-foreground">
                Podrás ingresar notas cuando cumplas estos requisitos.
              </p>
            </div>
            <Prerequisites
              prerequisites={prerequisites}
              canOpenCourse={canOpenCourse}
              onOpenCourse={onOpenCourse}
            />
          </div>
          {removeButton && (
            <AdaptiveDialogFooter className="mx-0 mb-0 shrink-0 flex-row items-center justify-start border-t bg-muted/50 px-6 py-2.5 sm:justify-start">
              {removeButton}
            </AdaptiveDialogFooter>
          )}
        </>
      ) : (
        <>
          <Tabs defaultValue="grades" className="min-h-0 flex-1">
            <TabsList className="shrink-0 px-6 pt-2">
              <TabsTab value="grades">Notas</TabsTab>
              <TabsTab value="details">Detalles</TabsTab>
            </TabsList>
            <TabsPanel
              value="grades"
              className="min-h-0 flex-1 overflow-y-auto sm:max-h-[60vh] sm:min-h-72"
            >
              <GradingSchemeEditor
                assessments={assessments}
                scale={scale}
                isReadOnly={isLocked}
                copySource={
                  schemeSource && !isLocked
                    ? {
                        label: schemeSource.label,
                        onCopy: () =>
                          onGradesChange({
                            assessments: copyScheme(schemeSource.assessments),
                          }),
                      }
                    : undefined
                }
                onChange={(next) => onGradesChange({ assessments: next })}
              />
            </TabsPanel>
            <TabsPanel
              value="details"
              className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pt-5 pb-3 sm:max-h-[60vh] sm:min-h-72"
            >
              <Details
                course={course}
                curriculum={curriculum}
                prerequisites={prerequisites}
                canOpenCourse={canOpenCourse}
                onOpenCourse={onOpenCourse}
              />
              {removeButton && <div className="mt-auto">{removeButton}</div>}
            </TabsPanel>
          </Tabs>
          <AdaptiveDialogFooter className="mx-0 mb-0 shrink-0 flex-row flex-wrap items-center justify-start gap-0 border-t bg-muted/50 py-3.5 pr-4 pl-6 sm:justify-start">
            {isLocked ? (
              <>
                <p className="flex min-w-0 flex-1 items-center gap-2 pr-2 text-muted-foreground text-sm">
                  <Lock className="size-3.5 shrink-0" />
                  {getLockedHint(prerequisites)}
                </p>
                {lockedGrade !== null && (
                  <span className="shrink-0 px-2 font-heading font-semibold text-3xl text-muted-foreground tabular-nums">
                    {formatGrade(roundGrade(lockedGrade))}
                  </span>
                )}
              </>
            ) : (
              <GradeSummary
                enrollment={enrollment}
                scale={scale}
                onChange={onGradesChange}
                onSetStatus={onSetStatus}
              />
            )}
          </AdaptiveDialogFooter>
        </>
      )}
    </>
  );
}

function StatusMenu({
  status,
  isAvailable,
  onSetStatus,
}: {
  status: EnrollmentStatus;
  isAvailable: boolean;
  onSetStatus: (status: EnrollmentStatus) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" aria-label="Estado" />}
      >
        <StatusDot status={status} />
        <span className="capitalize">{STATUS_LABELS[status]}</span>
        <ChevronDown className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup
          value={status}
          onValueChange={(next: EnrollmentStatus) => onSetStatus(next)}
        >
          {STATUS_ORDER.map((option) => (
            <DropdownMenuRadioItem
              key={option}
              value={option}
              disabled={option === "APPROVED" && !isAvailable}
            >
              <span className="flex size-3 items-center justify-center">
                <StatusDot status={option} />
              </span>
              <span className="capitalize">{STATUS_LABELS[option]}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusDot({ status }: { status: EnrollmentStatus }) {
  const color = STATUS_DOT[status];
  return color ? (
    <span aria-hidden className={cn("size-1.75 rounded-full", color)} />
  ) : null;
}

type PanelPrerequisite = {
  key: string;
  name: string;
  isMet: boolean;
  courseId?: number;
  detail?: string;
};

function getPrerequisites(
  course: Course,
  curriculum: Curriculum,
  progress: TrajectoryProgress,
): PanelPrerequisite[] {
  const prerequisites: PanelPrerequisite[] = course.prerequisiteIds.flatMap(
    (id) => {
      const prerequisite = curriculum.courses.find((other) => other.id === id);
      if (!prerequisite) return [];
      return {
        key: `course-${id}`,
        name: prerequisite.name,
        isMet: progress.approvedCourseIds.has(id),
        courseId: id,
      };
    },
  );
  if (course.prerequisiteCredits > 0) {
    const isMet = course.prerequisiteCredits <= progress.approvedCredits;
    prerequisites.push({
      key: "credits",
      name: `${course.prerequisiteCredits} créditos aprobados`,
      isMet,
      detail: isMet
        ? undefined
        : `${progress.approvedCredits} de ${course.prerequisiteCredits}`,
    });
  }
  return prerequisites;
}

function getLockedHint(prerequisites: PanelPrerequisite[]) {
  const missing = prerequisites.filter((prerequisite) => !prerequisite.isMet);
  const [only] = missing;
  const goal =
    missing.length === 1 && only?.courseId !== undefined
      ? `apruebes ${only.name}`
      : "cumplas los requisitos";
  return `Tus notas siguen guardadas. Volverás a editarlas cuando ${goal}.`;
}

function Prerequisites({
  prerequisites,
  canOpenCourse,
  onOpenCourse,
}: {
  prerequisites: PanelPrerequisite[];
  canOpenCourse: (courseId: number) => boolean;
  onOpenCourse: (courseId: number) => void;
}) {
  if (prerequisites.length === 0)
    return <p className="text-muted-foreground text-sm">Ninguno</p>;

  return (
    <ul className="text-sm">
      {prerequisites.map(({ key, name, isMet, courseId, detail }) => (
        <li key={key} className="flex min-h-9 items-center gap-2.5">
          {isMet ? (
            <Check
              aria-label="Cumplido"
              className="size-3.5 shrink-0 text-success"
            />
          ) : (
            <Circle
              aria-label="Pendiente"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          )}
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              isMet && "text-muted-foreground",
            )}
          >
            {name}
          </span>
          {detail && (
            <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
              {detail}
            </span>
          )}
          {courseId !== undefined && !isMet && canOpenCourse(courseId) && (
            <Button
              variant="ghost"
              size="xs"
              className="-mr-2 shrink-0 text-muted-foreground"
              onClick={() => onOpenCourse(courseId)}
            >
              Ver curso
              <ArrowUpRight />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

function Details({
  course,
  curriculum,
  prerequisites,
  canOpenCourse,
  onOpenCourse,
}: {
  course: Course;
  curriculum: Curriculum;
  prerequisites: PanelPrerequisite[];
  canOpenCourse: (courseId: number) => boolean;
  onOpenCourse: (courseId: number) => void;
}) {
  const area = curriculum.areas.find(({ id }) => id === course.areaId);
  const successors = curriculum.courses.filter((other) =>
    other.prerequisiteIds.includes(course.id),
  );

  return (
    <div className="space-y-5 text-sm">
      <div className="space-y-1.5">
        <h3 className="text-muted-foreground">Área</h3>
        <p className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-[3px] ring-1 ring-foreground/15"
            style={{ backgroundColor: getCourseColor(curriculum, course) }}
          />
          <span className="truncate">{area?.name ?? "Sin área"}</span>
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="min-w-0 space-y-1">
          <h3 className="text-muted-foreground">Requiere</h3>
          <Prerequisites
            prerequisites={prerequisites}
            canOpenCourse={canOpenCourse}
            onOpenCourse={onOpenCourse}
          />
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className="text-muted-foreground">Habilita</h3>
          {successors.length === 0 ? (
            <p className="text-muted-foreground">Ninguno</p>
          ) : (
            <ul>
              {successors.map((other) => (
                <li key={other.id} className="flex min-h-9 items-center">
                  <span className="truncate">{other.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

type Tone = "muted" | "success" | "warning" | "destructive";

const TONE_CLASS: Record<Tone, string> = {
  muted: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

function GradeSummary({
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
  const suggestion: EnrollmentStatus | null =
    courseGrade !== null && status === "PENDING"
      ? isPassing
        ? "APPROVED"
        : "FAILED"
      : null;

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
