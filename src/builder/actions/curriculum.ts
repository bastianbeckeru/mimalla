import type { Curriculum, Handlers } from "@/builder/draft";

export type CurriculumAction = {
  type: "editDetails";
  changes: Partial<
    Pick<
      Curriculum,
      "programName" | "institution" | "effectiveYear" | "versionName"
    >
  >;
};

export const curriculumHandlers: Handlers<CurriculumAction> = {
  editDetails: (draft, { changes }) => ({
    ...draft,
    curriculum: { ...draft.curriculum, ...changes },
  }),
};
