"use client";

import {
  type DragMoveEvent,
  Feedback,
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
} from "@dnd-kit/dom";
import { DragDropProvider, useDragDropMonitor } from "@dnd-kit/react";
import { memo, type RefObject, startTransition, useState } from "react";
import { apply } from "@/builder/apply";
import AddButton from "@/components/builder/add-button";
import DraggableCourseCard from "@/components/builder/course-card";
import NewCourseDialog from "@/components/builder/new-course-dialog";
import PeriodHeader from "@/components/builder/period-header";
import ResizeHandle from "@/components/builder/resize-handle";
import ConnectionsOverlay from "@/components/curriculum/connections-overlay";
import { getCourseColor } from "@/curriculum/colors";
import {
  type ConnectionRole,
  getConnectionRole,
} from "@/curriculum/connections";
import {
  type CourseCardLayout,
  getCourseCards,
  getMaxDuration,
} from "@/curriculum/grid";
import {
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
  getEmptyCells,
  getRowCount,
  HEADER_ROWS,
} from "@/curriculum/grid-cells";
import { getPeriodLabel } from "@/curriculum/periods";
import { useGridGesture } from "@/hooks/use-grid-gesture";
import type { Action, Draft, ResizeAction, SlotAction } from "@/types/builder";
import type { HexColor } from "@/types/colors";
import type { Curriculum, Period } from "@/types/curriculum";

const DRAG_ACTIVATION_DISTANCE = 5;

const sensors = [
  PointerSensor.configure({
    activationConstraints: [
      new PointerActivationConstraints.Distance({
        value: DRAG_ACTIVATION_DISTANCE,
      }),
    ],
  }),
  KeyboardSensor,
];

type Size = { height: number; duration: number };
type Gesture = { dragId: string; action: SlotAction | ResizeAction };
type NewCourse = { period: Period; position: number };

function isSameGesture(a: Gesture | null, b: Gesture) {
  return (
    a?.dragId === b.dragId &&
    JSON.stringify(a.action) === JSON.stringify(b.action)
  );
}

function getResize(
  curriculum: Curriculum,
  card: CourseCardLayout,
  delta: Size,
): Gesture {
  return {
    dragId: card.id,
    action: {
      type: "resizeCourse",
      courseId: card.course.id,
      slotIndex: card.slotIndex,
      rows: Math.max(1, card.height + delta.height),
      duration: Math.min(
        Math.max(1, card.duration + delta.duration),
        getMaxDuration(curriculum, card.course),
      ),
    },
  };
}

// Memoized, and fed primitives and stable callbacks, so that a gesture only
// renders the cards it moves or whose connection role it changes.
const GridCard = memo(function GridCard({
  card,
  column,
  row,
  duration,
  height,
  curriculum,
  gestureRole,
  color,
  isSelected,
  takeDropOrigin,
  onSelect,
  onResize,
  onRelease,
}: {
  card: CourseCardLayout;
  column: number;
  row: number;
  duration: number;
  height: number;
  curriculum: Curriculum;
  gestureRole: ConnectionRole | null | undefined;
  color: HexColor;
  isSelected: boolean;
  takeDropOrigin: (dragId: string) => { x: number; y: number } | null;
  onSelect: (courseId: number) => void;
  onResize: (card: CourseCardLayout, delta: Size) => void;
  onRelease: (card: CourseCardLayout, delta: Size) => void;
}) {
  return (
    <DraggableCourseCard
      dragId={card.id}
      course={card.course}
      curriculum={curriculum}
      gestureRole={gestureRole}
      color={color}
      isSelected={isSelected}
      onSelect={() => onSelect(card.course.id)}
      takeDropOrigin={() => takeDropOrigin(card.id)}
      style={{
        gridColumn: `${column} / span ${duration}`,
        gridRow: `${HEADER_ROWS + row} / span ${height}`,
      }}
    >
      <ResizeHandle
        onResize={(delta) => onResize(card, delta)}
        onRelease={(delta) => onRelease(card, delta)}
      />
    </DraggableCourseCard>
  );
});

const EmptyCell = memo(function EmptyCell({
  period,
  column,
  row,
  label,
  onAdd,
}: {
  period: Period;
  column: number;
  row: number;
  label: string;
  onAdd: (course: NewCourse) => void;
}) {
  return (
    <AddButton
      label={label}
      revealOnHover
      style={{ gridColumn: column, gridRow: HEADER_ROWS + row }}
      onClick={() => onAdd({ period, position: row })}
    />
  );
});

export default function CurriculumGrid({
  draft,
  dispatch,
  selectedCourseId,
  onSelectCourse,
}: {
  draft: Draft;
  dispatch: (action: Action) => void;
  selectedCourseId: number | null;
  onSelectCourse: (courseId: number) => void;
}) {
  const { firstCellRef, getCellUnder, keepDropOrigin, takeDropOrigin } =
    useGridGesture();
  const { curriculum } = draft;
  const columns = curriculum.periods.length;
  const baseCards = getCourseCards(curriculum);

  function getMove(operation: DragMoveEvent["operation"]): Gesture | null {
    const card = baseCards.find((card) => card.id === operation.source?.id);
    const rect = operation.shape?.current.boundingRectangle;
    const cell =
      card && rect && getCellUnder(rect, { columns, duration: card.duration });
    const period = cell && curriculum.periods[cell.column - 1];
    if (!card || !cell || !period) return null;
    return {
      dragId: card.id,
      action: {
        type: "moveSlot",
        courseId: card.course.id,
        slotIndex: card.slotIndex,
        to: { ...period, position: cell.row },
      },
    };
  }

  return (
    <DragDropProvider
      sensors={sensors}
      plugins={(defaults) => [
        ...defaults,
        Feedback.configure({ dropAnimation: null }),
      ]}
      onDragEnd={({ operation, canceled }) => {
        const rect = operation.shape?.current.boundingRectangle;
        if (rect && typeof operation.source?.id === "string")
          keepDropOrigin(operation.source.id, rect);
        const drop = getMove(operation);
        if (!canceled && drop) dispatch(drop.action);
      }}
    >
      <GridContent
        draft={draft}
        baseCards={baseCards}
        dispatch={dispatch}
        selectedCourseId={selectedCourseId}
        firstCellRef={firstCellRef}
        getMove={getMove}
        takeDropOrigin={takeDropOrigin}
        onSelectCourse={onSelectCourse}
      />
    </DragDropProvider>
  );
}

// The grid itself. The gesture lives below the provider so it can listen to
// moves through the monitor: the provider's `onDragMove` commits a transition
// on every pointer move, even when nothing changes.
function GridContent({
  draft,
  baseCards,
  dispatch,
  selectedCourseId,
  firstCellRef,
  getMove,
  takeDropOrigin,
  onSelectCourse,
}: {
  draft: Draft;
  baseCards: CourseCardLayout[];
  dispatch: (action: Action) => void;
  selectedCourseId: number | null;
  firstCellRef: RefObject<HTMLDivElement | null>;
  getMove: (operation: DragMoveEvent["operation"]) => Gesture | null;
  takeDropOrigin: (dragId: string) => { x: number; y: number } | null;
  onSelectCourse: (courseId: number) => void;
}) {
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [newCourse, setNewCourse] = useState<NewCourse | null>(null);
  const [isNewCourseOpen, setIsNewCourseOpen] = useState(false);
  const { curriculum } = draft;
  const columns = curriculum.periods.length;

  useDragDropMonitor({
    onDragMove: ({ operation }) => {
      const next = getMove(operation);
      if (next && !isSameGesture(gesture, next))
        startTransition(() => setGesture(next));
    },
    onDragEnd: () => startTransition(() => setGesture(null)),
  });

  // The cards as they stand, and as they would stand if the ongoing drag or
  // resize ended now, so the rest of the grid makes room while it happens.
  const baseCardsById = new Map(baseCards.map((card) => [card.id, card]));
  const shownCurriculum = gesture
    ? apply(draft, gesture.action).curriculum
    : curriculum;
  const cards = gesture ? getCourseCards(shownCurriculum) : baseCards;
  const draggedId = gesture?.action.type === "moveSlot" ? gesture.dragId : null;
  const gestureCourseId = gesture?.action.courseId ?? null;
  const landing = cards.find((card) => card.id === draggedId);

  const rows = getRowCount(cards);
  const emptyCells = getEmptyCells(cards, { rows, columns }).flatMap((cell) => {
    const period = curriculum.periods[cell.column - 1];
    return period ? [{ ...cell, period }] : [];
  });

  function openNewCourse(course: NewCourse) {
    setNewCourse(course);
    setIsNewCourseOpen(true);
  }

  function handleResize(card: CourseCardLayout, delta: Size) {
    const next = getResize(curriculum, card, delta);
    setGesture((current) => (isSameGesture(current, next) ? current : next));
  }

  function handleRelease(card: CourseCardLayout, delta: Size) {
    setGesture(null);
    dispatch(getResize(curriculum, card, delta).action);
  }

  return (
    <>
      <div
        className="relative grid w-max"
        style={{
          gridTemplateColumns: `repeat(${columns + 1}, ${GRID_CELL_WIDTH}rem)`,
          gridTemplateRows: `auto repeat(${rows}, ${GRID_CELL_HEIGHT}rem)`,
          gap: `${GRID_GAP}rem`,
        }}
      >
        {curriculum.periods.map((period, index) => (
          <PeriodHeader
            key={`${period.programYear}-${period.term}`}
            curriculum={curriculum}
            period={period}
            dispatch={dispatch}
            style={{ gridColumn: index + 1, gridRow: 1 }}
          />
        ))}
        <div
          ref={firstCellRef}
          aria-hidden
          className="pointer-events-none"
          style={{ gridColumn: 1, gridRow: HEADER_ROWS + 1 }}
        />
        {emptyCells.map(({ period, column, row }) => (
          <EmptyCell
            key={`${column}/${row}`}
            period={period}
            column={column}
            row={row}
            label={`Agregar curso en ${getPeriodLabel(curriculum.termSystem, period)}, fila ${row}`}
            onAdd={openNewCourse}
          />
        ))}
        <AddButton
          label="Agregar periodo"
          style={{
            gridColumn: columns + 1,
            gridRow: `${HEADER_ROWS + 1} / span ${rows}`,
          }}
          onClick={() => dispatch({ type: "addPeriod" })}
        />
        <ConnectionsOverlay
          curriculum={shownCurriculum}
          cards={cards}
          size={{ rows, columns }}
          firstRow={HEADER_ROWS + 1}
          gestureCourseId={gestureCourseId}
          selectedCourseId={selectedCourseId}
        />
        {cards.map((shownCard) => {
          // dnd-kit lifts the dragged card from where it started, so it keeps
          // that place; the landing outline shows where it ends up instead.
          const baseCard = baseCardsById.get(shownCard.id) ?? shownCard;
          const card = shownCard.id === draggedId ? baseCard : shownCard;
          return (
            <GridCard
              key={card.id}
              card={baseCard}
              column={card.column}
              row={card.row}
              duration={card.duration}
              height={card.height}
              curriculum={curriculum}
              gestureRole={
                gestureCourseId === null
                  ? undefined
                  : getConnectionRole(
                      shownCurriculum,
                      gestureCourseId,
                      card.course.id,
                    )
              }
              color={getCourseColor(curriculum, card.course)}
              isSelected={card.course.id === selectedCourseId}
              takeDropOrigin={takeDropOrigin}
              onSelect={onSelectCourse}
              onResize={handleResize}
              onRelease={handleRelease}
            />
          );
        })}
        {landing && (
          <div
            aria-hidden
            className="pointer-events-none z-10 rounded-lg bg-primary/10"
            style={{
              gridColumn: `${landing.column} / span ${landing.duration}`,
              gridRow: `${HEADER_ROWS + landing.row} / span ${landing.height}`,
            }}
          />
        )}
      </div>
      {newCourse && (
        <NewCourseDialog
          open={isNewCourseOpen}
          periodLabel={getPeriodLabel(curriculum.termSystem, newCourse.period)}
          onOpenChange={setIsNewCourseOpen}
          onCreate={(name) => {
            dispatch({ type: "addCourse", name, ...newCourse });
            setIsNewCourseOpen(false);
          }}
        />
      )}
    </>
  );
}
