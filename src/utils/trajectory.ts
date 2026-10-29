import { nanoid } from "nanoid";
import {
  getCourseHeight,
  getDefaultCredits,
  pushDownCollisions,
} from "@/builder/grid";
import { compareSlots } from "@/builder/periods";
import type { Course, Curriculum } from "@/types/builder";
import type { ExtendedCourse, PeriodKey } from "@/types/curriculum";
import type {
  Enrollment,
  EnrollmentStatus,
  Entry,
  TrajectoryProgress,
} from "@/types/trajectory";
import { extendCourses } from "@/utils/curriculum";
import { arabicToRoman } from "@/utils/numbers";
import {
  comparePeriodKeys,
  getSemesterIndex,
  isSemester,
  parsePeriodKey,
  TERM_LABELS,
} from "@/utils/period-key";

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

export type Cell = { period: PeriodKey; row: number };

export function createEnrollments({
  entry,
  curriculum,
}: {
  entry: Entry;
  curriculum: Curriculum;
}): Enrollment[] {
  const entryOffset = entry.term >= 3 ? 1 : 0;
  const slots = curriculum.courses
    .flatMap((course) =>
      course.slots.map((slot) => ({ ...slot, courseId: course.id })),
    )
    .toSorted(compareSlots);

  return slots.map((slot) => {
    const semesterIndex =
      getSemesterIndex({
        year: entry.year + slot.programYear - 1,
        term: slot.term,
      }) + entryOffset;

    return {
      id: nanoid(),
      courseId: slot.courseId,
      position: slot.position,
      status: "PENDING",
      year: Math.floor(semesterIndex / 2),
      term: semesterIndex % 2 === 0 ? 1 : 3,
    };
  });
}

export type TrajectoryContext = {
  entry: Entry;
  curriculum: Curriculum;
};

function getPeriodKey({ year, term }: { year: number; term: number }) {
  return `${year}-${term}` as PeriodKey;
}

function getNextSemester(key: PeriodKey): PeriodKey {
  const { year, term } = parsePeriodKey(key);
  return term < 3 ? `${year}-3` : `${year + 1}-1`;
}

// Every period that holds a card, and every semester between them.
function fillSemesters(keys: PeriodKey[]) {
  const sorted = [...new Set(keys)].sort(comparePeriodKeys);
  const first = sorted[0];
  const last = sorted.at(-1);
  if (!first || !last) return sorted;

  const periods = new Set(sorted);
  const firstSemester = isSemester(parsePeriodKey(first).term)
    ? first
    : getNextSemester(first);
  for (
    let key = firstSemester;
    comparePeriodKeys(key, last) <= 0;
    key = getNextSemester(key)
  )
    periods.add(key);
  return [...periods].sort(comparePeriodKeys);
}

export function layOutTrajectory(
  enrollments: Enrollment[],
  { entry, curriculum }: TrajectoryContext,
  keptPeriods: PeriodKey[] = [],
) {
  const defaultCredits = getDefaultCredits(curriculum);
  const courses = new Map(curriculum.courses.map((c) => [c.id, c]));
  const placed = enrollments.flatMap((enrollment) => {
    const course = courses.get(enrollment.courseId);
    return course ? [{ enrollment, course }] : [];
  });
  const periods = fillSemesters([
    getPeriodKey(entry),
    ...keptPeriods,
    ...placed.map(({ enrollment }) => getPeriodKey(enrollment)),
  ]);
  const columnOf = (enrollment: Enrollment) =>
    periods.indexOf(getPeriodKey(enrollment)) + 1;

  const lastColumn = Math.max(
    ...placed.map(
      ({ enrollment, course }) => columnOf(enrollment) + course.duration - 1,
    ),
  );
  while (periods.length < lastColumn) {
    const last = periods.at(-1);
    if (!last) break;
    periods.push(getNextSemester(last));
  }

  const cards = placed.map(({ enrollment, course }) => ({
    id: enrollment.id,
    courseId: course.id,
    course,
    enrollment,
    column: columnOf(enrollment),
    row: enrollment.position,
    duration: course.duration,
    height: getCourseHeight(course.credits, defaultCredits),
  }));

  return { periods, cards };
}

export type TrajectoryLayout = ReturnType<typeof layOutTrajectory>;

export type EnrollmentCard = TrajectoryLayout["cards"][number];

export function getNextPeriod(periods: PeriodKey[]) {
  const last = periods.at(-1);
  return last ? getNextSemester(last) : null;
}

// The trajectory as a curriculum laid out in calendar periods, each card a
// slot of its course, so the builder's grid and connections work on it.
export function toLayoutCurriculum(
  curriculum: Curriculum,
  { periods }: TrajectoryLayout,
  cards: EnrollmentCard[],
): Curriculum {
  return {
    ...curriculum,
    periods: periods.map((key) => {
      const { year, term } = parsePeriodKey(key);
      return { programYear: year, term };
    }),
    courses: curriculum.courses.map((course) => ({
      ...course,
      slots: cards
        .filter((card) => card.courseId === course.id)
        .map((card) => {
          const { year, term } = card.enrollment;
          return { programYear: year, term, position: card.row };
        }),
    })),
  };
}

// Pushes cards down until none overlaps another. The anchored enrollments keep
// their cells, in order of priority.
export function settleEnrollments(
  enrollments: Enrollment[],
  context: TrajectoryContext,
  anchorIds: string[] = [],
): Enrollment[] {
  const layout = layOutTrajectory(enrollments, context);
  const cardsOf = (courseId: number) =>
    layout.cards.filter((card) => card.courseId === courseId);
  const anchors = anchorIds.flatMap((id) => {
    const card = layout.cards.find((candidate) => candidate.id === id);
    if (!card) return [];
    return [
      {
        courseId: card.courseId,
        slotIndex: cardsOf(card.courseId).indexOf(card),
      },
    ];
  });

  const settled = pushDownCollisions(
    toLayoutCurriculum(context.curriculum, layout, layout.cards),
    anchors,
    getDefaultCredits(context.curriculum),
  );

  const rows = new Map(
    settled.courses.flatMap((course) => {
      const cards = cardsOf(course.id);
      return course.slots.flatMap((slot, index) => {
        const card = cards[index];
        return card ? [[card.id, slot.position] as const] : [];
      });
    }),
  );
  return enrollments.map((enrollment) => {
    const position = rows.get(enrollment.id);
    return position === undefined || position === enrollment.position
      ? enrollment
      : { ...enrollment, position };
  });
}

function getEnd(card: { column: number; duration: number }) {
  return card.column + card.duration - 1;
}

function spansAny(card: EnrollmentCard, from: number, to: number) {
  return from <= to && card.column <= to && from <= getEnd(card);
}

// Whether a card spanning these columns would push a period past the limit.
function isAnyPeriodFull(cards: EnrollmentCard[], from: number, to: number) {
  for (let column = from; column <= to; column++) {
    const count = cards.filter((card) => spansAny(card, column, column)).length;
    if (count >= MAX_ENROLLMENTS_PER_PERIOD) return true;
  }
  return false;
}

function placeAt(enrollment: Enrollment, { period, row }: Cell): Enrollment {
  const { year, term } = parsePeriodKey(period);
  return { ...enrollment, year, term, position: row };
}

export function addEnrollment(
  enrollments: Enrollment[],
  course: Course,
  cell: Cell,
  context: TrajectoryContext,
): EditResult {
  const { periods, cards } = layOutTrajectory(enrollments, context, [
    cell.period,
  ]);
  const column = periods.indexOf(cell.period) + 1;
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
    cell,
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
  cell: Cell,
  context: TrajectoryContext,
): EditResult {
  const { periods, cards } = layOutTrajectory(enrollments, context, [
    cell.period,
  ]);
  const moved = cards.find((card) => card.id === enrollmentId);
  if (!moved) return { enrollments };

  const column = periods.indexOf(cell.period) + 1;
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
  if (isEnteringFullPeriod) return { error: "PERIOD_FULL" };

  const course = extendCourses(context.curriculum.courses).get(moved.courseId);
  const error = course && getMoveError(others, moved, column, end, course);
  if (error) return { error };

  return {
    enrollments: settleEnrollments(
      enrollments.map((e) => (e.id === enrollmentId ? placeAt(e, cell) : e)),
      context,
      [enrollmentId],
    ),
  };
}

// A course cannot move to or past a period that holds its prerequisite, when
// moving back, or its successor, when moving forward.
function getMoveError(
  others: EnrollmentCard[],
  moved: EnrollmentCard,
  column: number,
  end: number,
  course: ExtendedCourse,
): EditError | null {
  if (course.isElective || column === moved.column) return null;

  if (
    others.some(
      (card) => card.courseId === course.id && spansAny(card, column, end),
    )
  )
    return "DUPLICATE_COURSE";

  const isMovingForward = column > moved.column;
  const relatedIds = isMovingForward
    ? course.successorIds
    : course.prerequisiteIds;
  const related = others.filter((card) => relatedIds.includes(card.courseId));

  if (related.some((card) => spansAny(card, column, end)))
    return isMovingForward ? "SUCCESSOR_IN_PERIOD" : "PREREQUISITE_IN_PERIOD";

  const [from, to] = isMovingForward
    ? [moved.column, column - 1]
    : [end + 1, moved.column - 1];
  if (related.some((card) => spansAny(card, from, to)))
    return isMovingForward ? "SUCCESSOR_ON_THE_WAY" : "PREREQUISITE_ON_THE_WAY";

  return null;
}

export function extractCourseIds(
  enrollments: Enrollment[],
  status: EnrollmentStatus,
) {
  return enrollments.filter((e) => e.status === status).map((e) => e.courseId);
}

export function getProgress(
  enrollments: Enrollment[],
  courses: Map<number, Course>,
): TrajectoryProgress {
  return {
    approvedCourseIds: new Set(extractCourseIds(enrollments, "APPROVED")),
    approvedCredits: getTrajectoryStats(enrollments, courses).approvedCredits,
  };
}

export function getTrajectoryStats(
  enrollments: Enrollment[],
  courses: Map<number, Course>,
) {
  let approvedCredits = 0;
  let approvedCourses = 0;
  let pendingCourses = 0;

  for (const enrollment of enrollments) {
    const course = courses.get(enrollment.courseId);
    if (!course) continue;

    if (enrollment.status === "APPROVED") {
      approvedCourses++;
      approvedCredits += course.credits;
    } else if (enrollment.status === "PENDING") {
      pendingCourses++;
    }
  }

  const totalCourses = approvedCourses + pendingCourses;

  return {
    progress: totalCourses > 0 ? (approvedCourses / totalCourses) * 100 : 0,
    approvedCredits,
    approvedCourses,
    totalCourses,
  };
}

export function getPeriodInfo(id: PeriodKey, entry: Entry) {
  const { year, term } = parsePeriodKey(id);
  const currentDate = new Date();

  const isCurrent =
    year === currentDate.getFullYear() &&
    term === (currentDate.getMonth() < 7 ? 1 : 3);

  if (!isSemester(term)) return { label: TERM_LABELS[term], isCurrent };

  const number = getSemesterIndex({ year, term }) - getSemesterIndex(entry) + 1;

  return {
    label: number > 0 ? `Semestre ${arabicToRoman(number)}` : "Semestre",
    isCurrent,
  };
}

export function isAvailable(course: Course, progress: TrajectoryProgress) {
  return (
    course.prerequisiteIds.every((id) => progress.approvedCourseIds.has(id)) &&
    course.prerequisiteCredits <= progress.approvedCredits
  );
}

// Electives, and courses with no pending or approved enrollment, such as
// failed or removed ones.
export function getAddableCourses(
  courses: Map<number, Course>,
  enrollments: Enrollment[],
) {
  const takenCourseIds = new Set(
    enrollments.filter((e) => e.status !== "FAILED").map((e) => e.courseId),
  );

  return [...courses.values()].filter(
    (c) => c.isElective || !takenCourseIds.has(c.id),
  );
}

type ToggleResult =
  | {
      enrollments: Enrollment[];
      status: EnrollmentStatus;
      revertedCount: number;
      missingPrerequisiteIds?: never;
    }
  | {
      enrollments?: never;
      status?: never;
      revertedCount?: never;
      missingPrerequisiteIds: number[];
    };

// Approves a pending enrollment, if its course is available, and returns an
// approved or failed one to pending.
export function toggleEnrollmentStatus(
  enrollments: Enrollment[],
  enrollmentId: string,
  courses: Map<number, ExtendedCourse>,
): ToggleResult {
  const target = enrollments.find((e) => e.id === enrollmentId);
  const course = target && courses.get(target.courseId);
  if (!target || !course)
    return { enrollments, status: "PENDING", revertedCount: 0 };

  const status: EnrollmentStatus =
    target.status === "PENDING" ? "APPROVED" : "PENDING";
  const progress = getProgress(enrollments, courses);
  if (status === "APPROVED" && !isAvailable(course, progress))
    return {
      missingPrerequisiteIds: course.prerequisiteIds.filter(
        (id) => !progress.approvedCourseIds.has(id),
      ),
    };

  return {
    status,
    ...setEnrollmentStatus(enrollments, enrollmentId, status, courses),
  };
}

// Sets an enrollment's status. Approved successors of a course that stops
// being approved return to pending.
export function setEnrollmentStatus(
  enrollments: Enrollment[],
  enrollmentId: string,
  status: EnrollmentStatus,
  courses: Map<number, ExtendedCourse>,
) {
  const target = enrollments.find((e) => e.id === enrollmentId);
  if (!target) return { enrollments, revertedCount: 0 };

  const revertedCourseIds =
    status === "APPROVED"
      ? new Set<number>()
      : getApprovedSuccessorIds(enrollments, target.courseId, courses);

  let revertedCount = 0;
  const updated = enrollments.map((e) => {
    if (e.id === enrollmentId) return { ...e, status };
    if (e.status === "APPROVED" && revertedCourseIds.has(e.courseId)) {
      revertedCount++;
      return { ...e, status: "PENDING" as const };
    }
    return e;
  });
  return { enrollments: updated, revertedCount };
}

function getApprovedSuccessorIds(
  enrollments: Enrollment[],
  courseId: number,
  courses: Map<number, ExtendedCourse>,
) {
  const approvedCourseIds = new Set(extractCourseIds(enrollments, "APPROVED"));
  const successorIds = new Set<number>();
  const pendingIds = [courseId];

  for (let id = pendingIds.pop(); id !== undefined; id = pendingIds.pop()) {
    for (const successorId of courses.get(id)?.successorIds ?? []) {
      if (
        approvedCourseIds.has(successorId) &&
        !successorIds.has(successorId)
      ) {
        successorIds.add(successorId);
        pendingIds.push(successorId);
      }
    }
  }

  return successorIds;
}
