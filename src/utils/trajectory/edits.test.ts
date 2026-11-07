import { describe, expect, test } from "bun:test";
import {
  getMoveConflict,
  MAX_ENROLLMENTS_PER_PERIOD,
  moveEnrollment,
  retakeEnrollment,
} from "@/utils/trajectory/edits";
import {
  course,
  curriculumOf,
  entry,
  layoutOf,
  trajectory,
} from "@/utils/trajectory/test-helpers";

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

describe("getMoveConflict", () => {
  const context = {
    entry,
    curriculum: curriculumOf([
      course(1),
      course(2, { prerequisiteIds: [1] }),
      course(3, { prerequisiteIds: [2] }),
      course(9, { isElective: true }),
    ]),
  };
  const enrollments = trajectory({
    "2024-1": [1, 9],
    "2024-3": [2],
    "2025-1": [3],
    "2025-3": [],
  });

  test("names the prerequisite that stops a move backward", () => {
    expect(getMoveConflict(enrollments, "2025-1/3", "2024-3", context)).toEqual(
      {
        error: "PREREQUISITE_IN_PERIOD",
        blockerIds: ["2024-3/2"],
      },
    );
  });

  test("names the successor on the way of a move forward", () => {
    expect(getMoveConflict(enrollments, "2024-3/2", "2025-3", context)).toEqual(
      {
        error: "SUCCESSOR_ON_THE_WAY",
        blockerIds: ["2025-1/3"],
      },
    );
  });

  test("finds none for a period the course can reach", () => {
    expect(
      getMoveConflict(enrollments, "2025-1/3", "2025-3", context),
    ).toBeNull();
  });

  test("finds none for an elective", () => {
    expect(
      getMoveConflict(enrollments, "2024-1/9", "2025-3", context),
    ).toBeNull();
  });

  test("names no blocker when the period is full", () => {
    const crowded = trajectory({
      "2024-1": [9],
      "2024-3": Array.from({ length: 10 }, () => 9),
    });
    expect(getMoveConflict(crowded, "2024-1/9", "2024-3", context)).toEqual({
      error: "PERIOD_FULL",
      blockerIds: [],
    });
  });
});

describe("retakeEnrollment", () => {
  const context = {
    entry,
    curriculum: curriculumOf([course(1), course(2)]),
  };

  test("adds a pending enrollment in the next semester", () => {
    const enrollments = trajectory(
      { "2024-1": [1], "2024-3": [2] },
      { 1: "FAILED" },
    );
    const result = retakeEnrollment(enrollments, "2024-1/1", context);

    expect(result?.period).toBe("2024-3");
    expect(layoutOf(result?.enrollments)).toEqual({
      "2024-1": [1],
      "2024-3": [2, 1],
    });
    expect(result?.enrollments.at(-1)?.status).toBe("PENDING");
  });

  test("adds the period after the last one when none follows", () => {
    const enrollments = trajectory({ "2024-1": [1] }, { 1: "FAILED" });

    expect(retakeEnrollment(enrollments, "2024-1/1", context)?.period).toBe(
      "2024-3",
    );
  });

  test("skips a period that is full", () => {
    const crowded = {
      entry,
      curriculum: curriculumOf([course(1), course(9, { isElective: true })]),
    };
    const enrollments = trajectory(
      {
        "2024-1": [1],
        "2024-3": Array.from({ length: 10 }, () => 9),
      },
      { 1: "FAILED" },
    );

    expect(retakeEnrollment(enrollments, "2024-1/1", crowded)?.period).toBe(
      "2025-1",
    );
  });
});
