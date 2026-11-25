import { describe, expect, test } from "bun:test";
import { crs } from "@/test/ids";
import type { Trajectory } from "@/types/trajectory";
import { course, curriculumOf } from "@/utils/trajectory/test-helpers";
import type { Table } from "@/utils/trajectory-file/columns";
import { exportTrajectory } from "@/utils/trajectory-file/export";

const curriculum = {
  ...curriculumOf([
    {
      ...course(1, { slots: [{ programYear: 1, term: 3, position: 0 }] }),
      code: "MAT102",
      name: "Cálculo II",
    },
    course(2),
  ]),
  versionName: "v4.0",
};

const trajectory: Trajectory = {
  id: "t1",
  curriculumPath: "uch/quimica-y-farmacia/2022",
  entry: { year: 2023, term: 1 },
  gradingScale: { min: 1, max: 7, passing: 4 },
  enrollments: [
    {
      id: "x",
      courseId: crs(1),
      year: 2023,
      term: 3,
      position: 0,
      status: "FAILED",
      courseGrade: 3.4,
    },
    {
      id: "y",
      courseId: crs(1),
      year: 2024,
      term: 3,
      position: 1,
      status: "APPROVED",
      assessments: [
        {
          kind: "GROUP",
          id: "g",
          name: "Controles",
          weight: 30,
          droppedCount: 1,
          assessments: [
            {
              kind: "SINGLE",
              id: "s1",
              name: "Control 1",
              weight: null,
              grade: 5.5,
            },
            {
              kind: "SINGLE",
              id: "s2",
              name: "Control 2",
              weight: null,
              grade: 4.8,
            },
          ],
        },
        {
          kind: "SINGLE",
          id: "s3",
          name: "Examen",
          weight: 70,
          grade: null,
        },
      ],
    },
  ],
};

function sheet(tables: Table[], name: string) {
  return tables.find((table) => table.name === name)?.rows;
}

describe("exportTrajectory", () => {
  const tables = exportTrajectory(trajectory, curriculum);

  test("orders the sheets with the README first", () => {
    expect(tables.map(({ name }) => name)).toEqual([
      "README",
      "trajectory",
      "courses",
      "enrollments",
      "assessments",
    ]);
  });

  test("writes the curriculum, the entry and the grading scale", () => {
    expect(sheet(tables, "trajectory")).toEqual([
      [
        "format_version",
        "institution",
        "program",
        "effective_year",
        "curriculum_version",
        "entry_year",
        "entry_term",
        "grade_min",
        "grade_max",
        "grade_passing",
      ],
      [1, "uch", "quimica-y-farmacia", 2022, "v4.0", 2023, 1, 1, 7, 4],
    ]);
  });

  test("lists every course of the curriculum, enrolled or not", () => {
    expect(sheet(tables, "courses")).toEqual([
      [
        "course_id",
        "course_code",
        "course_name",
        "program_year",
        "term",
        "credits",
      ],
      ["crs_00000001", "MAT102", "Cálculo II", 1, 3, 6],
      ["crs_00000002", "C2", "Course 2", null, null, 6],
    ]);
  });

  test("writes one row per enrollment, a retake included", () => {
    expect(sheet(tables, "enrollments")).toEqual([
      [
        "enrollment_id",
        "course_id",
        "course_code",
        "course_name",
        "year",
        "term",
        "position",
        "status",
        "final_grade",
      ],
      ["e1", "crs_00000001", "MAT102", "Cálculo II", 2023, 3, 0, "FAILED", 3.4],
      [
        "e2",
        "crs_00000001",
        "MAT102",
        "Cálculo II",
        2024,
        3,
        1,
        "APPROVED",
        null,
      ],
    ]);
  });

  test("flattens the grading scheme, referencing groups by parent_id", () => {
    expect(sheet(tables, "assessments")).toEqual([
      [
        "enrollment_id",
        "assessment_id",
        "parent_id",
        "kind",
        "name",
        "weight",
        "grade",
        "dropped_count",
      ],
      ["e2", "a1", null, "GROUP", "Controles", 30, null, 1],
      ["e2", "a2", "a1", "SINGLE", "Control 1", null, 5.5, null],
      ["e2", "a3", "a1", "SINGLE", "Control 2", null, 4.8, null],
      ["e2", "a4", null, "SINGLE", "Examen", 70, null, null],
    ]);
  });

  test("describes each column in the README with this curriculum's values", () => {
    const readme = sheet(tables, "README") ?? [];
    const header = readme.findIndex((row) => row[0] === "sheet");

    expect(readme[header]).toEqual([
      "sheet",
      "column",
      "required",
      "allowed values",
      "description",
    ]);
    expect(
      readme.find((row) => row[0] === "enrollments" && row[1] === "term"),
    ).toEqual([
      "enrollments",
      "term",
      "sí",
      "1, 2, 3 o 4",
      "Periodo del año: 1 primer semestre, 2 invierno, 3 segundo semestre, 4 verano.",
    ]);
    expect(
      readme.find((row) => row[0] === "assessments" && row[1] === "kind")?.[3],
    ).toBe("SINGLE o GROUP");
  });
});
