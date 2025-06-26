import type {
  EnrolledCourse,
  newCurriculumStoreInitialStateProps,
  useNewCurriculumStoreProps,
} from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";

const initialState: newCurriculumStoreInitialStateProps = {
  //version: "0.1.4",
  curriculums: [],
  activeCurriculumId: null,
};

export const useNewCurriculumStore = create(
  persist<useNewCurriculumStoreProps>(
    (set) => ({
      ...initialState,

      resetStore: () => {
        set(initialState);
      },

      /* CURRICULUM */
      addCurriculum: (newCurriculum) =>
        set((state) => {
          if (!state || !newCurriculum) return state;

          const { year, term, path, slots } = newCurriculum;

          const fixedNewCurriculum = {
            id: nanoid(),
            path: path, // Necessary, because we don't use programId yet
            year: year,
            term: term,
            enrolledCourses: slots.map((slot) => ({
              ...slot,
              id: nanoid(),
              year: year + (slot.year - 1),
              term: term === 2 ? (slot.term === 1 ? 2 : 1) : slot.term,
              status: "PENDING",
            })) as EnrolledCourse[],
          };

          return {
            ...state,
            curriculums: [...state.curriculums, fixedNewCurriculum],
            activeCurriculumId: fixedNewCurriculum.id,
          };
        }),
      removeCurriculum: (id) =>
        set((state) => {
          if (!state) return state;

          const newCurriculums = state.curriculums.filter((c) => c.id !== id);

          if (newCurriculums.length === 0) return initialState;

          if (state.activeCurriculumId === id && newCurriculums.length > 0) {
            return {
              ...state,
              curriculums: newCurriculums,
              activeCurriculumId: newCurriculums[0]!.id,
            };
          }

          return {
            ...state,
            curriculums: newCurriculums,
          };
        }),
      selectCurriculum: (id) => set({ activeCurriculumId: id }),
      updateCurriculumEnrollments: (newEnrollments) =>
        set((state) => {
          if (!state || !state.activeCurriculumId) return state;
          console.log("Updating enrollments...");
          const newCurriculums = state.curriculums.map((c) => {
            if (c.id !== state.activeCurriculumId) return c;

            return {
              ...c,
              enrolledCourses: newEnrollments,
            };
          });

          return {
            ...state,
            curriculums: newCurriculums,
          };
        }),
    }),
    { name: "curriculum-storage", version: 1 },
  ),
);
