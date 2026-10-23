import { nanoid } from "nanoid";
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import legacyCourseCodesByPath from "@/stores/legacy-course-codes.json";
import type { CurriculumData } from "@/types/curriculum";
import type { Enrollment, Entry, Trajectory } from "@/types/trajectory";
import { fetchProgramCurriculums } from "@/utils/curriculum-data";
import { createEnrollments } from "@/utils/trajectory";

type TrajectoryState = {
  trajectories: Trajectory[];
  activeTrajectoryId: string | null;
};

type TrajectoryActions = {
  addTrajectory: (trajectory: {
    curriculumId: number;
    entry: Entry;
    curriculum: Pick<CurriculumData, "curriculum" | "courses">;
  }) => void;
  removeActiveTrajectory: () => void;
  updateActiveEnrollments: (enrollments: Enrollment[]) => void;
};

type PersistedEnrollmentV3 = Omit<Enrollment, "courseCode"> & {
  courseId: number;
};

type PersistedStateV2 = {
  curriculums: {
    id: string;
    path: string;
    year: number;
    term: number;
    enrolledCourses: PersistedEnrollmentV3[];
  }[];
  activeCurriculumId: string | null;
};

type PersistedStateV3 = {
  trajectories: (Omit<Trajectory, "curriculumId" | "enrollments"> & {
    curriculumPath: string;
    enrollments: PersistedEnrollmentV3[];
  })[];
  activeTrajectoryId: string | null;
};

type FindCurrentCurriculumId = (path: string) => Promise<number | null>;

const legacyCourseCodes: Record<
  string,
  Record<string, string>
> = legacyCourseCodesByPath;

function migrateToV2(state: PersistedStateV2): PersistedStateV2 {
  return {
    activeCurriculumId:
      state.activeCurriculumId ?? state.curriculums[0]?.id ?? null,
    curriculums: state.curriculums.map((curriculum) => ({
      ...curriculum,
      term: curriculum.term === 2 ? 3 : curriculum.term,
      enrolledCourses: curriculum.enrolledCourses.map((enrollment) =>
        enrollment.year < curriculum.year
          ? { ...enrollment, year: curriculum.year + enrollment.year - 1 }
          : enrollment,
      ),
    })),
  };
}

function migrateToV3(persisted: PersistedStateV2, version: number) {
  const state = version < 2 ? migrateToV2(persisted) : persisted;

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

async function migrateToV4(
  state: PersistedStateV3,
  findCurrentCurriculumId: FindCurrentCurriculumId,
): Promise<TrajectoryState> {
  const trajectories = await Promise.all(
    state.trajectories.map(
      async ({ curriculumPath, enrollments, ...trajectory }) => {
        const courseCodes = legacyCourseCodes[curriculumPath] ?? {};

        return {
          ...trajectory,
          curriculumId: await findCurrentCurriculumId(curriculumPath),
          enrollments: enrollments.map(({ courseId, ...enrollment }) => ({
            ...enrollment,
            courseCode: courseCodes[courseId] ?? null,
          })),
        };
      },
    ),
  );

  return { trajectories, activeTrajectoryId: state.activeTrajectoryId };
}

export function migrateTrajectoryState(
  persistedState: unknown,
  version: number,
  findCurrentCurriculumId: FindCurrentCurriculumId = findCurrentCurriculumIdOf,
): Promise<TrajectoryState> {
  const state =
    version < 3
      ? migrateToV3(persistedState as PersistedStateV2, version)
      : (persistedState as PersistedStateV3);

  return migrateToV4(state, findCurrentCurriculumId);
}

let hasHydrationFailed = false;
const hydrationFailureListeners = new Set<() => void>();

function setHydrationFailed(failed: boolean) {
  hasHydrationFailed = failed;
  for (const listener of hydrationFailureListeners) listener();
}

async function findCurrentCurriculumIdOf(path: string) {
  const curriculums = await fetchProgramCurriculums(path);
  return curriculums[0]?.id ?? null;
}

export const useTrajectoryStore = create<TrajectoryState & TrajectoryActions>()(
  persist(
    (set) => ({
      trajectories: [],
      activeTrajectoryId: null,

      addTrajectory: ({ curriculumId, entry, curriculum }) =>
        set((state) => {
          const trajectory = {
            id: nanoid(),
            curriculumId,
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
      version: 4,
      migrate: (persistedState, version) =>
        migrateTrajectoryState(persistedState, version),
      onRehydrateStorage: () => {
        setHydrationFailed(false);
        return (_state, error) => setHydrationFailed(error !== undefined);
      },
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

export function useHasHydrationFailed() {
  return useSyncExternalStore(
    (onChange) => {
      hydrationFailureListeners.add(onChange);
      return () => hydrationFailureListeners.delete(onChange);
    },
    () => hasHydrationFailed,
    () => false,
  );
}
