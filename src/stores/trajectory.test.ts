import { describe, expect, test } from "bun:test";
import { migrateTrajectoryState } from "@/stores/trajectory";

describe("migrateTrajectoryState", () => {
  test("keeps a version 2 trajectory under the new field names", () => {
    const state = migrateTrajectoryState(
      {
        curriculums: [
          {
            id: "t1",
            path: "udp/derecho",
            year: 2024,
            term: 3,
            enrolledCourses: [
              {
                id: "e1",
                courseId: 10,
                year: 2025,
                term: 1,
                position: 2,
                status: "APPROVED",
              },
            ],
          },
        ],
        activeCurriculumId: "t1",
      },
      2,
    );

    expect(state).toEqual({
      trajectories: [
        {
          id: "t1",
          curriculumPath: "udp/derecho",
          entry: { year: 2024, term: 3 },
          enrollments: [
            {
              id: "e1",
              courseId: 10,
              year: 2025,
              term: 1,
              position: 2,
              status: "APPROVED",
            },
          ],
        },
      ],
      activeTrajectoryId: "t1",
    });
  });

  test("moves a version 1 trajectory to calendar years and the current second semester term", () => {
    const state = migrateTrajectoryState(
      {
        curriculums: [
          {
            id: "t1",
            path: "udp/psicologia",
            year: 2023,
            term: 2,
            enrolledCourses: [
              {
                id: "e1",
                courseId: 10,
                year: 1,
                term: 1,
                position: 1,
                status: "APPROVED",
              },
              {
                id: "e2",
                courseId: 11,
                year: 3,
                term: 3,
                position: 1,
                status: "PENDING",
              },
              {
                id: "e3",
                courseId: 12,
                year: 2024,
                term: 1,
                position: 2,
                status: "PENDING",
              },
            ],
          },
        ],
        activeCurriculumId: null,
      },
      1,
    );

    const [trajectory] = state.trajectories;
    expect(trajectory?.entry).toEqual({ year: 2023, term: 3 });
    expect(
      trajectory?.enrollments.map((e) => ({ id: e.id, year: e.year })),
    ).toEqual([
      { id: "e1", year: 2023 },
      { id: "e2", year: 2025 },
      { id: "e3", year: 2024 },
    ]);
  });

  test("activates the first trajectory when a version 1 state has none active", () => {
    const state = migrateTrajectoryState(
      {
        curriculums: [
          { id: "t1", path: "a/b", year: 2024, term: 1, enrolledCourses: [] },
          { id: "t2", path: "a/c", year: 2024, term: 1, enrolledCourses: [] },
        ],
        activeCurriculumId: null,
      },
      1,
    );

    expect(state.activeTrajectoryId).toBe("t1");
  });
});
