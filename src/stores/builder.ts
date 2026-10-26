import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apply } from "@/builder/apply";
import { createDraft } from "@/builder/draft";
import type { Action, Draft } from "@/types/builder";
import type { History, HistoryAction } from "@/types/history";
import { createHistory, historyReducer } from "@/utils/history";

type BuilderState = {
  draft: Draft;
  history: History<Draft>;
};

type BuilderActions = {
  dispatch: (action: Action, options?: { group?: string }) => void;
  load: (draft: Draft) => void;
  undo: () => void;
  redo: () => void;
};

const initialDraft = createDraft("semester");

export const useBuilderStore = create<BuilderState & BuilderActions>()(
  persist(
    (set) => {
      const update = (
        toHistoryAction: (present: Draft) => HistoryAction<Draft>,
      ) =>
        set((state) => {
          const history = historyReducer(
            state.history,
            toHistoryAction(state.history.present),
          );
          return { history, draft: history.present };
        });

      return {
        draft: initialDraft,
        history: createHistory(initialDraft),
        dispatch: (action, options) =>
          update((present) => {
            const next = apply(present, action);
            return action.type === "createCurriculum"
              ? { type: "reset", present: next }
              : { type: "commit", present: next, group: options?.group };
          }),
        load: (draft) => update(() => ({ type: "reset", present: draft })),
        undo: () => update(() => ({ type: "undo" })),
        redo: () => update(() => ({ type: "redo" })),
      };
    },
    {
      name: "builder-storage",
      version: 1,
      partialize: (state) => ({ draft: state.draft }),
      merge: (persisted, current) => {
        const draft =
          (persisted as Partial<BuilderState> | undefined)?.draft ??
          current.draft;
        return { ...current, draft, history: createHistory(draft) };
      },
    },
  ),
);

export function useBuilderHasHydrated() {
  return useSyncExternalStore(
    (onChange) => useBuilderStore.persist.onFinishHydration(onChange),
    () => useBuilderStore.persist.hasHydrated(),
    () => false,
  );
}
