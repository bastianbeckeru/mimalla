import { nanoid } from "nanoid";
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Slot } from "@/types/curriculum";
import type { EnrolledCourse, StudentCurriculum } from "@/types/store";
import { createEnrollments } from "@/utils/curriculum";

type CurriculumState = {
  curriculums: StudentCurriculum[];
  activeCurriculumId: string | null;
};

type CurriculumActions = {
  addCurriculum: (curriculum: {
    path: string;
    year: number;
    term: number;
    slots: Slot[];
  }) => void;
  removeActiveCurriculum: () => void;
  updateActiveEnrollments: (enrollments: EnrolledCourse[]) => void;
};

export const useCurriculumStore = create<CurriculumState & CurriculumActions>()(
  persist(
    (set) => ({
      curriculums: [],
      activeCurriculumId: null,

      addCurriculum: ({ path, year, term, slots }) =>
        set((state) => {
          const curriculum = {
            id: nanoid(),
            path,
            year,
            term,
            enrolledCourses: createEnrollments({ year, term, slots }),
          };

          return {
            curriculums: [...state.curriculums, curriculum],
            activeCurriculumId: curriculum.id,
          };
        }),

      removeActiveCurriculum: () =>
        set((state) => {
          const curriculums = state.curriculums.filter(
            (c) => c.id !== state.activeCurriculumId,
          );

          return {
            curriculums,
            activeCurriculumId: curriculums[0]?.id ?? null,
          };
        }),

      updateActiveEnrollments: (enrollments) =>
        set((state) => ({
          curriculums: state.curriculums.map((c) =>
            c.id === state.activeCurriculumId
              ? { ...c, enrolledCourses: enrollments }
              : c,
          ),
        })),
    }),
    {
      name: "curriculum-storage",
      version: 2,
      migrate: (persistedState, version) => {
        const state = persistedState as CurriculumState;

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

        return state;
      },
    },
  ),
);

export function useActiveCurriculum() {
  return useCurriculumStore((state) =>
    state.curriculums.find((c) => c.id === state.activeCurriculumId),
  );
}

export function useHasHydrated() {
  return useSyncExternalStore(
    (onChange) => useCurriculumStore.persist.onFinishHydration(onChange),
    () => useCurriculumStore.persist.hasHydrated(),
    () => false,
  );
}
