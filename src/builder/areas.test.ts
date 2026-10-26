import { describe, expect, test } from "bun:test";
import { apply } from "@/builder/apply";
import { getAreaShades, getCourseColor, getTextColor } from "@/builder/colors";
import { createDraft } from "@/builder/draft";
import type { Action, Area, Course } from "@/types/builder";
import type { HexColor } from "@/types/colors";
import { getLuminance } from "@/utils/colors";

const FIRST_SEMESTER = { programYear: 1, term: 1 };

function draftAfter(...actions: Action[]) {
  return actions.reduce(apply, createDraft("semester"));
}

describe("creating an area", () => {
  test("adds it with its name and the next id", () => {
    const draft = draftAfter(
      { type: "addArea", name: "Derecho Privado" },
      { type: "addArea", name: "Derecho Público" },
    );

    expect(
      draft.curriculum.areas.map(({ id, name }) => ({ id, name })),
    ).toEqual([
      { id: 1, name: "Derecho Privado" },
      { id: 2, name: "Derecho Público" },
    ]);
  });

  test("gives each new area the next shade of the base color, repeating after the last", () => {
    const shades = getAreaShades(createDraft("semester").baseColor);
    const draft = draftAfter(
      ...Array.from(
        { length: shades.length + 1 },
        (_, index): Action => ({ type: "addArea", name: `Área ${index}` }),
      ),
    );

    expect(draft.curriculum.areas.map((area) => area.color)).toEqual([
      ...shades,
      shades[0] as HexColor,
    ]);
  });
});

describe("renaming an area", () => {
  test("changes only its name", () => {
    const before = draftAfter({ type: "addArea", name: "Privado" });
    const draft = apply(before, {
      type: "editArea",
      areaId: 1,
      changes: { name: "Derecho Privado" },
    });

    expect(draft.curriculum.areas).toEqual([
      { ...(before.curriculum.areas[0] as Area), name: "Derecho Privado" },
    ]);
  });
});

describe("assigning a course to an area", () => {
  const before = draftAfter(
    { type: "addArea", name: "Privado" },
    { type: "addCourse", period: FIRST_SEMESTER },
  );

  test("sets the course's area, and can clear it again", () => {
    const assigned = apply(before, {
      type: "assignArea",
      courseId: 1,
      areaId: 1,
    });
    const cleared = apply(assigned, {
      type: "assignArea",
      courseId: 1,
      areaId: null,
    });

    expect(assigned.curriculum.courses[0]?.areaId).toBe(1);
    expect(cleared.curriculum.courses[0]?.areaId).toBeNull();
  });

  test("ignores an area that does not exist", () => {
    expect(apply(before, { type: "assignArea", courseId: 1, areaId: 2 })).toBe(
      before,
    );
  });
});

describe("deleting an area", () => {
  test("removes it and leaves its courses without an area", () => {
    const draft = draftAfter(
      { type: "addArea", name: "Privado" },
      { type: "addArea", name: "Público" },
      { type: "addCourse", period: FIRST_SEMESTER },
      { type: "addCourse", period: FIRST_SEMESTER },
      { type: "assignArea", courseId: 1, areaId: 1 },
      { type: "assignArea", courseId: 2, areaId: 2 },
      { type: "deleteArea", areaId: 1 },
    );

    expect(draft.curriculum.areas.map((area) => area.name)).toEqual([
      "Público",
    ]);
    expect(draft.curriculum.courses.map((course) => course.areaId)).toEqual([
      null,
      2,
    ]);
  });
});

describe("coloring areas", () => {
  const threeAreas: Action[] = [
    { type: "addArea", name: "Privado" },
    { type: "addArea", name: "Público" },
    { type: "addArea", name: "Penal" },
  ];

  test("sets an area's color by hand, lowercased", () => {
    const draft = draftAfter(...threeAreas, {
      type: "setAreaColor",
      areaId: 2,
      color: "#FF8800",
    });

    expect(draft.curriculum.areas[1]?.color).toBe("#ff8800");
  });

  test.each(["ff8800", "#f80", "#gg0000", "red"])(
    "ignores the invalid color %p",
    (color) => {
      const before = draftAfter(...threeAreas);
      expect(apply(before, { type: "setAreaColor", areaId: 2, color })).toBe(
        before,
      );
    },
  );

  test("ignores coloring an area that does not exist", () => {
    const before = draftAfter(...threeAreas);
    expect(
      apply(before, { type: "setAreaColor", areaId: 4, color: "#ff8800" }),
    ).toBe(before);
  });

  test("changing the base color recolors only the areas not colored by hand", () => {
    const draft = draftAfter(
      ...threeAreas,
      { type: "setAreaColor", areaId: 2, color: "#ff8800" },
      { type: "setBaseColor", color: "#16a34a" },
    );
    const shades = getAreaShades("#16a34a");

    expect(draft.baseColor).toBe("#16a34a");
    expect(draft.curriculum.areas.map((area) => area.color)).toEqual([
      shades[0] as HexColor,
      "#ff8800",
      shades[2] as HexColor,
    ]);
  });

  test("a new area does not inherit the hand coloring of a deleted one", () => {
    const draft = draftAfter(
      ...threeAreas,
      { type: "setAreaColor", areaId: 3, color: "#ff8800" },
      { type: "deleteArea", areaId: 3 },
      { type: "addArea", name: "Procesal" },
      { type: "setBaseColor", color: "#16a34a" },
    );

    expect(draft.curriculum.areas[2]?.color).toBe(
      getAreaShades("#16a34a")[2] as HexColor,
    );
  });

  test("ignores an invalid base color", () => {
    const before = draftAfter(...threeAreas);
    expect(apply(before, { type: "setBaseColor", color: "verde" })).toBe(
      before,
    );
  });
});

describe("course colors", () => {
  test("a course takes its area's color, and the neutral default without one", () => {
    const draft = draftAfter(
      { type: "addArea", name: "Privado" },
      { type: "setAreaColor", areaId: 1, color: "#ff8800" },
      { type: "addCourse", period: FIRST_SEMESTER },
      { type: "addCourse", period: FIRST_SEMESTER },
      { type: "assignArea", courseId: 1, areaId: 1 },
    );
    const [assigned, unassigned] = draft.curriculum.courses as [Course, Course];

    expect(getCourseColor(draft.curriculum, assigned)).toBe("#ff8800");
    expect(getCourseColor(draft.curriculum, unassigned)).toBe("#fafafa");
  });

  test.each<[HexColor, string]>([
    ["#ffffff", "#0a0a0a"],
    ["#fafafa", "#0a0a0a"],
    ["#facc15", "#0a0a0a"],
    ["#000000", "#fafafa"],
    ["#4f46e5", "#fafafa"],
    ["#1e1b4b", "#fafafa"],
  ])("text on %p is %p", (background, text) => {
    expect(getTextColor(background)).toBe(text);
  });
});

describe("the shade scale of a base color", () => {
  const shades = getAreaShades("#4f46e5");

  test("has about 6 distinct lowercase hex shades", () => {
    expect(shades).toHaveLength(6);
    expect(new Set(shades).size).toBe(6);
    for (const shade of shades) expect(shade).toMatch(/^#[0-9a-f]{6}$/);
  });

  test("orders the shades so consecutive ones contrast", () => {
    const pairs = shades.map(
      (shade, index) =>
        [shade, shades[(index + 1) % shades.length] as HexColor] as const,
    );

    for (const [a, b] of pairs) {
      const [lighter, darker] = [getLuminance(a), getLuminance(b)].toSorted(
        (x, y) => y - x,
      ) as [number, number];
      expect((lighter + 0.05) / (darker + 0.05)).toBeGreaterThan(1.5);
    }
  });
});
