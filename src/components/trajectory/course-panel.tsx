"use client";

import { cn } from "cn";
import {
  Check,
  ChevronRight,
  Circle,
  Lock,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  X,
} from "lucide-react";
import {
  type ElementType,
  type FocusEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { getCourseColor } from "@/builder/colors";
import CommitInput from "@/components/trajectory/commit-input";
import { STATUS_LABELS } from "@/components/trajectory/enrollment-card";
import GradingSchemeEditor from "@/components/trajectory/grading-scheme-editor";
import StatusControl from "@/components/trajectory/status-control";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerVirtualKeyboardProvider,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
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
  getSuggestedStatus,
  hasRecordedGrades,
  isValidGrade,
  parseGrade,
  roundGrade,
} from "@/utils/grades";
import { copyScheme } from "@/utils/grading-scheme";

export type SchemeSource = { label: string; assessments: Assessment[] };

export type PanelSnapPoint = number | string | null;

type GradesChange = Partial<Pick<Enrollment, "assessments" | "courseGrade">>;

const PEEK_HEIGHT_REM = 8;

export const PEEK_SNAP_POINT = `${PEEK_HEIGHT_REM}rem`;
const HALF_SNAP_POINT = 0.6;
export const FULL_SNAP_POINT = 1;
const SNAP_POINTS = [PEEK_SNAP_POINT, HALF_SNAP_POINT, FULL_SNAP_POINT];

export function getPanelHeight(snapPoint: PanelSnapPoint) {
  if (typeof snapPoint === "number") return snapPoint * window.innerHeight;
  if (snapPoint === null) return 0;
  const rootFontSize = Number.parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );
  return PEEK_HEIGHT_REM * rootFontSize;
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

export default function CoursePanel({
  open,
  snapPoint,
  enrollment,
  course,
  onSnapPointChange,
  onOpenChange,
  ...props
}: Omit<PanelContentProps, "enrollment" | "course" | "onClose"> & {
  open: boolean;
  snapPoint: PanelSnapPoint;
  enrollment: Enrollment | null;
  course: Course | null;
  onSnapPointChange: (snapPoint: PanelSnapPoint) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const panelContentProps =
    enrollment && course
      ? {
          ...props,
          enrollment,
          course,
          onClose: () => onOpenChange(false),
        }
      : null;

  if (isMobile)
    return (
      <CourseDrawer
        open={open}
        snapPoint={snapPoint}
        onSnapPointChange={onSnapPointChange}
        onOpenChange={onOpenChange}
      >
        {panelContentProps && (
          <PanelContent
            key={panelContentProps.enrollment.id}
            {...panelContentProps}
            isDrawer
            isPeek={snapPoint === PEEK_SNAP_POINT}
            Title={DrawerTitle}
            Description={DrawerDescription}
          />
        )}
      </CourseDrawer>
    );

  return open && panelContentProps ? (
    <aside
      aria-label="Curso seleccionado"
      className="fade-in slide-in-from-right-2 flex w-96 shrink-0 animate-in flex-col overflow-hidden border-l bg-popover text-sm duration-200 ease-out motion-reduce:animate-none"
    >
      <PanelContent
        key={panelContentProps.enrollment.id}
        {...panelContentProps}
        isDrawer={false}
        isPeek={false}
        Title="h2"
        Description="p"
      />
    </aside>
  ) : null;
}

function CourseDrawer({
  open,
  snapPoint,
  onSnapPointChange,
  onOpenChange,
  children,
}: {
  open: boolean;
  snapPoint: PanelSnapPoint;
  onSnapPointChange: (snapPoint: PanelSnapPoint) => void;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const popupRef = useRef<HTMLDivElement>(null);
  const isFull = open && snapPoint === FULL_SNAP_POINT;
  const isPeek = open && snapPoint === PEEK_SNAP_POINT;

  useEffect(() => {
    if (!isPeek) return;
    const { style } = document.documentElement;
    style.setProperty("--toast-inset", PEEK_SNAP_POINT);
    return () => {
      style.removeProperty("--toast-inset");
    };
  }, [isPeek]);

  return (
    <>
      <Drawer
        open={open}
        modal={isFull ? "trap-focus" : false}
        disablePointerDismissal
        snapPoints={SNAP_POINTS}
        snapPoint={snapPoint}
        onSnapPointChange={onSnapPointChange}
        onOpenChange={onOpenChange}
      >
        <DrawerVirtualKeyboardProvider>
          <DrawerContent
            ref={popupRef}
            initialFocus={popupRef}
            finalFocus={false}
            onFocusCapture={(event) => {
              if (event.target instanceof HTMLInputElement)
                onSnapPointChange(FULL_SNAP_POINT);
            }}
          >
            <DrawerClose className="sr-only">Cerrar</DrawerClose>
            {children}
          </DrawerContent>
        </DrawerVirtualKeyboardProvider>
      </Drawer>
      {open &&
        createPortal(
          <button
            type="button"
            tabIndex={-1}
            aria-label="Reducir"
            className={cn(
              "fixed inset-0 z-40 bg-black/30 opacity-0 transition-opacity duration-300 ease-out",
              isFull ? "opacity-100" : "pointer-events-none",
            )}
            onClick={() => onSnapPointChange(HALF_SNAP_POINT)}
          />,
          document.body,
        )}
    </>
  );
}

function PanelContent({
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
          <TabsTab value="grades">Notas</TabsTab>
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
          <Details
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

function RelationRow({
  name,
  icon,
  detail,
  isDimmed = false,
  onOpen,
}: {
  name: string;
  icon?: React.ReactNode;
  detail?: string;
  isDimmed?: boolean;
  onOpen?: () => void;
}) {
  const content = (
    <>
      {icon}
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          isDimmed && "text-muted-foreground",
        )}
      >
        {name}
      </span>
      {detail && (
        <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
          {detail}
        </span>
      )}
      {onOpen && (
        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
      )}
    </>
  );

  return onOpen ? (
    <button
      type="button"
      className="flex min-h-10 w-full items-center gap-2.5 text-left"
      onClick={onOpen}
    >
      {content}
    </button>
  ) : (
    <div className="flex min-h-10 items-center gap-2.5">{content}</div>
  );
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
        <li key={key}>
          <RelationRow
            name={name}
            detail={detail}
            isDimmed={isMet}
            icon={
              isMet ? (
                <Check
                  aria-label="Cumplido"
                  className="size-3.5 shrink-0 text-success"
                />
              ) : (
                <Circle
                  aria-label="Pendiente"
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
              )
            }
            onOpen={
              courseId !== undefined && canOpenCourse(courseId)
                ? () => onOpenCourse(courseId)
                : undefined
            }
          />
        </li>
      ))}
    </ul>
  );
}

function Details({
  course,
  curriculum,
  prerequisites,
  successors,
  canOpenCourse,
  onOpenCourse,
}: {
  course: Course;
  curriculum: Curriculum;
  prerequisites: PanelPrerequisite[];
  successors: Course[];
  canOpenCourse: (courseId: number) => boolean;
  onOpenCourse: (courseId: number) => void;
}) {
  const area = curriculum.areas.find(({ id }) => id === course.areaId);

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
              <li key={other.id}>
                <RelationRow
                  name={other.name}
                  onOpen={
                    canOpenCourse(other.id)
                      ? () => onOpenCourse(other.id)
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
        )}
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
