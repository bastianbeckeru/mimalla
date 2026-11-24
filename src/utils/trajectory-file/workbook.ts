import type { Cell, Table } from "@/utils/trajectory-file/columns";

const MAX_COLUMN_WIDTH = 60;
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04];

function loadSheetJs() {
  return import("xlsx");
}

function getColumnWidths(rows: Cell[][]) {
  const widths: number[] = [];
  for (const row of rows)
    row.forEach((cell, index) => {
      widths[index] = Math.max(
        widths[index] ?? 0,
        Math.min(String(cell ?? "").length + 2, MAX_COLUMN_WIDTH),
      );
    });
  return Array.from(widths, (wch) => ({ wch: wch ?? 10 }));
}

export async function writeWorkbook(tables: Table[]) {
  const XLSX = await loadSheetJs();
  const workbook = XLSX.utils.book_new();
  for (const { name, rows } of tables) {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    if (name !== "README") sheet["!cols"] = getColumnWidths(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }
  return XLSX.write(workbook, {
    type: "array",
    bookType: "xlsx",
    compression: true,
  }) as ArrayBuffer;
}

function toCell(value: unknown): Cell {
  if (typeof value === "number" || typeof value === "string") return value;
  if (value === null || value === undefined) return null;
  return String(value);
}

function trimRow(row: Cell[]) {
  const end = row.findLastIndex((cell) => cell !== null && cell !== "");
  return row.slice(0, end + 1);
}

export async function readWorkbook(
  data: ArrayBuffer | Uint8Array,
): Promise<Table[]> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (ZIP_SIGNATURE.some((byte, index) => bytes[index] !== byte))
    throw new Error("The file is not an .xlsx workbook");

  const XLSX = await loadSheetJs();
  const workbook = XLSX.read(bytes, { type: "array" });
  return workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const rows = sheet
      ? XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          defval: null,
          raw: true,
          blankrows: true,
        })
      : [];
    return { name, rows: rows.map((row) => trimRow(row.map(toCell))) };
  });
}
