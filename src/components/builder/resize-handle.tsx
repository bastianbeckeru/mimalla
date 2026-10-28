"use client";

import { type PointerEvent, useRef } from "react";
import {
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
} from "@/utils/curriculum-grid";

type Point = { x: number; y: number };
type CellDelta = { height: number; duration: number };

function getCellDelta(event: PointerEvent, origin: Point): CellDelta {
  const rootFontSize = Number.parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );
  return {
    height: Math.round(
      (event.clientY - origin.y) /
        ((GRID_CELL_HEIGHT + GRID_GAP) * rootFontSize),
    ),
    duration: Math.round(
      (event.clientX - origin.x) /
        ((GRID_CELL_WIDTH + GRID_GAP) * rootFontSize),
    ),
  };
}

export default function ResizeHandle({
  onResize,
  onRelease,
}: {
  onResize: (delta: CellDelta) => void;
  onRelease: (delta: CellDelta) => void;
}) {
  const origin = useRef<Point | null>(null);

  return (
    <div
      role="presentation"
      aria-label="Cambiar créditos y duración"
      className="absolute -right-1 -bottom-1 z-20 size-6 cursor-nwse-resize touch-none p-2 opacity-0 transition-opacity group-hover/card:opacity-100 group-data-selected/card:opacity-100"
      onPointerDown={(event) => {
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        origin.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerMove={(event) => {
        if (origin.current === null) return;
        onResize(getCellDelta(event, origin.current));
      }}
      onPointerUp={(event) => {
        if (origin.current === null) return;
        const delta = getCellDelta(event, origin.current);
        origin.current = null;
        onRelease(delta);
      }}
      onPointerCancel={() => {
        if (origin.current === null) return;
        origin.current = null;
        onResize({ height: 0, duration: 0 });
        onRelease({ height: 0, duration: 0 });
      }}
    >
      <span className="block size-full rounded-br-sm border-current border-r-2 border-b-2 opacity-70" />
    </div>
  );
}
