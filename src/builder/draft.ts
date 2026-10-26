import { DEFAULT_BASE_COLOR } from "@/builder/colors";
import { REGULAR_TERMS } from "@/builder/periods";
import type { Curriculum, Draft, TermSystem } from "@/types/builder";

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
      courses: [],
    },
    baseColor: DEFAULT_BASE_COLOR,
    handColoredAreaIds: [],
  };
}

export function findCourse(curriculum: Curriculum, courseId: number) {
  return curriculum.courses.find((course) => course.id === courseId);
}
