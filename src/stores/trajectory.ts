import { nanoid } from "nanoid";
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Slot } from "@/types/curriculum";
import type { Enrollment, Entry, Trajectory } from "@/types/trajectory";
import { createEnrollments } from "@/utils/curriculum";

type TrajectoryState = {
  trajectories: Trajectory[];
  activeTrajectoryId: string | null;
};

type TrajectoryActions = {
  addTrajectory: (trajectory: {
    curriculumPath: string;
    entry: Entry;
    slots: Slot[];
  }) => void;
  removeActiveTrajectory: () => void;
  updateActiveEnrollments: (enrollments: Enrollment[]) => void;
};

type PersistedStateV2 = {
  curriculums: {
    id: string;
    path: string;
    year: number;
    term: number;
    enrolledCourses: Enrollment[];
  }[];
  activeCurriculumId: string | null;
};

export function migrateTrajectoryState(
  persistedState: unknown,
  version: number,
): TrajectoryState {
  const state = persistedState as PersistedStateV2;

  if (version < 2) {
    state.activeCurriculumId ??= state.curriculums[0]?.id ?? null;
    state.curriculums = state.curriculums.map((curriculum) => ({
      ...curriculum,
      term: curriculum.term === 2 ? 3 : curriculum.term,
      enrolledCourses: curriculum.enrolledCourses.map((enrollment) =>
        enrollment.year < curriculum.year
          ? { ...enrollment, year: curriculum.year + enrollment.year - 1 }
          : enrollment,
      ),
    }));
  }

  return {
    trajectories: state.curriculums.map((curriculum) => ({
      id: curriculum.id,
      curriculumPath: curriculum.path,
      entry: { year: curriculum.year, term: curriculum.term },
      enrollments: curriculum.enrolledCourses,
    })),
    activeTrajectoryId: state.activeCurriculumId,
  };
}

export const useTrajectoryStore = create<TrajectoryState & TrajectoryActions>()(
  persist(
    (set) => ({
      trajectories: [],
      activeTrajectoryId: null,

      addTrajectory: ({ curriculumPath, entry, slots }) =>
        set((state) => {
          const trajectory = {
            id: nanoid(),
            curriculumPath,
            entry,
            enrollments: createEnrollments({ entry, slots }),
          };

          return {
            trajectories: [...state.trajectories, trajectory],
            activeTrajectoryId: trajectory.id,
          };
        }),

      removeActiveTrajectory: () =>
        set((state) => {
          const trajectories = state.trajectories.filter(
            (t) => t.id !== state.activeTrajectoryId,
          );

          return {
            trajectories,
            activeTrajectoryId: trajectories[0]?.id ?? null,
          };
        }),

      updateActiveEnrollments: (enrollments) =>
        set((state) => ({
          trajectories: state.trajectories.map((t) =>
            t.id === state.activeTrajectoryId ? { ...t, enrollments } : t,
          ),
        })),
    }),
    {
      name: "curriculum-storage",
      version: 3,
      migrate: migrateTrajectoryState,
    },
  ),
);

export function useActiveTrajectory() {
  return useTrajectoryStore((state) =>
    state.trajectories.find((t) => t.id === state.activeTrajectoryId),
  );
}

export function useHasHydrated() {
  return useSyncExternalStore(
    (onChange) => useTrajectoryStore.persist.onFinishHydration(onChange),
    () => useTrajectoryStore.persist.hasHydrated(),
    () => false,
  );
}
