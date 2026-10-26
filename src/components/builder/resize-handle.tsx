"use client";

import { cn } from "cn";
import { type PointerEvent, useRef } from "react";
import {
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
} from "@/utils/curriculum-grid";

type Edge = "bottom" | "right";

function getCellDelta(edge: Edge, event: PointerEvent, origin: number) {
  const rootFontSize = Number.parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );
  const cell = edge === "bottom" ? GRID_CELL_HEIGHT : GRID_CELL_WIDTH;
  const pointer = edge === "bottom" ? event.clientY : event.clientX;
  return Math.round((pointer - origin) / ((cell + GRID_GAP) * rootFontSize));
}

export default function ResizeHandle({
  edge,
  label,
  onResize,
  onRelease,
}: {
  edge: Edge;
  label: string;
  onResize: (cells: number) => void;
  onRelease: (cells: number) => void;
}) {
  const origin = useRef<number | null>(null);

  return (
    <div
      role="presentation"
      aria-label={label}
      className={cn(
        "absolute z-20 touch-none",
        edge === "bottom"
          ? "inset-x-2 -bottom-1 h-2 cursor-ns-resize"
          : "inset-y-2 -right-1 w-2 cursor-ew-resize",
      )}
      onPointerDown={(event) => {
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        origin.current = edge === "bottom" ? event.clientY : event.clientX;
      }}
      onPointerMove={(event) => {
        if (origin.current === null) return;
        onResize(getCellDelta(edge, event, origin.current));
      }}
      onPointerUp={(event) => {
        if (origin.current === null) return;
        const cells = getCellDelta(edge, event, origin.current);
        origin.current = null;
        onRelease(cells);
      }}
      onPointerCancel={() => {
        if (origin.current === null) return;
        origin.current = null;
        onResize(0);
        onRelease(0);
      }}
    />
  );
}
