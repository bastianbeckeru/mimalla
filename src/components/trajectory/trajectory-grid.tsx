"use client";

import type { DragMoveEvent } from "@dnd-kit/dom";
import { useDragDropMonitor } from "@dnd-kit/react";
import { cn } from "cn";
import { ChevronDown } from "lucide-react";
import { memo, type RefObject, startTransition, useState } from "react";
import AddButton from "@/components/builder/add-button";
import ConnectionsOverlay from "@/components/curriculum/connections-overlay";
import EnrollmentCard from "@/components/trajectory/enrollment-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCourseColor } from "@/curriculum/colors";
import {
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
  getEmptyCells,
  getRowCount,
  HEADER_ROWS,
} from "@/curriculum/grid-cells";
import type { Curriculum, PeriodKey } from "@/types/curriculum";
import type {
  Enrollment,
  Entry,
  Placement,
  TrajectoryProgress,
} from "@/types/trajectory";
import { parsePeriodKey } from "@/utils/period-key";
import { getMoveConflict, moveEnrollment } from "@/utils/trajectory/edits";
import {
  getPeriodInfo,
  layOutTrajectory,
  type PlacedEnrollment,
  toLayoutCurriculum,
} from "@/utils/trajectory/layout";
import { isAvailable } from "@/utils/trajectory/progress";

export const ENTER_STAGGER_MS = 30;

const TOUCH_HOLD_TOLERANCE = 8;

export type Gesture = { dragId: string; placement: Placement };

export function hasLeftStart({ x, y }: { x: number; y: number }) {
  return Math.hypot(x, y) >= TOUCH_HOLD_TOLERANCE;
}

const PeriodHeader = memo(function PeriodHeader({
  period,
  column,
  label,
  year,
  actionsLabel,
  isCurrent,
  canClose,
  onAdd,
  onClosePeriod,
}: {
  period: PeriodKey;
  column: number;
  label: string | undefined;
  year: number;
  actionsLabel: string;
  isCurrent: boolean;
  canClose: boolean;
  onAdd: (period: PeriodKey, column: number) => void;
  onClosePeriod: (period: PeriodKey) => void;
}) {
  return (
    <h2 className="min-w-0" style={{ gridColumn: column, gridRow: 1 }}>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={actionsLabel}
          className={cn(
            "flex min-h-7 w-full items-center gap-1.5 rounded-md px-2 py-1 text-left font-semibold text-muted-foreground text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-muted",
            isCurrent && "text-foreground",
          )}
        >
          <span className="min-w-0 truncate">{label}</span>
          <span className="font-normal tabular-nums opacity-70">{year}</span>
          <ChevronDown className="ml-auto size-3 shrink-0 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem onClick={() => onAdd(period, column)}>
            Agregar curso
          </DropdownMenuItem>
          {canClose && (
            <DropdownMenuItem onClick={() => onClosePeriod(period)}>
              Cerrar periodo
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </h2>
  );
});

const EmptyCell = memo(function EmptyCell({
  period,
  column,
  row,
  label,
  onAdd,
}: {
  period: PeriodKey;
  column: number;
  row: number;
  label: string;
  onAdd: (placement: Placement) => void;
}) {
  return (
    <AddButton
      label={label}
      revealOnHover
      style={{ gridColumn: column, gridRow: HEADER_ROWS + row }}
      onClick={() => onAdd({ period, row })}
    />
  );
});

// The board's grid. The gesture lives here, away from the board's panel and
// dialogs, and only what it moves renders again: this runs each time a dragged
// card enters another cell.
export default function TrajectoryGrid({
  base,
  nextPeriod,
  gesturePeriods,
  enrollments,
  entry,
  curriculum,
  progress,
  selectedId,
  draggingId,
  isEntering,
  isMobile,
  isPanelOpen,
  firstCellRef,
  getMove,
  takeDropOrigin,
  getPeriodLabel,
  hasPendingEnrollments,
  onLeaveStart,
  onSelectCard,
  onAddAtPeriodEnd,
  onAddAt,
  onClosePeriod,
}: {
  base: ReturnType<typeof layOutTrajectory>;
  nextPeriod: PeriodKey | null | undefined;
  gesturePeriods: PeriodKey[];
  enrollments: Enrollment[];
  entry: Entry;
  curriculum: Curriculum;
  progress: TrajectoryProgress;
  selectedId: string | null;
  draggingId: string | null;
  isEntering: boolean;
  isMobile: boolean;
  isPanelOpen: boolean;
  firstCellRef: RefObject<HTMLDivElement | null>;
  getMove: (operation: DragMoveEvent["operation"]) => Gesture | null;
  takeDropOrigin: (dragId: string) => { x: number; y: number } | null;
  getPeriodLabel: (period: PeriodKey) => string;
  hasPendingEnrollments: (column: number) => boolean;
  onLeaveStart: () => void;
  onSelectCard: (id: string) => void;
  onAddAtPeriodEnd: (period: PeriodKey, column: number) => void;
  onAddAt: (placement: Placement) => void;
  onClosePeriod: (period: PeriodKey) => void;
}) {
  const [gesture, setGesture] = useState<Gesture | null>(null);

  // Listening here rather than through the provider's `onDragMove`, which
  // commits a transition on every pointer move even when nothing changes.
  useDragDropMonitor({
    onDragMove: ({ operation }) => {
      if (hasLeftStart(operation.transform)) onLeaveStart();
      const next = getMove(operation);
      if (
        next &&
        (gesture?.dragId !== next.dragId ||
          gesture.placement.period !== next.placement.period ||
          gesture.placement.row !== next.placement.row)
      )
        startTransition(() => setGesture(next));
    },
    onDragEnd: () => startTransition(() => setGesture(null)),
  });

  const context = { entry, curriculum };
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
  const startsNoConnection = new Set(
    shown.cards
      .filter(
        (card) => card.enrollment.status === "FAILED" && card.id !== selectedId,
      )
      .map((card) => card.id),
  );
  // Connections are hidden during a gesture, so what the cards and the overlay
  // read from this only matters at the base layout. Keeping it there spares
  // every card a render per cell.
  const layoutCurriculum = toLayoutCurriculum(curriculum, base, base.cards);
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
  const emptyCells =
    isMobile || isPanelOpen
      ? []
      : getEmptyCells(shown.cards, { rows, columns }).flatMap((cell) => {
          const period = shown.periods[cell.column - 1];
          return period ? [{ ...cell, period }] : [];
        });

  function isBlocked(card: PlacedEnrollment) {
    return (
      card.enrollment.status === "PENDING" &&
      !isAvailable(card.course, progress)
    );
  }

  return (
    <div
      className="relative grid w-max"
      style={{
        gridTemplateColumns: `repeat(${columns + 1}, ${GRID_CELL_WIDTH}rem)`,
        gridTemplateRows: `auto repeat(${rows}, ${GRID_CELL_HEIGHT}rem)`,
        gap: `${GRID_GAP}rem`,
      }}
    >
      {shown.periods.map((period, index) => {
        const { label, isCurrent, hasStarted } = getPeriodInfo(period, entry);
        const column = index + 1;
        return (
          <PeriodHeader
            key={period}
            period={period}
            column={column}
            label={label}
            year={parsePeriodKey(period).year}
            actionsLabel={`Acciones de ${getPeriodLabel(period)}`}
            isCurrent={isCurrent}
            canClose={hasStarted && hasPendingEnrollments(column)}
            onAdd={onAddAtPeriodEnd}
            onClosePeriod={onClosePeriod}
          />
        );
      })}
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
          label={`Agregar curso en ${getPeriodLabel(period)}, fila ${row}`}
          onAdd={onAddAt}
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
          onClick={() => onAddAt({ period: nextPeriod, row: 1 })}
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
        const card = shownCard.id === gesture?.dragId ? baseCard : shownCard;
        return (
          <EnrollmentCard
            key={card.id}
            dragId={card.id}
            course={card.course}
            curriculum={layoutCurriculum}
            color={getCourseColor(curriculum, card.course)}
            status={card.enrollment.status}
            isAvailable={isAvailable(card.course, progress)}
            isBlocker={blockerIds.has(card.id)}
            isSelected={card.id === selectedId}
            isEntering={isEntering}
            enterDelay={isEntering ? (card.column - 1) * ENTER_STAGGER_MS : 0}
            gridColumn={`${card.column} / span ${card.duration}`}
            gridRow={`${HEADER_ROWS + card.row} / span ${card.height}`}
            onSelect={onSelectCard}
            takeDropOrigin={takeDropOrigin}
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
  );
}
