import { describe, expect, test } from "bun:test";
import { apply } from "@/builder/apply";
import { createDraft } from "@/builder/draft";
import { getCourseHeight, getDefaultCredits } from "@/builder/grid";
import type { Action } from "@/types/builder";

const FIRST_SEMESTER = { programYear: 1, term: 1 };

function curriculumWithCredits(...credits: number[]) {
  const actions = credits.flatMap((value, index): Action[] => [
    { type: "addCourse", period: { programYear: index + 1, term: 1 } },
    { type: "editCourse", courseId: index + 1, changes: { credits: value } },
  ]);
  return actions.reduce(apply, createDraft("semester")).curriculum;
}

describe("default credits", () => {
  test("are 5 when there are no courses", () => {
    expect(getDefaultCredits(curriculumWithCredits())).toBe(5);
  });

  test("are the most common credits among the courses", () => {
    expect(getDefaultCredits(curriculumWithCredits(6, 4, 4, 10))).toBe(4);
  });

  test("are the lower value on a tie", () => {
    expect(getDefaultCredits(curriculumWithCredits(6, 3, 6, 3))).toBe(3);
  });
});

describe("course height", () => {
  test.each([
    [5, 1],
    [7, 1],
    [8, 2],
    [10, 2],
    [13, 3],
    [2, 1],
    [0, 1],
  ])(
    "a %p-credit course is %p rows tall with 5 default credits",
    (credits, rows) => {
      expect(getCourseHeight(credits, 5)).toBe(rows);
    },
  );

  test("is one row when the default credits are 0", () => {
    expect(getCourseHeight(4, 0)).toBe(1);
  });

  test("leaves room below a tall course for the next added course", () => {
    const actions: Action[] = [
      { type: "addCourse", period: FIRST_SEMESTER },
      { type: "addCourse", period: FIRST_SEMESTER },
      { type: "addCourse", period: FIRST_SEMESTER },
      { type: "editCourse", courseId: 3, changes: { credits: 10 } },
      { type: "addCourse", period: FIRST_SEMESTER },
    ];
    const { courses } = actions.reduce(
      apply,
      createDraft("semester"),
    ).curriculum;

    expect(courses.at(-1)?.slots).toEqual([{ ...FIRST_SEMESTER, position: 5 }]);
  });
});
