import type { History, HistoryAction } from "@/types/history";

const MAX_HISTORY = 50;

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
      if (action.group !== undefined && action.group === history.group) {
        const previous = history.past.at(-1);
        if (isDeepEqual(action.present, previous))
          return {
            past: history.past.slice(0, -1),
            present: action.present,
            future: [],
          };

        return { ...history, present: action.present };
      }

      return {
        past: [...history.past, history.present].slice(-MAX_HISTORY),
        present: action.present,
        future: [],
        group: action.group,
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
