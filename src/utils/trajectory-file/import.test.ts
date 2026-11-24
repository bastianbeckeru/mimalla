import { describe, expect, test } from "bun:test";
import { crs } from "@/test/ids";
import type { Assessment, Enrollment, Trajectory } from "@/types/trajectory";
import { MAX_ENROLLMENTS_PER_PERIOD } from "@/utils/trajectory/edits";
import { course, curriculumOf } from "@/utils/trajectory/test-helpers";
import type { Cell, Table } from "@/utils/trajectory-file/columns";
import { exportTrajectory } from "@/utils/trajectory-file/export";
import {
  importTrajectory,
  readCurriculumPath,
} from "@/utils/trajectory-file/import";
import { readWorkbook, writeWorkbook } from "@/utils/trajectory-file/workbook";

const curriculum = {
  ...curriculumOf([
    { ...course(1), name: "Cálculo II" },
    course(2),
    course(3, { duration: 2 }),
    course(9, { isElective: true }),
  ]),
  versionName: "v4.0",
};
const curriculumPath = "uch/quimica-y-farmacia/2022";
const target = { curriculumPath, curriculum };

const trajectory: Trajectory = {
  id: "t1",
  curriculumPath,
  entry: { year: 2023, term: 1 },
  gradingScale: { min: 1, max: 7, passing: 4 },
  enrollments: [
    {
      id: "x",
      courseId: crs(1),
      year: 2023,
      term: 1,
      position: 0,
      status: "FAILED",
      courseGrade: 3.4,
    },
    {
      id: "y",
      courseId: crs(3),
      year: 2023,
      term: 3,
      position: 0,
      status: "PENDING",
    },
    {
      id: "z",
      courseId: crs(1),
      year: 2024,
      term: 1,
      position: 2,
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
        { kind: "SINGLE", id: "s3", name: "Examen", weight: 70, grade: null },
      ],
    },
  ],
};

const exported = exportTrajectory(trajectory, curriculum);

function withoutIds(assessments: Assessment[] = []): unknown[] {
  return assessments.map(({ id: _, ...assessment }) =>
    assessment.kind === "GROUP"
      ? { ...assessment, assessments: withoutIds(assessment.assessments) }
      : assessment,
  );
}

function comparable(enrollments: Enrollment[]) {
  return enrollments.map(({ id: _, assessments, ...enrollment }) => ({
    ...enrollment,
    ...(assessments ? { assessments: withoutIds(assessments) } : {}),
  }));
}

function withCell(
  tables: Table[],
  sheet: string,
  row: number,
  column: string,
  value: Cell,
) {
  return tables.map((table) => {
    if (table.name !== sheet) return table;
    const index = table.rows[0]?.indexOf(column) ?? -1;
    return {
      ...table,
      rows: table.rows.map((cells, rowIndex) =>
        rowIndex === row + 1
          ? cells.map((cell, cellIndex) => (cellIndex === index ? value : cell))
          : cells,
      ),
    };
  });
}

function withRows(tables: Table[], sheet: string, rows: Cell[][]) {
  return tables.map((table) =>
    table.name === sheet ? { ...table, rows: [...table.rows, ...rows] } : table,
  );
}

function errorsOf(tables: Table[]) {
  const result = importTrajectory(tables, target);
  return result.ok ? [] : result.errors;
}

describe("importTrajectory", () => {
  test("restores the exported trajectory, with new ids", () => {
    const result = importTrajectory(exported, target);

    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(result.entry).toEqual(trajectory.entry);
    expect(result.gradingScale).toEqual(trajectory.gradingScale);
    expect(comparable(result.enrollments)).toEqual(
      comparable(trajectory.enrollments),
    );
    expect(result.enrollments.map(({ id }) => id)).not.toContain("x");
    expect(result.warnings).toEqual([]);
  });

  test("restores the trajectory through an .xlsx file", async () => {
    const tables = await readWorkbook(await writeWorkbook(exported));

    const result = importTrajectory(tables, target);

    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(comparable(result.enrollments)).toEqual(
      comparable(trajectory.enrollments),
    );
  });

  test("ignores the README, the courses sheet and the course names", () => {
    const tables = withCell(
      exported.filter(({ name }) => name !== "README" && name !== "courses"),
      "enrollments",
      0,
      "course_name",
      "Otro nombre",
    );

    expect(importTrajectory(tables, target).ok).toBe(true);
  });

  test("places an enrollment without a position at the end of its period", () => {
    const tables = withRows(exported, "enrollments", [
      ["e9", crs(2), null, null, 2023, 1, null, "PENDING", null],
    ]);

    const result = importTrajectory(tables, target);

    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(
      result.enrollments.find(({ courseId }) => courseId === crs(2))?.position,
    ).toBe(1);
  });

  test("keeps the positions of a period listed out of order", () => {
    const tables = withRows(exported, "enrollments", [
      ["e8", crs(9), null, null, 2025, 1, 1, "PENDING", null],
      ["e9", crs(2), null, null, 2025, 1, 0, "PENDING", null],
    ]);

    const result = importTrajectory(tables, target);

    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    const positionOf = (courseId: string) =>
      result.enrollments.find((e) => e.courseId === courseId && e.year === 2025)
        ?.position;
    expect([positionOf(crs(2)), positionOf(crs(9))]).toEqual([0, 1]);
  });

  test("warns when the curriculum version changed", () => {
    const result = importTrajectory(exported, {
      ...target,
      curriculum: { ...curriculum, versionName: "v5.0" },
    });

    expect(result.warnings).toEqual([
      {
        sheet: "trajectory",
        row: 2,
        message:
          "El archivo es de la versión v4.0 de la malla y ahora es la v5.0. Tu progreso se mantiene.",
      },
    ]);
    expect(result.ok).toBe(true);
  });

  describe("rejects the whole file", () => {
    test("when a sheet is missing", () => {
      expect(
        errorsOf(exported.filter(({ name }) => name !== "enrollments")),
      ).toEqual([
        { sheet: "enrollments", row: null, message: "Falta la hoja." },
      ]);
    });

    test("when a column is missing", () => {
      const tables = exported.map((table) =>
        table.name === "assessments"
          ? {
              ...table,
              rows: table.rows.map((cells) => cells.slice(0, -1)),
            }
          : table,
      );

      expect(errorsOf(tables)).toEqual([
        {
          sheet: "assessments",
          row: 1,
          message: "Falta la columna dropped_count.",
        },
      ]);
    });

    test("when the file is of another curriculum", () => {
      expect(
        errorsOf(withCell(exported, "trajectory", 0, "effective_year", 2025)),
      ).toEqual([
        {
          sheet: "trajectory",
          row: 2,
          message:
            "El archivo es de la malla uch/quimica-y-farmacia/2025, no de uch/quimica-y-farmacia/2022.",
        },
      ]);
    });

    test("when the format version is unknown", () => {
      expect(
        errorsOf(withCell(exported, "trajectory", 0, "format_version", 2)),
      ).toEqual([
        {
          sheet: "trajectory",
          row: 2,
          message: "format_version debe ser 1.",
        },
      ]);
    });

    test("when the grading scale is invalid", () => {
      expect(
        errorsOf(withCell(exported, "trajectory", 0, "grade_passing", 8)),
      ).toEqual([
        {
          sheet: "trajectory",
          row: 2,
          message:
            "La escala de notas no es válida: grade_min debe ser menor que grade_max y grade_passing debe quedar entre ambas.",
        },
      ]);
    });

    test("when a course is not in the curriculum, naming it", () => {
      expect(
        errorsOf(withCell(exported, "enrollments", 1, "course_id", "crs_nope")),
      ).toEqual([
        {
          sheet: "enrollments",
          row: 3,
          message: "El course_id crs_nope no está en la malla.",
        },
      ]);
    });

    test("when a term is not valid for the curriculum", () => {
      expect(errorsOf(withCell(exported, "enrollments", 0, "term", 5))).toEqual(
        [
          {
            sheet: "enrollments",
            row: 2,
            message: "term debe ser 1, 2, 3 o 4.",
          },
        ],
      );
    });

    test("when a required cell is empty or of the wrong kind", () => {
      expect(
        errorsOf(
          withCell(
            withCell(exported, "enrollments", 0, "status", null),
            "enrollments",
            1,
            "year",
            "dos mil",
          ),
        ),
      ).toEqual([
        { sheet: "enrollments", row: 2, message: "Falta status." },
        {
          sheet: "enrollments",
          row: 3,
          message: "year debe ser un número entero desde 0.",
        },
      ]);
    });

    test("when an id is duplicated", () => {
      expect(
        errorsOf(withCell(exported, "enrollments", 1, "enrollment_id", "e1")),
      ).toContainEqual({
        sheet: "enrollments",
        row: 3,
        message: "El enrollment_id e1 está repetido.",
      });
    });

    test("when a grade is outside the grading scale", () => {
      expect(
        errorsOf(withCell(exported, "assessments", 1, "grade", 8)),
      ).toEqual([
        {
          sheet: "assessments",
          row: 3,
          message: "grade debe estar entre 1 y 7.",
        },
      ]);
    });

    test("when an assessment references an unknown enrollment or group", () => {
      expect(
        errorsOf(
          withCell(
            withCell(exported, "assessments", 1, "parent_id", "a9"),
            "assessments",
            3,
            "enrollment_id",
            "e9",
          ),
        ),
      ).toEqual([
        {
          sheet: "assessments",
          row: 3,
          message: "El parent_id a9 no es un grupo de la misma inscripción.",
        },
        {
          sheet: "assessments",
          row: 5,
          message: "El enrollment_id e9 no está en la hoja enrollments.",
        },
      ]);
    });

    test("only once when an invalid group has assessments in it", () => {
      expect(
        errorsOf(withCell(exported, "assessments", 0, "weight", 120)),
      ).toEqual([
        {
          sheet: "assessments",
          row: 2,
          message: "weight debe ser un número de 0 a 100.",
        },
      ]);
    });

    test("when a group references itself through its parents", () => {
      expect(
        errorsOf(withCell(exported, "assessments", 0, "parent_id", "a1")),
      ).toContainEqual({
        sheet: "assessments",
        row: 2,
        message: "El grupo a1 se contiene a sí mismo.",
      });
    });

    test(`when assessments nest deeper than 3 levels`, () => {
      const tables = withRows(exported, "assessments", [
        ["e3", "b1", null, "GROUP", "1", null, null, null],
        ["e3", "b2", "b1", "GROUP", "2", null, null, null],
        ["e3", "b3", "b2", "GROUP", "3", null, null, null],
        ["e3", "b4", "b3", "SINGLE", "4", null, null, null],
      ]);

      expect(errorsOf(tables)).toEqual([
        {
          sheet: "assessments",
          row: 8,
          message: "Las evaluaciones se anidan hasta 3 niveles.",
        },
        {
          sheet: "assessments",
          row: 9,
          message: "Las evaluaciones se anidan hasta 3 niveles.",
        },
      ]);
    });

    test("when weights in one level sum to more than 100", () => {
      expect(
        errorsOf(withCell(exported, "assessments", 3, "weight", 80)),
      ).toEqual([
        {
          sheet: "assessments",
          row: 2,
          message: "Los pesos de este nivel suman 110%, más de 100%.",
        },
      ]);
    });

    test("when an enrollment breaks the edit rules", () => {
      const fullPeriod = Array.from(
        { length: MAX_ENROLLMENTS_PER_PERIOD },
        (_, index): Cell[] => [
          `f${index}`,
          crs(9),
          null,
          null,
          2026,
          1,
          null,
          "PENDING",
          null,
        ],
      );
      const tables = withRows(exported, "enrollments", [
        ...fullPeriod,
        ["d1", crs(2), null, null, 2026, 1, null, "PENDING", null],
        ["d2", crs(1), null, null, 2024, 1, null, "PENDING", null],
      ]);

      expect(errorsOf(tables)).toEqual([
        {
          sheet: "enrollments",
          row: 15,
          message: `El periodo 2026-1 tendría más de ${MAX_ENROLLMENTS_PER_PERIOD} cursos.`,
        },
        {
          sheet: "enrollments",
          row: 16,
          message: "Cálculo II ya está en el periodo 2024-1.",
        },
      ]);
    });
  });
});

describe("readCurriculumPath", () => {
  test("reads the curriculum the file names", () => {
    expect(readCurriculumPath(exported)).toBe(curriculumPath);
  });

  test("is null for a file without a trajectory sheet", () => {
    expect(readCurriculumPath([])).toBeNull();
  });
});
