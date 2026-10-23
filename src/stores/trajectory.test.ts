import { describe, expect, test } from "bun:test";
import { migrateTrajectoryState } from "@/stores/trajectory";

const currentCurriculumIds: Record<string, number> = {
  "udp/derecho": 41,
  "udp/psicologia": 7,
};

async function findCurrentCurriculumId(path: string) {
  return currentCurriculumIds[path] ?? null;
}

describe("migrateTrajectoryState", () => {
  test("a version 3 trajectory references the current curriculum of its program and its courses by code", async () => {
    const persisted = {
      trajectories: [
        {
          id: "t1",
          curriculumPath: "udp/derecho",
          entry: { year: 2022, term: 1 },
          enrollments: [
            {
              id: "e1",
              year: 2022,
              term: 1,
              position: 1,
              status: "APPROVED",
              courseId: 177,
            },
            {
              id: "e2",
              year: 2022,
              term: 3,
              position: 2,
              status: "FAILED",
              courseId: 178,
            },
            {
              id: "e3",
              year: 2023,
              term: 2,
              position: 1,
              status: "PENDING",
              courseId: 10,
            },
          ],
        },
      ],
      activeTrajectoryId: "t1",
    };

    expect(
      await migrateTrajectoryState(persisted, 3, findCurrentCurriculumId),
    ).toEqual({
      trajectories: [
        {
          id: "t1",
          curriculumId: 41,
          entry: { year: 2022, term: 1 },
          enrollments: [
            {
              id: "e1",
              year: 2022,
              term: 1,
              position: 1,
              status: "APPROVED",
              courseCode: "DER06111",
            },
            {
              id: "e2",
              year: 2022,
              term: 3,
              position: 2,
              status: "FAILED",
              courseCode: "DER06112",
            },
            {
              id: "e3",
              year: 2023,
              term: 2,
              position: 1,
              status: "PENDING",
              courseCode: "CFGXXXX",
            },
          ],
        },
      ],
      activeTrajectoryId: "t1",
    });
  });

  test("an enrollment whose course id has no code is kept and marked as not found", async () => {
    const persisted = {
      trajectories: [
        {
          id: "t1",
          curriculumPath: "udp/psicologia",
          entry: { year: 2021, term: 3 },
          enrollments: [
            {
              id: "e1",
              year: 2022,
              term: 1,
              position: 3,
              status: "APPROVED",
              courseId: 105,
            },
            {
              id: "e2",
              year: 2022,
              term: 1,
              position: 4,
              status: "FAILED",
              courseId: 110,
            },
            {
              id: "e3",
              year: 2022,
              term: 3,
              position: 1,
              status: "PENDING",
              courseId: 9999,
            },
          ],
        },
      ],
      activeTrajectoryId: "t1",
    };

    const migrated = await migrateTrajectoryState(
      persisted,
      3,
      findCurrentCurriculumId,
    );

    expect(migrated.trajectories[0]?.curriculumId).toBe(7);
    expect(migrated.trajectories[0]?.enrollments).toEqual([
      {
        id: "e1",
        year: 2022,
        term: 1,
        position: 3,
        status: "APPROVED",
        courseCode: "PSI4121",
      },
      {
        id: "e2",
        year: 2022,
        term: 1,
        position: 4,
        status: "FAILED",
        courseCode: null,
      },
      {
        id: "e3",
        year: 2022,
        term: 3,
        position: 1,
        status: "PENDING",
        courseCode: null,
      },
    ]);
  });

  test("a trajectory whose program has no current curriculum is kept without a curriculum", async () => {
    const persisted = {
      trajectories: [
        {
          id: "t1",
          curriculumPath: "udp/derecho",
          entry: { year: 2022, term: 1 },
          enrollments: [],
        },
        {
          id: "t2",
          curriculumPath: "udp/arquitectura",
          entry: { year: 2020, term: 1 },
          enrollments: [
            {
              id: "e1",
              year: 2020,
              term: 1,
              position: 1,
              status: "APPROVED",
              courseId: 1,
            },
          ],
        },
      ],
      activeTrajectoryId: "t2",
    };

    expect(
      await migrateTrajectoryState(persisted, 3, findCurrentCurriculumId),
    ).toEqual({
      trajectories: [
        {
          id: "t1",
          curriculumId: 41,
          entry: { year: 2022, term: 1 },
          enrollments: [],
        },
        {
          id: "t2",
          curriculumId: null,
          entry: { year: 2020, term: 1 },
          enrollments: [
            {
              id: "e1",
              year: 2020,
              term: 1,
              position: 1,
              status: "APPROVED",
              courseCode: null,
            },
          ],
        },
      ],
      activeTrajectoryId: "t2",
    });
  });

  test("a version 2 state is renamed to trajectories and migrated to version 4", async () => {
    const persisted = {
      curriculums: [
        {
          id: "c1",
          path: "udp/derecho",
          year: 2022,
          term: 3,
          enrolledCourses: [
            {
              id: "e1",
              year: 2023,
              term: 1,
              position: 2,
              status: "APPROVED",
              courseId: 177,
            },
          ],
        },
      ],
      activeCurriculumId: "c1",
    };

    expect(
      await migrateTrajectoryState(persisted, 2, findCurrentCurriculumId),
    ).toEqual({
      trajectories: [
        {
          id: "c1",
          curriculumId: 41,
          entry: { year: 2022, term: 3 },
          enrollments: [
            {
              id: "e1",
              year: 2023,
              term: 1,
              position: 2,
              status: "APPROVED",
              courseCode: "DER06111",
            },
          ],
        },
      ],
      activeTrajectoryId: "c1",
    });
  });

  test("a version 1 state gets an active trajectory, second terms and calendar years before reaching version 4", async () => {
    const persisted = {
      curriculums: [
        {
          id: "c1",
          path: "udp/derecho",
          year: 2021,
          term: 2,
          enrolledCourses: [
            {
              id: "e1",
              year: 1,
              term: 2,
              position: 1,
              status: "APPROVED",
              courseId: 177,
            },
            {
              id: "e2",
              year: 2023,
              term: 1,
              position: 2,
              status: "PENDING",
              courseId: 178,
            },
          ],
        },
        {
          id: "c2",
          path: "udp/psicologia",
          year: 2020,
          term: 1,
          enrolledCourses: [],
        },
      ],
      activeCurriculumId: null,
    };

    expect(
      await migrateTrajectoryState(persisted, 1, findCurrentCurriculumId),
    ).toEqual({
      trajectories: [
        {
          id: "c1",
          curriculumId: 41,
          entry: { year: 2021, term: 3 },
          enrollments: [
            {
              id: "e1",
              year: 2021,
              term: 2,
              position: 1,
              status: "APPROVED",
              courseCode: "DER06111",
            },
            {
              id: "e2",
              year: 2023,
              term: 1,
              position: 2,
              status: "PENDING",
              courseCode: "DER06112",
            },
          ],
        },
        {
          id: "c2",
          curriculumId: 7,
          entry: { year: 2020, term: 1 },
          enrollments: [],
        },
      ],
      activeTrajectoryId: "c1",
    });
  });

  test("a failed curriculum lookup rejects the migration and leaves the persisted state as it was", async () => {
    const persisted = {
      curriculums: [
        {
          id: "c1",
          path: "udp/derecho",
          year: 2021,
          term: 2,
          enrolledCourses: [
            {
              id: "e1",
              year: 1,
              term: 2,
              position: 1,
              status: "APPROVED",
              courseId: 177,
            },
          ],
        },
      ],
      activeCurriculumId: null,
    };
    const before = structuredClone(persisted);
    const failingLookup = async () => {
      throw new Error("Failed to fetch");
    };

    await expect(
      migrateTrajectoryState(persisted, 1, failingLookup),
    ).rejects.toThrow("Failed to fetch");
    expect(persisted).toEqual(before);
  });
});
