"use client";

import {
  type DragMoveEvent,
  Feedback,
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
} from "@dnd-kit/dom";
import { DragDropProvider } from "@dnd-kit/react";
import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import type { Action } from "@/builder/apply";
import { getCourseColor } from "@/builder/colors";
import type { Curriculum } from "@/builder/draft";
import { getCourseHeight, getDefaultCredits } from "@/builder/grid";
import { getPeriodLabel, isSamePeriod } from "@/builder/periods";
import CourseCard from "@/components/builder/course-card";
import { Button } from "@/components/ui/button";
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
type Landing = Cell & { dragId: string; height: number };

export default function CurriculumGrid({
  curriculum,
  dispatch,
  selectedCourseId,
  onSelectCourse,
}: {
  curriculum: Curriculum;
  dispatch: (action: Action) => void;
  selectedCourseId: number | null;
  onSelectCourse: (courseId: number) => void;
}) {
  const firstCellRef = useRef<HTMLDivElement>(null);
  const [landing, setLanding] = useState<Landing | null>(null);
  const defaultCredits = getDefaultCredits(curriculum);
  const columns = curriculum.periods.length;

  const cards = curriculum.courses.flatMap((course) =>
    course.slots.map((slot, slotIndex) => ({
      dragId: `${course.id}/${slotIndex}`,
      course,
      slotIndex,
      column:
        curriculum.periods.findIndex((period) => isSamePeriod(period, slot)) +
        1,
      row: slot.position,
      height: getCourseHeight(course.credits, defaultCredits),
    })),
  );

  const rows =
    Math.max(
      MIN_ROWS,
      ...cards.map((card) => card.row + card.height - 1),
      landing ? landing.row + landing.height - 1 : 0,
    ) + SPARE_ROWS;
  const footRow = HEADER_ROWS + rows + 1;

  const occupied = new Set(
    cards.flatMap((card) =>
      Array.from(
        { length: card.height },
        (_, offset) => `${card.column}/${card.row + offset}`,
      ),
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

  function getCellAt(left: number, top: number): Cell | null {
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
      column: Math.min(Math.max(column, 0), columns - 1) + 1,
      row: Math.max(row, 0) + 1,
    };
  }

  function getLanding(operation: DragMoveEvent["operation"]) {
    const card = cards.find((card) => card.dragId === operation.source?.id);
    const rect = operation.shape?.current.boundingRectangle;
    const cell = rect && getCellAt(rect.left, rect.top);
    return card && cell ? { card, cell } : null;
  }

  return (
    <DragDropProvider
      sensors={sensors}
      plugins={(defaults) => [
        ...defaults,
        Feedback.configure({ dropAnimation: null }),
      ]}
      onDragMove={({ operation }) => {
        const next = getLanding(operation);
        if (
          next &&
          (next.cell.column !== landing?.column ||
            next.cell.row !== landing.row)
        )
          setLanding({
            ...next.cell,
            dragId: next.card.dragId,
            height: next.card.height,
          });
      }}
      onDragEnd={({ operation, canceled }) => {
        setLanding(null);
        const drop = getLanding(operation);
        const period = drop && curriculum.periods[drop.cell.column - 1];
        if (canceled || !drop || !period) return;
        dispatch({
          type: "moveSlot",
          courseId: drop.card.course.id,
          slotIndex: drop.card.slotIndex,
          to: { ...period, position: drop.cell.row },
        });
      }}
    >
      <div
        className="grid w-max"
        style={{
          gridTemplateColumns: `repeat(${columns}, ${GRID_CELL_WIDTH}rem)`,
          gridTemplateRows: `auto repeat(${rows}, ${GRID_CELL_HEIGHT}rem) auto`,
          gap: `${GRID_GAP}rem`,
        }}
      >
        {curriculum.periods.map((period, index) => (
          <h2
            key={`${period.programYear}-${period.term}`}
            className="text-balance text-center font-medium text-muted-foreground text-xs"
            style={{ gridColumn: index + 1, gridRow: 1 }}
          >
            {getPeriodLabel(curriculum.termSystem, period)}
          </h2>
        ))}
        <div
          ref={firstCellRef}
          aria-hidden
          className="pointer-events-none"
          style={{ gridColumn: 1, gridRow: HEADER_ROWS + 1 }}
        />
        {emptyCells.map(({ period, column, row }) => (
          <button
            key={`${column}/${row}`}
            type="button"
            aria-label={`Agregar curso en ${getPeriodLabel(curriculum.termSystem, period)}, fila ${row}`}
            className="group flex items-center justify-center rounded-lg border border-transparent border-dashed text-muted-foreground transition-colors hover:border-border focus-visible:border-border focus-visible:outline-none"
            style={{ gridColumn: column, gridRow: HEADER_ROWS + row }}
            onClick={() =>
              dispatch({ type: "addCourse", period, position: row })
            }
          >
            <Plus className="size-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          </button>
        ))}
        {cards.map((card) => (
          <CourseCard
            key={card.dragId}
            dragId={card.dragId}
            course={card.course}
            color={getCourseColor(curriculum, card.course)}
            isSelected={card.course.id === selectedCourseId}
            onSelect={() => onSelectCourse(card.course.id)}
            style={{
              gridColumn: card.column,
              gridRow: `${HEADER_ROWS + card.row} / span ${card.height}`,
            }}
          />
        ))}
        {landing && (
          <div
            aria-hidden
            className="pointer-events-none z-10 rounded-lg border-2 border-primary border-dashed bg-primary/10"
            style={{
              gridColumn: landing.column,
              gridRow: `${HEADER_ROWS + landing.row} / span ${landing.height}`,
            }}
          />
        )}
        {curriculum.periods.map((period, index) => (
          <Button
            key={`${period.programYear}-${period.term}`}
            variant="ghost"
            aria-label={`Agregar curso en ${getPeriodLabel(curriculum.termSystem, period)}`}
            style={{ gridColumn: index + 1, gridRow: footRow }}
            onClick={() => dispatch({ type: "addCourse", period })}
          >
            <Plus />
          </Button>
        ))}
      </div>
    </DragDropProvider>
  );
}
