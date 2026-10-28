import { create } from "zustand";

// Connections that show up again this soon after hiding are still "warm", so
// they switch at once instead of drawing in.
const WARM_MS = 300;
const DRAW_IN_MS = 250;

type ConnectionFocusState = {
  hoveredCourseId: number | null;
  keyboardCourseId: number | null;
  selectedCourseId: number | null;
  // Whether connections that appear now draw themselves in.
  isDrawingIn: boolean;
};

type ConnectionFocusStore = ConnectionFocusState & {
  hover: (courseId: number) => void;
  focusByKeyboard: (courseId: number) => void;
  select: (courseId: number | null) => void;
  // Stops a course being hovered or focused, if it still is.
  release: (
    courseId: number,
    source?: "hoveredCourseId" | "keyboardCourseId",
  ) => void;
};

// The course whose connections are shown: the one under the pointer, else the
// one focused by keyboard, else the selected one.
export function getFocusedCourseId(state: ConnectionFocusState) {
  return (
    state.hoveredCourseId ?? state.keyboardCourseId ?? state.selectedCourseId
  );
}

let hiddenAt = Number.NEGATIVE_INFINITY;
let drawInTimer: ReturnType<typeof setTimeout> | undefined;

export const useConnectionFocus = create<ConnectionFocusStore>()((set, get) => {
  function update(changes: Partial<ConnectionFocusState>) {
    const before = getFocusedCourseId(get());
    set(changes);
    const after = getFocusedCourseId(get());
    const now = performance.now();
    if (before !== null && after === null) hiddenAt = now;
    if (before === null && after !== null && now - hiddenAt > WARM_MS) {
      clearTimeout(drawInTimer);
      set({ isDrawingIn: true });
      drawInTimer = setTimeout(() => set({ isDrawingIn: false }), DRAW_IN_MS);
    }
  }

  return {
    hoveredCourseId: null,
    keyboardCourseId: null,
    selectedCourseId: null,
    isDrawingIn: false,
    hover: (courseId) => update({ hoveredCourseId: courseId }),
    focusByKeyboard: (courseId) => update({ keyboardCourseId: courseId }),
    select: (courseId) => update({ selectedCourseId: courseId }),
    release: (courseId, source) => {
      const state = get();
      const changes: Partial<ConnectionFocusState> = {};
      for (const key of source
        ? [source]
        : (["hoveredCourseId", "keyboardCourseId"] as const))
        if (state[key] === courseId) changes[key] = null;
      update(changes);
    },
  };
});
