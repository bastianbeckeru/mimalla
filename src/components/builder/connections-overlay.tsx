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

const STROKE_WIDTH = 0.1;
const MISPLACED_DASHES = "0.3 0.2";

function getStroke(connection: Connection) {
  if (connection.isMisplaced) return "var(--warning)";
  return connection.kind === "prerequisite"
    ? "var(--connection-prerequisite)"
    : "var(--connection-successor)";
}

// Draws the connections of the focused course: the gesture's course while a
// card is dragged or resized, else the hovered, focused or selected one.
export default function ConnectionsOverlay({
  curriculum,
  cards,
  size,
  gestureCourseId,
  selectedCourseId,
}: {
  curriculum: Curriculum;
  cards: ConnectionCard[];
  size: GridSize;
  gestureCourseId: number | null;
  selectedCourseId: number | null;
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
  const connections = getConnections(curriculum, cards, focusedCourseId);
  if (connections.length === 0) return null;
  const paths = routeConnections(connections, cards, size);
  const { width, height } = getCanvasSize(size);

  return (
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
  );
}
