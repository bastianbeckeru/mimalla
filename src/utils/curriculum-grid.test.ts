import { describe, expect, test } from "bun:test";
import { getCellAt, getEmptyCells, getRowCount } from "@/utils/curriculum-grid";

const firstCell = { left: 100, top: 50, width: 128, height: 64 };
const gap = 8;

describe("getCellAt", () => {
  test("returns the cell nearest to the card's corner", () => {
    expect(
      getCellAt(
        { left: 100 + 136 * 2 + 60, top: 50 + 72 + 10 },
        { firstCell, gap, columns: 6, duration: 1 },
      ),
    ).toEqual({ column: 3, row: 2 });
  });

  test("keeps the card within the first row and column", () => {
    expect(
      getCellAt(
        { left: 0, top: 0 },
        { firstCell, gap, columns: 6, duration: 1 },
      ),
    ).toEqual({ column: 1, row: 1 });
  });

  test("keeps a long card within the last columns", () => {
    expect(
      getCellAt(
        { left: 100 + 136 * 5, top: 50 },
        { firstCell, gap, columns: 6, duration: 2 },
      ),
    ).toEqual({ column: 5, row: 1 });
  });
});

describe("getEmptyCells", () => {
  test("leaves out every cell a card covers", () => {
    const cards = [{ column: 1, row: 1, duration: 2, height: 2 }];

    expect(getEmptyCells(cards, { rows: 2, columns: 3 })).toEqual([
      { column: 3, row: 1 },
      { column: 3, row: 2 },
    ]);
  });
});

describe("getRowCount", () => {
  test("keeps a minimum of rows plus a spare one", () => {
    expect(getRowCount([])).toBe(7);
  });

  test("adds a spare row below the lowest card", () => {
    expect(getRowCount([{ column: 1, row: 8, duration: 1, height: 2 }])).toBe(
      10,
    );
  });
});
