"use client";

import { MoveHorizontal, PanelLeftClose } from "lucide-react";
import { type PointerEvent, useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import {
  clampSidebarWidth,
  DEFAULT_SIDEBAR_WIDTH,
  getDraggedSidebarWidth,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
} from "@/utils/sidebar-width";

const KEYBOARD_STEP = 16;

type DraggedWidth = ReturnType<typeof getDraggedSidebarWidth>;

function getWrapper(handle: HTMLElement) {
  return handle.closest<HTMLElement>("[data-slot=sidebar-wrapper]");
}

function previewWidth(handle: HTMLElement, width: number) {
  getWrapper(handle)?.style.setProperty("--sidebar-width", `${width}px`);
}

function setResizing(handle: HTMLElement, isResizing: boolean) {
  getWrapper(handle)?.toggleAttribute("data-resizing", isResizing);
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

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setResizing(event.currentTarget, true);
    setDrag({ width, isClosing: false });
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const next = getDraggedSidebarWidth(event.clientX);
    previewWidth(event.currentTarget, next.width);
    setDrag(next);
  }

  function cancelDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    setResizing(event.currentTarget, false);
    previewWidth(event.currentTarget, width);
    setDrag(null);
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    if (drag.isClosing) {
      cancelDrag(event);
      setOpen(false);
      return;
    }
    setResizing(event.currentTarget, false);
    setDrag(null);
    onWidthChange(drag.width);
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
