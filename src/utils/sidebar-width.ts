export const MIN_SIDEBAR_WIDTH = 240;
export const DEFAULT_SIDEBAR_WIDTH = 288;
export const MAX_SIDEBAR_WIDTH = 360;

const CLOSE_DISTANCE_PAST_MIN = MIN_SIDEBAR_WIDTH * 0.75;

export function clampSidebarWidth(width: number) {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));
}

export function getDraggedSidebarWidth(pointerX: number) {
  return {
    width: Math.round(clampSidebarWidth(pointerX)),
    isClosing: pointerX < MIN_SIDEBAR_WIDTH - CLOSE_DISTANCE_PAST_MIN,
  };
}

export function parseSidebarWidth(stored: string | null) {
  const width = Number(stored);
  return stored === null || !Number.isFinite(width)
    ? DEFAULT_SIDEBAR_WIDTH
    : clampSidebarWidth(width);
}
