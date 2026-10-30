import { describe, expect, test } from "bun:test";
import type { Assessment } from "@/types/trajectory";
import {
  copyScheme,
  flattenScheme,
  getDropProjection,
  getWeightIssue,
  indentAssessment,
  moveAssessment,
  moveAssessmentBy,
  outdentAssessment,
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

describe("moveAssessmentBy", () => {
  test("swaps an assessment with its neighbor", () => {
    expect(
      outline(moveAssessmentBy([single("a"), single("b")], "b", -1)),
    ).toEqual(["b", "a"]);
  });

  test("stays within its group", () => {
    expect(moveAssessmentBy([single("a"), single("b")], "b", 1)).toBeNull();
  });
});

describe("indentAssessment", () => {
  test("moves an assessment into the group above it", () => {
    const scheme = [group("controls", [single("c1")]), single("c2")];

    expect(outline(indentAssessment(scheme, "c2"))).toEqual([
      "controls",
      "  c1",
      "  c2",
    ]);
  });

  test("needs a group above", () => {
    expect(indentAssessment([single("a"), single("b")], "b")).toBeNull();
  });
});

describe("outdentAssessment", () => {
  test("moves an assessment out of its group, right after it", () => {
    const scheme = [
      group("controls", [single("c1"), single("c2")]),
      single("exam"),
    ];

    expect(outline(outdentAssessment(scheme, "c1"))).toEqual([
      "controls",
      "  c2",
      "c1",
      "exam",
    ]);
  });

  test("needs a group", () => {
    expect(outdentAssessment([single("a")], "a")).toBeNull();
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

  test("cannot go below a single assessment", () => {
    expect(getDropProjection(rows, "extra", 4, 3)).toMatchObject({
      parentId: null,
      depth: 0,
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
