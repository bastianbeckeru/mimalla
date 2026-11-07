"use client";

import { MoveHorizontal, PanelLeftClose } from "lucide-react";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import {
  clampSidebarWidth,
  DEFAULT_SIDEBAR_WIDTH,
  getDraggedSidebarWidth,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
} from "@/utils/sidebar-width";

const KEYBOARD_STEP = 16;

const WIDTH_PROPERTY = "--sidebar-width";

type DraggedWidth = ReturnType<typeof getDraggedSidebarWidth>;

type ActiveDrag = {
  wrapper: HTMLElement;
  startWidth: number;
  grabOffset: number;
};

function previewWidth(wrapper: HTMLElement, width: number) {
  wrapper.style.setProperty(WIDTH_PROPERTY, `${width}px`);
}

function abandonDrag({ wrapper, startWidth }: ActiveDrag) {
  wrapper.removeAttribute("data-resizing");
  previewWidth(wrapper, startWidth);
}

export default function SidebarResizeHandle({
  width,
  onWidthChange,
}: {
  width: number;
  onWidthChange: (width: number) => void;
}) {
  const { setOpen } = useSidebar();
  const [drag, setDrag] = useState<DraggedWidth | null>(null);
  const activeDrag = useRef<ActiveDrag | null>(null);

  useEffect(
    () => () => {
      if (activeDrag.current) abandonDrag(activeDrag.current);
    },
    [],
  );

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    const wrapper = event.currentTarget.closest<HTMLElement>(
      "[data-slot=sidebar-wrapper]",
    );
    if (event.button !== 0 || !wrapper) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    wrapper.setAttribute("data-resizing", "");
    activeDrag.current = {
      wrapper,
      startWidth: width,
      grabOffset: event.clientX - width,
    };
    setDrag({ width, isClosing: false });
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const active = activeDrag.current;
    if (!active) return;
    const next = getDraggedSidebarWidth(event.clientX - active.grabOffset);
    previewWidth(active.wrapper, next.width);
    setDrag(next);
  }

  function cancelDrag() {
    if (!activeDrag.current) return;
    abandonDrag(activeDrag.current);
    activeDrag.current = null;
    setDrag(null);
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    const active = activeDrag.current;
    if (!active) return;
    const next = getDraggedSidebarWidth(event.clientX - active.grabOffset);
    if (next.isClosing) {
      cancelDrag();
      setOpen(false);
      return;
    }
    previewWidth(active.wrapper, next.width);
    active.wrapper.removeAttribute("data-resizing");
    activeDrag.current = null;
    setDrag(null);
    onWidthChange(next.width);
  }

  return (
    <>
      {drag?.isClosing && (
        <div className="pointer-events-none absolute inset-0 bg-sidebar/60" />
      )}
      {/* biome-ignore lint/a11y/useSemanticElements: a focusable separator with a value is the ARIA window splitter, which <hr> cannot be */}
      <div
        role="separator"
        tabIndex={0}
        aria-label="Ajustar ancho de la barra lateral"
        aria-orientation="vertical"
        aria-valuemin={MIN_SIDEBAR_WIDTH}
        aria-valuemax={MAX_SIDEBAR_WIDTH}
        aria-valuenow={width}
        data-dragging={drag ? "" : undefined}
        className="group/handle absolute inset-y-0 -right-1.5 z-20 flex w-3 cursor-col-resize touch-none select-none justify-center outline-none"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onPointerCancel={cancelDrag}
        onLostPointerCapture={cancelDrag}
        onDoubleClick={() => onWidthChange(DEFAULT_SIDEBAR_WIDTH)}
        onKeyDown={(event) => {
          const direction =
            event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
          if (direction === 0) return;
          event.preventDefault();
          onWidthChange(clampSidebarWidth(width + direction * KEYBOARD_STEP));
        }}
      >
        <span className="w-px bg-transparent transition-colors group-hover/handle:bg-foreground/40 group-focus-visible/handle:bg-ring group-data-dragging/handle:bg-foreground/60" />
      </div>
      {drag && (
        <div className="pointer-events-none absolute top-1/2 left-full z-20 ml-2 flex -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-md border bg-popover px-2 py-1 font-medium text-popover-foreground text-xs tabular-nums shadow-sm [&_svg]:size-3.5">
          {drag.isClosing ? (
            <>
              <PanelLeftClose />
              Suelta para cerrar
            </>
          ) : (
            <>
              <MoveHorizontal />
              {drag.width} px
            </>
          )}
        </div>
      )}
    </>
  );
}
