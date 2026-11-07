import { nanoid } from "nanoid";
import {
  getCourseHeight,
  getDefaultCredits,
  pushDownCollisions,
} from "@/curriculum/grid";
import { compareSlots } from "@/curriculum/periods";
import type { Curriculum, PeriodKey } from "@/types/curriculum";
import type { Enrollment, Entry, TrajectoryContext } from "@/types/trajectory";
import { arabicToRoman } from "@/utils/numbers";
import {
  comparePeriodKeys,
  getSemesterIndex,
  isSemester,
  parsePeriodKey,
  TERM_LABELS,
} from "@/utils/period-key";

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

function getPeriodKey({ year, term }: { year: number; term: number }) {
  return `${year}-${term}` as PeriodKey;
}

function getNextSemester(key: PeriodKey): PeriodKey {
  const { year, term } = parsePeriodKey(key);
  return term < 3 ? `${year}-3` : `${year + 1}-1`;
}

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

type TrajectoryLayout = ReturnType<typeof layOutTrajectory>;

export type PlacedEnrollment = TrajectoryLayout["cards"][number];

export function getNextPeriod(periods: PeriodKey[]) {
  const last = periods.at(-1);
  return last ? getNextSemester(last) : null;
}

export function toLayoutCurriculum(
  curriculum: Curriculum,
  { periods }: TrajectoryLayout,
  cards: PlacedEnrollment[],
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

export function getEnd(card: { column: number; duration: number }) {
  return card.column + card.duration - 1;
}

export function spansAny(card: PlacedEnrollment, from: number, to: number) {
  return from <= to && card.column <= to && from <= getEnd(card);
}

export function getPeriodEndRow(cards: PlacedEnrollment[], column: number) {
  return (
    Math.max(
      0,
      ...cards
        .filter((card) => spansAny(card, column, column))
        .map((card) => card.row + card.height - 1),
    ) + 1
  );
}

export function getPeriodInfo(id: PeriodKey, entry: Entry) {
  const { year, term } = parsePeriodKey(id);
  const currentDate = new Date();
  const currentPeriod = `${currentDate.getFullYear()}-${
    currentDate.getMonth() < 7 ? 1 : 3
  }`;

  const isCurrent = comparePeriodKeys(id, currentPeriod) === 0;
  const hasStarted = comparePeriodKeys(id, currentPeriod) <= 0;

  if (!isSemester(term))
    return { label: TERM_LABELS[term], isCurrent, hasStarted };

  const number = getSemesterIndex({ year, term }) - getSemesterIndex(entry) + 1;

  return {
    label: number > 0 ? `Semestre ${arabicToRoman(number)}` : "Semestre",
    isCurrent,
    hasStarted,
  };
}

// The column a board opens on: the last one holding an approved course, or the
// current period while nothing is approved, or the first if that is off the board.
export function getOpeningColumn(
  { periods, cards }: TrajectoryLayout,
  entry: Entry,
) {
  const lastApproved = Math.max(
    0,
    ...cards
      .filter((card) => card.enrollment.status === "APPROVED")
      .map((card) => card.column + card.duration - 1),
  );
  if (lastApproved > 0) return lastApproved;
  return (
    Math.max(
      0,
      periods.findIndex((period) => getPeriodInfo(period, entry).isCurrent),
    ) + 1
  );
}
