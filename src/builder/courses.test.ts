import { describe, expect, test } from "bun:test";
import { type Action, apply } from "@/builder/apply";
import { createDraft } from "@/builder/draft";

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
    const draft = draftAfter({ type: "addCourse", period: FIRST_SEMESTER });

    expect(slotsOf(draft)).toEqual([
      { id: 1, credits: 5, slots: [{ ...FIRST_SEMESTER, position: 1 }] },
    ]);
  });

  test("places it below the courses already in the column", () => {
    const draft = draftAfter(
      { type: "addCourse", period: FIRST_SEMESTER },
      { type: "addCourse", period: FIRST_SEMESTER },
    );

    expect(slotsOf(draft)[1]).toEqual({
      id: 2,
      credits: 5,
      slots: [{ ...FIRST_SEMESTER, position: 2 }],
    });
  });
});

describe("editing a course", () => {
  const withCourse = draftAfter({ type: "addCourse", period: FIRST_SEMESTER });

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
