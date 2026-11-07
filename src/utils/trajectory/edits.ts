import { nanoid } from "nanoid";
import type { Course, ExtendedCourse, PeriodKey } from "@/types/curriculum";
import type {
  Enrollment,
  Placement,
  TrajectoryContext,
} from "@/types/trajectory";
import { extendCourses } from "@/utils/curriculum";
import { isSemester, parsePeriodKey } from "@/utils/period-key";
import {
  getEnd,
  getNextPeriod,
  getPeriodEndRow,
  layOutTrajectory,
  type PlacedEnrollment,
  settleEnrollments,
  spansAny,
} from "@/utils/trajectory/layout";

export const MAX_ENROLLMENTS_PER_PERIOD = 10;

export type EditError =
  | "PERIOD_FULL"
  | "DUPLICATE_COURSE"
  | "SUCCESSOR_IN_PERIOD"
  | "PREREQUISITE_IN_PERIOD"
  | "SUCCESSOR_ON_THE_WAY"
  | "PREREQUISITE_ON_THE_WAY";

type EditResult =
  | { enrollments: Enrollment[]; error?: never }
  | { enrollments?: never; error: EditError };

export type MoveConflict = { error: EditError; blockerIds: string[] };

function isAnyPeriodFull(cards: PlacedEnrollment[], from: number, to: number) {
  for (let column = from; column <= to; column++) {
    const count = cards.filter((card) => spansAny(card, column, column)).length;
    if (count >= MAX_ENROLLMENTS_PER_PERIOD) return true;
  }
  return false;
}

function placeAt(
  enrollment: Enrollment,
  { period, row }: Placement,
): Enrollment {
  const { year, term } = parsePeriodKey(period);
  return { ...enrollment, year, term, position: row };
}

export function addEnrollment(
  enrollments: Enrollment[],
  course: Course,
  placement: Placement,
  context: TrajectoryContext,
): EditResult {
  const { periods, cards } = layOutTrajectory(enrollments, context, [
    placement.period,
  ]);
  const column = periods.indexOf(placement.period) + 1;
  const end = column + course.duration - 1;

  if (isAnyPeriodFull(cards, column, end)) return { error: "PERIOD_FULL" };

  const isDuplicate = cards.some(
    (card) => card.courseId === course.id && spansAny(card, column, end),
  );
  if (isDuplicate && !course.isElective) return { error: "DUPLICATE_COURSE" };

  const enrollment = placeAt(
    {
      id: nanoid(),
      courseId: course.id,
      status: "PENDING",
      year: 0,
      term: 0,
      position: 0,
    },
    placement,
  );
  return {
    enrollments: settleEnrollments([...enrollments, enrollment], context, [
      enrollment.id,
    ]),
  };
}

export function removeEnrollment(
  enrollments: Enrollment[],
  enrollmentId: string,
) {
  return enrollments.filter((e) => e.id !== enrollmentId);
}

export function moveEnrollment(
  enrollments: Enrollment[],
  enrollmentId: string,
  placement: Placement,
  context: TrajectoryContext,
): EditResult {
  const conflict = getMoveConflict(
    enrollments,
    enrollmentId,
    placement.period,
    context,
  );
  if (conflict) return { error: conflict.error };

  return {
    enrollments: settleEnrollments(
      enrollments.map((e) =>
        e.id === enrollmentId ? placeAt(e, placement) : e,
      ),
      context,
      [enrollmentId],
    ),
  };
}

export function getMoveConflict(
  enrollments: Enrollment[],
  enrollmentId: string,
  period: PeriodKey,
  context: TrajectoryContext,
): MoveConflict | null {
  const { periods, cards } = layOutTrajectory(enrollments, context, [period]);
  const moved = cards.find((card) => card.id === enrollmentId);
  if (!moved) return null;

  const column = periods.indexOf(period) + 1;
  const end = column + moved.duration - 1;
  const others = cards.filter((card) => card !== moved);

  const isEnteringFullPeriod =
    column !== moved.column &&
    [...Array(moved.duration).keys()].some((offset) => {
      const target = column + offset;
      return (
        !spansAny(moved, target, target) &&
        isAnyPeriodFull(others, target, target)
      );
    });
  if (isEnteringFullPeriod) return { error: "PERIOD_FULL", blockerIds: [] };

  const course = extendCourses(context.curriculum.courses).get(moved.courseId);
  return course
    ? findRelatedConflict(others, moved, column, end, course)
    : null;
}

function toConflict(error: EditError, blockers: PlacedEnrollment[]) {
  return { error, blockerIds: blockers.map((card) => card.id) };
}

function findRelatedConflict(
  others: PlacedEnrollment[],
  moved: PlacedEnrollment,
  column: number,
  end: number,
  course: ExtendedCourse,
): MoveConflict | null {
  if (course.isElective || column === moved.column) return null;

  const duplicates = others.filter(
    (card) => card.courseId === course.id && spansAny(card, column, end),
  );
  if (duplicates.length > 0) return toConflict("DUPLICATE_COURSE", duplicates);

  const isMovingForward = column > moved.column;
  const relatedIds = isMovingForward
    ? course.successorIds
    : course.prerequisiteIds;
  const related = others.filter((card) => relatedIds.includes(card.courseId));

  const inPeriod = related.filter((card) => spansAny(card, column, end));
  if (inPeriod.length > 0)
    return toConflict(
      isMovingForward ? "SUCCESSOR_IN_PERIOD" : "PREREQUISITE_IN_PERIOD",
      inPeriod,
    );

  const [from, to] = isMovingForward
    ? [moved.column, column - 1]
    : [end + 1, moved.column - 1];
  const onTheWay = related.filter((card) => spansAny(card, from, to));
  if (onTheWay.length > 0)
    return toConflict(
      isMovingForward ? "SUCCESSOR_ON_THE_WAY" : "PREREQUISITE_ON_THE_WAY",
      onTheWay,
    );

  return null;
}

export function retakeEnrollment(
  enrollments: Enrollment[],
  enrollmentId: string,
  context: TrajectoryContext,
) {
  const { periods, cards } = layOutTrajectory(enrollments, context);
  const failed = cards.find((card) => card.id === enrollmentId);
  if (!failed) return null;

  const nextPeriod = getNextPeriod(periods);
  const candidates = [
    ...periods
      .slice(getEnd(failed))
      .filter((period) => isSemester(parsePeriodKey(period).term)),
    ...(nextPeriod ? [nextPeriod] : []),
  ];
  for (const period of candidates) {
    const result = addEnrollment(
      enrollments,
      failed.course,
      {
        period,
        row: getPeriodEndRow(cards, periods.indexOf(period) + 1),
      },
      context,
    );
    if (result.enrollments) return { enrollments: result.enrollments, period };
  }
  return null;
}
