type ProblemRule =
  | "missing-field"
  | "invalid-field"
  | "missing-course"
  | "empty-code"
  | "duplicate-code"
  | "prerequisite-cycle"
  | "overlapping-slots"
  | "shared-course-conflict";

export type Problem = {
  rule: ProblemRule;
  message: string;
};
