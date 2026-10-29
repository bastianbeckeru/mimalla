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
import { cn } from "cn";
import { useEffect, useRef, useState } from "react";
import { getCourseColor } from "@/builder/colors";
import AddButton from "@/components/builder/add-button";
import ConnectionsOverlay from "@/components/curriculum/connections-overlay";
import AddEnrollmentDialog from "@/components/trajectory/add-enrollment-dialog";
import CoursePanel from "@/components/trajectory/course-panel";
import EnrollmentCard from "@/components/trajectory/enrollment-card";
import { toast } from "@/components/ui/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Course, Curriculum } from "@/types/builder";
import type { PeriodKey } from "@/types/curriculum";
import type { Enrollment, Entry } from "@/types/trajectory";
import { extendCourses } from "@/utils/curriculum";
import {
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
} from "@/utils/curriculum-grid";
import { parsePeriodKey } from "@/utils/period-key";
import {
  addEnrollment,
  type EnrollmentCard as Card,
  type Cell,
  type EditError,
  getAddableCourses,
  getNextPeriod,
  getPeriodInfo,
  getProgress,
  isAvailable,
  layOutTrajectory,
  MAX_ENROLLMENTS_PER_PERIOD,
  moveEnrollment,
  removeEnrollment,
  setEnrollmentStatus,
  toggleEnrollmentStatus,
  toLayoutCurriculum,
} from "@/utils/trajectory";

const MIN_ROWS = 6;
const HEADER_ROWS = 1;
const SPARE_ROWS = 1;
const DRAG_ACTIVATION_DISTANCE = 5;
const TOUCH_HOLD_MS = 300;
const TOUCH_HOLD_TOLERANCE = 8;
const ROOT_FONT_SIZE = 16;
// A click this soon after a drag ends belongs to the drag.
const DRAG_CLICK_MS = 300;
const SHAKE_MS = 300;
const HINT_MS = 1500;
const ENTER_STAGGER_MS = 30;
const ENTER_MS = 300;

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
      cancel: ["Escape"],
      end: ["Space", "Tab"],
      up: ["ArrowUp"],
      down: ["ArrowDown"],
      left: ["ArrowLeft"],
      right: ["ArrowRight"],
    },
  }),
];

const MOVE_ERROR_DESCRIPTIONS: Record<EditError, string> = {
  PERIOD_FULL: `Un periodo no puede tener más de ${MAX_ENROLLMENTS_PER_PERIOD} cursos.`,
  DUPLICATE_COURSE: "Este periodo ya tiene este curso.",
  SUCCESSOR_IN_PERIOD: "Este periodo tiene un curso que lo requiere.",
  PREREQUISITE_IN_PERIOD: "Este periodo tiene uno de sus prerrequisitos.",
  SUCCESSOR_ON_THE_WAY: "Hay un curso que lo requiere en el camino.",
  PREREQUISITE_ON_THE_WAY: "Hay uno de sus prerrequisitos en el camino.",
};

export type Notice = {
  title: string;
  description?: string;
  // Shown on every screen, not only on mobile.
  isImportant?: boolean;
};

type Gesture = { dragId: string; cell: Cell };
type Hint = { courseId: number; missingIds: number[] };

function getRevertedDescription(count: number) {
  return count === 1
    ? "1 curso que lo requería volvió a pendiente."
    : `${count} cursos que lo requerían volvieron a pendiente.`;
}

export default function TrajectoryBoard({
  enrollments,
  entry,
  curriculum,
  onChange,
}: {
  enrollments: Enrollment[];
  entry: Entry;
  curriculum: Curriculum;
  onChange: (enrollments: Enrollment[], notice: Notice) => void;
}) {
  const isMobile = useIsMobile();
  const firstCellRef = useRef<HTMLDivElement>(null);
  const dropOrigin = useRef<{ dragId: string; x: number; y: number } | null>(
    null,
  );
  const lastDragEndAt = useRef(Number.NEGATIVE_INFINITY);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [panelId, setPanelId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const selectedId = isPanelOpen ? panelId : null;
  const [addCell, setAddCell] = useState<Cell | null>(null);
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [isEntering, setIsEntering] = useState(true);

  const context = { entry, curriculum };
  const courses = extendCourses(curriculum.courses);
  const progress = getProgress(enrollments, courses);

  const base = layOutTrajectory(enrollments, context);
  const nextPeriod = getNextPeriod(base.periods);
  // While a card moves, the grid keeps its periods and one more to drop on.
  const gesturePeriods = nextPeriod
    ? [...base.periods, nextPeriod]
    : base.periods;
  const preview = gesture
    ? moveEnrollment(enrollments, gesture.dragId, gesture.cell, context)
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
          column: shown.periods.indexOf(gesture.cell.period) + 1,
          row: gesture.cell.row,
          duration: draggedCard.duration,
          height: draggedCard.height,
        }
      : shown.cards.find((card) => card.id === gesture.dragId)
    : undefined;

  const columns = shown.periods.length;
  const rows =
    Math.max(
      MIN_ROWS,
      ...shown.cards.map((card) => card.row + card.height - 1),
    ) + SPARE_ROWS;

  const selected = shown.cards.find((card) => card.id === selectedId) ?? null;
  // Kept while the panel closes, so its content stays until it is gone.
  const panelCard = base.cards.find((card) => card.id === panelId) ?? null;
  // Failed enrollments take no part in connections unless selected.
  const connectionCards = shown.cards.filter(
    (card) => card.enrollment.status !== "FAILED" || card.id === selectedId,
  );
  const layoutCurriculum = toLayoutCurriculum(
    curriculum,
    shown,
    connectionCards,
  );
  const gestureCourseId = draggedCard?.courseId ?? hint?.courseId ?? null;

  useEffect(() => {
    const timeout = setTimeout(
      () => setIsEntering(false),
      ENTER_STAGGER_MS * base.periods.length + ENTER_MS,
    );
    return () => clearTimeout(timeout);
  }, [base.periods.length]);

  useEffect(() => {
    if (shakingId === null) return;
    const timeout = setTimeout(() => setShakingId(null), SHAKE_MS);
    return () => clearTimeout(timeout);
  }, [shakingId]);

  useEffect(() => {
    if (hint === null) return;
    const timeout = setTimeout(() => setHint(null), HINT_MS);
    return () => clearTimeout(timeout);
  }, [hint]);

  const occupied = new Set(
    shown.cards.flatMap((card) =>
      Array.from({ length: card.height }, (_, rowOffset) =>
        Array.from(
          { length: card.duration },
          (_, columnOffset) =>
            `${card.column + columnOffset}/${card.row + rowOffset}`,
        ),
      ).flat(),
    ),
  );
  const emptyCells = isMobile
    ? []
    : Array.from({ length: rows }, (_, rowIndex) =>
        shown.periods.map((period, columnIndex) => ({
          period,
          column: columnIndex + 1,
          row: rowIndex + 1,
        })),
      )
        .flat()
        .filter(({ column, row }) => !occupied.has(`${column}/${row}`));
  // On mobile, each period ends with a button to add a course below its last.
  const periodEnds = isMobile
    ? shown.periods.map((period, index) => ({
        period,
        column: index + 1,
        row:
          Math.max(
            0,
            ...shown.cards
              .filter(
                (card) =>
                  card.column <= index + 1 &&
                  index + 1 < card.column + card.duration,
              )
              .map((card) => card.row + card.height - 1),
          ) + 1,
      }))
    : [];

  function getPeriodLabel(period: PeriodKey) {
    const { label } = getPeriodInfo(period, entry);
    return `${label} (${parsePeriodKey(period).year})`;
  }

  function getCellAt(left: number, top: number, duration: number): Cell | null {
    const firstCell = firstCellRef.current?.getBoundingClientRect();
    if (!firstCell) return null;
    const rootFontSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    const gap = GRID_GAP * rootFontSize;
    const column = Math.round(
      (left - firstCell.left) / (firstCell.width + gap),
    );
    const row = Math.round((top - firstCell.top) / (firstCell.height + gap));
    const period =
      gesturePeriods[
        Math.min(Math.max(column, 0), gesturePeriods.length - duration)
      ];
    return period ? { period, row: Math.max(row, 0) + 1 } : null;
  }

  function getMove(operation: DragMoveEvent["operation"]): Gesture | null {
    const card = base.cards.find((card) => card.id === operation.source?.id);
    const rect = operation.shape?.current.boundingRectangle;
    const cell = card && rect && getCellAt(rect.left, rect.top, card.duration);
    return card && cell ? { dragId: card.id, cell } : null;
  }

  function isSameGesture(next: Gesture) {
    return (
      gesture?.dragId === next.dragId &&
      gesture.cell.period === next.cell.period &&
      gesture.cell.row === next.cell.row
    );
  }

  function openPanel(card: Card) {
    setPanelId(card.id);
    setIsPanelOpen(true);
  }

  function toggleStatus(card: Card) {
    if (performance.now() - lastDragEndAt.current < DRAG_CLICK_MS) return;
    const result = toggleEnrollmentStatus(enrollments, card.id, courses);
    if (result.missingPrerequisiteIds) {
      setShakingId(card.id);
      setHint({
        courseId: card.courseId,
        missingIds: result.missingPrerequisiteIds,
      });
      return;
    }
    onChange(result.enrollments, {
      title:
        result.status === "APPROVED"
          ? `${card.course.name} aprobado`
          : `${card.course.name} pendiente`,
      ...(result.revertedCount > 0 && {
        description: getRevertedDescription(result.revertedCount),
        isImportant: true,
      }),
    });
  }

  function handleDragEnd({ operation, canceled }: DragEndEvent) {
    setGesture(null);
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
    if (rect)
      dropOrigin.current = { dragId: card.id, x: rect.left, y: rect.top };
    const drop = getMove(operation);
    if (canceled || !drop) return;
    if (
      drop.cell.period === base.periods[card.column - 1] &&
      drop.cell.row === card.row
    )
      return;

    const result = moveEnrollment(enrollments, card.id, drop.cell, context);
    if (result.error) {
      toast.add({
        type: "error",
        title: "No se puede mover el curso",
        description: MOVE_ERROR_DESCRIPTIONS[result.error],
      });
      return;
    }
    onChange(result.enrollments, { title: `${card.course.name} movido` });
  }

  function handleAdd(cell: Cell, course: Course) {
    const result = addEnrollment(enrollments, course, cell, context);
    if (result.error) {
      toast.add({
        type: "error",
        title: "No se puede agregar el curso",
        description: MOVE_ERROR_DESCRIPTIONS[result.error],
      });
      return;
    }
    onChange(result.enrollments, { title: `${course.name} agregado` });
  }

  function takeDropOrigin(dragId: string) {
    if (dropOrigin.current?.dragId !== dragId) return null;
    const { x, y } = dropOrigin.current;
    dropOrigin.current = null;
    return { x, y };
  }

  return (
    <DragDropProvider
      sensors={sensors}
      plugins={(defaults) => [
        ...defaults,
        Feedback.configure({ dropAnimation: null }),
      ]}
      onDragStart={() => setHint(null)}
      onDragMove={({ operation }) => {
        const next = getMove(operation);
        if (next && !isSameGesture(next)) setGesture(next);
      }}
      onDragEnd={handleDragEnd}
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
          const { label, isCurrent } = getPeriodInfo(period, entry);
          return (
            <h2
              key={period}
              className={cn(
                "truncate px-2 py-1 font-semibold text-muted-foreground text-xs",
                isCurrent && "text-foreground",
              )}
              style={{ gridColumn: index + 1, gridRow: 1 }}
            >
              {label}
              <span className="ml-1.5 font-normal tabular-nums opacity-70">
                {parsePeriodKey(period).year}
              </span>
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
            onClick={() => setAddCell({ period, row })}
          />
        ))}
        {periodEnds.map(({ period, column, row }) => (
          <AddButton
            key={period}
            label={`Agregar curso en ${getPeriodLabel(period)}`}
            style={{ gridColumn: column, gridRow: HEADER_ROWS + row }}
            onClick={() => setAddCell({ period, row })}
          />
        ))}
        {nextPeriod && (
          <AddButton
            label="Agregar periodo"
            style={{
              gridColumn: columns + 1,
              gridRow: isMobile
                ? HEADER_ROWS + 1
                : `${HEADER_ROWS + 1} / span ${rows}`,
            }}
            onClick={() => setAddCell({ period: nextPeriod, row: 1 })}
          />
        )}
        {!isEntering && (
          <ConnectionsOverlay
            curriculum={layoutCurriculum}
            cards={connectionCards}
            obstacles={shown.cards}
            size={{ rows, columns }}
            firstRow={HEADER_ROWS + 1}
            gestureCourseId={gestureCourseId}
            selectedCourseId={selected?.courseId ?? null}
            isShown={(connection) =>
              !hint ||
              (connection.kind === "prerequisite" &&
                hint.missingIds.includes(connection.from.courseId))
            }
          />
        )}
        {shown.cards.map((shownCard) => {
          // dnd-kit lifts the dragged card from where it started, so it keeps
          // that place; the landing outline shows where it ends up instead.
          const baseCard = baseCardsById.get(shownCard.id) ?? shownCard;
          const card = shownCard.id === gesture?.dragId ? baseCard : shownCard;
          return (
            <EnrollmentCard
              key={card.id}
              dragId={card.id}
              course={card.course}
              curriculum={layoutCurriculum}
              gestureCourseId={gestureCourseId}
              color={getCourseColor(curriculum, card.course)}
              status={card.enrollment.status}
              isAvailable={isAvailable(card.course, progress)}
              isSelected={card.id === selectedId}
              isShaking={card.id === shakingId}
              isEntering={isEntering}
              enterDelay={(card.column - 1) * ENTER_STAGGER_MS}
              onSelect={() => toggleStatus(card)}
              onOpenPanel={() => openPanel(card)}
              takeDropOrigin={() => takeDropOrigin(card.id)}
              style={{
                gridColumn: `${card.column} / span ${card.duration}`,
                gridRow: `${HEADER_ROWS + card.row} / span ${card.height}`,
              }}
            />
          );
        })}
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
      <AddEnrollmentDialog
        cell={addCell}
        periodLabel={addCell ? getPeriodLabel(addCell.period) : ""}
        courses={getAddableCourses(courses, enrollments)}
        onOpenChange={(open) => {
          if (!open) setAddCell(null);
        }}
        onAdd={handleAdd}
      />
      <CoursePanel
        open={isPanelOpen && panelCard !== null}
        enrollment={panelCard?.enrollment ?? null}
        course={panelCard?.course ?? null}
        curriculum={curriculum}
        progress={progress}
        onOpenChange={setIsPanelOpen}
        onFail={() => {
          if (!panelCard) return;
          const result = setEnrollmentStatus(
            enrollments,
            panelCard.id,
            "FAILED",
            courses,
          );
          setIsPanelOpen(false);
          onChange(result.enrollments, {
            title: `${panelCard.course.name} reprobado`,
            ...(result.revertedCount > 0 && {
              description: getRevertedDescription(result.revertedCount),
              isImportant: true,
            }),
          });
        }}
        onRemove={() => {
          if (!panelCard) return;
          setIsPanelOpen(false);
          onChange(removeEnrollment(enrollments, panelCard.id), {
            title: `${panelCard.course.name} quitado`,
          });
        }}
      />
    </DragDropProvider>
  );
}
