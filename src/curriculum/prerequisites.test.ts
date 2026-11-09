import { describe, expect, test } from "bun:test";
import { apply } from "@/builder/apply";
import { createDraft } from "@/builder/draft";
import { getMisplacedPrerequisiteIds } from "@/curriculum/prerequisites";
import { crs } from "@/test/ids";
import type { Action, Draft } from "@/types/builder";

const FIRST_SEMESTER = { programYear: 1, term: 1 };
const SECOND_SEMESTER = { programYear: 1, term: 3 };
const THIRD_SEMESTER = { programYear: 2, term: 1 };

function draftAfter(...actions: Action[]) {
  return actions.reduce(apply, createDraft("semester"));
}

function prerequisitesOf(draft: Draft) {
  return draft.curriculum.courses.map((course) => ({
    id: course.id,
    prerequisiteIds: course.prerequisiteIds,
  }));
}

const threeCourses: Action[] = [
  {
    type: "addCourse",
    id: crs(1),
    name: "Nuevo curso",
    period: FIRST_SEMESTER,
  },
  {
    type: "addCourse",
    id: crs(2),
    name: "Nuevo curso",
    period: SECOND_SEMESTER,
  },
  {
    type: "addCourse",
    id: crs(3),
    name: "Nuevo curso",
    period: THIRD_SEMESTER,
  },
];

describe("adding a prerequisite", () => {
  test("links another course of the curriculum as a prerequisite", () => {
    const draft = draftAfter(...threeCourses, {
      type: "addPrerequisite",
      courseId: crs(2),
      prerequisiteId: crs(1),
    });

    expect(prerequisitesOf(draft)).toEqual([
      { id: crs(1), prerequisiteIds: [] },
      { id: crs(2), prerequisiteIds: [crs(1)] },
      { id: crs(3), prerequisiteIds: [] },
    ]);
  });

  test("rejects making a course its own prerequisite", () => {
    const before = draftAfter(...threeCourses);
    const after = apply(before, {
      type: "addPrerequisite",
      courseId: crs(1),
      prerequisiteId: crs(1),
    });

    expect(after).toBe(before);
  });

  test("rejects a prerequisite that would close a cycle through other courses", () => {
    const before = draftAfter(
      ...threeCourses,
      { type: "addPrerequisite", courseId: crs(2), prerequisiteId: crs(1) },
      { type: "addPrerequisite", courseId: crs(3), prerequisiteId: crs(2) },
    );
    const after = apply(before, {
      type: "addPrerequisite",
      courseId: crs(1),
      prerequisiteId: crs(3),
    });

    expect(after).toBe(before);
  });

  test("rejects a course that is already a prerequisite or does not exist", () => {
    const before = draftAfter(...threeCourses, {
      type: "addPrerequisite",
      courseId: crs(2),
      prerequisiteId: crs(1),
    });

    expect(
      apply(before, {
        type: "addPrerequisite",
        courseId: crs(2),
        prerequisiteId: crs(1),
      }),
    ).toBe(before);
    expect(
      apply(before, {
        type: "addPrerequisite",
        courseId: crs(2),
        prerequisiteId: crs(9),
      }),
    ).toBe(before);
    expect(
      apply(before, {
        type: "addPrerequisite",
        courseId: crs(9),
        prerequisiteId: crs(1),
      }),
    ).toBe(before);
  });
});

describe("removing a prerequisite", () => {
  test("unlinks it and keeps the other prerequisites", () => {
    const draft = draftAfter(
      ...threeCourses,
      { type: "addPrerequisite", courseId: crs(3), prerequisiteId: crs(1) },
      { type: "addPrerequisite", courseId: crs(3), prerequisiteId: crs(2) },
      { type: "removePrerequisite", courseId: crs(3), prerequisiteId: crs(1) },
    );

    expect(prerequisitesOf(draft)[2]).toEqual({
      id: crs(3),
      prerequisiteIds: [crs(2)],
    });
  });

  test("ignores a course that is not a prerequisite", () => {
    const before = draftAfter(...threeCourses);

    expect(
      apply(before, {
        type: "removePrerequisite",
        courseId: crs(3),
        prerequisiteId: crs(1),
      }),
    ).toBe(before);
  });
});

describe("setting the prerequisite credits", () => {
  test("records the minimum approved credits the course requires", () => {
    const draft = draftAfter(...threeCourses, {
      type: "setPrerequisiteCredits",
      courseId: crs(3),
      credits: 30,
    });

    expect(
      draft.curriculum.courses.map((course) => course.prerequisiteCredits),
    ).toEqual([0, 0, 30]);
  });

  test("rejects credits that are not a whole number of at least 0", () => {
    const before = draftAfter(...threeCourses);

    for (const credits of [-1, 2.5, Number.NaN])
      expect(
        apply(before, {
          type: "setPrerequisiteCredits",
          courseId: crs(3),
          credits,
        }),
      ).toBe(before);
  });
});

describe("prerequisite placement warnings", () => {
  test("warns about prerequisites in the same column or a later one, not earlier ones", () => {
    const draft = draftAfter(
      ...threeCourses,
      {
        type: "addCourse",
        id: crs(4),
        name: "Nuevo curso",
        period: SECOND_SEMESTER,
      },
      { type: "addPrerequisite", courseId: crs(2), prerequisiteId: crs(1) },
      { type: "addPrerequisite", courseId: crs(2), prerequisiteId: crs(3) },
      { type: "addPrerequisite", courseId: crs(2), prerequisiteId: crs(4) },
    );

    expect(getMisplacedPrerequisiteIds(draft.curriculum, crs(2))).toEqual([
      crs(3),
      crs(4),
    ]);
  });

  test("warns about none once a misplaced prerequisite is moved to an earlier column", () => {
    const draft = draftAfter(
      ...threeCourses,
      { type: "addPrerequisite", courseId: crs(2), prerequisiteId: crs(3) },
      {
        type: "moveSlot",
        courseId: crs(3),
        slotIndex: 0,
        to: { ...FIRST_SEMESTER, position: 2 },
      },
    );

    expect(getMisplacedPrerequisiteIds(draft.curriculum, crs(2))).toEqual([]);
  });
});

describe("prerequisite placement warnings with duration", () => {
  test("warns about an earlier prerequisite whose last spanned column reaches the course", () => {
    const draft = draftAfter(
      {
        type: "addCourse",
        id: crs(1),
        name: "Nuevo curso",
        period: FIRST_SEMESTER,
      },
      {
        type: "addCourse",
        id: crs(2),
        name: "Nuevo curso",
        period: SECOND_SEMESTER,
        position: 3,
      },
      {
        type: "addCourse",
        id: crs(3),
        name: "Nuevo curso",
        period: THIRD_SEMESTER,
        position: 3,
      },
      { type: "editCourse", courseId: crs(1), changes: { duration: 2 } },
      { type: "addPrerequisite", courseId: crs(2), prerequisiteId: crs(1) },
      { type: "addPrerequisite", courseId: crs(3), prerequisiteId: crs(1) },
    );

    expect(getMisplacedPrerequisiteIds(draft.curriculum, crs(2))).toEqual([
      crs(1),
    ]);
    expect(getMisplacedPrerequisiteIds(draft.curriculum, crs(3))).toEqual([]);
  });
});

describe("prerequisite placement warnings with several placements", () => {
  const electivePrerequisite: Action[] = [
    {
      type: "addCourse",
      id: crs(1),
      name: "Nuevo curso",
      period: THIRD_SEMESTER,
    },
    {
      type: "addCourse",
      id: crs(2),
      name: "Nuevo curso",
      period: SECOND_SEMESTER,
    },
    { type: "editCourse", courseId: crs(1), changes: { isElective: true } },
    { type: "addSlot", courseId: crs(1) },
    { type: "addPrerequisite", courseId: crs(2), prerequisiteId: crs(1) },
  ];

  test("warns when no placement of the prerequisite finishes before the course", () => {
    const draft = draftAfter(...electivePrerequisite, {
      type: "moveSlot",
      courseId: crs(1),
      slotIndex: 1,
      to: { ...SECOND_SEMESTER, position: 2 },
    });

    expect(getMisplacedPrerequisiteIds(draft.curriculum, crs(2))).toEqual([
      crs(1),
    ]);
  });

  test("does not warn when a later placement of the prerequisite finishes before the course", () => {
    const draft = draftAfter(...electivePrerequisite, {
      type: "moveSlot",
      courseId: crs(1),
      slotIndex: 1,
      to: { ...FIRST_SEMESTER, position: 1 },
    });

    expect(getMisplacedPrerequisiteIds(draft.curriculum, crs(2))).toEqual([]);
  });
});

describe("deleting a course", () => {
  test("removes it from the prerequisites of the other courses", () => {
    const draft = draftAfter(
      ...threeCourses,
      { type: "addPrerequisite", courseId: crs(2), prerequisiteId: crs(1) },
      { type: "addPrerequisite", courseId: crs(3), prerequisiteId: crs(1) },
      { type: "addPrerequisite", courseId: crs(3), prerequisiteId: crs(2) },
      { type: "deleteCourse", courseId: crs(1) },
    );

    expect(prerequisitesOf(draft)).toEqual([
      { id: crs(2), prerequisiteIds: [] },
      { id: crs(3), prerequisiteIds: [crs(2)] },
    ]);
  });
});
