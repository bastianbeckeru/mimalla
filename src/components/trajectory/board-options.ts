import { EDIT_ERROR_DESCRIPTIONS } from "@/components/trajectory/edit-feedback";
import type { PeriodKey } from "@/types/curriculum";
import type {
  Enrollment,
  Entry,
  GradingScale,
  SchemeSource,
  TrajectoryContext,
  TrajectoryProgress,
} from "@/types/trajectory";
import {
  formatGrade,
  getCourseGrade,
  getSuggestedStatus,
  roundGrade,
} from "@/utils/grades";
import { getMoveConflict } from "@/utils/trajectory/edits";
import {
  getPeriodInfo,
  type PlacedEnrollment,
} from "@/utils/trajectory/layout";
import { isAvailable } from "@/utils/trajectory/progress";

type PeriodLabel = (period: PeriodKey) => string;

export function getPassedPeriodOptions(periods: PeriodKey[], entry: Entry) {
  return periods.flatMap((period) => {
    const { label, hasStarted, isCurrent } = getPeriodInfo(period, entry);
    return label && hasStarted && !isCurrent ? [{ period, label }] : [];
  });
}

export function getMoveOptions({
  enrollments,
  card,
  periods,
  currentPeriod,
  context,
  getPeriodLabel,
}: {
  enrollments: Enrollment[];
  card: PlacedEnrollment;
  periods: PeriodKey[];
  currentPeriod: PeriodKey | undefined;
  context: TrajectoryContext;
  getPeriodLabel: PeriodLabel;
}) {
  return periods.map((period) => {
    const conflict = getMoveConflict(enrollments, card.id, period, context);
    return {
      period,
      label: getPeriodLabel(period),
      isCurrent: period === currentPeriod,
      conflict: conflict && EDIT_ERROR_DESCRIPTIONS[conflict.error],
    };
  });
}

export function getClosingEnrollments({
  cards,
  column,
  gradingScale,
  progress,
}: {
  cards: PlacedEnrollment[];
  column: number | null;
  gradingScale: GradingScale;
  progress: TrajectoryProgress;
}) {
  return cards
    .filter(
      (card) => card.column === column && card.enrollment.status === "PENDING",
    )
    .map((card) => {
      const grade = getCourseGrade(card.enrollment, gradingScale);
      return {
        id: card.id,
        name: card.course.name,
        grade: grade === null ? null : formatGrade(roundGrade(grade)),
        isAvailable: isAvailable(card.course, progress),
        suggestedStatus: getSuggestedStatus(card.enrollment, gradingScale),
      };
    });
}

// The latest other enrollment of the same course with assessments, whose
// grading scheme a new attempt can start from.
export function getSchemeSource(
  card: PlacedEnrollment,
  { periods, cards }: { periods: PeriodKey[]; cards: PlacedEnrollment[] },
  getPeriodLabel: PeriodLabel,
): SchemeSource | null {
  const source = cards
    .filter(
      (other) =>
        other.courseId === card.courseId &&
        other.id !== card.id &&
        (other.enrollment.assessments?.length ?? 0) > 0,
    )
    .sort((a, b) => a.column - b.column)
    .at(-1);
  const period = source && periods[source.column - 1];
  return source && period
    ? {
        label: getPeriodLabel(period),
        assessments: source.enrollment.assessments ?? [],
      }
    : null;
}
