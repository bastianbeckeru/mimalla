import type {
  EnrolledCourse,
  newCurriculumStoreInitialStateProps,
  useNewCurriculumStoreProps,
} from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { createUrlSlug } from "@/utils/strings";

const initialState: newCurriculumStoreInitialStateProps = {
  //version: "0.1.4",
  curriculums: [],
  past: [],
  present: null,
  future: [],
};

const MAX_HISTORY = 10;

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

          const { year, term, program, slots } = newCurriculum;

          const fixednNewCurriculum = {
            id: nanoid(),
            programSlug: createUrlSlug(program.name), // Necessary because we don't use programId
            year: year,
            term: term,
            enrolledCourses: slots.map((slot) => ({
              ...slot,
              id: nanoid(),
              status: "PENDING",
            })) as EnrolledCourse[],
          };

          return {
            ...state,
            curriculums: [...state.curriculums, fixednNewCurriculum],
            past: [],
            present: fixednNewCurriculum,
            future: [],
          };
        }),
      removeCurriculum: (curriculumId) =>
        set((state) => {
          if (!state) return state;

          const newCurriculums = state.curriculums.filter(
            (c) => c.id !== curriculumId,
          );

          if (newCurriculums.length === 0) return initialState;

          if (state.present?.id === curriculumId) {
            return {
              ...state,
              curriculums: newCurriculums,
              past: [],
              present: newCurriculums[0],
              future: [],
            };
          }

          return {
            ...state,
            curriculums: newCurriculums,
          };
        }),
      selectCurriculum: (id) =>
        set((state) => {
          const curriculum = state.curriculums.find((c) => c.id === id);
          if (!curriculum) return state;

          return {
            ...state,
            past: [],
            present: curriculum,
            future: [],
          };
        }),
      updateCurriculumEnrollments: (curriculumId, newEnrollments) =>
        set((state) => {
          if (!state || !state.present) return state;

          if (state.present.id === curriculumId) {
            return {
              ...state,
              present: {
                ...state.present,
                enrolledCourses: newEnrollments,
              },
            };
          }

          return state;
        }),

      /* HISTORY */
      undo: () =>
        set((state) => {
          if (state.past.length === 0 || state.present === null) return state;

          const previous = state.past[state.past.length - 1];
          const newPast = state.past.slice(0, -1);

          return {
            ...state,
            past: newPast,
            present: previous,
            future: [state.present, ...state.future].slice(0, MAX_HISTORY),
          };
        }),
      redo: () =>
        set((state) => {
          if (state.future.length === 0 || state.present === null) return state;

          const next = state.future[0];
          const newFuture = state.future.slice(1);

          return {
            ...state,
            past: [...state.past, state.present].slice(-MAX_HISTORY),
            present: next,
            future: newFuture,
          };
        }),
    }),
    { name: "data" },
  ),
);
