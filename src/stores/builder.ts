import { nanoid } from "nanoid";
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apply } from "@/builder/apply";
import { createDraft } from "@/builder/draft";
import { createAreaId, createCourseId, createTrackId } from "@/curriculum/ids";
import type { Action, Draft } from "@/types/builder";
import type {
  Area,
  Course,
  Curriculum,
  CurriculumDetails,
  TermSystem,
  Track,
} from "@/types/curriculum";
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

function addTracks(draft: Draft): Draft {
  const { curriculum } = draft;
  return {
    ...draft,
    curriculum: {
      ...curriculum,
      tracks: curriculum.tracks ?? [],
      courses: curriculum.courses.map((course) => ({
        ...course,
        trackIds: course.trackIds ?? [],
      })),
    },
  };
}

// Before version 4, courses, areas and tracks had numbered ids (ADR 0007).
type Numbered<T> = Omit<T, "id"> & { id: number };
type NumberedCourse = Omit<
  Numbered<Course>,
  "areaId" | "trackIds" | "prerequisiteIds"
> & { areaId: number | null; trackIds: number[]; prerequisiteIds: number[] };
type NumberedDraft = Omit<Draft, "curriculum" | "handColoredAreaIds"> & {
  handColoredAreaIds: number[];
  curriculum: Omit<Curriculum, "courses" | "areas" | "tracks"> & {
    courses: NumberedCourse[];
    areas: Numbered<Area>[];
    tracks: Numbered<Track>[];
  };
};

function giveIds<T>(items: { id: number }[], create: () => T) {
  const ids = new Map(items.map(({ id }) => [id, create()]));
  return {
    get: (id: number) => ids.get(id) ?? create(),
    list: (numbered: number[]) => numbered.flatMap((id) => ids.get(id) ?? []),
  };
}

/** Gives the courses, areas and tracks of a saved draft stable ids. */
export function migrateToStableIds(draft: NumberedDraft): Draft {
  const { curriculum } = draft;
  const courseIds = giveIds(curriculum.courses, createCourseId);
  const areaIds = giveIds(curriculum.areas, createAreaId);
  const trackIds = giveIds(curriculum.tracks, createTrackId);

  return {
    ...draft,
    handColoredAreaIds: areaIds.list(draft.handColoredAreaIds),
    curriculum: {
      ...curriculum,
      areas: curriculum.areas.map((area) => ({
        ...area,
        id: areaIds.get(area.id),
      })),
      tracks: curriculum.tracks.map((track) => ({
        ...track,
        id: trackIds.get(track.id),
      })),
      courses: curriculum.courses.map((course) => ({
        ...course,
        id: courseIds.get(course.id),
        areaId:
          areaIds.list(course.areaId === null ? [] : [course.areaId])[0] ??
          null,
        trackIds: trackIds.list(course.trackIds),
        prerequisiteIds: courseIds.list(course.prerequisiteIds),
      })),
    },
  };
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
      version: 4,
      partialize: (state): PersistedState => ({
        curricula: state.curricula,
        activeId: state.activeId,
      }),
      migrate: (persisted, version) => {
        let state = persisted as PersistedState;
        if (version < 2) {
          // Version 1 kept a single draft; keep it only if it was started.
          const draft = (persisted as { draft?: Draft } | undefined)?.draft;
          const id = nanoid();
          state =
            draft && isStarted(draft)
              ? { curricula: [{ id, draft }], activeId: id }
              : { curricula: [], activeId: null };
        }
        if (version < 3) {
          // Version 3 added tracks.
          state = {
            ...state,
            curricula: state.curricula.map(({ id, draft }) => ({
              id,
              draft: addTracks(draft),
            })),
          };
        }
        if (version < 4) {
          state = {
            ...state,
            curricula: state.curricula.map(({ id, draft }) => ({
              id,
              draft: migrateToStableIds(draft as unknown as NumberedDraft),
            })),
          };
        }
        return state;
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
