import { describe, expect, test } from "bun:test";
import type { Course, PeriodKey, Slot } from "@/types/curriculum";
import type {
  EnrollmentStatus,
  PeriodWithEnrollments,
} from "@/types/trajectory";
import { extendCourses } from "@/utils/curriculum";
import {
  createEnrollments,
  MAX_ENROLLMENTS_PER_PERIOD,
  moveEnrollment,
  setEnrollmentStatus,
} from "@/utils/trajectory";

function slot(
  courseId: number,
  programYear: number,
  term: number,
  position = 1,
): Slot {
  return { id: courseId, courseId, programYear, term, position };
}

function course(
  id: number,
  { prerequisiteIds = [] as number[], isElective = false } = {},
): Course {
  return {
    id,
    code: `C${id}`,
    name: `Course ${id}`,
    credits: 6,
    duration: 1,
    prerequisiteCredits: 0,
    prerequisiteIds,
    isElective,
  };
}

function trajectory(
  layout: Record<PeriodKey, number[]>,
  statuses: Record<number, EnrollmentStatus> = {},
): PeriodWithEnrollments[] {
  return Object.entries(layout).map(([id, courseIds]) => {
    const [year = 0, term = 0] = id.split("-").map(Number);

    return {
      id: id as PeriodKey,
      enrollments: courseIds.map((courseId, index) => ({
        id: `${id}/${courseId}`,
        courseId,
        year,
        term,
        position: index + 1,
        status: statuses[courseId] ?? "PENDING",
      })),
    };
  });
}

function layoutOf(periods: PeriodWithEnrollments[] | undefined) {
  return Object.fromEntries(
    (periods ?? []).map((p) => [p.id, p.enrollments.map((e) => e.courseId)]),
  );
}

describe("createEnrollments", () => {
  const slots = [slot(1, 1, 1), slot(2, 1, 3, 2), slot(3, 2, 1), slot(4, 3, 3)];

  const periodsOf = (entry: { year: number; term: number }) =>
    createEnrollments({ entry, slots }).map((e) => ({
      courseId: e.courseId,
      year: e.year,
      term: e.term,
    }));

  test("places each slot in the calendar period of its program year for a first semester entry", () => {
    expect(periodsOf({ year: 2024, term: 1 })).toEqual([
      { courseId: 1, year: 2024, term: 1 },
      { courseId: 2, year: 2024, term: 3 },
      { courseId: 3, year: 2025, term: 1 },
      { courseId: 4, year: 2026, term: 3 },
    ]);
  });

  test("shifts every slot one semester later for a second semester entry", () => {
    expect(periodsOf({ year: 2024, term: 3 })).toEqual([
      { courseId: 1, year: 2024, term: 3 },
      { courseId: 2, year: 2025, term: 1 },
      { courseId: 3, year: 2025, term: 3 },
      { courseId: 4, year: 2027, term: 1 },
    ]);
  });

  test("starts every enrollment as pending, at its slot position, with a unique id", () => {
    const enrollments = createEnrollments({
      entry: { year: 2024, term: 1 },
      slots,
    });

    expect(enrollments.map((e) => e.status)).toEqual([
      "PENDING",
      "PENDING",
      "PENDING",
      "PENDING",
    ]);
    expect(enrollments.map((e) => e.position)).toEqual([1, 2, 1, 1]);
    expect(new Set(enrollments.map((e) => e.id)).size).toBe(4);
  });
});

describe("moveEnrollment", () => {
  const courses = extendCourses([
    course(1),
    course(2, { prerequisiteIds: [1] }),
    course(3, { prerequisiteIds: [2] }),
    course(4),
    course(9, { isElective: true }),
  ]);

  test("moves an enrollment to another period and takes that period", () => {
    const periods = trajectory({
      "2024-1": [1, 4],
      "2024-3": [],
      "2025-1": [2],
    });

    const result = moveEnrollment(
      periods,
      { periodId: "2024-1", index: 1 },
      { periodId: "2024-3", index: 0 },
      courses,
    );

    expect(layoutOf(result.periods)).toEqual({
      "2024-1": [1],
      "2024-3": [4],
      "2025-1": [2],
    });
    expect(result.periods?.[1]?.enrollments[0]).toMatchObject({
      id: "2024-1/4",
      year: 2024,
      term: 3,
      position: 1,
    });
  });

  test("renumbers the positions of the periods it reorders", () => {
    const periods = trajectory({ "2024-1": [1, 4, 9] });

    const result = moveEnrollment(
      periods,
      { periodId: "2024-1", index: 2 },
      { periodId: "2024-1", index: 0 },
      courses,
    );

    expect(
      result.periods?.[0]?.enrollments.map((e) => [e.courseId, e.position]),
    ).toEqual([
      [9, 1],
      [1, 2],
      [4, 3],
    ]);
  });

  test("rejects moving a course into the period of its successor", () => {
    const periods = trajectory({ "2024-1": [1], "2024-3": [2] });

    const result = moveEnrollment(
      periods,
      { periodId: "2024-1", index: 0 },
      { periodId: "2024-3", index: 0 },
      courses,
    );

    expect(result.error).toBe("SUCCESSOR_IN_PERIOD");
  });

  test("rejects moving a course past its successor", () => {
    const periods = trajectory({ "2024-1": [1], "2024-3": [2], "2025-1": [] });

    const result = moveEnrollment(
      periods,
      { periodId: "2024-1", index: 0 },
      { periodId: "2025-1", index: 0 },
      courses,
    );

    expect(result.error).toBe("SUCCESSOR_ON_THE_WAY");
  });

  test("rejects moving a course into the period of its prerequisite", () => {
    const periods = trajectory({ "2024-1": [2], "2024-3": [3] });

    const result = moveEnrollment(
      periods,
      { periodId: "2024-3", index: 0 },
      { periodId: "2024-1", index: 0 },
      courses,
    );

    expect(result.error).toBe("PREREQUISITE_IN_PERIOD");
  });

  test("rejects moving a course before its prerequisite", () => {
    const periods = trajectory({ "2024-1": [], "2024-3": [2], "2025-1": [3] });

    const result = moveEnrollment(
      periods,
      { periodId: "2025-1", index: 0 },
      { periodId: "2024-1", index: 0 },
      courses,
    );

    expect(result.error).toBe("PREREQUISITE_ON_THE_WAY");
  });

  test("rejects moving a course into a period that already has it", () => {
    const periods = trajectory({ "2024-1": [4], "2024-3": [4] });

    const result = moveEnrollment(
      periods,
      { periodId: "2024-1", index: 0 },
      { periodId: "2024-3", index: 0 },
      courses,
    );

    expect(result.error).toBe("DUPLICATE_COURSE");
  });

  test("lets an elective share a period with another enrollment of itself", () => {
    const periods = trajectory({ "2024-1": [9], "2024-3": [9] });

    const result = moveEnrollment(
      periods,
      { periodId: "2024-1", index: 0 },
      { periodId: "2024-3", index: 0 },
      courses,
    );

    expect(layoutOf(result.periods)).toEqual({
      "2024-1": [],
      "2024-3": [9, 9],
    });
  });

  test("rejects moving into a full period but allows reordering within it", () => {
    const fullPeriod = Array.from(
      { length: MAX_ENROLLMENTS_PER_PERIOD },
      () => 9,
    );
    const periods = trajectory({ "2024-1": [4], "2024-3": fullPeriod });

    const intoFull = moveEnrollment(
      periods,
      { periodId: "2024-1", index: 0 },
      { periodId: "2024-3", index: 0 },
      courses,
    );
    const withinFull = moveEnrollment(
      periods,
      { periodId: "2024-3", index: 0 },
      { periodId: "2024-3", index: 5 },
      courses,
    );

    expect(intoFull.error).toBe("PERIOD_FULL");
    expect(withinFull.error).toBeUndefined();
  });
});

describe("setEnrollmentStatus", () => {
  const courses = extendCourses([
    course(1),
    course(2, { prerequisiteIds: [1] }),
    course(3, { prerequisiteIds: [2] }),
    course(4),
  ]);

  const statusesOf = (periods: PeriodWithEnrollments[]) =>
    Object.fromEntries(
      periods.flatMap((p) => p.enrollments).map((e) => [e.id, e.status]),
    );

  test("returns the approved successors of a course to pending when it stops being approved", () => {
    const periods = trajectory(
      { "2024-1": [1, 4], "2024-3": [2], "2025-1": [3] },
      { 1: "APPROVED", 2: "APPROVED", 3: "APPROVED", 4: "APPROVED" },
    );

    const updated = setEnrollmentStatus(
      periods,
      "2024-1/1",
      "PENDING",
      courses,
    );

    expect(statusesOf(updated)).toEqual({
      "2024-1/1": "PENDING",
      "2024-1/4": "APPROVED",
      "2024-3/2": "PENDING",
      "2025-1/3": "PENDING",
    });
  });

  test("returns the approved successors to pending when the course is failed", () => {
    const periods = trajectory(
      { "2024-1": [1], "2024-3": [2] },
      { 1: "APPROVED", 2: "APPROVED" },
    );

    const updated = setEnrollmentStatus(periods, "2024-1/1", "FAILED", courses);

    expect(statusesOf(updated)).toEqual({
      "2024-1/1": "FAILED",
      "2024-3/2": "PENDING",
    });
  });

  test("leaves every other enrollment as it was when a course is approved", () => {
    const periods = trajectory(
      { "2024-1": [1], "2024-3": [2, 4] },
      { 2: "FAILED", 4: "APPROVED" },
    );

    const updated = setEnrollmentStatus(
      periods,
      "2024-1/1",
      "APPROVED",
      courses,
    );

    expect(statusesOf(updated)).toEqual({
      "2024-1/1": "APPROVED",
      "2024-3/2": "FAILED",
      "2024-3/4": "APPROVED",
    });
  });
});
