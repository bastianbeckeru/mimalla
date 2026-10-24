import { useMemo, useReducer } from "react";

const MAX_HISTORY = 50;

type History<T> = {
  past: T[];
  present: T;
  future: T[];
};

type HistoryAction<T> =
  | { type: "commit"; present: T }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; present: T };

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

export function historyReducer<T>(
  history: History<T>,
  action: HistoryAction<T>,
): History<T> {
  switch (action.type) {
    case "commit":
      if (isDeepEqual(action.present, history.present)) return history;

      return {
        past: [...history.past, history.present].slice(-MAX_HISTORY),
        present: action.present,
        future: [],
      };
    case "undo": {
      const previous = history.past.at(-1);
      if (previous === undefined) return history;

      return {
        past: history.past.slice(0, -1),
        present: previous,
        future: [history.present, ...history.future].slice(0, MAX_HISTORY),
      };
    }
    case "redo": {
      const [next, ...future] = history.future;
      if (next === undefined) return history;

      return {
        past: [...history.past, history.present].slice(-MAX_HISTORY),
        present: next,
        future,
      };
    }
    case "reset":
      return createHistory(action.present);
  }
}

function isDeepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const aEntries = Object.entries(a);
  const bRecord = b as Record<string, unknown>;
  return (
    aEntries.length === Object.keys(b).length &&
    aEntries.every(
      ([key, value]) =>
        Object.hasOwn(b, key) && isDeepEqual(value, bRecord[key]),
    )
  );
}

export function useHistory<T>(initialPresent: () => T) {
  const [history, dispatch] = useReducer(historyReducer<T>, undefined, () =>
    createHistory(initialPresent()),
  );

  const controls = useMemo(
    () => ({
      commit: (present: T) => dispatch({ type: "commit", present }),
      undo: () => dispatch({ type: "undo" }),
      redo: () => dispatch({ type: "redo" }),
      reset: (present: T) => dispatch({ type: "reset", present }),
    }),
    [],
  );

  return {
    present: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    ...controls,
  };
}

export type HistoryControls<T> = ReturnType<typeof useHistory<T>>;
