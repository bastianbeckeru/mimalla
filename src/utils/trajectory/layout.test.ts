import { describe, expect, test } from "bun:test";
import type { PeriodKey } from "@/types/curriculum";
import type { Enrollment, EnrollmentStatus } from "@/types/trajectory";
import {
  createEnrollments,
  getOpeningColumn,
  getPeriodEndRow,
  layOutTrajectory,
} from "@/utils/trajectory/layout";
import {
  course,
  curriculumOf,
  entry,
  trajectory,
} from "@/utils/trajectory/test-helpers";

describe("createEnrollments", () => {
  const curriculum = curriculumOf([
    course(4, { slots: [{ programYear: 3, term: 3, position: 1 }] }),
    course(1, { slots: [{ programYear: 1, term: 1, position: 1 }] }),
    course(2, { slots: [{ programYear: 1, term: 3, position: 2 }] }),
    course(3, { slots: [{ programYear: 2, term: 1, position: 1 }] }),
  ]);

  const periodsOf = (entry: { year: number; term: number }) =>
    createEnrollments({ entry, curriculum }).map((e) => ({
      courseId: e.courseId,
      year: e.year,
      term: e.term,
    }));

  test("places each slot, in curriculum order, in the calendar period of its program year for a first semester entry", () => {
    expect(periodsOf({ year: 2024, term: 1 })).toEqual([
      { courseId: 1, year: 2024, term: 1 },
      { courseId: 2, year: 2024, term: 3 },
      { courseId: 3, year: 2025, term: 1 },
      { courseId: 4, year: 2026, term: 3 },
    ]);
  });

  test("shifts every slot one semester later for a second semester entry", () => {
    expect(periodsOf({ year: 2024, term: 3 })).toEqual([
      { courseId: 1, year: 2024, term: 3 },
      { courseId: 2, year: 2025, term: 1 },
      { courseId: 3, year: 2025, term: 3 },
      { courseId: 4, year: 2027, term: 1 },
    ]);
  });

  test("starts every enrollment as pending, at its slot position, with a unique id", () => {
    const enrollments = createEnrollments({
      entry: { year: 2024, term: 1 },
      curriculum,
    });

    expect(enrollments.map((e) => e.status)).toEqual([
      "PENDING",
      "PENDING",
      "PENDING",
      "PENDING",
    ]);
    expect(enrollments.map((e) => e.position)).toEqual([1, 2, 1, 1]);
    expect(new Set(enrollments.map((e) => e.id)).size).toBe(4);
  });
});

describe("layOutTrajectory", () => {
  const curriculum = curriculumOf([
    course(1),
    course(2),
    course(3, { credits: 12, duration: 2 }),
  ]);
  function enrollment(
    courseId: number,
    period: PeriodKey,
    position = 1,
  ): Enrollment {
    const [year = 0, term = 0] = period.split("-").map(Number);
    return {
      id: `${period}/${courseId}`,
      courseId,
      year,
      term,
      position,
      status: "PENDING",
    };
  }

  test("spans a card over its course's duration and sizes it by its credits against the default credits", () => {
    const { cards } = layOutTrajectory(
      [enrollment(1, "2024-1"), enrollment(3, "2024-1", 2)],
      { entry, curriculum },
    );

    expect(
      cards.map(({ id, column, row, duration, height }) => ({
        id,
        column,
        row,
        duration,
        height,
      })),
    ).toEqual([
      { id: "2024-1/1", column: 1, row: 1, duration: 1, height: 1 },
      { id: "2024-1/3", column: 1, row: 2, duration: 2, height: 2 },
    ]);
  });

  test("runs the periods from the entry to the last card, empty semesters included", () => {
    const { periods, cards } = layOutTrajectory(
      [enrollment(1, "2024-3"), enrollment(2, "2025-3")],
      { entry, curriculum },
    );

    expect(periods).toEqual(["2024-1", "2024-3", "2025-1", "2025-3"]);
    expect(cards.map((card) => card.column)).toEqual([2, 4]);
  });

  test("adds the periods a card spans past the last one", () => {
    const { periods } = layOutTrajectory([enrollment(3, "2024-3")], {
      entry,
      curriculum,
    });

    expect(periods).toEqual(["2024-1", "2024-3", "2025-1"]);
  });

  test("shows a winter or summer term only while it holds a card", () => {
    const { periods } = layOutTrajectory(
      [enrollment(1, "2024-4"), enrollment(2, "2025-3")],
      { entry, curriculum },
    );

    expect(periods).toEqual(["2024-1", "2024-3", "2024-4", "2025-1", "2025-3"]);
  });

  test("keeps the periods it is given, even when they hold no card", () => {
    const { periods, cards } = layOutTrajectory(
      [enrollment(1, "2024-1")],
      { entry, curriculum },
      ["2024-3", "2025-1"],
    );

    expect(periods).toEqual(["2024-1", "2024-3", "2025-1"]);
    expect(cards.map((card) => card.column)).toEqual([1]);
  });
});

describe("getOpeningColumn", () => {
  const curriculum = curriculumOf([
    course(1),
    course(2),
    course(3),
    course(4, { duration: 2 }),
  ]);

  function openingColumn(
    layout: Record<PeriodKey, number[]>,
    statuses: Record<number, EnrollmentStatus>,
    from = entry,
  ) {
    return getOpeningColumn(
      layOutTrajectory(trajectory(layout, statuses), {
        entry: from,
        curriculum,
      }),
      from,
    );
  }

  test("opens on the last period with an approved course, not at the end of the board", () => {
    expect(
      openingColumn(
        { "2024-1": [1], "2024-3": [2], "2025-1": [3] },
        { 1: "APPROVED", 2: "FAILED" },
      ),
    ).toBe(1);
  });

  test("counts the last period an approved course spans", () => {
    expect(
      openingColumn({ "2024-1": [4], "2025-1": [1] }, { 4: "APPROVED" }),
    ).toBe(2);
  });

  test("opens on the current period while nothing is approved", () => {
    const year = new Date().getFullYear();
    const current = new Date().getMonth() < 7 ? 1 : 3;
    expect(
      openingColumn(
        {
          [`${year - 1}-1`]: [1],
          [`${year - 1}-3`]: [2],
          [`${year}-${current}`]: [3],
        },
        {},
        { year: year - 1, term: 1 },
      ),
    ).toBe(current === 1 ? 3 : 4);
  });

  test("opens on the first period when nothing is approved and the board ended long ago", () => {
    expect(
      openingColumn(
        { "2010-1": [1], "2010-3": [2] },
        {},
        { year: 2010, term: 1 },
      ),
    ).toBe(1);
  });
});

describe("getPeriodEndRow", () => {
  const context = { entry, curriculum: curriculumOf([course(1), course(2)]) };

  test("is the first row below the cards of a period", () => {
    const { cards } = layOutTrajectory(
      trajectory({ "2024-1": [1, 2] }),
      context,
    );
    expect(getPeriodEndRow(cards, 1)).toBe(3);
  });

  test("is the first row of an empty period", () => {
    expect(getPeriodEndRow([], 4)).toBe(1);
  });
});
