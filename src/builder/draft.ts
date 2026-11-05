import { DEFAULT_BASE_COLOR } from "@/curriculum/colors";
import { REGULAR_TERMS } from "@/curriculum/periods";
import type { Draft } from "@/types/builder";
import type { TermSystem } from "@/types/curriculum";

const INITIAL_PROGRAM_YEARS = 5;

export function createDraft(termSystem: TermSystem): Draft {
  const programYears = Array.from(
    { length: INITIAL_PROGRAM_YEARS },
    (_, index) => index + 1,
  );

  return {
    curriculum: {
      programName: "",
      institution: "",
      effectiveYear: null,
      versionName: "",
      termSystem,
      periods: programYears.flatMap((programYear) =>
        REGULAR_TERMS[termSystem].map((term) => ({ programYear, term })),
      ),
      areas: [],
      tracks: [],
      courses: [],
    },
    baseColor: DEFAULT_BASE_COLOR,
    handColoredAreaIds: [],
  };
}
