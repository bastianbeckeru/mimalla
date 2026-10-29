import { nanoid } from "nanoid";
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LEGACY_CURRICULUMS } from "@/stores/legacy-curriculums";
import type { Curriculum } from "@/types/builder";
import type { Enrollment, Entry, Trajectory } from "@/types/trajectory";
import { getCurriculumPath } from "@/utils/curriculum";
import { createEnrollments } from "@/utils/trajectory";

type TrajectoryState = {
  trajectories: Trajectory[];
  activeTrajectoryId: string | null;
};

type TrajectoryActions = {
  addTrajectory: (trajectory: {
    curriculumPath: string;
    entry: Entry;
    curriculum: Curriculum;
  }) => void;
  removeActiveTrajectory: () => void;
  updateActiveEnrollments: (enrollments: Enrollment[]) => void;
};

type PersistedStateV1 = {
  curriculums: {
    id: string;
    path: string;
    year: number;
    term: number;
    enrolledCourses: Enrollment[];
  }[];
  activeCurriculumId: string | null;
};

function migrateFromV1(state: PersistedStateV1): TrajectoryState {
  return {
    trajectories: state.curriculums.map((curriculum) => ({
      id: curriculum.id,
      curriculumPath: curriculum.path,
      entry: {
        year: curriculum.year,
        term: curriculum.term === 2 ? 3 : curriculum.term,
      },
      enrollments: curriculum.enrolledCourses.map((enrollment) =>
        enrollment.year < curriculum.year
          ? { ...enrollment, year: curriculum.year + enrollment.year - 1 }
          : enrollment,
      ),
    })),
    activeTrajectoryId:
      state.activeCurriculumId ?? state.curriculums[0]?.id ?? null,
  };
}

function migrateToCurriculumFile(trajectory: Trajectory): Trajectory {
  const legacy = LEGACY_CURRICULUMS[trajectory.curriculumPath];
  if (!legacy) return trajectory;

  return {
    ...trajectory,
    curriculumPath: getCurriculumPath(
      trajectory.curriculumPath,
      legacy.effectiveYear,
    ),
    enrollments: trajectory.enrollments.flatMap((enrollment) => {
      const courseId = legacy.courseIds[enrollment.courseId];
      return courseId === undefined ? [] : [{ ...enrollment, courseId }];
    }),
  };
}

export function migrateTrajectoryState(
  persistedState: unknown,
  version: number,
): TrajectoryState {
  const state =
    version < 2
      ? migrateFromV1(persistedState as PersistedStateV1)
      : (persistedState as TrajectoryState);

  return {
    ...state,
    trajectories: state.trajectories.map(migrateToCurriculumFile),
  };
}

export const useTrajectoryStore = create<TrajectoryState & TrajectoryActions>()(
  persist(
    (set) => ({
      trajectories: [],
      activeTrajectoryId: null,

      addTrajectory: ({ curriculumPath, entry, curriculum }) =>
        set((state) => {
          const trajectory = {
            id: nanoid(),
            curriculumPath,
            entry,
            enrollments: createEnrollments({ entry, curriculum }),
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
