import { REGULAR_TERMS } from "@/builder/periods";

export type TermSystem = "semester" | "annual";

export type Period = {
  programYear: number;
  term: number;
};

export type Slot = Period & {
  position: number;
};

export type Course = {
  id: number;
  name: string;
  credits: number;
  duration: number;
  slots: Slot[];
};

export type Curriculum = {
  programName: string;
  effectiveYear: number | null;
  termSystem: TermSystem;
  periods: Period[];
  courses: Course[];
};

export type Draft = {
  curriculum: Curriculum;
};

export type Handlers<A extends { type: string }> = {
  [K in A["type"]]: (draft: Draft, action: Extract<A, { type: K }>) => Draft;
};

const INITIAL_PROGRAM_YEARS = 5;

export function createDraft(termSystem: TermSystem): Draft {
  const programYears = Array.from(
    { length: INITIAL_PROGRAM_YEARS },
    (_, index) => index + 1,
  );

  return {
    curriculum: {
      programName: "",
      effectiveYear: null,
      termSystem,
      periods: programYears.flatMap((programYear) =>
        REGULAR_TERMS[termSystem].map((term) => ({ programYear, term })),
      ),
      courses: [],
    },
  };
}
