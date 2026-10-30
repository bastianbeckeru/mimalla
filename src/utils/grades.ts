import type {
  Assessment,
  Enrollment,
  GradingScale,
  RequiredGrade,
} from "@/types/trajectory";

export const DEFAULT_GRADING_SCALE: GradingScale = {
  min: 1,
  max: 7,
  passing: 4,
};

// Levels of assessments below the course: group, subgroup and single.
export const MAX_ASSESSMENT_DEPTH = 3;

const GRADE_STEP = 0.1;

type SingleAssessment = Extract<Assessment, { kind: "SINGLE" }>;
type GradeOf = (assessment: SingleAssessment) => number | null;

export function isValidGrade(grade: number, scale: GradingScale) {
  return grade >= scale.min && grade <= scale.max;
}

// Rounds half up to one decimal, so 3.95 passes at 4.0.
export function roundGrade(grade: number) {
  return Math.round(grade * 10 + 1e-9) / 10;
}

export function getSchemeDepth(assessments: Assessment[]): number {
  return Math.max(
    0,
    ...assessments.map((assessment) =>
      assessment.kind === "GROUP"
        ? 1 + getSchemeDepth(assessment.assessments)
        : 1,
    ),
  );
}

export function getComputedGrade(
  assessments: Assessment[],
  scale: GradingScale,
) {
  const grade = getGrade(assessments, getValidGrade(scale));
  return grade === null ? null : roundGrade(grade);
}

// The grade the student entered prevails over the one their assessments add
// up to, such as for a course whose assessments they no longer remember.
export function getCourseGrade(enrollment: Enrollment, scale: GradingScale) {
  const { courseGrade, assessments = [] } = enrollment;
  if (courseGrade !== undefined && isValidGrade(courseGrade, scale))
    return roundGrade(courseGrade);
  return getComputedGrade(assessments, scale);
}

export function getPartialAverage(
  assessments: Assessment[],
  scale: GradingScale,
) {
  return getPartial(assessments, getValidGrade(scale)).average;
}

// The grade the student needs in every assessment still without one to pass,
// or null when none is missing.
export function getRequiredGrade(
  assessments: Assessment[],
  scale: GradingScale,
): RequiredGrade | null {
  const validGrade = getValidGrade(scale);
  if (getSingles(assessments).every((single) => validGrade(single) !== null))
    return null;

  const passesWith = (missing: number) => {
    const grade = getGrade(
      assessments,
      (single) => validGrade(single) ?? missing,
    );
    return grade !== null && roundGrade(grade) >= scale.passing;
  };
  if (passesWith(scale.min)) return { status: "REACHED" };
  if (!passesWith(scale.max)) return { status: "UNREACHABLE" };

  for (let step = 1; ; step++) {
    const grade = roundGrade(scale.min + step * GRADE_STEP);
    if (passesWith(grade)) return { status: "NEEDED", grade };
  }
}

// An assessment's grade so far: complete once it has every grade, partial
// while a group still misses some.
export function getAssessmentGrade(
  assessment: Assessment,
  scale: GradingScale,
): { grade: number; isPartial: boolean } | null {
  const partial = getAssessmentPartial(assessment, getValidGrade(scale));
  if (partial.average === null) return null;
  return { grade: partial.average, isPartial: partial.coverage < 1 };
}

function getValidGrade(scale: GradingScale): GradeOf {
  return ({ grade }) =>
    grade !== null && isValidGrade(grade, scale) ? grade : null;
}

function getSingles(assessments: Assessment[]): SingleAssessment[] {
  return assessments.flatMap((assessment) =>
    assessment.kind === "GROUP"
      ? getSingles(assessment.assessments)
      : [assessment],
  );
}

// Groups without single assessments have nothing to grade, so they count as
// if they were not there.
function getCounted(assessments: Assessment[]) {
  return assessments.filter((assessment) => getSingles([assessment]).length);
}

// Assessments without a weight share equally what the weighted ones leave.
export function getWeights(assessments: Assessment[]) {
  const weighted = assessments.reduce(
    (sum, { weight }) => sum + (weight ?? 0),
    0,
  );
  const unweightedCount = assessments.filter(
    ({ weight }) => weight === null,
  ).length;
  const share = unweightedCount
    ? Math.max(0, 100 - weighted) / unweightedCount
    : 0;
  return assessments.map(({ weight }) => weight ?? share);
}

// Divides by the actual sum of the weights, so weights that add up to 90%
// still give a grade on the scale.
function getWeightedAverage(grades: number[], weights: number[]) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total === 0) return null;
  return (
    grades.reduce(
      (sum, grade, index) => sum + grade * (weights[index] ?? 0),
      0,
    ) / total
  );
}

// The grade of a set of assessments once every one has a grade, dropping the
// lowest ones a group asks to drop.
function getGrade(
  assessments: Assessment[],
  gradeOf: GradeOf,
  droppedCount = 0,
): number | null {
  const counted = getCounted(assessments);
  const grades = counted.map((assessment) =>
    assessment.kind === "GROUP"
      ? getGrade(assessment.assessments, gradeOf, assessment.droppedCount)
      : gradeOf(assessment),
  );
  if (counted.length === 0 || grades.some((grade) => grade === null))
    return null;

  const weights = getWeights(counted);
  const dropped = new Set(
    grades
      .map((grade, index) => ({ grade: grade as number, index }))
      .sort((a, b) => a.grade - b.grade)
      .slice(0, Math.min(droppedCount, counted.length - 1))
      .map(({ index }) => index),
  );
  const kept = grades.flatMap((grade, index) =>
    dropped.has(index) ? [] : [{ grade: grade as number, index }],
  );
  return getWeightedAverage(
    kept.map(({ grade }) => grade),
    kept.map(({ index }) => weights[index] ?? 0),
  );
}

// The weighted average of what already has a grade. `coverage` is the share
// of the weight graded so far; a group drops nothing until it is complete.
function getPartial(
  assessments: Assessment[],
  gradeOf: GradeOf,
): { coverage: number; average: number | null } {
  const counted = getCounted(assessments);
  const weights = getWeights(counted);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total === 0) return { coverage: 0, average: null };

  let coverage = 0;
  let sum = 0;
  counted.forEach((assessment, index) => {
    const share = (weights[index] ?? 0) / total;
    const partial = getAssessmentPartial(assessment, gradeOf);
    if (partial.average === null) return;
    coverage += share * partial.coverage;
    sum += share * partial.coverage * partial.average;
  });
  return { coverage, average: coverage > 0 ? sum / coverage : null };
}

function getAssessmentPartial(assessment: Assessment, gradeOf: GradeOf) {
  if (assessment.kind === "SINGLE") {
    const grade = gradeOf(assessment);
    return { coverage: grade === null ? 0 : 1, average: grade };
  }
  const grade = getGrade(
    assessment.assessments,
    gradeOf,
    assessment.droppedCount,
  );
  return grade === null
    ? getPartial(assessment.assessments, gradeOf)
    : { coverage: 1, average: grade };
}

// Every attempt that ended, approved or failed, counts by its credits.
export function getCumulativeAverage(
  enrollments: Enrollment[],
  courses: Map<number, { credits: number }>,
  scale: GradingScale,
) {
  let credits = 0;
  let sum = 0;
  for (const enrollment of enrollments) {
    if (enrollment.status === "PENDING") continue;
    const grade = getCourseGrade(enrollment, scale);
    const course = courses.get(enrollment.courseId);
    if (grade === null || !course) continue;
    credits += course.credits;
    sum += grade * course.credits;
  }
  return credits > 0 ? sum / credits : null;
}

const gradeFormat = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

export function formatGrade(grade: number) {
  return gradeFormat.format(grade);
}

// Reads a grade written with a decimal comma or point, keeping two decimals.
// Returns null for an empty text and NaN for one that is not a number.
export function parseGrade(text: string) {
  const trimmed = text.trim().replace(",", ".");
  if (trimmed === "") return null;
  const grade = Number(trimmed);
  return Number.isFinite(grade) ? Math.round(grade * 100) / 100 : Number.NaN;
}
