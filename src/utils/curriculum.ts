import { nanoid } from "nanoid";
import type {
  Area,
  Course,
  ExtendedCourse,
  PeriodKey,
  Slot,
} from "@/types/curriculum";
import type {
  Enrollment,
  EnrollmentStatus,
  Entry,
  PeriodWithEnrollments,
} from "@/types/trajectory";
import { arabicToRoman } from "@/utils/numbers";
import {
  comparePeriodKeys,
  getSemesterIndex,
  isSemester,
  parsePeriodKey,
  TERM_LABELS,
} from "@/utils/period-key";

export function extendCourses(courses: Course[]) {
  const successorIds = new Map<number, number[]>();

  for (const course of courses) {
    for (const prerequisiteId of course.prerequisiteIds) {
      successorIds.set(prerequisiteId, [
        ...(successorIds.get(prerequisiteId) ?? []),
        course.id,
      ]);
    }
  }

  return new Map<number, ExtendedCourse>(
    courses.map((course) => [
      course.id,
      { ...course, successorIds: successorIds.get(course.id) ?? [] },
    ]),
  );
}

export function getCourseArea(areas: Area[], course: Course) {
  const { id, isElective } = course;

  if (isElective) {
    const electiveAreas = areas.filter((area) => area.courseIds.includes(id));

    const mainArea = areas.find((area) =>
      electiveAreas.every((eArea) => area.subareaIds.includes(eArea.id)),
    );

    if (!mainArea && electiveAreas.length === 1) return electiveAreas[0];

    return mainArea;
  }

  return areas.find((area) => area.courseIds.includes(id));
}

export function getPeriods(slots: Slot[]) {
  const periods = [
    ...new Set(slots.map((s): PeriodKey => `${s.programYear}-${s.term}`)),
  ].sort(comparePeriodKeys);

  return {
    periods,
    nCols: periods.length,
    nRows: Math.max(1, ...slots.map((s) => s.position)),
  };
}

export function createEnrollments({
  entry,
  slots,
}: {
  entry: Entry;
  slots: Slot[];
}): Enrollment[] {
  const entryOffset = entry.term >= 3 ? 1 : 0;

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

export function groupEnrollmentsByPeriod(
  enrollments: Enrollment[],
): PeriodWithEnrollments[] {
  const periods = new Map<PeriodKey, Enrollment[]>();

  for (const enrollment of enrollments) {
    const key: PeriodKey = `${enrollment.year}-${enrollment.term}`;
    periods.set(key, [...(periods.get(key) ?? []), enrollment]);
  }

  const keys = [...periods.keys()].sort(comparePeriodKeys);
  const first = keys[0];
  const last = keys.at(-1);

  if (first && last) {
    const fromYear = parsePeriodKey(first).year;
    const toYear = parsePeriodKey(last).year;

    for (let year = fromYear; year <= toYear; year++) {
      for (const term of [1, 3]) {
        const key: PeriodKey = `${year}-${term}`;
        const isInRange =
          comparePeriodKeys(key, first) >= 0 &&
          comparePeriodKeys(key, last) <= 0;

        if (isInRange && !periods.has(key)) periods.set(key, []);
      }
    }
  }

  return [...periods.entries()]
    .sort(([a], [b]) => comparePeriodKeys(a, b))
    .map(([id, enrollments]) => ({ id, enrollments }));
}

export function extractCourseIds(
  enrollments: Enrollment[],
  status: EnrollmentStatus,
) {
  return enrollments.filter((e) => e.status === status).map((e) => e.courseId);
}

export function getCurriculumStats(
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
