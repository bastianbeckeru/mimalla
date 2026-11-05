import { describe, expect, test } from "bun:test";
import type { Assessment } from "@/types/trajectory";
import {
  convertToGroup,
  copyScheme,
  flattenScheme,
  getDropProjection,
  getSchemeSlots,
  getVisibleRows,
  getWeightIssue,
  moveAssessment,
} from "@/utils/grading-scheme";

function single(
  id: string,
  weight: number | null = null,
  grade: number | null = null,
) {
  return {
    kind: "SINGLE",
    id,
    name: id,
    weight,
    grade,
  } satisfies Assessment;
}

function group(
  id: string,
  assessments: Assessment[],
  weight: number | null = null,
) {
  return {
    kind: "GROUP",
    id,
    name: id,
    weight,
    assessments,
    droppedCount: 0,
  } satisfies Assessment;
}

// Each assessment's id, indented two spaces per level.
function outline(assessments: Assessment[] | null) {
  return flattenScheme(assessments ?? []).map(
    ({ assessment, depth }) => `${"  ".repeat(depth)}${assessment.id}`,
  );
}

describe("moveAssessment", () => {
  test("moves an assessment into a group", () => {
    const scheme = [group("controls", [single("c1")]), single("c2")];

    expect(
      outline(moveAssessment(scheme, "c2", { parentId: "controls", index: 1 })),
    ).toEqual(["controls", "  c1", "  c2"]);
  });

  test("moves a group with everything in it", () => {
    const scheme = [single("exam"), group("controls", [single("c1")])];

    expect(
      outline(moveAssessment(scheme, "controls", { parentId: null, index: 0 })),
    ).toEqual(["controls", "  c1", "exam"]);
  });

  test("does not move a group inside itself", () => {
    const scheme = [group("tests", [group("first", [single("t1")])])];

    expect(
      moveAssessment(scheme, "tests", { parentId: "first", index: 0 }),
    ).toBeNull();
  });

  test("does not go deeper than three levels", () => {
    const scheme = [
      group("tests", [group("first", [single("t1")])]),
      group("controls", [single("c1")]),
    ];

    expect(
      moveAssessment(scheme, "controls", { parentId: "first", index: 0 }),
    ).toBeNull();
    expect(
      moveAssessment(scheme, "controls", { parentId: "tests", index: 0 }),
    ).not.toBeNull();
  });
});

describe("copyScheme", () => {
  test("keeps the structure and weights without the grades", () => {
    const copy = copyScheme([group("controls", [single("c1", 50, 6)], 25)]);
    const controls = copy[0];

    expect(controls?.kind === "GROUP" && controls.weight).toBe(25);
    expect(controls?.kind === "GROUP" && controls.assessments[0]).toMatchObject(
      { weight: 50, grade: null },
    );
    expect(controls?.id).not.toBe("controls");
  });
});

describe("getWeightIssue", () => {
  test("accepts weights that add up to 100%", () => {
    expect(getWeightIssue([single("a", 40), single("b", 60)])).toBeNull();
  });

  test("tells the sum when the weights do not add up to 100%", () => {
    expect(getWeightIssue([single("a", 40), single("b", 50)])).toBe(90);
  });

  test("accepts less than 100% when some assessments share the rest", () => {
    expect(getWeightIssue([single("a", 40), single("b")])).toBeNull();
    expect(getWeightIssue([single("a", 120), single("b")])).toBe(120);
  });
});

describe("moveAssessment below a single assessment", () => {
  test("turns it into a group that keeps its place, name and weight", () => {
    const moved = moveAssessment(
      [single("exam", 40), single("extra", 60)],
      "extra",
      { parentId: "exam", index: 0 },
    );

    expect(moved).toEqual([
      {
        kind: "GROUP",
        id: "exam",
        name: "exam",
        weight: 40,
        droppedCount: 0,
        assessments: [single("extra", 60)],
      },
    ]);
  });

  test("keeps its grade in an assessment of the new group", () => {
    const moved = moveAssessment(
      [single("exam", 40, 6), single("extra")],
      "extra",
      { parentId: "exam", index: 0 },
    );

    const exam = moved?.[0];
    if (exam?.kind !== "GROUP") throw new Error("Expected a group");
    expect(exam.assessments).toMatchObject([
      { kind: "SINGLE", name: "exam", weight: null, grade: 6 },
      { id: "extra" },
    ]);
    expect(exam.assessments[0]?.id).not.toBe("exam");
  });

  test("leaves it alone when that goes past three levels", () => {
    const scheme = [group("a", [group("b", [single("c")])]), single("d")];

    expect(moveAssessment(scheme, "d", { parentId: "c", index: 0 })).toBeNull();
  });
});

describe("getDropProjection", () => {
  const scheme = [
    group("controls", [single("c1"), single("c2")]),
    single("exam"),
    single("extra"),
  ];
  const rows = flattenScheme(scheme);

  test("drops at the same level by default", () => {
    // Without "extra": controls, c1, c2, exam. The gap before "exam".
    expect(getDropProjection(rows, "extra", 3, 0)).toEqual({
      parentId: null,
      index: 1,
      depth: 0,
    });
  });

  test("drops into the group above when dragged to the right", () => {
    expect(getDropProjection(rows, "extra", 3, 1)).toEqual({
      parentId: "controls",
      index: 2,
      depth: 1,
    });
  });

  test("becomes a group's first assessment between it and its first one", () => {
    expect(getDropProjection(rows, "extra", 1, -2)).toEqual({
      parentId: "controls",
      index: 0,
      depth: 1,
    });
  });

  test("stays beside a single assessment when dragged one level", () => {
    expect(getDropProjection(rows, "extra", 4, 1)).toMatchObject({
      parentId: null,
      depth: 0,
    });
  });

  test("goes below a single assessment when dragged two levels", () => {
    expect(getDropProjection(rows, "extra", 4, 2)).toEqual({
      parentId: "exam",
      index: 0,
      depth: 1,
    });
  });

  test("goes no further than one level below a single assessment", () => {
    expect(getDropProjection(rows, "extra", 4, 9)).toMatchObject({
      parentId: "exam",
      depth: 1,
    });
  });

  test("cannot go below a single assessment on the last level", () => {
    const deep = flattenScheme([
      group("a", [group("b", [single("c")])]),
      single("d"),
    ]);

    expect(getDropProjection(deep, "d", 3, 9)).toMatchObject({
      parentId: "b",
      depth: 2,
    });
  });

  test("keeps a group within three levels", () => {
    const nested = flattenScheme([
      group("tests", [group("first", [single("t1")])]),
      group("controls", [single("c1")]),
    ]);

    // Right after t1, controls can go into tests but not into first.
    expect(getDropProjection(nested, "controls", 3, 5)).toEqual({
      parentId: "tests",
      index: 1,
      depth: 1,
    });
  });
});

describe("getVisibleRows", () => {
  const rows = flattenScheme([
    group("a", [group("b", [single("c")]), single("d")]),
    single("e"),
  ]);
  const visibleIds = (collapsed: string[]) =>
    getVisibleRows(rows, new Set(collapsed)).map(
      ({ assessment }) => assessment.id,
    );

  test("keeps every row when nothing is collapsed", () => {
    expect(visibleIds([])).toEqual(["a", "b", "c", "d", "e"]);
  });

  test("hides every descendant of a collapsed group", () => {
    expect(visibleIds(["a"])).toEqual(["a", "e"]);
  });

  test("keeps the siblings after a nested collapsed group", () => {
    expect(visibleIds(["b"])).toEqual(["a", "b", "d", "e"]);
  });
});

describe("getSchemeSlots", () => {
  const slots = (scheme: Assessment[], collapsed: string[] = []) => {
    const collapsedIds = new Set(collapsed);
    return getSchemeSlots(
      getVisibleRows(flattenScheme(scheme), collapsedIds),
      collapsedIds,
    ).map((slot) =>
      slot.kind === "ROW"
        ? slot.row.assessment.id
        : `+${slot.group.assessment.id}`,
    );
  };

  test("adds to a group after its last row", () => {
    expect(slots([group("a", [single("b")]), single("c")])).toEqual([
      "a",
      "b",
      "+a",
      "c",
    ]);
  });

  test("closes nested groups from the inside out", () => {
    expect(slots([group("a", [group("b", [single("c")])])])).toEqual([
      "a",
      "b",
      "c",
      "+b",
      "+a",
    ]);
  });

  test("adds to an empty group", () => {
    expect(slots([group("a", [])])).toEqual(["a", "+a"]);
  });

  test("does not add to a collapsed group", () => {
    expect(slots([group("a", [single("b")]), single("c")], ["a"])).toEqual([
      "a",
      "c",
    ]);
  });
});

describe("convertToGroup", () => {
  test("keeps the name and weight, and leaves an ungraded group empty", () => {
    const [converted] = convertToGroup([single("a", 40)], "a") ?? [];

    expect(converted).toMatchObject({
      kind: "GROUP",
      name: "a",
      weight: 40,
      assessments: [],
    });
  });

  test("keeps the grade inside the group", () => {
    const [converted] = convertToGroup([single("a", 40, 6)], "a") ?? [];

    expect(converted).toMatchObject({
      assessments: [{ kind: "SINGLE", name: "a", weight: null, grade: 6 }],
    });
  });

  test("leaves groups alone", () => {
    expect(convertToGroup([group("a", [])], "a")).toBeNull();
  });

  test("needs a level left below it", () => {
    const scheme = [group("a", [group("b", [single("c")])])];

    expect(convertToGroup(scheme, "c")).toBeNull();
    expect(convertToGroup([group("a", [single("b")])], "b")).not.toBeNull();
  });
});
