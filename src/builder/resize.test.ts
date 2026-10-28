import { describe, expect, test } from "bun:test";
import { apply } from "@/builder/apply";
import { createDraft } from "@/builder/draft";
import { exportFile } from "@/builder/export";
import { getMaxDuration } from "@/builder/grid";
import type { Action, Course, Draft } from "@/types/builder";

const FIRST_SEMESTER = { programYear: 1, term: 1 };
const SECOND_SEMESTER = { programYear: 1, term: 3 };
const LAST_SEMESTER = { programYear: 5, term: 3 };

function draftAfter(...actions: Action[]) {
  return actions.reduce(apply, createDraft("semester"));
}

function positionsOf(draft: Draft) {
  return draft.curriculum.courses.map((course) => course.slots);
}

function durationsOf(draft: Draft) {
  return draft.curriculum.courses.map((course) => course.duration);
}

function creditsOf(draft: Draft) {
  return draft.curriculum.courses.map((course) => course.credits);
}

describe("resizing a course's height", () => {
  test("sets the credits to rows × default credits", () => {
    const draft = draftAfter(
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
      { type: "resizeCourse", courseId: 3, slotIndex: 0, rows: 3, duration: 1 },
    );

    expect(creditsOf(draft)).toEqual([5, 5, 15]);
  });

  test("growing into the course below pushes it down", () => {
    const draft = draftAfter(
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
      {
        type: "addCourse",
        name: "Nuevo curso",
        period: FIRST_SEMESTER,
        position: 5,
      },
      { type: "resizeCourse", courseId: 1, slotIndex: 0, rows: 3, duration: 1 },
    );

    expect(positionsOf(draft)).toEqual([
      [{ ...FIRST_SEMESTER, position: 1 }],
      [{ ...FIRST_SEMESTER, position: 4 }],
      [{ ...FIRST_SEMESTER, position: 5 }],
    ]);
  });
});

describe("resizing a course's width", () => {
  test("sets its duration in consecutive columns", () => {
    const draft = draftAfter(
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
      { type: "resizeCourse", courseId: 1, slotIndex: 0, rows: 1, duration: 3 },
    );

    expect(durationsOf(draft)).toEqual([3]);
  });

  test("growing into a course in the next column pushes it down", () => {
    const draft = draftAfter(
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
      { type: "addCourse", name: "Nuevo curso", period: SECOND_SEMESTER },
      { type: "resizeCourse", courseId: 1, slotIndex: 0, rows: 1, duration: 2 },
    );

    expect(positionsOf(draft)).toEqual([
      [{ ...FIRST_SEMESTER, position: 1 }],
      [{ ...SECOND_SEMESTER, position: 2 }],
    ]);
  });
});

describe("rejecting a resize", () => {
  test("cannot span past the last column", () => {
    const before = draftAfter({
      type: "addCourse",
      name: "Nuevo curso",
      period: LAST_SEMESTER,
    });

    expect(
      apply(before, {
        type: "resizeCourse",
        courseId: 1,
        slotIndex: 0,
        rows: 1,
        duration: 2,
      }),
    ).toBe(before);
  });

  test.each([
    ["0 rows", { rows: 0, duration: 1 }],
    ["a fractional height", { rows: 1.5, duration: 1 }],
    ["a duration of 0", { rows: 1, duration: 0 }],
    ["a fractional duration", { rows: 1, duration: 1.5 }],
    ["the same size", { rows: 1, duration: 1 }],
  ])("keeps the draft for %s", (_, size) => {
    const before = draftAfter({
      type: "addCourse",
      name: "Nuevo curso",
      period: FIRST_SEMESTER,
    });

    expect(
      apply(before, {
        type: "resizeCourse",
        courseId: 1,
        slotIndex: 0,
        ...size,
      }),
    ).toBe(before);
  });
});

describe("setting the duration from the panel", () => {
  test("widens the course and pushes the course it grows into down", () => {
    const draft = draftAfter(
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
      { type: "addCourse", name: "Nuevo curso", period: SECOND_SEMESTER },
      { type: "editCourse", courseId: 1, changes: { duration: 2 } },
    );

    expect(durationsOf(draft)).toEqual([2, 1]);
    expect(positionsOf(draft)).toEqual([
      [{ ...FIRST_SEMESTER, position: 1 }],
      [{ ...SECOND_SEMESTER, position: 2 }],
    ]);
  });

  test.each([
    ["past the last column", 2],
    ["of 0", 0],
    ["that is fractional", 1.5],
  ])("rejects a duration %s", (_, duration) => {
    const before = draftAfter({
      type: "addCourse",
      name: "Nuevo curso",
      period: LAST_SEMESTER,
    });

    expect(
      apply(before, { type: "editCourse", courseId: 1, changes: { duration } }),
    ).toBe(before);
  });
});

describe("moving a course that spans several columns", () => {
  test("cannot be dropped where it would span past the last column", () => {
    const before = draftAfter(
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
      { type: "editCourse", courseId: 1, changes: { duration: 2 } },
    );

    expect(
      apply(before, {
        type: "moveSlot",
        courseId: 1,
        slotIndex: 0,
        to: { ...LAST_SEMESTER, position: 1 },
      }),
    ).toBe(before);
  });

  test("pushes down a course in any column it lands on", () => {
    const draft = draftAfter(
      { type: "addCourse", name: "Nuevo curso", period: SECOND_SEMESTER },
      {
        type: "addCourse",
        name: "Nuevo curso",
        period: FIRST_SEMESTER,
        position: 3,
      },
      { type: "editCourse", courseId: 2, changes: { duration: 2 } },
      {
        type: "moveSlot",
        courseId: 2,
        slotIndex: 0,
        to: { ...FIRST_SEMESTER, position: 1 },
      },
    );

    expect(positionsOf(draft)).toEqual([
      [{ ...SECOND_SEMESTER, position: 2 }],
      [{ ...FIRST_SEMESTER, position: 1 }],
    ]);
  });

  test("a new course goes below the courses spanning into its column", () => {
    const draft = draftAfter(
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
      { type: "editCourse", courseId: 1, changes: { duration: 2 } },
      { type: "addCourse", name: "Nuevo curso", period: SECOND_SEMESTER },
    );

    expect(positionsOf(draft)[1]).toEqual([
      { ...SECOND_SEMESTER, position: 2 },
    ]);
  });
});

describe("maximum duration", () => {
  test("reaches up to the last column", () => {
    const { curriculum } = draftAfter(
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
      {
        type: "addCourse",
        name: "Nuevo curso",
        period: { programYear: 5, term: 1 },
      },
    );
    const [first, second] = curriculum.courses as [Course, Course];

    expect(getMaxDuration(curriculum, first)).toBe(10);
    expect(getMaxDuration(curriculum, second)).toBe(2);
  });
});

describe("exporting the duration", () => {
  test("writes it after the credits and omits it when 1", () => {
    const draft = draftAfter(
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
      { type: "addArea", name: "Privado" },
      { type: "assignArea", courseId: 1, areaId: 1 },
      { type: "editCourse", courseId: 1, changes: { duration: 2 } },
    );

    expect(exportFile(draft)).toContain(
      '"courses":[' +
        '{"id":1,"name":"Nuevo curso","credits":5,"duration":2,"areaId":1,"slots":[{"programYear":1,"term":1,"position":1}]},' +
        '{"id":2,"name":"Nuevo curso","credits":5,"slots":[{"programYear":1,"term":1,"position":2}]}]',
    );
  });
});
