import { describe, expect, test } from "bun:test";
import { crs } from "@/test/ids";
import type { Assessment, Enrollment } from "@/types/trajectory";
import { course, curriculumOf } from "@/utils/trajectory/test-helpers";
import { summarizeImport } from "@/utils/trajectory-file/summary";

const curriculum = curriculumOf([
  { ...course(1), name: "Cálculo II" },
  course(2),
  course(3),
]);

function enrollment(
  id: string,
  courseNumber: number,
  changes: Partial<Enrollment> = {},
): Enrollment {
  return {
    id,
    courseId: crs(courseNumber),
    year: 2024,
    term: 1,
    position: courseNumber,
    status: "PENDING",
    ...changes,
  };
}

const scheme: Assessment[] = [
  {
    kind: "GROUP",
    id: "g",
    name: "Controles",
    weight: 30,
    droppedCount: 0,
    assessments: [
      { kind: "SINGLE", id: "s1", name: "C1", weight: null, grade: 5 },
      { kind: "SINGLE", id: "s2", name: "C2", weight: null, grade: 6 },
    ],
  },
  { kind: "SINGLE", id: "s3", name: "Examen", weight: 70, grade: null },
];

const current = [enrollment("a", 1), enrollment("b", 2), enrollment("c", 3)];

describe("summarizeImport", () => {
  test("finds no change in the same trajectory with other ids", () => {
    expect(
      summarizeImport(
        current,
        current.map((e) => ({ ...e, id: `new-${e.id}` })),
        curriculum,
      ),
    ).toEqual({ changedCourseCount: 0, gradedCourses: [] });
  });

  test("counts the courses that change and the assessments they get", () => {
    const imported = [
      enrollment("x", 1, { status: "APPROVED", assessments: scheme }),
      enrollment("y", 2, { year: 2025 }),
      enrollment("z", 3),
    ];

    expect(summarizeImport(current, imported, curriculum)).toEqual({
      changedCourseCount: 2,
      gradedCourses: [{ name: "Cálculo II", assessmentCount: 4 }],
    });
  });

  test("counts a course that leaves the trajectory as a change", () => {
    expect(summarizeImport(current, current.slice(0, 2), curriculum)).toEqual({
      changedCourseCount: 1,
      gradedCourses: [],
    });
  });

  test("counts every enrolled course for a new trajectory", () => {
    expect(
      summarizeImport(
        null,
        [enrollment("x", 1, { assessments: scheme }), enrollment("y", 1)],
        curriculum,
      ),
    ).toEqual({
      changedCourseCount: 1,
      gradedCourses: [{ name: "Cálculo II", assessmentCount: 4 }],
    });
  });
});
