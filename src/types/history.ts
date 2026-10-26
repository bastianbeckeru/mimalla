export type History<T> = {
  past: T[];
  present: T;
  future: T[];
  group?: string;
};

export type HistoryAction<T> =
  | { type: "commit"; present: T; group?: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "endGroup" }
  | { type: "reset"; present: T };
