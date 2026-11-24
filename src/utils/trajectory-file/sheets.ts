import type { CourseId, Curriculum } from "@/types/curriculum";
import type { GradingScale } from "@/types/trajectory";
import type {
  Cell,
  Column,
  ColumnType,
  SheetName,
  Table,
} from "@/utils/trajectory-file/columns";

export type ImportIssue = {
  sheet: SheetName;
  row: number | null;
  message: string;
};

export type SheetRow = { row: number; cells: Map<string, Cell> };

export type Value = string | number | null;

function isBlank(cell: Cell | undefined) {
  return cell === null || cell === undefined || String(cell).trim() === "";
}

export function readSheet(
  tables: Table[],
  sheet: SheetName,
  columns: Column[],
  issues: ImportIssue[],
): SheetRow[] | null {
  const table = tables.find(({ name }) => name === sheet);
  if (!table) {
    issues.push({ sheet, row: null, message: "Falta la hoja." });
    return null;
  }

  const [header = [], ...rows] = table.rows;
  const names = header.map((cell) => String(cell ?? "").trim());
  const missing = columns.filter(
    ({ name, isIgnored }) => !isIgnored && !names.includes(name),
  );
  for (const { name } of missing)
    issues.push({ sheet, row: 1, message: `Falta la columna ${name}.` });
  if (missing.length) return null;

  return rows.flatMap((cells, index) =>
    cells.every(isBlank)
      ? []
      : [
          {
            row: index + 2,
            cells: new Map(
              names.map((name, cellIndex) => [name, cells[cellIndex] ?? null]),
            ),
          },
        ],
  );
}

function toNumber(cell: Cell) {
  if (typeof cell === "number") return cell;
  const text = String(cell).trim().replace(",", ".");
  return text === "" ? Number.NaN : Number(text);
}

function listValues(values: readonly (string | number)[]) {
  const texts = values.map(String);
  const last = texts.pop();
  return texts.length ? `${texts.join(", ")} o ${last}` : (last ?? "");
}

export function describeType(type: ColumnType) {
  switch (type.kind) {
    case "text":
      return "texto";
    case "integer":
      return `número entero desde ${type.min}`;
    case "number":
      if (type.min !== undefined && type.max !== undefined)
        return `número de ${type.min} a ${type.max}`;
      return "número";
    case "grade":
      return "nota entre grade_min y grade_max";
    case "courseId":
      return "un course_id de la hoja courses";
    case "choice":
      return listValues(type.values);
  }
}

type CellContext = {
  curriculum: Curriculum;
  gradingScale: GradingScale | null;
};

function readValue(
  cell: Cell,
  { name, type }: Column,
  { curriculum, gradingScale }: CellContext,
): { value: Value } | { error: string } {
  switch (type.kind) {
    case "text":
      return { value: String(cell).trim() };
    case "courseId": {
      const id = String(cell).trim();
      return curriculum.courses.some((course) => course.id === id)
        ? { value: id as CourseId }
        : { error: `El course_id ${id} no está en la malla.` };
    }
    case "choice": {
      const match = type.values.find((value) =>
        typeof value === "number"
          ? value === toNumber(cell)
          : value === String(cell).trim(),
      );
      return match === undefined
        ? { error: `${name} debe ser ${listValues(type.values)}.` }
        : { value: match };
    }
    case "integer": {
      const value = toNumber(cell);
      return Number.isInteger(value) && value >= type.min
        ? { value }
        : { error: `${name} debe ser un ${describeType(type)}.` };
    }
    case "number": {
      const value = toNumber(cell);
      const isInRange =
        Number.isFinite(value) &&
        value >= (type.min ?? -Infinity) &&
        value <= (type.max ?? Infinity);
      return isInRange
        ? { value }
        : { error: `${name} debe ser un ${describeType(type)}.` };
    }
    case "grade": {
      const value = toNumber(cell);
      if (!Number.isFinite(value))
        return { error: `${name} debe ser un número.` };
      if (
        gradingScale &&
        (value < gradingScale.min || value > gradingScale.max)
      )
        return {
          error: `${name} debe estar entre ${gradingScale.min} y ${gradingScale.max}.`,
        };
      return { value };
    }
  }
}

export function readRow(
  sheet: SheetName,
  { row, cells }: SheetRow,
  columns: Column[],
  context: CellContext,
  issues: ImportIssue[],
): Record<string, Value> | null {
  const values: Record<string, Value> = {};
  let isValid = true;
  for (const column of columns) {
    if (column.isIgnored) continue;
    const cell = cells.get(column.name) ?? null;
    if (isBlank(cell)) {
      if (column.isRequired) {
        issues.push({ sheet, row, message: `Falta ${column.name}.` });
        isValid = false;
      }
      values[column.name] = null;
      continue;
    }
    const result = readValue(cell, column, context);
    if ("error" in result) {
      issues.push({ sheet, row, message: result.error });
      isValid = false;
    } else {
      values[column.name] = result.value;
    }
  }
  return isValid ? values : null;
}
