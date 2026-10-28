import { describe, expect, test } from "bun:test";
import { apply } from "@/builder/apply";
import { createDraft } from "@/builder/draft";
import type { Action } from "@/types/builder";

const FIRST_SEMESTER = { programYear: 1, term: 1 };

function draftAfter(...actions: Action[]) {
  return actions.reduce(apply, createDraft("semester"));
}

function slotsOf(draft: ReturnType<typeof draftAfter>) {
  return draft.curriculum.courses.map((course) => ({
    id: course.id,
    credits: course.credits,
    slots: course.slots,
  }));
}

describe("adding a course", () => {
  test("places it in the first row of an empty column with 5 credits", () => {
    const draft = draftAfter({
      type: "addCourse",
      name: "Nuevo curso",
      period: FIRST_SEMESTER,
    });

    expect(slotsOf(draft)).toEqual([
      { id: 1, credits: 5, slots: [{ ...FIRST_SEMESTER, position: 1 }] },
    ]);
  });

  test("places it below the courses already in the column", () => {
    const draft = draftAfter(
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
    );

    expect(slotsOf(draft)[1]).toEqual({
      id: 2,
      credits: 5,
      slots: [{ ...FIRST_SEMESTER, position: 2 }],
    });
  });

  test("places it at the empty cell it is created on, leaving a gap above", () => {
    const draft = draftAfter({
      type: "addCourse",
      name: "Nuevo curso",
      period: FIRST_SEMESTER,
      position: 4,
    });

    expect(slotsOf(draft)).toEqual([
      { id: 1, credits: 5, slots: [{ ...FIRST_SEMESTER, position: 4 }] },
    ]);
  });
});

describe("deleting a course", () => {
  test("removes it and leaves the other courses where they are", () => {
    const draft = draftAfter(
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
      { type: "deleteCourse", courseId: 1 },
    );

    expect(slotsOf(draft)).toEqual([
      { id: 2, credits: 5, slots: [{ ...FIRST_SEMESTER, position: 2 }] },
    ]);
  });

  test("ignores a course that does not exist", () => {
    const before = draftAfter({
      type: "addCourse",
      name: "Nuevo curso",
      period: FIRST_SEMESTER,
    });

    expect(apply(before, { type: "deleteCourse", courseId: 9 })).toBe(before);
  });
});

describe("editing a course", () => {
  const withCourse = draftAfter({
    type: "addCourse",
    name: "Nuevo curso",
    period: FIRST_SEMESTER,
  });

  test("changes its name and credits", () => {
    const draft = apply(withCourse, {
      type: "editCourse",
      courseId: 1,
      changes: { name: "Cálculo I", credits: 8 },
    });

    expect(draft.curriculum.courses[0]).toMatchObject({
      name: "Cálculo I",
      credits: 8,
    });
  });

  test.each([-1, 2.5, Number.NaN])(
    "rejects %p credits and keeps the draft",
    (credits) => {
      const draft = apply(withCourse, {
        type: "editCourse",
        courseId: 1,
        changes: { credits },
      });

      expect(draft).toEqual(withCourse);
    },
  );

  test("accepts 0 credits", () => {
    const draft = apply(withCourse, {
      type: "editCourse",
      courseId: 1,
      changes: { credits: 0 },
    });

    expect(draft.curriculum.courses[0]?.credits).toBe(0);
  });
});
