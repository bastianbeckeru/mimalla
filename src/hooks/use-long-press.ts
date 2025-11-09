import type { Coordinates } from "@/utils/pathfinding";
import { useRef, useCallback, useEffect } from "react";

type UseInteractionsOptions = {
  onLongPress?: (event: PointerEvent) => void;
  onClick?: (event: PointerEvent) => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onScroll?: (event: PointerEvent) => void;
  longPressThreshold?: number;
  hoverDelay?: number;
  moveTolerance?: number;
};

export const useInteractions = (options: UseInteractionsOptions = {}) => {
  const {
    onLongPress,
    onClick,
    onHoverStart,
    onHoverEnd,
    onScroll,
    longPressThreshold = 700,
    hoverDelay = 100,
    moveTolerance = 10,
  } = options;

  const timeout = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const startCoords = useRef<Coordinates>({ x: 0, y: 0 });
  const isPressing = useRef(false);
  const longPressTriggered = useRef(false);
  const currentPointerType = useRef<string>(""); // 'mouse', 'touch', 'pen'
  const callbackRef = useRef(onLongPress);
  const onClickRef = useRef(onClick);
  const onHoverRef = useRef(onHoverStart);
  const onHoverEndRef = useRef(onHoverEnd);
  const onScrollRef = useRef(onScroll);

  useEffect(() => {
    callbackRef.current = onLongPress;
  }, [onLongPress]);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    onHoverRef.current = onHoverStart;
  }, [onHoverStart]);

  useEffect(() => {
    onHoverEndRef.current = onHoverEnd;
  }, [onHoverEnd]);

  useEffect(() => {
    onScrollRef.current = onScroll;
  }, [onScroll]);

  const getCoordinates = (event: PointerEvent): Coordinates => {
    return { x: event.clientX, y: event.clientY };
  };

  const isScrolling = (event: PointerEvent, tolerance = 5): boolean => {
    const current = getCoordinates(event);
    return (
      Math.abs(current.x - startCoords.current.x) > tolerance ||
      Math.abs(current.y - startCoords.current.y) > tolerance
    );
  };

  const start = useCallback(
    (event: React.PointerEvent) => {
      event.stopPropagation();

      currentPointerType.current = event.pointerType;

      isPressing.current = true;
      longPressTriggered.current = false;
      startCoords.current = getCoordinates(event.nativeEvent);

      timeout.current = setTimeout(() => {
        if (callbackRef.current) {
          longPressTriggered.current = true;
          callbackRef.current(event.nativeEvent);
        }
        isPressing.current = false;
      }, longPressThreshold);
    },
    [longPressThreshold],
  );

  const clear = useCallback(
    (event: PointerEvent, shouldTriggerClick = true) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }

      if (isPressing.current) {
        if (
          shouldTriggerClick &&
          onClickRef.current &&
          !longPressTriggered.current
        ) {
          onClickRef.current(event);
        }
        isPressing.current = false;
      }

      // Reset pointer type
      currentPointerType.current = "";
    },
    [],
  );

  const handleMove = useCallback(
    (event: PointerEvent) => {
      if (isPressing.current && isScrolling(event)) {
        clear(event, false);
        if (onScrollRef.current) {
          onScrollRef.current(event);
        }
      }
    },
    [clear],
  );

  // Solo activar hover para mouse (no touch ni pen)
  const handlePointerEnter = useCallback(
    (event: React.PointerEvent) => {
      event.stopPropagation();

      if (event.pointerType === "mouse") {
        hoverTimeout.current = setTimeout(() => {
          if (onHoverRef.current) {
            onHoverRef.current();
          }
        }, hoverDelay);
      }
    },
    [hoverDelay],
  );

  // Solo ejecutar onHoverEnd si fue mouse
  const handlePointerLeave = useCallback((event: React.PointerEvent) => {
    event.stopPropagation();

    if (event.pointerType === "mouse") {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }
      if (onHoverEndRef.current) {
        onHoverEndRef.current();
      }
    }
  }, []);

  useEffect(() => {
    const handlePointerUp = (event: PointerEvent) => clear(event);
    const handlePointerMove = (event: PointerEvent) => handleMove(event);

    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointermove", handlePointerMove);

    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [clear, handleMove]);

  return {
    onPointerDown: start,
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
  };
};

export default useInteractions;
