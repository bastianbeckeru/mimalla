import { nanoid } from "nanoid";
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apply } from "@/builder/apply";
import { createDraft } from "@/builder/draft";
import type {
  Action,
  CurriculumDetails,
  Draft,
  TermSystem,
} from "@/types/builder";
import type { History, HistoryAction } from "@/types/history";
import { createHistory, historyReducer } from "@/utils/history";

export type SavedCurriculum = {
  id: string;
  draft: Draft;
};

type BuilderState = {
  curricula: SavedCurriculum[];
  activeId: string | null;
  draft: Draft;
  history: History<Draft>;
};

type BuilderActions = {
  dispatch: (action: Action, options?: { group?: string }) => void;
  create: (termSystem: TermSystem, details: CurriculumDetails) => void;
  add: (draft: Draft) => void;
  select: (id: string) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  undo: () => void;
  redo: () => void;
  endGroup: () => void;
};

type PersistedState = Pick<BuilderState, "curricula" | "activeId">;

const emptyDraft = createDraft("semester");

function activate(curricula: SavedCurriculum[], activeId: string | null) {
  const draft =
    curricula.find((curriculum) => curriculum.id === activeId)?.draft ??
    emptyDraft;
  return { curricula, activeId, draft, history: createHistory(draft) };
}

function isStarted(draft: Draft) {
  return (
    draft.curriculum.courses.length > 0 ||
    draft.curriculum.programName.trim() !== ""
  );
}

export const useBuilderStore = create<BuilderState & BuilderActions>()(
  persist(
    (set) => {
      const update = (
        toHistoryAction: (present: Draft) => HistoryAction<Draft>,
      ) =>
        set((state) => {
          if (state.activeId === null) return state;
          const history = historyReducer(
            state.history,
            toHistoryAction(state.history.present),
          );
          return {
            history,
            draft: history.present,
            curricula: state.curricula.map((curriculum) =>
              curriculum.id === state.activeId
                ? { ...curriculum, draft: history.present }
                : curriculum,
            ),
          };
        });

      const add = (draft: Draft) =>
        set((state) => {
          const curriculum = { id: nanoid(), draft };
          return activate([curriculum, ...state.curricula], curriculum.id);
        });

      return {
        ...activate([], null),
        dispatch: (action, options) =>
          update((present) => ({
            type: "commit",
            present: apply(present, action),
            group: options?.group,
          })),
        create: (termSystem, details) =>
          add(
            apply(emptyDraft, {
              type: "createCurriculum",
              termSystem,
              details,
            }),
          ),
        add,
        select: (id) =>
          set((state) =>
            id === state.activeId ? state : activate(state.curricula, id),
          ),
        duplicate: (id) =>
          set((state) => {
            const index = state.curricula.findIndex(
              (curriculum) => curriculum.id === id,
            );
            const original = state.curricula[index];
            if (!original) return state;
            const draft = structuredClone(original.draft);
            draft.curriculum.programName = `${draft.curriculum.programName} (copia)`;
            const copy = { id: nanoid(), draft };
            return activate(
              state.curricula.toSpliced(index + 1, 0, copy),
              copy.id,
            );
          }),
        remove: (id) =>
          set((state) => {
            const curricula = state.curricula.filter(
              (curriculum) => curriculum.id !== id,
            );
            if (id !== state.activeId) return { curricula };
            return activate(curricula, curricula[0]?.id ?? null);
          }),
        undo: () => update(() => ({ type: "undo" })),
        redo: () => update(() => ({ type: "redo" })),
        endGroup: () => update(() => ({ type: "endGroup" })),
      };
    },
    {
      name: "builder-storage",
      version: 2,
      partialize: (state): PersistedState => ({
        curricula: state.curricula,
        activeId: state.activeId,
      }),
      migrate: (persisted, version) => {
        if (version >= 2) return persisted as PersistedState;
        // Version 1 kept a single draft; keep it only if it was started.
        const draft = (persisted as { draft?: Draft } | undefined)?.draft;
        if (!draft || !isStarted(draft))
          return { curricula: [], activeId: null };
        const id = nanoid();
        return { curricula: [{ id, draft }], activeId: id };
      },
      merge: (persisted, current) => {
        const { curricula = [], activeId = null } =
          (persisted as Partial<PersistedState> | undefined) ?? {};
        return { ...current, ...activate(curricula, activeId) };
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
