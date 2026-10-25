import { describe, expect, test } from "bun:test";
import { type Action, apply } from "@/builder/apply";
import { createDraft, type Draft } from "@/builder/draft";
import { exportFile } from "@/builder/export";

const FIRST_SEMESTER = { programYear: 1, term: 1 };
const SECOND_SEMESTER = { programYear: 1, term: 3 };

function draftAfter(...actions: Action[]) {
  return actions.reduce(apply, createDraft("semester"));
}

function positionsOf(draft: Draft) {
  return draft.curriculum.courses.map((course) => course.slots);
}

describe("moving a course", () => {
  test("places it at the column and row it is dropped on", () => {
    const draft = draftAfter(
      { type: "addCourse", period: FIRST_SEMESTER },
      {
        type: "moveSlot",
        courseId: 1,
        slotIndex: 0,
        to: { ...SECOND_SEMESTER, position: 4 },
      },
    );

    expect(positionsOf(draft)).toEqual([[{ ...SECOND_SEMESTER, position: 4 }]]);
  });

  test("dropping an 8-credit course on top of another pushes it down 2 rows", () => {
    const draft = draftAfter(
      { type: "addCourse", period: FIRST_SEMESTER },
      { type: "addCourse", period: SECOND_SEMESTER },
      { type: "editCourse", courseId: 2, changes: { credits: 8 } },
      {
        type: "moveSlot",
        courseId: 2,
        slotIndex: 0,
        to: { ...FIRST_SEMESTER, position: 1 },
      },
    );

    expect(positionsOf(draft)).toEqual([
      [{ ...FIRST_SEMESTER, position: 3 }],
      [{ ...FIRST_SEMESTER, position: 1 }],
    ]);
  });

  test("pushes down a chain of colliding courses and leaves those above in place", () => {
    const draft = draftAfter(
      { type: "addCourse", period: FIRST_SEMESTER },
      { type: "addCourse", period: FIRST_SEMESTER },
      { type: "addCourse", period: FIRST_SEMESTER },
      { type: "addCourse", period: SECOND_SEMESTER },
      { type: "editCourse", courseId: 4, changes: { credits: 10 } },
      {
        type: "moveSlot",
        courseId: 4,
        slotIndex: 0,
        to: { ...FIRST_SEMESTER, position: 2 },
      },
    );

    expect(positionsOf(draft)).toEqual([
      [{ ...FIRST_SEMESTER, position: 1 }],
      [{ ...FIRST_SEMESTER, position: 4 }],
      [{ ...FIRST_SEMESTER, position: 5 }],
      [{ ...FIRST_SEMESTER, position: 2 }],
    ]);
  });

  test("keeps the gap below a pushed course when it does not reach the next one", () => {
    const draft = draftAfter(
      { type: "addCourse", period: FIRST_SEMESTER },
      { type: "addCourse", period: SECOND_SEMESTER },
      { type: "addCourse", period: SECOND_SEMESTER },
      {
        type: "moveSlot",
        courseId: 3,
        slotIndex: 0,
        to: { ...FIRST_SEMESTER, position: 5 },
      },
      {
        type: "moveSlot",
        courseId: 2,
        slotIndex: 0,
        to: { ...FIRST_SEMESTER, position: 1 },
      },
    );

    expect(positionsOf(draft)).toEqual([
      [{ ...FIRST_SEMESTER, position: 2 }],
      [{ ...FIRST_SEMESTER, position: 1 }],
      [{ ...FIRST_SEMESTER, position: 5 }],
    ]);
  });

  test.each([
    ["row 0", { ...FIRST_SEMESTER, position: 0 }],
    ["a fractional row", { ...FIRST_SEMESTER, position: 1.5 }],
    [
      "a period outside the curriculum",
      { programYear: 9, term: 1, position: 1 },
    ],
  ])("rejects a drop on %s and keeps the draft", (_, to) => {
    const before = draftAfter({ type: "addCourse", period: FIRST_SEMESTER });

    expect(
      apply(before, { type: "moveSlot", courseId: 1, slotIndex: 0, to }),
    ).toBe(before);
  });

  test("keeps the draft when the course is dropped where it already is", () => {
    const before = draftAfter({ type: "addCourse", period: FIRST_SEMESTER });

    expect(
      apply(before, {
        type: "moveSlot",
        courseId: 1,
        slotIndex: 0,
        to: { ...FIRST_SEMESTER, position: 1 },
      }),
    ).toBe(before);
  });

  test("exports the pushed-down positions and the order they produce", () => {
    const draft = draftAfter(
      { type: "addCourse", period: FIRST_SEMESTER },
      { type: "addCourse", period: SECOND_SEMESTER },
      {
        type: "moveSlot",
        courseId: 2,
        slotIndex: 0,
        to: { ...FIRST_SEMESTER, position: 1 },
      },
    );

    expect(exportFile(draft)).toContain(
      '"courses":[' +
        '{"id":1,"name":"Nuevo curso","credits":5,"slots":[{"programYear":1,"term":1,"position":1}]},' +
        '{"id":2,"name":"Nuevo curso","credits":5,"slots":[{"programYear":1,"term":1,"position":2}]}]',
    );
  });

  test("leaves the courses below in place when a course moves away", () => {
    const draft = draftAfter(
      { type: "addCourse", period: FIRST_SEMESTER },
      { type: "addCourse", period: FIRST_SEMESTER },
      {
        type: "moveSlot",
        courseId: 1,
        slotIndex: 0,
        to: { ...SECOND_SEMESTER, position: 1 },
      },
    );

    expect(positionsOf(draft)).toEqual([
      [{ ...SECOND_SEMESTER, position: 1 }],
      [{ ...FIRST_SEMESTER, position: 2 }],
    ]);
  });
});
