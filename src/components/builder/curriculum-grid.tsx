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
import { getCourseColor } from "@/builder/colors";
import {
  getCourseHeight,
  getDefaultCredits,
  getMaxDuration,
} from "@/builder/grid";
import { getPeriodLabel, isSamePeriod } from "@/builder/periods";
import CourseCard from "@/components/builder/course-card";
import PeriodHeader from "@/components/builder/period-header";
import ResizeHandle from "@/components/builder/resize-handle";
import PathsOverlay from "@/components/curriculum/paths-overlay";
import { Button } from "@/components/ui/button";
import type { Action, Curriculum } from "@/types/builder";
import {
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
} from "@/utils/curriculum-grid";
import { createConnectionPaths } from "@/utils/pathfinding";

const MIN_ROWS = 6;
const HEADER_ROWS = 1;
const SPARE_ROWS = 1;
const DRAG_ACTIVATION_DISTANCE = 5;
const PREREQUISITE_LINE_COLOR = "#34d399";

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
type Landing = Cell & Size & { dragId: string };
type Resize = Size & { dragId: string };

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
  const [resize, setResize] = useState<Resize | null>(null);
  const [hoveredCourseId, setHoveredCourseId] = useState<number | null>(null);
  const defaultCredits = getDefaultCredits(curriculum);
  const columns = curriculum.periods.length;

  const cards = curriculum.courses.flatMap((course) =>
    course.slots.map((slot, slotIndex) => {
      const dragId = `${course.id}/${slotIndex}`;
      const size = {
        height: getCourseHeight(course.credits, defaultCredits),
        duration: course.duration,
      };
      return {
        dragId,
        course,
        slot,
        slotIndex,
        column:
          curriculum.periods.findIndex((period) => isSamePeriod(period, slot)) +
          1,
        row: slot.position,
        size,
        ...(resize?.dragId === dragId ? resize : size),
      };
    }),
  );

  type Card = (typeof cards)[number];

  const rows =
    Math.max(
      MIN_ROWS,
      ...cards.map((card) => card.row + card.height - 1),
      landing ? landing.row + landing.height - 1 : 0,
    ) + SPARE_ROWS;
  const footRow = HEADER_ROWS + rows + 1;

  const prerequisitePaths =
    hoveredCourseId === null || landing || resize
      ? []
      : createConnectionPaths(
          rows,
          columns,
          cards.map((card) => ({
            id: card.dragId,
            x: card.column,
            y: card.row,
            w: card.duration,
            h: card.height,
            programYear: card.slot.programYear,
            term: card.slot.term,
            courseId: card.course.id,
            course: card.course.id === hoveredCourseId ? card.course : null,
          })),
        ).map(({ data }) => ({ data, color: PREREQUISITE_LINE_COLOR }));

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

  function getLanding(operation: DragMoveEvent["operation"]) {
    const card = cards.find((card) => card.dragId === operation.source?.id);
    const rect = operation.shape?.current.boundingRectangle;
    const cell = card && rect && getCellAt(rect.left, rect.top, card.duration);
    return card && cell ? { card, cell } : null;
  }

  function getResizedSize(card: Card, delta: Partial<Size>): Size {
    return {
      height: Math.max(1, card.size.height + (delta.height ?? 0)),
      duration: Math.min(
        Math.max(1, card.size.duration + (delta.duration ?? 0)),
        getMaxDuration(curriculum, card.course),
      ),
    };
  }

  function resizeCard(card: Card, delta: Partial<Size>) {
    const size = getResizedSize(card, delta);
    if (size.height !== resize?.height || size.duration !== resize.duration)
      setResize({ ...size, dragId: card.dragId });
  }

  function releaseCard(card: Card, delta: Partial<Size>) {
    setResize(null);
    const { height, duration } = getResizedSize(card, delta);
    dispatch({
      type: "resizeCourse",
      courseId: card.course.id,
      slotIndex: card.slotIndex,
      rows: height,
      duration,
    });
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
            duration: next.card.duration,
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
        className="relative grid w-max"
        style={{
          gridTemplateColumns: `repeat(${columns}, ${GRID_CELL_WIDTH}rem)`,
          gridTemplateRows: `auto repeat(${rows}, ${GRID_CELL_HEIGHT}rem) auto`,
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
        <div
          aria-hidden
          className="pointer-events-none absolute z-0"
          style={{
            gridColumn: "1 / -1",
            gridRow: `${HEADER_ROWS + 1} / span ${rows}`,
            inset: `-${GRID_GAP}rem`,
          }}
        >
          <PathsOverlay paths={prerequisitePaths} />
        </div>
        {cards.map((card) => (
          <CourseCard
            key={card.dragId}
            dragId={card.dragId}
            course={card.course}
            color={getCourseColor(curriculum, card.course)}
            isSelected={card.course.id === selectedCourseId}
            onSelect={() => onSelectCourse(card.course.id)}
            onHoverChange={(isHovered) =>
              setHoveredCourseId(isHovered ? card.course.id : null)
            }
            style={{
              gridColumn: `${card.column} / span ${card.duration}`,
              gridRow: `${HEADER_ROWS + card.row} / span ${card.height}`,
            }}
          >
            <ResizeHandle
              edge="bottom"
              label="Cambiar créditos"
              onResize={(rows) => resizeCard(card, { height: rows })}
              onRelease={(rows) => releaseCard(card, { height: rows })}
            />
            <ResizeHandle
              edge="right"
              label="Cambiar duración"
              onResize={(columns) => resizeCard(card, { duration: columns })}
              onRelease={(columns) => releaseCard(card, { duration: columns })}
            />
          </CourseCard>
        ))}
        {landing && (
          <div
            aria-hidden
            className="pointer-events-none z-10 rounded-lg border-2 border-primary border-dashed bg-primary/10"
            style={{
              gridColumn: `${landing.column} / span ${landing.duration}`,
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
