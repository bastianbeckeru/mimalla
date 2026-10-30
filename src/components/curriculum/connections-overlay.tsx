"use client";

import { cn } from "cn";
import { useEffect } from "react";
import {
  type Connection,
  type ConnectionCard,
  getConnections,
} from "@/builder/connections";
import {
  type GridSize,
  getCanvasSize,
  routeConnections,
} from "@/builder/routing";
import { getFocusedCourseId, useConnectionFocus } from "@/stores/connections";
import type { Curriculum } from "@/types/builder";
import { GRID_GAP } from "@/utils/curriculum-grid";

const STROKE_WIDTH = 0.1;
const MISPLACED_DASHES = "0.3 0.2";

function getStroke(connection: Connection) {
  if (connection.isMisplaced) return "var(--warning)";
  return connection.kind === "prerequisite"
    ? "var(--connection-prerequisite)"
    : "var(--connection-successor)";
}

// Draws the connections of the focused course: the gesture's course while a
// card is dragged or resized, else the hovered, focused or selected one. It
// covers the grid rows of the cards, from `firstRow` on.
export default function ConnectionsOverlay({
  curriculum,
  cards,
  size,
  firstRow,
  gestureCourseId = null,
  selectedCourseId,
  isShown = () => true,
}: {
  curriculum: Curriculum;
  cards: ConnectionCard[];
  size: GridSize;
  firstRow: number;
  gestureCourseId?: number | null;
  selectedCourseId: number | null;
  isShown?: (connection: Connection) => boolean;
}) {
  const select = useConnectionFocus((state) => state.select);
  const focusedCourseId = useConnectionFocus(
    (state) => gestureCourseId ?? getFocusedCourseId(state),
  );
  // Connections only draw in when they first appear, never while a gesture
  // keeps moving them.
  const isDrawingIn = useConnectionFocus(
    (state) => state.isDrawingIn && gestureCourseId === null,
  );

  useEffect(() => select(selectedCourseId), [select, selectedCourseId]);

  if (focusedCourseId === null) return null;
  const connections = getConnections(curriculum, cards, focusedCourseId).filter(
    isShown,
  );
  if (connections.length === 0) return null;
  const paths = routeConnections(connections, cards, size);
  const { width, height } = getCanvasSize(size);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-0"
      style={{
        gridColumn: `1 / span ${size.columns}`,
        gridRow: `${firstRow} / span ${size.rows}`,
        inset: `-${GRID_GAP}rem`,
      }}
    >
      <svg
        aria-hidden
        className="absolute top-0 left-0 overflow-visible"
        style={{ width: `${width}rem`, height: `${height}rem` }}
        viewBox={`0 0 ${width} ${height}`}
      >
        {connections.map((connection) => {
          const data = paths.get(connection.id);
          if (!data) return null;
          return (
            <path
              key={connection.id}
              d={data}
              fill="none"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={connection.isMisplaced ? undefined : 1}
              strokeDasharray={
                connection.isMisplaced ? MISPLACED_DASHES : undefined
              }
              className={cn(
                isDrawingIn &&
                  (connection.isMisplaced
                    ? "animate-connection-fade"
                    : "animate-connection-draw"),
              )}
              style={{ stroke: getStroke(connection) }}
            />
          );
        })}
      </svg>
    </div>
  );
}
