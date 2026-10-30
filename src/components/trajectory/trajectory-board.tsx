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
import CoursePanel, {
  type SchemeSource,
} from "@/components/trajectory/course-panel";
import EnrollmentCard, {
  STATUS_LABELS,
} from "@/components/trajectory/enrollment-card";
import { toast } from "@/components/ui/toast";
import { useGridGesture } from "@/hooks/use-grid-gesture";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Course, Curriculum } from "@/types/builder";
import type { PeriodKey } from "@/types/curriculum";
import type {
  ChangeNotice,
  Enrollment,
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
import { parsePeriodKey } from "@/utils/period-key";
import {
  addEnrollment,
  type EditError,
  getAddableCourses,
  getNextPeriod,
  getPeriodInfo,
  getProgress,
  isAvailable,
  layOutTrajectory,
  MAX_ENROLLMENTS_PER_PERIOD,
  moveEnrollment,
  type PlacedEnrollment,
  removeEnrollment,
  setEnrollmentStatus,
  toggleEnrollmentStatus,
  toLayoutCurriculum,
} from "@/utils/trajectory";

const DRAG_ACTIVATION_DISTANCE = 5;
const TOUCH_HOLD_MS = 300;
const TOUCH_HOLD_TOLERANCE = 8;
const ROOT_FONT_SIZE = 16;
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
type Hint = { courseId: number; missingIds: number[] };

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
  isEditing,
  onChange,
}: {
  enrollments: Enrollment[];
  entry: Entry;
  curriculum: Curriculum;
  gradingScale: GradingScale;
  isEditing: boolean;
  onChange: (enrollments: Enrollment[], notice?: ChangeNotice) => void;
}) {
  const isMobile = useIsMobile();
  const { firstCellRef, getCellUnder, keepDropOrigin, takeDropOrigin } =
    useGridGesture();
  const lastDragEndAt = useRef(Number.NEGATIVE_INFINITY);
  const isDragging = useRef(false);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [panelId, setPanelId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const selectedId = isPanelOpen ? panelId : null;
  const [addPlacement, setAddPlacement] = useState<Placement | null>(null);
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [isEntering, setIsEntering] = useState(true);

  const context = { entry, curriculum };
  const courses = extendCourses(curriculum.courses);
  const progress = getProgress(enrollments, courses);

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

  const emptyCells =
    isMobile || !isEditing
      ? []
      : getEmptyCells(shown.cards, { rows, columns }).flatMap((cell) => {
          const period = shown.periods[cell.column - 1];
          return period ? [{ ...cell, period }] : [];
        });
  const periodEnds =
    isMobile && isEditing
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
    setPanelId(card.id);
    setIsPanelOpen(true);
  }

  function toggleStatus(card: PlacedEnrollment) {
    if (
      isDragging.current ||
      performance.now() - lastDragEndAt.current < DRAG_CLICK_MS
    )
      return;
    const result = toggleEnrollmentStatus(enrollments, card.id, courses);
    if (result.missingPrerequisiteIds) {
      setShakingId(card.id);
      setHint({
        courseId: card.courseId,
        missingIds: result.missingPrerequisiteIds,
      });
      return;
    }
    onChange(
      result.enrollments,
      getStatusNotice(
        `${card.course.name} ${STATUS_LABELS[result.status]}`,
        result.revertedCount,
      ),
    );
  }

  function handleDragEnd({ operation, canceled }: DragEndEvent) {
    setGesture(null);
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
      onDragStart={() => {
        isDragging.current = true;
        setHint(null);
      }}
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
            onClick={() => setAddPlacement({ period, row })}
          />
        ))}
        {periodEnds.map(({ period, column, row }) => (
          <AddButton
            key={period}
            label={`Agregar curso en ${getPeriodLabel(period)}`}
            style={{ gridColumn: column, gridRow: HEADER_ROWS + row }}
            onClick={() => setAddPlacement({ period, row })}
          />
        ))}
        {isEditing && nextPeriod && (
          <AddButton
            label="Agregar periodo"
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
            gestureCourseId={gestureCourseId}
            selectedCourseId={selected?.courseId ?? null}
            isShown={(connection) =>
              hint
                ? connection.kind === "prerequisite" &&
                  hint.missingIds.includes(connection.from.courseId)
                : !startsNoConnection.has(connection.from.id)
            }
          />
        )}
        {shown.cards.map((shownCard) => {
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
              isEditing={isEditing}
              isSelected={card.id === selectedId}
              isShaking={card.id === shakingId}
              isEntering={isEntering}
              enterDelay={(card.column - 1) * ENTER_STAGGER_MS}
              onSelect={() =>
                isEditing ? toggleStatus(card) : openPanel(card)
              }
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
        placement={addPlacement}
        periodLabel={addPlacement ? getPeriodLabel(addPlacement.period) : ""}
        courses={getAddableCourses(courses, enrollments)}
        onOpenChange={(open) => {
          if (!open) setAddPlacement(null);
        }}
        onAdd={handleAdd}
      />
      <CoursePanel
        open={isPanelOpen && panelCard !== null}
        enrollment={panelCard?.enrollment ?? null}
        course={panelCard?.course ?? null}
        curriculum={curriculum}
        progress={progress}
        gradingScale={gradingScale}
        schemeSource={panelCard && getSchemeSource(panelCard)}
        isAvailable={
          panelCard !== null && isAvailable(panelCard.course, progress)
        }
        isEditing={isEditing}
        onOpenChange={setIsPanelOpen}
        onSetStatus={(status) => {
          if (!panelCard) return;
          const result = setEnrollmentStatus(
            enrollments,
            panelCard.id,
            status,
            courses,
          );
          setIsPanelOpen(false);
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
