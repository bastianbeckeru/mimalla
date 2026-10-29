import { describe, expect, test } from "bun:test";
import { migrateTrajectoryState } from "@/stores/trajectory";

describe("migrateTrajectoryState", () => {
  test("renames the fields of a version 1 trajectory already in calendar years", () => {
    const state = migrateTrajectoryState(
      {
        curriculums: [
          {
            id: "t1",
            path: "uni/program",
            year: 2024,
            term: 1,
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
      1,
    );

    expect(state).toEqual({
      trajectories: [
        {
          id: "t1",
          curriculumPath: "uni/program",
          entry: { year: 2024, term: 1 },
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
            path: "uni/other",
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

  test("points a version 2 trajectory to the curriculum file it was made from", () => {
    const state = migrateTrajectoryState(
      {
        trajectories: [
          {
            id: "t1",
            curriculumPath: "udp/derecho",
            entry: { year: 2024, term: 1 },
            enrollments: [
              {
                id: "e1",
                courseId: 177,
                year: 2024,
                term: 1,
                position: 1,
                status: "APPROVED",
              },
              {
                id: "e2",
                courseId: 999_999,
                year: 2024,
                term: 1,
                position: 2,
                status: "PENDING",
              },
            ],
          },
        ],
        activeTrajectoryId: "t1",
      },
      2,
    );

    expect(state.trajectories).toEqual([
      {
        id: "t1",
        curriculumPath: "udp/derecho/2023",
        entry: { year: 2024, term: 1 },
        enrollments: [
          {
            id: "e1",
            courseId: 1,
            year: 2024,
            term: 1,
            position: 1,
            status: "APPROVED",
          },
        ],
      },
    ]);
  });

  test("keeps a version 2 trajectory whose program has no curriculum file", () => {
    const trajectory = {
      id: "t1",
      curriculumPath: "udp/diseno",
      entry: { year: 2024, term: 1 },
      enrollments: [],
    };

    expect(
      migrateTrajectoryState(
        { trajectories: [trajectory], activeTrajectoryId: "t1" },
        2,
      ).trajectories,
    ).toEqual([trajectory]);
  });
});
