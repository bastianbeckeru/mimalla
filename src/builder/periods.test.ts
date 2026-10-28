import { describe, expect, test } from "bun:test";
import { apply } from "@/builder/apply";
import { createDraft } from "@/builder/draft";
import {
  canRemovePeriod,
  getAvailableIntensiveTerms,
  getPeriodLabel,
} from "@/builder/periods";
import type { Action } from "@/types/builder";

function draftAfter(...actions: Action[]) {
  return actions.reduce(apply, createDraft("semester"));
}

describe("a new annual curriculum", () => {
  test("has 5 program years of academic years", () => {
    const { curriculum } = createDraft("annual");

    expect(curriculum.periods).toEqual(
      [1, 2, 3, 4, 5].map((programYear) => ({ programYear, term: 1 })),
    );
    expect(getPeriodLabel("annual", { programYear: 1, term: 1 })).toBe("AÑO I");
  });
});

describe("creating a curriculum", () => {
  test("replaces the current draft with a blank one in the chosen term system and details", () => {
    const details = {
      programName: "Medicina",
      institution: "Universidad de Chile",
      effectiveYear: 2024,
      versionName: "v2",
    };
    const draft = draftAfter(
      { type: "editDetails", changes: { programName: "Derecho" } },
      {
        type: "addCourse",
        name: "Nuevo curso",
        period: { programYear: 1, term: 1 },
      },
      { type: "addPeriod" },
      { type: "createCurriculum", termSystem: "annual", details },
    );

    const blank = createDraft("annual");
    expect(draft).toEqual({
      ...blank,
      curriculum: { ...blank.curriculum, ...details },
    });
  });
});

describe("changing the term system", () => {
  test("swaps the columns for the regular terms of the new system while there are no courses", () => {
    const draft = draftAfter(
      { type: "addPeriod" },
      { type: "addIntensiveTerm", programYear: 1, term: 4 },
      { type: "setTermSystem", termSystem: "annual" },
    );

    expect(draft.curriculum.termSystem).toBe("annual");
    expect(draft.curriculum.periods).toEqual(
      [1, 2, 3, 4, 5, 6].map((programYear) => ({ programYear, term: 1 })),
    );
  });

  test("is not possible while the curriculum has courses", () => {
    const withCourse = draftAfter({
      type: "addCourse",
      name: "Nuevo curso",
      period: { programYear: 1, term: 1 },
    });

    expect(
      apply(withCourse, { type: "setTermSystem", termSystem: "annual" }),
    ).toBe(withCourse);
  });

  test("to the same system changes nothing", () => {
    const draft = draftAfter({
      type: "addIntensiveTerm",
      programYear: 1,
      term: 4,
    });

    expect(
      apply(draft, { type: "setTermSystem", termSystem: "semester" }),
    ).toBe(draft);
  });
});

describe("adding a period", () => {
  test("appends the next semester of the last program year", () => {
    const draft = draftAfter(
      { type: "removePeriod", period: { programYear: 5, term: 3 } },
      { type: "addPeriod" },
    );

    expect(draft.curriculum.periods.slice(-2)).toEqual([
      { programYear: 5, term: 1 },
      { programYear: 5, term: 3 },
    ]);
  });

  test("starts the next program year after its last regular term", () => {
    const draft = draftAfter({ type: "addPeriod" }, { type: "addPeriod" });

    expect(draft.curriculum.periods.slice(-3)).toEqual([
      { programYear: 5, term: 3 },
      { programYear: 6, term: 1 },
      { programYear: 6, term: 3 },
    ]);
  });

  test("starts the next program year after a summer", () => {
    const draft = draftAfter(
      { type: "addIntensiveTerm", programYear: 5, term: 4 },
      { type: "addPeriod" },
    );

    expect(draft.curriculum.periods.slice(-2)).toEqual([
      { programYear: 5, term: 4 },
      { programYear: 6, term: 1 },
    ]);
  });

  test("appends the next academic year in the annual system", () => {
    const draft = apply(createDraft("annual"), { type: "addPeriod" });

    expect(draft.curriculum.periods.at(-1)).toEqual({
      programYear: 6,
      term: 1,
    });
  });
});

describe("adding an intensive term", () => {
  test("places winter and summer in chronological order within the program year", () => {
    const draft = draftAfter(
      { type: "addIntensiveTerm", programYear: 1, term: 4 },
      { type: "addIntensiveTerm", programYear: 1, term: 2 },
    );

    expect(draft.curriculum.periods.slice(0, 5)).toEqual([
      { programYear: 1, term: 1 },
      { programYear: 1, term: 2 },
      { programYear: 1, term: 3 },
      { programYear: 1, term: 4 },
      { programYear: 2, term: 1 },
    ]);
  });

  test("labels winter and summer in Spanish with the program year in roman numerals", () => {
    expect(getPeriodLabel("semester", { programYear: 2, term: 2 })).toBe(
      "INVIERNO II",
    );
    expect(getPeriodLabel("annual", { programYear: 1, term: 4 })).toBe(
      "VERANO I",
    );
  });

  test("adds only summer in the annual system", () => {
    const annual = createDraft("annual");
    const draft = apply(annual, {
      type: "addIntensiveTerm",
      programYear: 1,
      term: 4,
    });

    expect(draft.curriculum.periods.slice(0, 3)).toEqual([
      { programYear: 1, term: 1 },
      { programYear: 1, term: 4 },
      { programYear: 2, term: 1 },
    ]);
    expect(
      apply(annual, { type: "addIntensiveTerm", programYear: 1, term: 2 }),
    ).toBe(annual);
  });

  test.each([
    ["a regular term", 1, 3],
    ["an unknown term", 1, 5],
    ["a missing program year", 6, 4],
  ])("rejects %s", (_, programYear, term) => {
    const draft = createDraft("semester");

    expect(apply(draft, { type: "addIntensiveTerm", programYear, term })).toBe(
      draft,
    );
  });

  test("rejects a term the program year already has", () => {
    const withSummer = draftAfter({
      type: "addIntensiveTerm",
      programYear: 1,
      term: 4,
    });

    expect(
      apply(withSummer, { type: "addIntensiveTerm", programYear: 1, term: 4 }),
    ).toBe(withSummer);
  });

  test("lists the intensive terms a program year can still get", () => {
    const { curriculum } = draftAfter({
      type: "addIntensiveTerm",
      programYear: 1,
      term: 4,
    });

    expect(getAvailableIntensiveTerms(curriculum, 1)).toEqual([2]);
    expect(getAvailableIntensiveTerms(curriculum, 2)).toEqual([2, 4]);
    expect(
      getAvailableIntensiveTerms(createDraft("annual").curriculum, 1),
    ).toEqual([4]);
  });
});

describe("removing a column", () => {
  const SECOND_SEMESTER = { programYear: 1, term: 3 };

  test("removes an empty regular column", () => {
    const draft = draftAfter({ type: "removePeriod", period: SECOND_SEMESTER });

    expect(draft.curriculum.periods.slice(0, 2)).toEqual([
      { programYear: 1, term: 1 },
      { programYear: 2, term: 1 },
    ]);
    expect(
      canRemovePeriod(createDraft("semester").curriculum, SECOND_SEMESTER),
    ).toBe(true);
  });

  test("removes an empty intensive column", () => {
    const draft = draftAfter(
      { type: "addIntensiveTerm", programYear: 1, term: 2 },
      { type: "removePeriod", period: { programYear: 1, term: 2 } },
    );

    expect(draft.curriculum.periods).toEqual(
      createDraft("semester").curriculum.periods,
    );
  });

  test("is not possible while the column has courses", () => {
    const withCourse = draftAfter({
      type: "addCourse",
      name: "Nuevo curso",
      period: SECOND_SEMESTER,
    });

    expect(canRemovePeriod(withCourse.curriculum, SECOND_SEMESTER)).toBe(false);
    expect(
      apply(withCourse, { type: "removePeriod", period: SECOND_SEMESTER }),
    ).toBe(withCourse);
  });

  test("is not possible while a course from an earlier column spans it", () => {
    const empty = createDraft("semester");
    const spanning = {
      ...empty,
      curriculum: {
        ...empty.curriculum,
        courses: [
          {
            id: 1,
            name: "Taller anual",
            code: "",
            credits: 10,
            areaId: null,
            duration: 2,
            prerequisiteIds: [],
            prerequisiteCredits: 0,
            isElective: false,
            slots: [{ programYear: 1, term: 1, position: 1 }],
          },
        ],
      },
    };

    expect(canRemovePeriod(spanning.curriculum, SECOND_SEMESTER)).toBe(false);
    expect(
      apply(spanning, { type: "removePeriod", period: SECOND_SEMESTER }),
    ).toBe(spanning);
    expect(
      canRemovePeriod(spanning.curriculum, { programYear: 2, term: 1 }),
    ).toBe(true);
  });

  test("is not possible for the only column left", () => {
    const oneColumn = draftAfter(
      ...[2, 3, 4, 5].flatMap((programYear): Action[] =>
        [1, 3].map((term) => ({
          type: "removePeriod",
          period: { programYear, term },
        })),
      ),
      { type: "removePeriod", period: SECOND_SEMESTER },
    );
    const onlyPeriod = { programYear: 1, term: 1 };

    expect(oneColumn.curriculum.periods).toEqual([onlyPeriod]);
    expect(canRemovePeriod(oneColumn.curriculum, onlyPeriod)).toBe(false);
    expect(apply(oneColumn, { type: "removePeriod", period: onlyPeriod })).toBe(
      oneColumn,
    );
  });

  test("ignores a column the curriculum does not have", () => {
    const draft = createDraft("semester");

    expect(
      apply(draft, {
        type: "removePeriod",
        period: { programYear: 1, term: 2 },
      }),
    ).toBe(draft);
  });
});

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

  test("numbers its semesters in roman numerals across program years", () => {
    expect(
      curriculum.periods
        .slice(0, 4)
        .map((period) => getPeriodLabel(curriculum.termSystem, period)),
    ).toEqual(["SEMESTRE I", "SEMESTRE II", "SEMESTRE III", "SEMESTRE IV"]);
  });

  test("starts without courses or details", () => {
    expect(curriculum.courses).toEqual([]);
    expect(curriculum.programName).toBe("");
    expect(curriculum.effectiveYear).toBeNull();
  });
});
