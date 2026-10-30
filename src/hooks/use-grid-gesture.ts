import { useRef } from "react";
import { GRID_GAP, getCellAt } from "@/utils/curriculum-grid";

type Origin = { x: number; y: number };

// What a draggable course grid needs to follow a gesture: the cell under a
// dragged card, measured from an invisible first cell, and where the card was
// dropped so it can glide from there into its new place.
export function useGridGesture() {
  const firstCellRef = useRef<HTMLDivElement>(null);
  const dropOrigin = useRef<(Origin & { dragId: string }) | null>(null);

  function getCellUnder(
    rect: { left: number; top: number },
    { columns, duration }: { columns: number; duration: number },
  ) {
    const firstCell = firstCellRef.current?.getBoundingClientRect();
    if (!firstCell) return null;
    const rootFontSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    return getCellAt(rect, {
      firstCell,
      gap: GRID_GAP * rootFontSize,
      columns,
      duration,
    });
  }

  function keepDropOrigin(dragId: string, rect: { left: number; top: number }) {
    dropOrigin.current = { dragId, x: rect.left, y: rect.top };
  }

  function takeDropOrigin(dragId: string): Origin | null {
    if (dropOrigin.current?.dragId !== dragId) return null;
    const { x, y } = dropOrigin.current;
    dropOrigin.current = null;
    return { x, y };
  }

  return { firstCellRef, getCellUnder, keepDropOrigin, takeDropOrigin };
}
