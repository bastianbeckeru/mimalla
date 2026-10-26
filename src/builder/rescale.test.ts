import { describe, expect, test } from "bun:test";
import { apply } from "@/builder/apply";
import { createDraft } from "@/builder/draft";
import { getDefaultCredits } from "@/builder/grid";
import { isSamePeriod } from "@/builder/periods";
import type { Draft, Period } from "@/types/builder";

const FIRST_SEMESTER = { programYear: 1, term: 1 };
const SECOND_SEMESTER = { programYear: 1, term: 3 };
const THIRD_SEMESTER = { programYear: 2, term: 1 };
const FOURTH_SEMESTER = { programYear: 2, term: 3 };

function addCourses(draft: Draft, period: Period, credits: number[]) {
  return credits.reduce((current, value) => {
    const added = apply(current, { type: "addCourse", period });
    return apply(added, {
      type: "editCourse",
      courseId: added.curriculum.courses.length,
      changes: { credits: value },
    });
  }, draft);
}

function setCredits(draft: Draft, courseIds: number[], credits: number) {
  return courseIds.reduce(
    (current, courseId) =>
      apply(current, { type: "editCourse", courseId, changes: { credits } }),
    draft,
  );
}

function creditsAndPositionsIn(draft: Draft, period: Period) {
  return draft.curriculum.courses.flatMap((course) =>
    course.slots
      .filter((slot) => isSamePeriod(slot, period))
      .map((slot) => [course.credits, slot.position]),
  );
}

function tenFivesAndNineFours() {
  const fives = addCourses(
    createDraft("semester"),
    SECOND_SEMESTER,
    Array(9).fill(5),
  );
  const withFirstColumn = addCourses(fives, FIRST_SEMESTER, [7, 5, 4]);
  return addCourses(withFirstColumn, THIRD_SEMESTER, Array(8).fill(4));
}

describe("re-scaling when the default credits change", () => {
  test("adding two 4-credit courses to ten 5s and nine 4s grows the 7-credit course and pushes the ones below it down", () => {
    const before = tenFivesAndNineFours();
    expect(getDefaultCredits(before.curriculum)).toBe(5);
    expect(creditsAndPositionsIn(before, FIRST_SEMESTER)).toEqual([
      [7, 1],
      [5, 2],
      [4, 3],
    ]);

    const after = addCourses(before, FOURTH_SEMESTER, [4, 4]);

    expect(getDefaultCredits(after.curriculum)).toBe(4);
    expect(creditsAndPositionsIn(after, FIRST_SEMESTER)).toEqual([
      [7, 1],
      [5, 3],
      [4, 4],
    ]);
    expect(creditsAndPositionsIn(after, SECOND_SEMESTER)).toEqual(
      creditsAndPositionsIn(before, SECOND_SEMESTER),
    );
  });

  test("nothing moves up when the course shrinks back", () => {
    const grown = addCourses(tenFivesAndNineFours(), FOURTH_SEMESTER, [4, 4]);

    const shrunk = setCredits(grown, [21, 22], 5);

    expect(getDefaultCredits(shrunk.curriculum)).toBe(5);
    expect(creditsAndPositionsIn(shrunk, FIRST_SEMESTER)).toEqual([
      [7, 1],
      [5, 3],
      [4, 4],
    ]);
  });

  test("deleting a course that changes the default credits pushes the grown course's neighbors down", () => {
    const fives = addCourses(createDraft("semester"), SECOND_SEMESTER, [5, 5]);
    const before = addCourses(fives, FIRST_SEMESTER, [7, 5, 4, 4]);
    expect(getDefaultCredits(before.curriculum)).toBe(5);

    const after = apply(before, { type: "deleteCourse", courseId: 1 });

    expect(getDefaultCredits(after.curriculum)).toBe(4);
    expect(creditsAndPositionsIn(after, FIRST_SEMESTER)).toEqual([
      [7, 1],
      [5, 3],
      [4, 4],
      [4, 5],
    ]);
  });

  test("editing a course's credits so the course above it grows pushes the edited course down", () => {
    const before = addCourses(createDraft("semester"), FIRST_SEMESTER, [7, 5]);
    expect(creditsAndPositionsIn(before, FIRST_SEMESTER)).toEqual([
      [7, 1],
      [5, 2],
    ]);

    const after = setCredits(before, [2], 4);

    expect(getDefaultCredits(after.curriculum)).toBe(4);
    expect(creditsAndPositionsIn(after, FIRST_SEMESTER)).toEqual([
      [7, 1],
      [4, 3],
    ]);
  });

  test("resizing a course so the course above it grows pushes the resized course down", () => {
    const firstColumn = addCourses(
      createDraft("semester"),
      FIRST_SEMESTER,
      [7, 5],
    );
    const withFive = addCourses(firstColumn, SECOND_SEMESTER, [5]);
    const before = addCourses(withFive, THIRD_SEMESTER, [4]);
    expect(getDefaultCredits(before.curriculum)).toBe(5);
    expect(creditsAndPositionsIn(before, FIRST_SEMESTER)).toEqual([
      [7, 1],
      [5, 2],
    ]);

    const after = apply(before, {
      type: "resizeCourse",
      courseId: 2,
      slotIndex: 0,
      rows: 2,
      duration: 1,
    });

    expect(getDefaultCredits(after.curriculum)).toBe(4);
    expect(creditsAndPositionsIn(after, FIRST_SEMESTER)).toEqual([
      [7, 1],
      [10, 3],
    ]);
  });

  test("editing credits so a course grows pushes the course below it down", () => {
    const draft = setCredits(
      addCourses(createDraft("semester"), FIRST_SEMESTER, [5, 5, 5]),
      [1],
      10,
    );

    expect(creditsAndPositionsIn(draft, FIRST_SEMESTER)).toEqual([
      [10, 1],
      [5, 3],
      [5, 4],
    ]);
  });
});
