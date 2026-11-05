"use client";

import { cn } from "cn";
import { Lock, MoreHorizontal, X } from "lucide-react";
import type { ElementType } from "react";
import CourseDetails, {
  Prerequisites,
} from "@/components/trajectory/course-details";
import GradeSummary from "@/components/trajectory/grade-summary";
import GradingSchemeEditor from "@/components/trajectory/grading-scheme-editor";
import StatusControl from "@/components/trajectory/status-control";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import type { Course, Curriculum } from "@/types/curriculum";
import type {
  Enrollment,
  EnrollmentStatus,
  GradesChange,
  GradingScale,
  PanelPrerequisite,
  SchemeSource,
  TrajectoryProgress,
} from "@/types/trajectory";
import {
  formatGrade,
  getCourseGrade,
  getPartialAverage,
  hasRecordedGrades,
  roundGrade,
} from "@/utils/grades";
import { copyScheme } from "@/utils/grading-scheme";

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

function getMissingLabel(prerequisites: PanelPrerequisite[]) {
  const missing = prerequisites.filter((prerequisite) => !prerequisite.isMet);
  const [only] = missing;
  return missing.length === 1 && only
    ? `falta ${only.name}`
    : `faltan ${missing.length} requisitos`;
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

type PanelContentProps = {
  enrollment: Enrollment;
  course: Course;
  curriculum: Curriculum;
  progress: TrajectoryProgress;
  gradingScale: GradingScale;
  schemeSource: SchemeSource | null;
  isAvailable: boolean;
  canOpenCourse: (courseId: number) => boolean;
  onOpenCourse: (courseId: number) => void;
  onSetStatus: (status: EnrollmentStatus) => void;
  onGradesChange: (grades: GradesChange) => void;
  onRetake: (() => void) | null;
  onMove: () => void;
  onRemove: () => void;
  onClose: () => void;
};

export default function CoursePanelContent({
  enrollment,
  course,
  curriculum,
  progress,
  gradingScale: scale,
  schemeSource,
  isAvailable,
  isDrawer,
  isPeek,
  Title,
  Description,
  canOpenCourse,
  onOpenCourse,
  onSetStatus,
  onGradesChange,
  onRetake,
  onMove,
  onRemove,
  onClose,
}: PanelContentProps & {
  isDrawer: boolean;
  isPeek: boolean;
  Title: ElementType;
  Description: ElementType;
}) {
  const isLocked = !isAvailable && enrollment.status === "PENDING";
  const hasGrades = hasRecordedGrades(enrollment);
  const prerequisites = getPrerequisites(course, curriculum, progress);
  const successors = curriculum.courses.filter((other) =>
    other.prerequisiteIds.includes(course.id),
  );
  const assessments = enrollment.assessments ?? [];
  const courseGrade = getCourseGrade(enrollment, scale);
  const shownGrade = courseGrade ?? getPartialAverage(assessments, scale);
  const metCount = prerequisites.filter(({ isMet }) => isMet).length;

  const header = (
    <header className="shrink-0 space-y-2.5 pt-3 pr-3 pb-3 pl-5">
      <div className="space-y-0.5">
        <div className="flex items-start gap-1.5">
          <Title
            className={cn(
              "min-w-0 flex-1 font-heading font-semibold text-foreground text-lg leading-snug",
              isPeek && "truncate",
            )}
          >
            {course.name}
          </Title>
          {isPeek && shownGrade !== null && (
            <span
              className={cn(
                "shrink-0 px-1 font-heading font-semibold text-lg tabular-nums",
                courseGrade !== null &&
                  (courseGrade >= scale.passing
                    ? "text-success"
                    : "text-destructive"),
              )}
            >
              {formatGrade(roundGrade(shownGrade))}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Más acciones"
                  className="shrink-0 text-muted-foreground"
                />
              }
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onMove}>Mover a…</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={onRemove}>
                Quitar de mi malla
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {!isDrawer && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Cerrar"
              className="shrink-0 text-muted-foreground"
              onClick={onClose}
            >
              <X />
            </Button>
          )}
        </div>
        <Description className="truncate text-muted-foreground text-xs">
          {[
            course.code,
            `${course.credits} ${course.credits === 1 ? "crédito" : "créditos"}`,
            prerequisites.length > 0 &&
              `Requiere ${metCount}/${prerequisites.length}`,
            successors.length > 0 && `Habilita ${successors.length}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Description>
      </div>
      <div className="flex flex-wrap items-center gap-2 pr-2">
        {isLocked ? (
          <p className="flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-muted px-2.5 text-muted-foreground text-xs">
            <Lock className="size-3 shrink-0" />
            <span className="truncate">
              Bloqueado · {getMissingLabel(prerequisites)}
            </span>
          </p>
        ) : (
          <StatusControl
            status={enrollment.status}
            isAvailable={isAvailable}
            onChange={onSetStatus}
          />
        )}
        {onRetake && (
          <Button size="sm" className="h-9 shrink-0" onClick={onRetake}>
            Recursar
          </Button>
        )}
      </div>
    </header>
  );

  if (isLocked && !hasGrades)
    return (
      <>
        {header}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto border-t px-5 pt-3 pb-[calc(1.25rem+var(--drawer-snap-point-offset,0px))]">
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
      </>
    );

  const summary = (
    <div
      className={cn(
        "flex shrink-0 flex-row flex-wrap items-center gap-0 bg-muted/50 py-3 pr-4 pl-5",
        isDrawer ? "border-y" : "border-t",
      )}
    >
      {isLocked ? (
        <>
          <p className="flex min-w-0 flex-1 items-center gap-2 pr-2 text-muted-foreground text-sm">
            <Lock className="size-3.5 shrink-0" />
            {getLockedHint(prerequisites)}
          </p>
          {shownGrade !== null && (
            <span className="shrink-0 px-2 font-heading font-semibold text-3xl text-muted-foreground tabular-nums">
              {formatGrade(roundGrade(shownGrade))}
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
    </div>
  );

  return (
    <>
      {header}
      {isDrawer && summary}
      <Tabs defaultValue="grades" className="min-h-0 flex-1">
        <TabsList className="shrink-0 px-5 pt-2">
          <TabsTab value="grades">Calificaciones</TabsTab>
          <TabsTab value="details">Detalles</TabsTab>
        </TabsList>
        <TabsPanel
          value="grades"
          className="min-h-0 flex-1 overflow-y-auto pb-[var(--drawer-snap-point-offset,0px)]"
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
          className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-[calc(0.75rem+var(--drawer-snap-point-offset,0px))]"
        >
          <CourseDetails
            course={course}
            curriculum={curriculum}
            prerequisites={prerequisites}
            successors={successors}
            canOpenCourse={canOpenCourse}
            onOpenCourse={onOpenCourse}
          />
        </TabsPanel>
      </Tabs>
      {!isDrawer && summary}
    </>
  );
}
