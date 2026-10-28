import type { CurriculumAction, Handlers } from "@/types/builder";

export const curriculumHandlers: Handlers<CurriculumAction> = {
  editDetails: (draft, { changes }) => ({
    ...draft,
    curriculum: { ...draft.curriculum, ...changes },
  }),
};
