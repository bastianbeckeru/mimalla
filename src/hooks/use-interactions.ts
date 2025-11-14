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
  clickThreshold?: number; // NUEVO
};

const useInteractions = (options: UseInteractionsOptions = {}) => {
  const {
    onLongPress,
    onClick,
    onHoverStart,
    onHoverEnd,
    onScroll,
    longPressThreshold = 700,
    hoverDelay = 100,
    moveTolerance = 5,
    clickThreshold = 200, // NUEVO: umbral para considerar un click válido
  } = options;

  const timeout = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const startCoords = useRef<Coordinates>({ x: 0, y: 0 });
  const pressStartTime = useRef<number>(0); // NUEVO
  const isPressing = useRef(false);
  const longPressTriggered = useRef(false);

  const callbacksRef = useRef({
    onLongPress,
    onClick,
    onHoverStart,
    onHoverEnd,
    onScroll,
  });

  useEffect(() => {
    callbacksRef.current = {
      onLongPress,
      onClick,
      onHoverStart,
      onHoverEnd,
      onScroll,
    };
  }, [onLongPress, onClick, onHoverStart, onHoverEnd, onScroll]);

  const getCoordinates = (event: PointerEvent): Coordinates => {
    return { x: event.clientX, y: event.clientY };
  };

  const isScrolling = (event: PointerEvent): boolean => {
    const current = getCoordinates(event);
    return (
      Math.abs(current.x - startCoords.current.x) > moveTolerance ||
      Math.abs(current.y - startCoords.current.y) > moveTolerance
    );
  };

  const start = useCallback(
    (event: React.PointerEvent) => {
      event.stopPropagation();

      isPressing.current = true;
      longPressTriggered.current = false;
      pressStartTime.current = Date.now(); // NUEVO
      startCoords.current = getCoordinates(event.nativeEvent);

      timeout.current = setTimeout(() => {
        if (callbacksRef.current.onLongPress) {
          longPressTriggered.current = true;
          callbacksRef.current.onLongPress(event.nativeEvent);
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
        const pressDuration = Date.now() - pressStartTime.current; // NUEVO
        const isValidClick = pressDuration < clickThreshold; // NUEVO

        if (
          shouldTriggerClick &&
          callbacksRef.current.onClick &&
          !longPressTriggered.current &&
          isValidClick // NUEVO: solo ejecutar onClick si fue un click rápido
        ) {
          callbacksRef.current.onClick(event);
        }
        isPressing.current = false;
      }
    },
    [clickThreshold], // NUEVO
  );

  const handleMove = useCallback(
    (event: PointerEvent) => {
      if (isPressing.current && isScrolling(event)) {
        clear(event, false);
        callbacksRef.current.onScroll?.(event);
      }
    },
    [clear],
  );

  const handlePointerEnter = useCallback(
    (event: React.PointerEvent) => {
      event.stopPropagation();

      if (event.pointerType === "mouse") {
        hoverTimeout.current = setTimeout(() => {
          callbacksRef.current.onHoverStart?.();
        }, hoverDelay);
      }
    },
    [hoverDelay],
  );

  const handlePointerLeave = useCallback((event: React.PointerEvent) => {
    event.stopPropagation();

    if (event.pointerType === "mouse") {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }
      callbacksRef.current.onHoverEnd?.();
    }
  }, []);

  useEffect(() => {
    const handlePointerUp = (event: PointerEvent) => clear(event);
    const handlePointerMove = (event: PointerEvent) => handleMove(event);

    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointermove", handlePointerMove);

    return () => {
      if (timeout.current) clearTimeout(timeout.current);
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);

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
