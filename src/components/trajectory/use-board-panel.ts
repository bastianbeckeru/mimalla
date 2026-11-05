import { useHotkey } from "@tanstack/react-hotkeys";
import { type RefObject, useEffect, useRef, useState } from "react";
import {
  FULL_SNAP_POINT,
  type PanelSnapPoint,
  PEEK_SNAP_POINT,
} from "@/components/trajectory/course-panel";
import type { PlacedEnrollment } from "@/utils/trajectory/layout";

const DRAG_CLICK_MS = 300;

export function useBoardPanel({
  sectionRef,
  isMobile,
  cards,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  isMobile: boolean;
  cards: PlacedEnrollment[];
}) {
  const lastDragEndAt = useRef(Number.NEGATIVE_INFINITY);
  const isDragging = useRef(false);
  const [panelId, setPanelId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [snapPoint, setSnapPoint] = useState<PanelSnapPoint>(PEEK_SNAP_POINT);
  const selectedId = isPanelOpen ? panelId : null;
  const panelCard = cards.find((card) => card.id === panelId) ?? null;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !isPanelOpen) return;
    function closeOnEmptyClick(event: MouseEvent) {
      if (
        performance.now() - lastDragEndAt.current < DRAG_CLICK_MS ||
        (event.target instanceof Element &&
          event.target.closest("button, [data-course-card]"))
      )
        return;
      setIsPanelOpen(false);
    }
    section.addEventListener("click", closeOnEmptyClick);
    return () => section.removeEventListener("click", closeOnEmptyClick);
  }, [isPanelOpen, sectionRef]);

  useHotkey(
    "Escape",
    (event) => {
      // The Escape that cancels a keyboard drag does not close the panel too.
      if (!event.defaultPrevented) setIsPanelOpen(false);
    },
    { enabled: isPanelOpen && !isMobile, preventDefault: false },
  );

  function openPanel(card: PlacedEnrollment) {
    if (!isPanelOpen) setSnapPoint(PEEK_SNAP_POINT);
    setPanelId(card.id);
    setIsPanelOpen(true);
  }

  function selectCard(id: string) {
    if (
      isDragging.current ||
      performance.now() - lastDragEndAt.current < DRAG_CLICK_MS
    )
      return;
    const card = cards.find((card) => card.id === id);
    if (!card) return;
    if (id !== selectedId) openPanel(card);
    else if (isMobile) setSnapPoint(FULL_SNAP_POINT);
    else setIsPanelOpen(false);
  }

  function markDragStart() {
    isDragging.current = true;
  }

  function markDragEnd() {
    isDragging.current = false;
    lastDragEndAt.current = performance.now();
  }

  return {
    panelCard,
    selectedId,
    isPanelOpen,
    setIsPanelOpen,
    snapPoint,
    setSnapPoint,
    openPanel,
    selectCard,
    markDragStart,
    markDragEnd,
  };
}
