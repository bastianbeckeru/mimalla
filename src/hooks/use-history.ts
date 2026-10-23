import { useState } from "react";

const MAX_HISTORY = 50;

type History<T> = {
  past: T[];
  present: T;
  future: T[];
};

export function useHistory<T>(initialPresent: () => T) {
  const [history, setHistory] = useState<History<T>>(() => ({
    past: [],
    present: initialPresent(),
    future: [],
  }));

  return {
    present: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    commit: (present: T) =>
      setHistory((prev) => ({
        past: [...prev.past, prev.present].slice(-MAX_HISTORY),
        present,
        future: [],
      })),
    undo: () =>
      setHistory((prev) => {
        const previous = prev.past.at(-1);
        if (previous === undefined) return prev;

        return {
          past: prev.past.slice(0, -1),
          present: previous,
          future: [prev.present, ...prev.future].slice(0, MAX_HISTORY),
        };
      }),
    redo: () =>
      setHistory((prev) => {
        const [next, ...future] = prev.future;
        if (next === undefined) return prev;

        return {
          past: [...prev.past, prev.present].slice(-MAX_HISTORY),
          present: next,
          future,
        };
      }),
    reset: (present: T) => setHistory({ past: [], present, future: [] }),
  };
}

export type HistoryControls<T> = ReturnType<typeof useHistory<T>>;
