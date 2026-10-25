import { DEFAULT_BASE_COLOR } from "@/builder/colors";
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
  areaId: number | null;
  slots: Slot[];
};

export type Area = {
  id: number;
  name: string;
  color: string;
};

export type Curriculum = {
  programName: string;
  effectiveYear: number | null;
  termSystem: TermSystem;
  periods: Period[];
  areas: Area[];
  courses: Course[];
};

export type Draft = {
  curriculum: Curriculum;
  baseColor: string;
  handColoredAreaIds: number[];
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
      areas: [],
      courses: [],
    },
    baseColor: DEFAULT_BASE_COLOR,
    handColoredAreaIds: [],
  };
}
