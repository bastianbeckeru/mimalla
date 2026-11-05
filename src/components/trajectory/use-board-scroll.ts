import { type RefObject, useEffect, useLayoutEffect } from "react";
import {
  FULL_SNAP_POINT,
  getPeekHeight,
  type PanelSnapPoint,
} from "@/components/trajectory/course-panel";
import {
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
} from "@/curriculum/grid-cells";

const PREVIOUS_PERIOD_PEEK_REM = 2.5;
const REVEAL_MARGIN_REM = 1;

type ScrollRefs = {
  sectionRef: RefObject<HTMLElement | null>;
  firstCellRef: RefObject<HTMLElement | null>;
};

type CardBox = {
  column: number;
  row: number;
  duration: number;
  height: number;
};

export function useOpeningScroll({
  sectionRef,
  firstCellRef,
  firstVisibleColumn,
}: ScrollRefs & { firstVisibleColumn: number }) {
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const firstCell = firstCellRef.current;
    if (!section || !firstCell) return;
    const rootFontSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    const column = (firstVisibleColumn - 1) * (GRID_CELL_WIDTH + GRID_GAP);
    section.scrollLeft +=
      firstCell.getBoundingClientRect().left -
      section.getBoundingClientRect().left +
      (column - PREVIOUS_PERIOD_PEEK_REM) * rootFontSize;
  }, [firstCellRef, firstVisibleColumn, sectionRef]);
}

export function useRevealPanelCard({
  sectionRef,
  firstCellRef,
  isMobile,
  isPanelOpen,
  snapPoint,
  card,
}: ScrollRefs & {
  isMobile: boolean;
  isPanelOpen: boolean;
  snapPoint: PanelSnapPoint;
  card: CardBox | null;
}) {
  const panelColumn = card?.column;
  const panelRow = card?.row;
  const panelDuration = card?.duration;
  const panelHeight = card?.height;

  useEffect(() => {
    const section = sectionRef.current;
    const firstCell = firstCellRef.current;
    if (
      !isPanelOpen ||
      snapPoint === FULL_SNAP_POINT ||
      !section ||
      !firstCell ||
      panelColumn === undefined ||
      panelRow === undefined ||
      panelDuration === undefined ||
      panelHeight === undefined
    )
      return;

    const rem = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    const sectionRect = section.getBoundingClientRect();
    const cellRect = firstCell.getBoundingClientRect();
    const stepX = (GRID_CELL_WIDTH + GRID_GAP) * rem;
    const stepY = (GRID_CELL_HEIGHT + GRID_GAP) * rem;
    const margin = REVEAL_MARGIN_REM * rem;
    const left =
      cellRect.left -
      sectionRect.left +
      section.scrollLeft +
      (panelColumn - 1) * stepX;
    const top =
      cellRect.top -
      sectionRect.top +
      section.scrollTop +
      (panelRow - 1) * stepY;
    const right = left + panelDuration * stepX - GRID_GAP * rem;
    const bottom = top + panelHeight * stepY - GRID_GAP * rem;
    const visibleHeight = isMobile
      ? Math.min(
          section.clientHeight,
          window.innerHeight - getPeekHeight() - sectionRect.top,
        )
      : section.clientHeight;

    section.scrollTo({
      left:
        left - margin < section.scrollLeft
          ? left - margin
          : right + margin > section.scrollLeft + section.clientWidth
            ? right + margin - section.clientWidth
            : section.scrollLeft,
      top:
        top - margin < section.scrollTop
          ? top - margin
          : bottom + margin > section.scrollTop + visibleHeight
            ? bottom + margin - visibleHeight
            : section.scrollTop,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [
    firstCellRef,
    isMobile,
    isPanelOpen,
    panelColumn,
    panelDuration,
    panelHeight,
    panelRow,
    sectionRef,
    snapPoint,
  ]);
}
