import { useEffect, useRef } from "react";

const LONG_PRESS_MS = 700;
const CLICK_MAX_MS = 200;
const HOVER_DELAY_MS = 100;
const MOVE_TOLERANCE_PX = 5;

type InteractionCallbacks = {
  onClick: () => void;
  onLongPress: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
};

export function useInteractions(callbacks: InteractionCallbacks) {
  const callbacksRef = useRef(callbacks);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cancelPress = useRef<(() => void) | null>(null);

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(
    () => () => {
      clearTimeout(hoverTimeout.current);
      cancelPress.current?.();
    },
    [],
  );

  function onPointerDown(event: React.PointerEvent) {
    event.stopPropagation();
    cancelPress.current?.();

    const origin = { x: event.clientX, y: event.clientY };
    const startedAt = Date.now();

    const longPressTimeout = setTimeout(() => {
      stopPress();
      callbacksRef.current.onLongPress();
    }, LONG_PRESS_MS);

    function handlePointerMove(moveEvent: PointerEvent) {
      if (
        Math.abs(moveEvent.clientX - origin.x) > MOVE_TOLERANCE_PX ||
        Math.abs(moveEvent.clientY - origin.y) > MOVE_TOLERANCE_PX
      ) {
        stopPress();
      }
    }

    function handlePointerUp() {
      stopPress();
      if (Date.now() - startedAt < CLICK_MAX_MS) callbacksRef.current.onClick();
    }

    function stopPress() {
      clearTimeout(longPressTimeout);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      cancelPress.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    cancelPress.current = stopPress;
  }

  function onPointerEnter(event: React.PointerEvent) {
    event.stopPropagation();
    if (event.pointerType !== "mouse") return;

    hoverTimeout.current = setTimeout(
      () => callbacksRef.current.onHoverStart(),
      HOVER_DELAY_MS,
    );
  }

  function onPointerLeave(event: React.PointerEvent) {
    event.stopPropagation();
    if (event.pointerType !== "mouse") return;

    clearTimeout(hoverTimeout.current);
    callbacksRef.current.onHoverEnd();
  }

  return { onPointerDown, onPointerEnter, onPointerLeave };
}
