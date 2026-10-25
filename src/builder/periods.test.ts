import { describe, expect, test } from "bun:test";
import { createDraft } from "@/builder/draft";
import { getPeriodLabel } from "@/builder/periods";

describe("a new semester curriculum", () => {
  const { curriculum } = createDraft("semester");

  test("has 5 program years of first and second semesters", () => {
    expect(curriculum.periods).toEqual([
      { programYear: 1, term: 1 },
      { programYear: 1, term: 3 },
      { programYear: 2, term: 1 },
      { programYear: 2, term: 3 },
      { programYear: 3, term: 1 },
      { programYear: 3, term: 3 },
      { programYear: 4, term: 1 },
      { programYear: 4, term: 3 },
      { programYear: 5, term: 1 },
      { programYear: 5, term: 3 },
    ]);
  });

  test("labels its columns in Spanish", () => {
    expect(
      curriculum.periods
        .slice(0, 2)
        .map((period) => getPeriodLabel(curriculum.termSystem, period)),
    ).toEqual(["Año 1 · Primer semestre", "Año 1 · Segundo semestre"]);
  });

  test("starts without courses or details", () => {
    expect(curriculum.courses).toEqual([]);
    expect(curriculum.programName).toBe("");
    expect(curriculum.effectiveYear).toBeNull();
  });
});
