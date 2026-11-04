"use client";

import {
  type DragEndEvent,
  type DragMoveEvent,
  Feedback,
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
} from "@dnd-kit/dom";
import { DragDropProvider } from "@dnd-kit/react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { cn } from "cn";
import { ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getCourseColor } from "@/builder/colors";
import AddButton from "@/components/builder/add-button";
import ConnectionsOverlay from "@/components/curriculum/connections-overlay";
import AddEnrollmentDialog from "@/components/trajectory/add-enrollment-dialog";
import ClosePeriodDialog from "@/components/trajectory/close-period-dialog";
import CoursePanel, {
  FULL_SNAP_POINT,
  getPanelHeight,
  type PanelSnapPoint,
  PEEK_SNAP_POINT,
  type SchemeSource,
} from "@/components/trajectory/course-panel";
import EnrollmentCard, {
  STATUS_LABELS,
} from "@/components/trajectory/enrollment-card";
import MoveEnrollmentDialog from "@/components/trajectory/move-enrollment-dialog";
import PassedPeriodsDialog from "@/components/trajectory/passed-periods-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { useGridGesture } from "@/hooks/use-grid-gesture";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConnectionFocus } from "@/stores/connections";
import type { Course, Curriculum } from "@/types/builder";
import type { PeriodKey } from "@/types/curriculum";
import type {
  ChangeNotice,
  Enrollment,
  EnrollmentStatus,
  Entry,
  GradingScale,
  Placement,
} from "@/types/trajectory";
import { extendCourses } from "@/utils/curriculum";
import {
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
  getEmptyCells,
  getRowCount,
  HEADER_ROWS,
} from "@/utils/curriculum-grid";
import {
  formatGrade,
  getCourseGrade,
  getSuggestedStatus,
  roundGrade,
} from "@/utils/grades";
import { parsePeriodKey } from "@/utils/period-key";
import {
  addEnrollment,
  approveThroughPeriod,
  type EditError,
  getAddableCourses,
  getMoveConflict,
  getNextPeriod,
  getPeriodEndRow,
  getPeriodInfo,
  getProgress,
  isAvailable,
  layOutTrajectory,
  MAX_ENROLLMENTS_PER_PERIOD,
  moveEnrollment,
  type PlacedEnrollment,
  removeEnrollment,
  retakeEnrollment,
  setEnrollmentStatus,
  setEnrollmentStatuses,
  toLayoutCurriculum,
} from "@/utils/trajectory";

const DRAG_ACTIVATION_DISTANCE = 5;
const TOUCH_HOLD_MS = 300;
const TOUCH_HOLD_TOLERANCE = 8;
const ROOT_FONT_SIZE = 16;
const DRAG_CLICK_MS = 300;
const ENTER_STAGGER_MS = 30;
const ENTER_MS = 300;
const PREVIOUS_PERIOD_PEEK_REM = 2.5;
const REVEAL_MARGIN_REM = 1;

const sensors = [
  PointerSensor.configure({
    activationConstraints: (event) =>
      event.pointerType === "touch"
        ? [
            new PointerActivationConstraints.Delay({
              value: TOUCH_HOLD_MS,
              tolerance: TOUCH_HOLD_TOLERANCE,
            }),
          ]
        : [
            new PointerActivationConstraints.Distance({
              value: DRAG_ACTIVATION_DISTANCE,
            }),
          ],
  }),
  KeyboardSensor.configure({
    offset: {
      x: (GRID_CELL_WIDTH + GRID_GAP) * ROOT_FONT_SIZE,
      y: (GRID_CELL_HEIGHT + GRID_GAP) * ROOT_FONT_SIZE,
    },
    keyboardCodes: {
      start: ["Space"],
      cancel: ["Escape", "Tab"],
      end: ["Space"],
      up: ["ArrowUp"],
      down: ["ArrowDown"],
      left: ["ArrowLeft"],
      right: ["ArrowRight"],
    },
  }),
];

const EDIT_ERROR_DESCRIPTIONS: Record<EditError, string> = {
  PERIOD_FULL: `Un periodo no puede tener más de ${MAX_ENROLLMENTS_PER_PERIOD} cursos.`,
  DUPLICATE_COURSE: "Este periodo ya tiene este curso.",
  SUCCESSOR_IN_PERIOD: "Este periodo tiene un curso que lo requiere.",
  PREREQUISITE_IN_PERIOD: "Este periodo tiene uno de sus prerrequisitos.",
  SUCCESSOR_ON_THE_WAY: "Hay un curso que lo requiere en el camino.",
  PREREQUISITE_ON_THE_WAY: "Hay uno de sus prerrequisitos en el camino.",
};

type Gesture = { dragId: string; placement: Placement };
type PeriodClosing = { period: PeriodKey; isOpen: boolean };

function getStatusNotice(title: string, revertedCount: number): ChangeNotice {
  if (revertedCount === 0) return { title };
  return {
    title,
    description:
      revertedCount === 1
        ? "1 curso que lo requería volvió a pendiente."
        : `${revertedCount} cursos que lo requerían volvieron a pendiente.`,
    isShownOnDesktop: true,
  };
}

function showEditError(title: string, error: EditError) {
  toast.add({
    type: "error",
    title,
    description: EDIT_ERROR_DESCRIPTIONS[error],
  });
}

export default function TrajectoryBoard({
  enrollments,
  entry,
  curriculum,
  gradingScale,
  isNew,
  onChange,
}: {
  enrollments: Enrollment[];
  entry: Entry;
  curriculum: Curriculum;
  gradingScale: GradingScale;
  isNew: boolean;
  onChange: (enrollments: Enrollment[], notice?: ChangeNotice) => void;
}) {
  const isMobile = useIsMobile();
  const { firstCellRef, getCellUnder, keepDropOrigin, takeDropOrigin } =
    useGridGesture();
  const sectionRef = useRef<HTMLElement>(null);
  const lastDragEndAt = useRef(Number.NEGATIVE_INFINITY);
  const isDragging = useRef(false);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [panelId, setPanelId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [snapPoint, setSnapPoint] = useState<PanelSnapPoint>(PEEK_SNAP_POINT);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [periodClosing, setPeriodClosing] = useState<PeriodClosing | null>(
    null,
  );
  const [isAskingPassedPeriods, setIsAskingPassedPeriods] = useState(isNew);
  const selectedId = isPanelOpen ? panelId : null;
  const [addPlacement, setAddPlacement] = useState<Placement | null>(null);
  const [isEntering, setIsEntering] = useState(true);

  const context = { entry, curriculum };
  const courses = extendCourses(curriculum.courses);
  const progress = getProgress(enrollments, courses);
  const addableCourses = getAddableCourses(courses, enrollments);

  const base = layOutTrajectory(enrollments, context);
  const nextPeriod = getNextPeriod(base.periods);
  const gesturePeriods = nextPeriod
    ? [...base.periods, nextPeriod]
    : base.periods;
  const preview = gesture
    ? moveEnrollment(enrollments, gesture.dragId, gesture.placement, context)
    : null;
  const shown = gesture
    ? layOutTrajectory(
        preview?.enrollments ?? enrollments,
        context,
        gesturePeriods,
      )
    : base;
  const baseCardsById = new Map(base.cards.map((card) => [card.id, card]));
  const draggedCard = gesture ? baseCardsById.get(gesture.dragId) : undefined;
  const landing = gesture
    ? preview?.error
      ? draggedCard && {
          column: shown.periods.indexOf(gesture.placement.period) + 1,
          row: gesture.placement.row,
          duration: draggedCard.duration,
          height: draggedCard.height,
        }
      : shown.cards.find((card) => card.id === gesture.dragId)
    : undefined;

  const columns = shown.periods.length;
  const rows = getRowCount(shown.cards);

  const selected = shown.cards.find((card) => card.id === selectedId) ?? null;
  const panelCard = base.cards.find((card) => card.id === panelId) ?? null;
  const startsNoConnection = new Set(
    shown.cards
      .filter(
        (card) => card.enrollment.status === "FAILED" && card.id !== selectedId,
      )
      .map((card) => card.id),
  );
  const layoutCurriculum = toLayoutCurriculum(curriculum, shown, shown.cards);
  const missingIdsOfSelected =
    selected && isBlocked(selected)
      ? new Set(
          selected.course.prerequisiteIds.filter(
            (id) => !progress.approvedCourseIds.has(id),
          ),
        )
      : null;
  const moveConflicts = new Map(
    draggingId
      ? gesturePeriods.map((period) => [
          period,
          getMoveConflict(enrollments, draggingId, period, context),
        ])
      : [],
  );
  const blockerIds = new Set(
    gesture ? moveConflicts.get(gesture.placement.period)?.blockerIds : [],
  );
  const [firstVisibleColumn] = useState(
    () =>
      Math.max(
        0,
        base.periods.findLastIndex(
          (period) => getPeriodInfo(period, entry).hasStarted,
        ),
      ) + 1,
  );
  const panelColumn = panelCard?.column;
  const panelRow = panelCard?.row;
  const panelDuration = panelCard?.duration;
  const panelHeight = panelCard?.height;

  useEffect(() => {
    const timeout = setTimeout(
      () => setIsEntering(false),
      ENTER_STAGGER_MS * base.periods.length + ENTER_MS,
    );
    return () => clearTimeout(timeout);
  }, [base.periods.length]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const firstCell = firstCellRef.current;
    if (!section || !firstCell) return;
    const rootFontSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    const column = (firstVisibleColumn - 1) * (GRID_CELL_WIDTH + GRID_GAP);
    section.scrollLeft +=
      firstCell.getBoundingClientRect().left -
      section.getBoundingClientRect().left +
      (column - PREVIOUS_PERIOD_PEEK_REM) * rootFontSize;
  }, [firstCellRef, firstVisibleColumn]);

  useEffect(() => {
    const section = sectionRef.current;
    const firstCell = firstCellRef.current;
    if (
      !isPanelOpen ||
      snapPoint === FULL_SNAP_POINT ||
      !section ||
      !firstCell ||
      panelColumn === undefined ||
      panelRow === undefined ||
      panelDuration === undefined ||
      panelHeight === undefined
    )
      return;

    const rem = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    const sectionRect = section.getBoundingClientRect();
    const cellRect = firstCell.getBoundingClientRect();
    const stepX = (GRID_CELL_WIDTH + GRID_GAP) * rem;
    const stepY = (GRID_CELL_HEIGHT + GRID_GAP) * rem;
    const margin = REVEAL_MARGIN_REM * rem;
    const left =
      cellRect.left -
      sectionRect.left +
      section.scrollLeft +
      (panelColumn - 1) * stepX;
    const top =
      cellRect.top -
      sectionRect.top +
      section.scrollTop +
      (panelRow - 1) * stepY;
    const right = left + panelDuration * stepX - GRID_GAP * rem;
    const bottom = top + panelHeight * stepY - GRID_GAP * rem;
    const visibleHeight = isMobile
      ? Math.min(
          section.clientHeight,
          window.innerHeight - getPanelHeight(snapPoint) - sectionRect.top,
        )
      : section.clientHeight;

    section.scrollTo({
      left:
        left - margin < section.scrollLeft
          ? left - margin
          : right + margin > section.scrollLeft + section.clientWidth
            ? right + margin - section.clientWidth
            : section.scrollLeft,
      top:
        top - margin < section.scrollTop
          ? top - margin
          : bottom + margin > section.scrollTop + visibleHeight
            ? bottom + margin - visibleHeight
            : section.scrollTop,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [
    firstCellRef,
    isMobile,
    isPanelOpen,
    panelColumn,
    panelDuration,
    panelHeight,
    panelRow,
    snapPoint,
  ]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !isPanelOpen) return;
    function closeOnEmptyClick(event: MouseEvent) {
      if (
        performance.now() - lastDragEndAt.current < DRAG_CLICK_MS ||
        (event.target instanceof Element &&
          event.target.closest("button, [data-course-card]"))
      )
        return;
      setIsPanelOpen(false);
    }
    section.addEventListener("click", closeOnEmptyClick);
    return () => section.removeEventListener("click", closeOnEmptyClick);
  }, [isPanelOpen]);

  useHotkey("Escape", () => setIsPanelOpen(false), {
    enabled: isPanelOpen && !isMobile,
  });

  const emptyCells =
    isMobile || isPanelOpen
      ? []
      : getEmptyCells(shown.cards, { rows, columns }).flatMap((cell) => {
          const period = shown.periods[cell.column - 1];
          return period ? [{ ...cell, period }] : [];
        });
  const passedPeriodOptions = base.periods.flatMap((period) => {
    const { hasStarted, isCurrent } = getPeriodInfo(period, entry);
    return hasStarted && !isCurrent
      ? [{ period, label: getPeriodLabel(period) }]
      : [];
  });
  const moveOptions = panelCard
    ? gesturePeriods.map((period) => {
        const conflict = getMoveConflict(
          enrollments,
          panelCard.id,
          period,
          context,
        );
        return {
          period,
          label: getPeriodLabel(period),
          isCurrent: period === base.periods[panelCard.column - 1],
          conflict: conflict && EDIT_ERROR_DESCRIPTIONS[conflict.error],
        };
      })
    : [];
  const closingColumn = periodClosing
    ? base.periods.indexOf(periodClosing.period) + 1
    : null;
  const closingEnrollments = base.cards
    .filter(
      (card) =>
        card.column === closingColumn && card.enrollment.status === "PENDING",
    )
    .map((card) => {
      const grade = getCourseGrade(card.enrollment, gradingScale);
      return {
        id: card.id,
        name: card.course.name,
        grade: grade === null ? null : formatGrade(roundGrade(grade)),
        isAvailable: isAvailable(card.course, progress),
        suggestedStatus: getSuggestedStatus(card.enrollment, gradingScale),
      };
    });

  function isBlocked(card: PlacedEnrollment) {
    return (
      card.enrollment.status === "PENDING" &&
      !isAvailable(card.course, progress)
    );
  }

  function hasPendingEnrollments(column: number) {
    return base.cards.some(
      (card) => card.column === column && card.enrollment.status === "PENDING",
    );
  }

  function addAtPeriodEnd(period: PeriodKey, column: number) {
    setAddPlacement({
      period,
      row: getPeriodEndRow(base.cards, column),
    });
  }

  function getPeriodLabel(period: PeriodKey) {
    const { label } = getPeriodInfo(period, entry);
    return `${label} (${parsePeriodKey(period).year})`;
  }

  // The latest other enrollment of the same course with assessments, whose
  // grading scheme a new attempt can start from.
  function getSchemeSource(card: PlacedEnrollment): SchemeSource | null {
    const source = base.cards
      .filter(
        (other) =>
          other.courseId === card.courseId &&
          other.id !== card.id &&
          (other.enrollment.assessments?.length ?? 0) > 0,
      )
      .sort((a, b) => a.column - b.column)
      .at(-1);
    const period = source && base.periods[source.column - 1];
    return source && period
      ? {
          label: getPeriodLabel(period),
          assessments: source.enrollment.assessments ?? [],
        }
      : null;
  }

  function getMove(operation: DragMoveEvent["operation"]): Gesture | null {
    const card = base.cards.find((card) => card.id === operation.source?.id);
    const rect = operation.shape?.current.boundingRectangle;
    const cell =
      card &&
      rect &&
      getCellUnder(rect, {
        columns: gesturePeriods.length,
        duration: card.duration,
      });
    const period = cell && gesturePeriods[cell.column - 1];
    return card && cell && period
      ? { dragId: card.id, placement: { period, row: cell.row } }
      : null;
  }

  function isSameGesture(next: Gesture) {
    return (
      gesture?.dragId === next.dragId &&
      gesture.placement.period === next.placement.period &&
      gesture.placement.row === next.placement.row
    );
  }

  function openPanel(card: PlacedEnrollment) {
    if (!isPanelOpen) setSnapPoint(PEEK_SNAP_POINT);
    setPanelId(card.id);
    setIsPanelOpen(true);
  }

  function selectCard(card: PlacedEnrollment) {
    if (
      isDragging.current ||
      performance.now() - lastDragEndAt.current < DRAG_CLICK_MS
    )
      return;
    openPanel(card);
  }

  function moveTo(card: PlacedEnrollment, period: PeriodKey) {
    const result = moveEnrollment(
      enrollments,
      card.id,
      {
        period,
        row: getPeriodEndRow(
          base.cards.filter((other) => other.id !== card.id),
          base.periods.indexOf(period) + 1,
        ),
      },
      context,
    );
    if (result.error) {
      showEditError("No se puede mover el curso", result.error);
      return;
    }
    setIsMoveOpen(false);
    onChange(result.enrollments, {
      title: `${card.course.name} movido a ${getPeriodLabel(period)}`,
    });
  }

  function retake(card: PlacedEnrollment) {
    const result = retakeEnrollment(enrollments, card.id, context);
    if (!result) return;
    onChange(result.enrollments, {
      title: `${card.course.name} agregado en ${getPeriodLabel(result.period)}`,
      isShownOnDesktop: true,
    });
  }

  function approvePassedPeriods(period: PeriodKey) {
    const { enrollments: next, approvedCount } = approveThroughPeriod(
      enrollments,
      period,
      context,
    );
    setIsAskingPassedPeriods(false);
    onChange(next, {
      title:
        approvedCount === 1
          ? "1 curso aprobado"
          : `${approvedCount} cursos aprobados`,
      isShownOnDesktop: true,
    });
  }

  function closePeriod(
    period: PeriodKey,
    statuses: Map<string, EnrollmentStatus>,
  ) {
    const result = setEnrollmentStatuses(enrollments, statuses, courses);
    setPeriodClosing({ period, isOpen: false });
    onChange(
      result.enrollments,
      getStatusNotice(
        `${getPeriodLabel(period)} cerrado`,
        result.revertedCount,
      ),
    );
  }

  function handleDragEnd({ operation, canceled }: DragEndEvent) {
    setGesture(null);
    setDraggingId(null);
    useConnectionFocus.getState().setSuspended(false);
    isDragging.current = false;
    lastDragEndAt.current = performance.now();
    const card = base.cards.find((card) => card.id === operation.source?.id);
    if (!card) return;

    const { activatorEvent, transform } = operation;
    const isHoldWithoutMoving =
      activatorEvent instanceof PointerEvent &&
      activatorEvent.pointerType === "touch" &&
      Math.hypot(transform.x, transform.y) < TOUCH_HOLD_TOLERANCE;
    if (isHoldWithoutMoving && !canceled) {
      openPanel(card);
      return;
    }

    const rect = operation.shape?.current.boundingRectangle;
    if (rect) keepDropOrigin(card.id, rect);
    const drop = getMove(operation);
    if (canceled || !drop) return;
    if (
      drop.placement.period === base.periods[card.column - 1] &&
      drop.placement.row === card.row
    )
      return;

    const result = moveEnrollment(
      enrollments,
      card.id,
      drop.placement,
      context,
    );
    if (result.error) {
      showEditError("No se puede mover el curso", result.error);
      return;
    }
    onChange(result.enrollments, { title: `${card.course.name} movido` });
  }

  function handleAdd(placement: Placement, course: Course) {
    const result = addEnrollment(enrollments, course, placement, context);
    if (result.error) {
      showEditError("No se puede agregar el curso", result.error);
      return;
    }
    onChange(result.enrollments, { title: `${course.name} agregado` });
  }

  return (
    <DragDropProvider
      sensors={sensors}
      plugins={(defaults) => [
        ...defaults,
        Feedback.configure({ dropAnimation: null }),
      ]}
      onDragStart={({ operation }) => {
        isDragging.current = true;
        setDraggingId(String(operation.source?.id));
        useConnectionFocus.getState().setSuspended(true);
        if (isMobile && isPanelOpen) setSnapPoint(PEEK_SNAP_POINT);
      }}
      onDragMove={({ operation }) => {
        const next = getMove(operation);
        if (next && !isSameGesture(next)) setGesture(next);
      }}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-0 flex-1">
        <section
          ref={sectionRef}
          aria-label="Mi malla"
          className="min-h-0 min-w-0 flex-1 overflow-auto px-4 pt-4 pb-2 lg:px-8"
          style={
            isMobile && isPanelOpen ? { paddingBottom: "62dvh" } : undefined
          }
        >
          <div
            className="relative grid w-max"
            style={{
              gridTemplateColumns: `repeat(${columns + 1}, ${GRID_CELL_WIDTH}rem)`,
              gridTemplateRows: `auto repeat(${rows}, ${GRID_CELL_HEIGHT}rem)`,
              gap: `${GRID_GAP}rem`,
            }}
          >
            {shown.periods.map((period, index) => {
              const { label, isCurrent, hasStarted } = getPeriodInfo(
                period,
                entry,
              );
              const column = index + 1;
              return (
                <h2
                  key={period}
                  className="min-w-0"
                  style={{ gridColumn: column, gridRow: 1 }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={`Acciones de ${getPeriodLabel(period)}`}
                      className={cn(
                        "flex min-h-7 w-full items-center gap-1.5 rounded-md px-2 py-1 text-left font-semibold text-muted-foreground text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-muted",
                        isCurrent && "text-foreground",
                      )}
                    >
                      <span className="min-w-0 truncate">{label}</span>
                      <span className="font-normal tabular-nums opacity-70">
                        {parsePeriodKey(period).year}
                      </span>
                      <ChevronDown className="ml-auto size-3 shrink-0 opacity-60" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44">
                      <DropdownMenuItem
                        onClick={() => addAtPeriodEnd(period, column)}
                      >
                        Agregar curso
                      </DropdownMenuItem>
                      {hasStarted && hasPendingEnrollments(column) && (
                        <DropdownMenuItem
                          onClick={() =>
                            setPeriodClosing({ period, isOpen: true })
                          }
                        >
                          Cerrar periodo
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </h2>
              );
            })}
            <div
              ref={firstCellRef}
              aria-hidden
              className="pointer-events-none"
              style={{ gridColumn: 1, gridRow: HEADER_ROWS + 1 }}
            />
            {emptyCells.map(({ period, column, row }) => (
              <AddButton
                key={`${column}/${row}`}
                label={`Agregar curso en ${getPeriodLabel(period)}, fila ${row}`}
                revealOnHover
                style={{ gridColumn: column, gridRow: HEADER_ROWS + row }}
                onClick={() => setAddPlacement({ period, row })}
              />
            ))}
            {nextPeriod && (
              <AddButton
                label="Agregar periodo"
                revealOnHover={!isMobile}
                style={{
                  gridColumn: columns + 1,
                  gridRow: isMobile
                    ? HEADER_ROWS + 1
                    : `${HEADER_ROWS + 1} / span ${rows}`,
                }}
                onClick={() => setAddPlacement({ period: nextPeriod, row: 1 })}
              />
            )}
            {!isEntering && (
              <ConnectionsOverlay
                curriculum={layoutCurriculum}
                cards={shown.cards}
                size={{ rows, columns }}
                firstRow={HEADER_ROWS + 1}
                selectedCourseId={selected?.courseId ?? null}
                isShown={(connection) => {
                  if (missingIdsOfSelected && selected) {
                    if (
                      connection.kind === "prerequisite" &&
                      connection.to.courseId === selected.courseId
                    )
                      return missingIdsOfSelected.has(connection.from.courseId);
                    if (
                      connection.kind === "successor" &&
                      connection.from.courseId === selected.courseId
                    )
                      return false;
                  }
                  return !startsNoConnection.has(connection.from.id);
                }}
              />
            )}
            {shown.cards.map((shownCard) => {
              const baseCard = baseCardsById.get(shownCard.id) ?? shownCard;
              const card =
                shownCard.id === gesture?.dragId ? baseCard : shownCard;
              return (
                <EnrollmentCard
                  key={card.id}
                  dragId={card.id}
                  course={card.course}
                  curriculum={layoutCurriculum}
                  ignoredFocusCourseId={
                    missingIdsOfSelected &&
                    selected &&
                    !missingIdsOfSelected.has(card.courseId)
                      ? selected.courseId
                      : null
                  }
                  color={getCourseColor(curriculum, card.course)}
                  status={card.enrollment.status}
                  isAvailable={isAvailable(card.course, progress)}
                  isBlocker={blockerIds.has(card.id)}
                  isSelected={card.id === selectedId}
                  isEntering={isEntering}
                  enterDelay={(card.column - 1) * ENTER_STAGGER_MS}
                  onSelect={() => selectCard(card)}
                  takeDropOrigin={() => takeDropOrigin(card.id)}
                  style={{
                    gridColumn: `${card.column} / span ${card.duration}`,
                    gridRow: `${HEADER_ROWS + card.row} / span ${card.height}`,
                  }}
                />
              );
            })}
            {shown.periods.map(
              (period, index) =>
                moveConflicts.get(period) && (
                  <div
                    key={period}
                    aria-hidden
                    className="fade-in pointer-events-none z-10 -mx-1 animate-in bg-background/70 duration-150 motion-reduce:animate-none"
                    style={{
                      gridColumn: index + 1,
                      gridRow: `1 / span ${rows + HEADER_ROWS}`,
                    }}
                  />
                ),
            )}
            {landing && (
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none z-10 rounded-lg",
                  preview?.error ? "bg-destructive/15" : "bg-primary/10",
                )}
                style={{
                  gridColumn: `${landing.column} / span ${landing.duration}`,
                  gridRow: `${HEADER_ROWS + landing.row} / span ${landing.height}`,
                }}
              />
            )}
          </div>
        </section>
        <CoursePanel
          open={isPanelOpen && panelCard !== null}
          snapPoint={snapPoint}
          enrollment={panelCard?.enrollment ?? null}
          course={panelCard?.course ?? null}
          curriculum={curriculum}
          progress={progress}
          gradingScale={gradingScale}
          schemeSource={panelCard && getSchemeSource(panelCard)}
          isAvailable={
            panelCard !== null && isAvailable(panelCard.course, progress)
          }
          canOpenCourse={(courseId) =>
            base.cards.some((card) => card.courseId === courseId)
          }
          onSnapPointChange={setSnapPoint}
          onOpenChange={setIsPanelOpen}
          onOpenCourse={(courseId) => {
            const card = base.cards
              .filter((card) => card.courseId === courseId)
              .at(-1);
            if (card) openPanel(card);
          }}
          onSetStatus={(status) => {
            if (!panelCard) return;
            const result = setEnrollmentStatus(
              enrollments,
              panelCard.id,
              status,
              courses,
            );
            onChange(
              result.enrollments,
              getStatusNotice(
                `${panelCard.course.name} ${STATUS_LABELS[status]}`,
                result.revertedCount,
              ),
            );
          }}
          onGradesChange={(grades) => {
            if (!panelCard) return;
            onChange(
              enrollments.map((enrollment) =>
                enrollment.id === panelCard.id
                  ? { ...enrollment, ...grades }
                  : enrollment,
              ),
            );
          }}
          onRetake={
            panelCard?.enrollment.status === "FAILED" &&
            addableCourses.some((course) => course.id === panelCard.courseId)
              ? () => retake(panelCard)
              : null
          }
          onMove={() => setIsMoveOpen(true)}
          onRemove={() => {
            if (!panelCard) return;
            setIsPanelOpen(false);
            onChange(removeEnrollment(enrollments, panelCard.id), {
              title: `${panelCard.course.name} quitado`,
            });
          }}
        />
      </div>
      <AddEnrollmentDialog
        placement={addPlacement}
        periodLabel={addPlacement ? getPeriodLabel(addPlacement.period) : ""}
        courses={addableCourses}
        onOpenChange={(open) => {
          if (!open) setAddPlacement(null);
        }}
        onAdd={handleAdd}
      />
      <MoveEnrollmentDialog
        open={isMoveOpen && panelCard !== null}
        courseName={panelCard?.course.name ?? ""}
        options={moveOptions}
        onOpenChange={setIsMoveOpen}
        onMove={(period) => {
          if (panelCard) moveTo(panelCard, period);
        }}
      />
      <ClosePeriodDialog
        open={periodClosing?.isOpen ?? false}
        periodLabel={periodClosing ? getPeriodLabel(periodClosing.period) : ""}
        enrollments={closingEnrollments}
        onOpenChange={(open) => {
          if (periodClosing)
            setPeriodClosing({ ...periodClosing, isOpen: open });
        }}
        onClose={(statuses) => {
          if (periodClosing) closePeriod(periodClosing.period, statuses);
        }}
      />
      <PassedPeriodsDialog
        open={isAskingPassedPeriods && passedPeriodOptions.length > 0}
        options={passedPeriodOptions}
        onOpenChange={setIsAskingPassedPeriods}
        onChoose={approvePassedPeriods}
      />
    </DragDropProvider>
  );
}
