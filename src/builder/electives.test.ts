import { describe, expect, test } from "bun:test";
import { type Action, apply } from "@/builder/apply";
import { createDraft, type Draft } from "@/builder/draft";

const FIRST_SEMESTER = { programYear: 1, term: 1 };
const SECOND_YEAR = { programYear: 2, term: 1 };

function draftAfter(...actions: Action[]) {
  return actions.reduce(apply, createDraft("semester"));
}

function slotsOf(draft: Draft) {
  return draft.curriculum.courses.map((course) => course.slots);
}

const markElective: Action = {
  type: "editCourse",
  courseId: 1,
  changes: { isElective: true },
};

describe("elective slots", () => {
  test("an elective gets another slot in the first free row of its last slot's column", () => {
    const draft = draftAfter(
      { type: "addCourse", period: FIRST_SEMESTER },
      { type: "addCourse", period: FIRST_SEMESTER },
      markElective,
      { type: "addSlot", courseId: 1 },
    );

    expect(slotsOf(draft)).toEqual([
      [
        { ...FIRST_SEMESTER, position: 1 },
        { ...FIRST_SEMESTER, position: 3 },
      ],
      [{ ...FIRST_SEMESTER, position: 2 }],
    ]);
  });

  test("a non-elective keeps its single slot", () => {
    const before = draftAfter({ type: "addCourse", period: FIRST_SEMESTER });

    expect(apply(before, { type: "addSlot", courseId: 1 })).toBe(before);
  });

  test("each slot of an elective is dragged on its own", () => {
    const draft = draftAfter(
      { type: "addCourse", period: FIRST_SEMESTER },
      markElective,
      { type: "addSlot", courseId: 1 },
      {
        type: "moveSlot",
        courseId: 1,
        slotIndex: 1,
        to: { ...SECOND_YEAR, position: 3 },
      },
    );

    expect(slotsOf(draft)).toEqual([
      [
        { ...FIRST_SEMESTER, position: 1 },
        { ...SECOND_YEAR, position: 3 },
      ],
    ]);
  });

  test("removing a slot of an elective keeps the others", () => {
    const draft = draftAfter(
      { type: "addCourse", period: FIRST_SEMESTER },
      markElective,
      { type: "addSlot", courseId: 1 },
      { type: "addSlot", courseId: 1 },
      { type: "removeSlot", courseId: 1, slotIndex: 1 },
    );

    expect(slotsOf(draft)).toEqual([
      [
        { ...FIRST_SEMESTER, position: 1 },
        { ...FIRST_SEMESTER, position: 3 },
      ],
    ]);
  });

  test("unmarking an elective keeps only its earliest slot", () => {
    const draft = draftAfter(
      { type: "addCourse", period: FIRST_SEMESTER },
      markElective,
      { type: "addSlot", courseId: 1 },
      { type: "addSlot", courseId: 1 },
      {
        type: "moveSlot",
        courseId: 1,
        slotIndex: 0,
        to: { ...SECOND_YEAR, position: 1 },
      },
      {
        type: "moveSlot",
        courseId: 1,
        slotIndex: 1,
        to: { ...SECOND_YEAR, position: 4 },
      },
      { type: "editCourse", courseId: 1, changes: { isElective: false } },
    );

    expect(draft.curriculum.courses[0]?.isElective).toBe(false);
    expect(slotsOf(draft)).toEqual([[{ ...FIRST_SEMESTER, position: 3 }]]);
  });

  test("the last slot of a course cannot be removed", () => {
    const before = draftAfter(
      { type: "addCourse", period: FIRST_SEMESTER },
      markElective,
    );

    expect(
      apply(before, { type: "removeSlot", courseId: 1, slotIndex: 0 }),
    ).toBe(before);
  });
});
