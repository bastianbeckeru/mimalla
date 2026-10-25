import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Action, apply } from "@/builder/apply";
import { createDraft, type Draft } from "@/builder/draft";

type BuilderState = {
  draft: Draft;
};

type BuilderActions = {
  dispatch: (action: Action) => void;
};

export const useBuilderStore = create<BuilderState & BuilderActions>()(
  persist(
    (set) => ({
      draft: createDraft("semester"),
      dispatch: (action) =>
        set((state) => ({ draft: apply(state.draft, action) })),
    }),
    {
      name: "builder-storage",
      version: 1,
      partialize: (state) => ({ draft: state.draft }),
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
