import { describe, expect, test } from "bun:test";
import type { Enrollment } from "@/types/trajectory";
import { extendCourses } from "@/utils/curriculum";
import {
  approveThroughPeriod,
  setEnrollmentStatus,
  setEnrollmentStatuses,
} from "@/utils/trajectory/progress";
import {
  course,
  curriculumOf,
  entry,
  trajectory,
} from "@/utils/trajectory/test-helpers";

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

describe("approveThroughPeriod", () => {
  const context = {
    entry,
    curriculum: curriculumOf([
      course(1),
      course(2, { prerequisiteIds: [1] }),
      course(3, { prerequisiteIds: [2] }),
      course(4, { prerequisiteIds: [5] }),
      course(5),
    ]),
  };

  test("approves in order up to the period and leaves the rest pending", () => {
    const enrollments = trajectory({
      "2024-1": [1],
      "2024-3": [2],
      "2025-1": [3],
    });
    const result = approveThroughPeriod(enrollments, "2024-3", context);

    expect(result.approvedCount).toBe(2);
    expect(result.enrollments.map((e) => e.status)).toEqual([
      "APPROVED",
      "APPROVED",
      "PENDING",
    ]);
  });

  test("leaves a course without its prerequisites pending", () => {
    const enrollments = trajectory({ "2024-1": [4], "2025-1": [5] });
    const result = approveThroughPeriod(enrollments, "2024-1", context);

    expect(result.approvedCount).toBe(0);
  });

  test("keeps a failed enrollment failed", () => {
    const enrollments = trajectory({ "2024-1": [1] }, { 1: "FAILED" });

    expect(
      approveThroughPeriod(enrollments, "2024-1", context).enrollments[0]
        ?.status,
    ).toBe("FAILED");
  });
});

describe("setEnrollmentStatuses", () => {
  const courses = extendCourses([
    course(1),
    course(2, { prerequisiteIds: [1] }),
    course(3),
  ]);

  test("applies every status and adds up the reverted successors", () => {
    const enrollments = trajectory(
      { "2024-1": [1, 3], "2024-3": [2] },
      { 1: "APPROVED", 2: "APPROVED" },
    );
    const result = setEnrollmentStatuses(
      enrollments,
      new Map([
        ["2024-1/1", "FAILED"],
        ["2024-1/3", "APPROVED"],
      ]),
      courses,
    );

    expect(result.enrollments.map((e) => e.status)).toEqual([
      "FAILED",
      "APPROVED",
      "PENDING",
    ]);
    expect(result.revertedCount).toBe(1);
  });
});
