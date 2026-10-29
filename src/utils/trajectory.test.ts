import { describe, expect, test } from "bun:test";
import type { Course, Curriculum, Slot } from "@/types/builder";
import type { PeriodKey } from "@/types/curriculum";
import type { Enrollment, EnrollmentStatus } from "@/types/trajectory";
import { extendCourses } from "@/utils/curriculum";
import {
  createEnrollments,
  layOutTrajectory,
  MAX_ENROLLMENTS_PER_PERIOD,
  moveEnrollment,
  setEnrollmentStatus,
  toggleEnrollmentStatus,
} from "@/utils/trajectory";

function course(
  id: number,
  {
    prerequisiteIds = [] as number[],
    isElective = false,
    slots = [] as Slot[],
    credits = 6,
    duration = 1,
  } = {},
): Course {
  return {
    id,
    code: `C${id}`,
    name: `Course ${id}`,
    credits,
    areaId: null,
    trackIds: [],
    duration,
    prerequisiteCredits: 0,
    prerequisiteIds,
    isElective,
    slots,
  };
}

function curriculumOf(courses: Course[]): Curriculum {
  return {
    programName: "Program",
    institution: "",
    effectiveYear: 2020,
    versionName: "",
    termSystem: "semester",
    periods: [],
    areas: [],
    tracks: [],
    courses,
  };
}

const entry = { year: 2024, term: 1 };

function trajectory(
  layout: Record<PeriodKey, number[]>,
  statuses: Record<number, EnrollmentStatus> = {},
): Enrollment[] {
  return Object.entries(layout).flatMap(([period, courseIds]) => {
    const [year = 0, term = 0] = period.split("-").map(Number);

    return courseIds.map((courseId, index) => ({
      id:
        courseIds.indexOf(courseId) === index
          ? `${period}/${courseId}`
          : `${period}/${courseId}/${index}`,
      courseId,
      year,
      term,
      position: index + 1,
      status: statuses[courseId] ?? "PENDING",
    }));
  });
}

function layoutOf(enrollments: Enrollment[] | undefined) {
  const layout: Record<string, number[]> = {};
  for (const e of (enrollments ?? []).toSorted(
    (a, b) => a.position - b.position,
  ))
    layout[`${e.year}-${e.term}`] = [
      ...(layout[`${e.year}-${e.term}`] ?? []),
      e.courseId,
    ];
  return layout;
}

describe("createEnrollments", () => {
  const curriculum = curriculumOf([
    course(4, { slots: [{ programYear: 3, term: 3, position: 1 }] }),
    course(1, { slots: [{ programYear: 1, term: 1, position: 1 }] }),
    course(2, { slots: [{ programYear: 1, term: 3, position: 2 }] }),
    course(3, { slots: [{ programYear: 2, term: 1, position: 1 }] }),
  ]);

  const periodsOf = (entry: { year: number; term: number }) =>
    createEnrollments({ entry, curriculum }).map((e) => ({
      courseId: e.courseId,
      year: e.year,
      term: e.term,
    }));

  test("places each slot, in curriculum order, in the calendar period of its program year for a first semester entry", () => {
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
      curriculum,
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
  const context = {
    entry,
    curriculum: curriculumOf([
      course(1),
      course(2, { prerequisiteIds: [1] }),
      course(3, { prerequisiteIds: [2] }),
      course(4),
      course(5, { prerequisiteIds: [1], duration: 2 }),
      course(9, { isElective: true }),
    ]),
  };

  test("moves an enrollment to a cell of another period", () => {
    const enrollments = trajectory({
      "2024-1": [1, 4],
      "2024-3": [],
      "2025-1": [2],
    });

    const result = moveEnrollment(
      enrollments,
      "2024-1/4",
      { period: "2024-3", row: 3 },
      context,
    );

    expect(layoutOf(result.enrollments)).toEqual({
      "2024-1": [1],
      "2024-3": [4],
      "2025-1": [2],
    });
    expect(result.enrollments?.find((e) => e.id === "2024-1/4")).toMatchObject({
      year: 2024,
      term: 3,
      position: 3,
    });
  });

  test("pushes the cards it lands on down", () => {
    const enrollments = trajectory({ "2024-1": [1, 4] });

    const result = moveEnrollment(
      enrollments,
      "2024-1/4",
      { period: "2024-1", row: 1 },
      context,
    );

    expect(result.enrollments?.map((e) => [e.courseId, e.position])).toEqual([
      [1, 2],
      [4, 1],
    ]);
  });

  test("rejects moving a course into the period of its successor", () => {
    const enrollments = trajectory({ "2024-1": [1], "2024-3": [2] });

    const result = moveEnrollment(
      enrollments,
      "2024-1/1",
      { period: "2024-3", row: 2 },
      context,
    );

    expect(result.error).toBe("SUCCESSOR_IN_PERIOD");
  });

  test("rejects moving a course past its successor", () => {
    const enrollments = trajectory({ "2024-1": [1], "2024-3": [2] });

    const result = moveEnrollment(
      enrollments,
      "2024-1/1",
      { period: "2025-1", row: 1 },
      context,
    );

    expect(result.error).toBe("SUCCESSOR_ON_THE_WAY");
  });

  test("rejects moving a course whose span would reach its prerequisite", () => {
    const enrollments = trajectory({ "2024-1": [1], "2025-1": [5] });

    const result = moveEnrollment(
      enrollments,
      "2025-1/5",
      { period: "2023-3", row: 2 },
      context,
    );

    expect(result.error).toBe("PREREQUISITE_IN_PERIOD");
  });

  test("rejects moving a course into the period of its prerequisite", () => {
    const enrollments = trajectory({ "2024-1": [2], "2024-3": [3] });

    const result = moveEnrollment(
      enrollments,
      "2024-3/3",
      { period: "2024-1", row: 2 },
      context,
    );

    expect(result.error).toBe("PREREQUISITE_IN_PERIOD");
  });

  test("rejects moving a course before its prerequisite", () => {
    const enrollments = trajectory({ "2024-3": [2], "2025-1": [3] });

    const result = moveEnrollment(
      enrollments,
      "2025-1/3",
      { period: "2024-1", row: 1 },
      context,
    );

    expect(result.error).toBe("PREREQUISITE_ON_THE_WAY");
  });

  test("rejects moving a course into a period that already has it", () => {
    const enrollments = trajectory({ "2024-1": [4], "2024-3": [4] });

    const result = moveEnrollment(
      enrollments,
      "2024-1/4",
      { period: "2024-3", row: 2 },
      context,
    );

    expect(result.error).toBe("DUPLICATE_COURSE");
  });

  test("lets an elective share a period with another enrollment of itself", () => {
    const enrollments = trajectory({ "2024-1": [9], "2024-3": [9] });

    const result = moveEnrollment(
      enrollments,
      "2024-1/9",
      { period: "2024-3", row: 1 },
      context,
    );

    expect(layoutOf(result.enrollments)).toEqual({ "2024-3": [9, 9] });
  });

  test("rejects moving into a full period but allows moving within it", () => {
    const fullPeriod = Array.from(
      { length: MAX_ENROLLMENTS_PER_PERIOD },
      () => 9,
    );
    const enrollments = trajectory({ "2024-1": [4], "2024-3": fullPeriod });

    const intoFull = moveEnrollment(
      enrollments,
      "2024-1/4",
      { period: "2024-3", row: 11 },
      context,
    );
    const withinFull = moveEnrollment(
      enrollments,
      "2024-3/9",
      { period: "2024-3", row: 12 },
      context,
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

  const statusesOf = (enrollments: Enrollment[]) =>
    Object.fromEntries(enrollments.map((e) => [e.id, e.status]));

  test("returns the approved successors of a course to pending when it stops being approved", () => {
    const enrollments = trajectory(
      { "2024-1": [1, 4], "2024-3": [2], "2025-1": [3] },
      { 1: "APPROVED", 2: "APPROVED", 3: "APPROVED", 4: "APPROVED" },
    );

    const updated = setEnrollmentStatus(
      enrollments,
      "2024-1/1",
      "PENDING",
      courses,
    );

    expect(statusesOf(updated.enrollments)).toEqual({
      "2024-1/1": "PENDING",
      "2024-1/4": "APPROVED",
      "2024-3/2": "PENDING",
      "2025-1/3": "PENDING",
    });
    expect(updated.revertedCount).toBe(2);
  });

  test("returns the approved successors to pending when the course is failed", () => {
    const enrollments = trajectory(
      { "2024-1": [1], "2024-3": [2] },
      { 1: "APPROVED", 2: "APPROVED" },
    );

    const updated = setEnrollmentStatus(
      enrollments,
      "2024-1/1",
      "FAILED",
      courses,
    );

    expect(statusesOf(updated.enrollments)).toEqual({
      "2024-1/1": "FAILED",
      "2024-3/2": "PENDING",
    });
  });

  test("leaves every other enrollment as it was when a course is approved", () => {
    const enrollments = trajectory(
      { "2024-1": [1], "2024-3": [2, 4] },
      { 2: "FAILED", 4: "APPROVED" },
    );

    const updated = setEnrollmentStatus(
      enrollments,
      "2024-1/1",
      "APPROVED",
      courses,
    );

    expect(statusesOf(updated.enrollments)).toEqual({
      "2024-1/1": "APPROVED",
      "2024-3/2": "FAILED",
      "2024-3/4": "APPROVED",
    });
  });
});

describe("toggleEnrollmentStatus", () => {
  const courses = extendCourses([
    course(1),
    course(2, { prerequisiteIds: [1] }),
  ]);

  test("refuses to approve a course whose prerequisites are not approved", () => {
    const enrollments = trajectory({ "2024-1": [1], "2024-3": [2] });

    expect(toggleEnrollmentStatus(enrollments, "2024-3/2", courses)).toEqual({
      missingPrerequisiteIds: [1],
    });
  });

  test("returns a failed enrollment to pending", () => {
    const enrollments = trajectory({ "2024-1": [1] }, { 1: "FAILED" });

    expect(
      toggleEnrollmentStatus(enrollments, "2024-1/1", courses).status,
    ).toBe("PENDING");
  });
});

describe("layOutTrajectory", () => {
  const curriculum = curriculumOf([
    course(1),
    course(2),
    course(3, { credits: 12, duration: 2 }),
  ]);
  function enrollment(
    courseId: number,
    period: PeriodKey,
    position = 1,
  ): Enrollment {
    const [year = 0, term = 0] = period.split("-").map(Number);
    return {
      id: `${period}/${courseId}`,
      courseId,
      year,
      term,
      position,
      status: "PENDING",
    };
  }

  test("spans a card over its course's duration and sizes it by its credits against the default credits", () => {
    const { cards } = layOutTrajectory(
      [enrollment(1, "2024-1"), enrollment(3, "2024-1", 2)],
      { entry, curriculum },
    );

    expect(
      cards.map(({ id, column, row, duration, height }) => ({
        id,
        column,
        row,
        duration,
        height,
      })),
    ).toEqual([
      { id: "2024-1/1", column: 1, row: 1, duration: 1, height: 1 },
      { id: "2024-1/3", column: 1, row: 2, duration: 2, height: 2 },
    ]);
  });

  test("runs the periods from the entry to the last card, empty semesters included", () => {
    const { periods, cards } = layOutTrajectory(
      [enrollment(1, "2024-3"), enrollment(2, "2025-3")],
      { entry, curriculum },
    );

    expect(periods).toEqual(["2024-1", "2024-3", "2025-1", "2025-3"]);
    expect(cards.map((card) => card.column)).toEqual([2, 4]);
  });

  test("adds the periods a card spans past the last one", () => {
    const { periods } = layOutTrajectory([enrollment(3, "2024-3")], {
      entry,
      curriculum,
    });

    expect(periods).toEqual(["2024-1", "2024-3", "2025-1"]);
  });

  test("shows a winter or summer term only while it holds a card", () => {
    const { periods } = layOutTrajectory(
      [enrollment(1, "2024-4"), enrollment(2, "2025-3")],
      { entry, curriculum },
    );

    expect(periods).toEqual(["2024-1", "2024-3", "2024-4", "2025-1", "2025-3"]);
  });

  test("keeps the periods it is given, even when they hold no card", () => {
    const { periods, cards } = layOutTrajectory(
      [enrollment(1, "2024-1")],
      { entry, curriculum },
      ["2024-3", "2025-1"],
    );

    expect(periods).toEqual(["2024-1", "2024-3", "2025-1"]);
    expect(cards.map((card) => card.column)).toEqual([1]);
  });
});
