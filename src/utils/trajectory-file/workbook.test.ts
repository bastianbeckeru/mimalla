import { expect, test } from "bun:test";
import { crs } from "@/test/ids";
import type { Table } from "@/utils/trajectory-file/columns";
import { readWorkbook, writeWorkbook } from "@/utils/trajectory-file/workbook";

const tables: Table[] = [
  { name: "README", rows: [["Progreso de Mi Malla"], [], ["sheet", "column"]] },
  {
    name: "enrollments",
    rows: [
      ["enrollment_id", "course_id", "year", "final_grade"],
      ["e1", crs(1), 2023, 3.4],
      ["e2", crs(1), 2024, null],
    ],
  },
];

test("reads back the sheets it writes, in order, with numeric cells and without trailing empty cells", async () => {
  const read = await readWorkbook(await writeWorkbook(tables));

  expect(read).toEqual([
    {
      name: "README",
      rows: [["Progreso de Mi Malla"], [], ["sheet", "column"]],
    },
    {
      name: "enrollments",
      rows: [
        ["enrollment_id", "course_id", "year", "final_grade"],
        ["e1", "crs_00000001", 2023, 3.4],
        ["e2", "crs_00000001", 2024],
      ],
    },
  ]);
});

test("rejects a file that is not a spreadsheet", async () => {
  expect(
    readWorkbook(new TextEncoder().encode("\u0000\u0001 not a workbook")),
  ).rejects.toThrow();
});
