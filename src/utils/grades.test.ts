import { describe, expect, test } from "bun:test";
import type { Assessment, Enrollment } from "@/types/trajectory";
import {
  DEFAULT_GRADING_SCALE,
  formatGrade,
  getAssessmentGrade,
  getComputedGrade,
  getCourseGrade,
  getCumulativeAverage,
  getPartialAverage,
  getRequiredGrade,
  getSchemeDepth,
  parseGrade,
  roundGrade,
} from "@/utils/grades";

const scale = DEFAULT_GRADING_SCALE;

let nextId = 0;

function single(grade: number | null, weight: number | null = null) {
  return {
    kind: "SINGLE",
    id: `a${nextId++}`,
    name: "Evaluación",
    weight,
    grade,
  } satisfies Assessment;
}

function group(
  assessments: Assessment[],
  weight: number | null = null,
  droppedCount = 0,
) {
  return {
    kind: "GROUP",
    id: `a${nextId++}`,
    name: "Grupo",
    weight,
    assessments,
    droppedCount,
  } satisfies Assessment;
}

function enrollment(fields: Partial<Enrollment>): Enrollment {
  return {
    id: "e1",
    courseId: 1,
    year: 2026,
    term: 1,
    position: 1,
    status: "PENDING",
    ...fields,
  };
}

describe("roundGrade", () => {
  test("rounds half up to one decimal", () => {
    expect(roundGrade(3.95)).toBe(4);
    expect(roundGrade(4.05)).toBe(4.1);
    expect(roundGrade(4.04)).toBe(4);
  });
});

describe("getComputedGrade", () => {
  test("weighs assessments by their percentage", () => {
    expect(getComputedGrade([single(7, 25), single(3, 75)], scale)).toBe(4);
  });

  test("weighs assessments without a weight equally", () => {
    expect(getComputedGrade([single(4), single(5), single(6)], scale)).toBe(5);
  });

  test("lets assessments without a weight share what the weighted ones leave", () => {
    // The exam counts 40%; the other two split the remaining 60%.
    expect(getComputedGrade([single(7, 40), single(4), single(4)], scale)).toBe(
      5.2,
    );
  });

  test("divides by the actual sum when the weights do not add up to 100%", () => {
    expect(getComputedGrade([single(6, 45), single(3, 45)], scale)).toBe(4.5);
  });

  test("averages nested groups by their weight in the parent", () => {
    const controls = group([single(5), single(6), single(7)], 25);
    const tests = group([group([single(4), single(4)]), single(4)], 45);
    const exam = single(3, 30);

    // 6 × 25% + 4 × 45% + 3 × 30%
    expect(getComputedGrade([controls, tests, exam], scale)).toBe(4.2);
  });

  test("drops a group's lowest grades", () => {
    expect(
      getComputedGrade(
        [group([single(2), single(5), single(6)], 100, 1)],
        scale,
      ),
    ).toBe(5.5);
  });

  test("always keeps at least one grade in a group", () => {
    expect(
      getComputedGrade([group([single(2), single(5)], 100, 3)], scale),
    ).toBe(5);
  });

  test("is missing until every assessment has a grade", () => {
    expect(getComputedGrade([single(6), single(null)], scale)).toBeNull();
  });

  test("leaves out grades outside the scale", () => {
    expect(getComputedGrade([single(6), single(70)], scale)).toBeNull();
  });

  test("ignores groups without assessments", () => {
    expect(getComputedGrade([single(5), group([], 50)], scale)).toBe(5);
  });

  test("is missing without assessments", () => {
    expect(getComputedGrade([], scale)).toBeNull();
  });
});

describe("getCourseGrade", () => {
  test("prefers the course grade the student entered", () => {
    expect(
      getCourseGrade(
        enrollment({ courseGrade: 5.5, assessments: [single(4)] }),
        scale,
      ),
    ).toBe(5.5);
  });

  test("works with an entered course grade and no assessments", () => {
    expect(getCourseGrade(enrollment({ courseGrade: 4.25 }), scale)).toBe(4.3);
  });

  test("falls back to the computed grade when the entered one is outside the scale", () => {
    expect(
      getCourseGrade(
        enrollment({ courseGrade: 55, assessments: [single(4)] }),
        scale,
      ),
    ).toBe(4);
  });

  test("is missing without grades", () => {
    expect(getCourseGrade(enrollment({}), scale)).toBeNull();
  });
});

describe("getPartialAverage", () => {
  test("averages only the assessments with a grade", () => {
    expect(getPartialAverage([single(5, 25), single(null, 75)], scale)).toBe(5);
  });

  test("weighs a partly graded group by what it has graded", () => {
    // Half of the controls (12.5%) at 6 and the first test (30%) at 4.
    const controls = group([single(6), single(null)], 25);
    const tests = group([single(4, 30), single(null, 45)], 75);

    expect(getPartialAverage([controls, tests], scale)).toBeCloseTo(
      (6 * 12.5 + 4 * 30) / 42.5,
    );
  });

  test("drops nothing until the group is complete", () => {
    expect(
      getPartialAverage(
        [group([single(2), single(6), single(null)], 100, 1)],
        scale,
      ),
    ).toBe(4);
  });

  test("is missing without grades", () => {
    expect(getPartialAverage([single(null), single(null)], scale)).toBeNull();
  });
});

describe("getRequiredGrade", () => {
  test("finds the grade needed in every missing assessment to pass", () => {
    // 3 × 50% + x × 50% ≥ 3.95
    expect(getRequiredGrade([single(3, 50), single(null, 50)], scale)).toEqual({
      status: "NEEDED",
      grade: 4.9,
    });
  });

  test("assumes the group drops its lowest grades", () => {
    // With the 1.0 dropped, two more 4.0 pass.
    expect(
      getRequiredGrade(
        [group([single(1), single(null), single(null)], 100, 1)],
        scale,
      ),
    ).toEqual({ status: "NEEDED", grade: 4 });
  });

  test("tells when the passing grade is already reached", () => {
    expect(getRequiredGrade([single(7, 90), single(null, 10)], scale)).toEqual({
      status: "REACHED",
    });
  });

  test("tells when the passing grade is no longer reachable", () => {
    expect(getRequiredGrade([single(1, 90), single(null, 10)], scale)).toEqual({
      status: "UNREACHABLE",
    });
  });

  test("is missing when every assessment has a grade", () => {
    expect(getRequiredGrade([single(5)], scale)).toBeNull();
  });

  test("counts grades outside the scale as missing", () => {
    expect(getRequiredGrade([single(3, 50), single(80, 50)], scale)).toEqual({
      status: "NEEDED",
      grade: 4.9,
    });
  });
});

describe("getSchemeDepth", () => {
  test("counts the levels below the course", () => {
    expect(getSchemeDepth([])).toBe(0);
    expect(getSchemeDepth([single(4), group([group([single(4)])])])).toBe(3);
  });
});

describe("getCumulativeAverage", () => {
  const courses = new Map([
    [1, { credits: 10 }],
    [2, { credits: 5 }],
  ]);

  test("weighs course grades by credits, counting every finished attempt", () => {
    const enrollments = [
      enrollment({ id: "e1", courseId: 1, status: "FAILED", courseGrade: 3 }),
      enrollment({ id: "e2", courseId: 1, status: "APPROVED", courseGrade: 5 }),
      enrollment({ id: "e3", courseId: 2, status: "APPROVED", courseGrade: 6 }),
    ];

    expect(getCumulativeAverage(enrollments, courses, scale)).toBe(
      (3 * 10 + 5 * 10 + 6 * 5) / 25,
    );
  });

  test("leaves out pending enrollments and those without a course grade", () => {
    const enrollments = [
      enrollment({ id: "e1", courseId: 1, status: "PENDING", courseGrade: 7 }),
      enrollment({ id: "e2", courseId: 1, status: "APPROVED" }),
      enrollment({ id: "e3", courseId: 2, status: "APPROVED", courseGrade: 6 }),
    ];

    expect(getCumulativeAverage(enrollments, courses, scale)).toBe(6);
  });

  test("is missing without finished course grades", () => {
    expect(getCumulativeAverage([], courses, scale)).toBeNull();
  });
});

describe("parseGrade", () => {
  test("reads a decimal comma or point", () => {
    expect(parseGrade("5,5")).toBe(5.5);
    expect(parseGrade(" 4.25 ")).toBe(4.25);
  });

  test("keeps two decimals", () => {
    expect(parseGrade("4,567")).toBe(4.57);
  });

  test("tells an empty text from one that is not a number", () => {
    expect(parseGrade("")).toBeNull();
    expect(parseGrade("abc")).toBeNaN();
  });
});

describe("formatGrade", () => {
  test("writes at least one decimal with a comma", () => {
    expect(formatGrade(5)).toBe("5,0");
    expect(formatGrade(4.25)).toBe("4,25");
  });
});

describe("getAssessmentGrade", () => {
  test("tells a group's partial grade apart from its complete one", () => {
    expect(getAssessmentGrade(group([single(5), single(null)]), scale)).toEqual(
      { grade: 5, isPartial: true },
    );
    expect(
      getAssessmentGrade(group([single(2), single(6)], null, 1), scale),
    ).toEqual({ grade: 6, isPartial: false });
  });
});
