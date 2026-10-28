import { useMemo, useReducer } from "react";
import { createHistory, historyReducer } from "@/utils/history";

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
