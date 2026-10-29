"use client";

import {
  type DragMoveEvent,
  Feedback,
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
} from "@dnd-kit/dom";
import { DragDropProvider } from "@dnd-kit/react";
import { useRef, useState } from "react";
import { apply } from "@/builder/apply";
import { getCourseColor } from "@/builder/colors";
import {
  type CourseCardLayout,
  getCourseCards,
  getMaxDuration,
} from "@/builder/grid";
import { getPeriodLabel } from "@/builder/periods";
import AddButton from "@/components/builder/add-button";
import DraggableCourseCard from "@/components/builder/course-card";
import NewCourseDialog from "@/components/builder/new-course-dialog";
import PeriodHeader from "@/components/builder/period-header";
import ResizeHandle from "@/components/builder/resize-handle";
import ConnectionsOverlay from "@/components/curriculum/connections-overlay";
import type {
  Action,
  Draft,
  Period,
  ResizeAction,
  SlotAction,
} from "@/types/builder";
import {
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
} from "@/utils/curriculum-grid";

const MIN_ROWS = 6;
const HEADER_ROWS = 1;
const SPARE_ROWS = 1;
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

type Cell = { column: number; row: number };
type Size = { height: number; duration: number };
type Gesture = { dragId: string; action: SlotAction | ResizeAction };
type NewCourse = { period: Period; position: number };

function isSameGesture(a: Gesture | null, b: Gesture) {
  return (
    a?.dragId === b.dragId &&
    JSON.stringify(a.action) === JSON.stringify(b.action)
  );
}

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
  const firstCellRef = useRef<HTMLDivElement>(null);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const dropOrigin = useRef<{ dragId: string; x: number; y: number } | null>(
    null,
  );
  const [newCourse, setNewCourse] = useState<NewCourse | null>(null);
  const [isNewCourseOpen, setIsNewCourseOpen] = useState(false);
  const { curriculum } = draft;
  const columns = curriculum.periods.length;

  // The cards as they stand, and as they would stand if the ongoing drag or
  // resize ended now, so the rest of the grid makes room while it happens.
  const baseCards = getCourseCards(curriculum);
  const baseCardsById = new Map(baseCards.map((card) => [card.id, card]));
  const shownCurriculum = gesture
    ? apply(draft, gesture.action).curriculum
    : curriculum;
  const cards = gesture ? getCourseCards(shownCurriculum) : baseCards;
  const draggedId = gesture?.action.type === "moveSlot" ? gesture.dragId : null;
  const gestureCourseId = gesture?.action.courseId ?? null;
  const landing = cards.find((card) => card.id === draggedId);

  const rows =
    Math.max(MIN_ROWS, ...cards.map((card) => card.row + card.height - 1)) +
    SPARE_ROWS;

  const occupied = new Set(
    cards.flatMap((card) =>
      Array.from({ length: card.height }, (_, rowOffset) =>
        Array.from(
          { length: card.duration },
          (_, columnOffset) =>
            `${card.column + columnOffset}/${card.row + rowOffset}`,
        ),
      ).flat(),
    ),
  );
  const emptyCells = Array.from({ length: rows }, (_, rowIndex) =>
    curriculum.periods.map((period, columnIndex) => ({
      period,
      column: columnIndex + 1,
      row: rowIndex + 1,
    })),
  )
    .flat()
    .filter(({ column, row }) => !occupied.has(`${column}/${row}`));

  function openNewCourse(course: NewCourse) {
    setNewCourse(course);
    setIsNewCourseOpen(true);
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
    return {
      column: Math.min(Math.max(column, 0), columns - duration) + 1,
      row: Math.max(row, 0) + 1,
    };
  }

  function getMove(operation: DragMoveEvent["operation"]): Gesture | null {
    const card = baseCards.find((card) => card.id === operation.source?.id);
    const rect = operation.shape?.current.boundingRectangle;
    const cell = card && rect && getCellAt(rect.left, rect.top, card.duration);
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

  function getResize(card: CourseCardLayout, delta: Size): Gesture {
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

  function takeDropOrigin(dragId: string) {
    if (dropOrigin.current?.dragId !== dragId) return null;
    const { x, y } = dropOrigin.current;
    dropOrigin.current = null;
    return { x, y };
  }

  function updateGesture(next: Gesture | null) {
    if (next && !isSameGesture(gesture, next)) setGesture(next);
  }

  return (
    <DragDropProvider
      sensors={sensors}
      plugins={(defaults) => [
        ...defaults,
        Feedback.configure({ dropAnimation: null }),
      ]}
      onDragMove={({ operation }) => updateGesture(getMove(operation))}
      onDragEnd={({ operation, canceled }) => {
        setGesture(null);
        const rect = operation.shape?.current.boundingRectangle;
        if (rect && typeof operation.source?.id === "string")
          dropOrigin.current = {
            dragId: operation.source.id,
            x: rect.left,
            y: rect.top,
          };
        const drop = getMove(operation);
        if (!canceled && drop) dispatch(drop.action);
      }}
    >
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
          <AddButton
            key={`${column}/${row}`}
            label={`Agregar curso en ${getPeriodLabel(curriculum.termSystem, period)}, fila ${row}`}
            revealOnHover
            style={{ gridColumn: column, gridRow: HEADER_ROWS + row }}
            onClick={() => openNewCourse({ period, position: row })}
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
            <DraggableCourseCard
              key={card.id}
              dragId={card.id}
              course={card.course}
              curriculum={shownCurriculum}
              gestureCourseId={gestureCourseId}
              color={getCourseColor(curriculum, card.course)}
              isSelected={card.course.id === selectedCourseId}
              onSelect={() => onSelectCourse(card.course.id)}
              takeDropOrigin={() => takeDropOrigin(card.id)}
              style={{
                gridColumn: `${card.column} / span ${card.duration}`,
                gridRow: `${HEADER_ROWS + card.row} / span ${card.height}`,
              }}
            >
              <ResizeHandle
                onResize={(delta) => updateGesture(getResize(baseCard, delta))}
                onRelease={(delta) => {
                  setGesture(null);
                  dispatch(getResize(baseCard, delta).action);
                }}
              />
            </DraggableCourseCard>
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
    </DragDropProvider>
  );
}
