import { describe, expect, test } from "bun:test";
import {
  validateCurriculum,
  validateCurriculumFiles,
} from "@/server/catalog/validate-curriculum";

function course(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    code: `CRS${id}`,
    name: `Course ${id}`,
    credits: 6,
    description: "",
    duration: 1,
    prerequisiteCredits: 0,
    prerequisiteIds: [],
    isElective: false,
    ...overrides,
  };
}

function curriculumFile(overrides: Record<string, unknown> = {}) {
  return {
    institution: { name: "Universidad Diego Portales", acronym: "UDP" },
    department: { name: "Facultad de Derecho", acronym: "FD" },
    program: {
      name: "Derecho",
      siesCode: "I3S1C1J1V1",
      demreCode: 38004,
      schedule: "DAYTIME",
    },
    curriculum: {
      version: "v6.0",
      year: 2023,
      structure: [
        { id: 1, year: 1, term: 1, position: 1, courseId: 1 },
        { id: 2, year: 1, term: 2, position: 1, courseId: 2 },
      ],
      plans: [
        {
          id: 1,
          name: "Derecho",
          requiredCredits: -1,
          courseIds: [1, 2],
          subplanIds: [],
          credential: { type: "PROFESSIONAL", name: "Abogado/a" },
        },
      ],
    },
    areas: [
      {
        id: 1,
        name: "Derecho Privado",
        color: "#FFFFFF",
        courseIds: [1, 2],
        subareaIds: [],
      },
    ],
    courses: [course(1), course(2, { prerequisiteIds: [1] })],
    ...overrides,
  };
}

describe("validateCurriculum", () => {
  test("a valid curriculum has no problems", () => {
    expect(validateCurriculum(curriculumFile())).toEqual([]);
  });

  describe("references to courses missing from the curriculum", () => {
    test("a prerequisite", () => {
      const file = curriculumFile({
        courses: [course(1), course(2, { prerequisiteIds: [1, 21] })],
      });

      expect(validateCurriculum(file)).toEqual([
        {
          rule: "missing-course",
          message: "course 2 (CRS2 Course 2) lists missing prerequisites: 21",
        },
      ]);
    });

    test("a slot, an area and a track", () => {
      const valid = curriculumFile();
      const file = {
        ...valid,
        curriculum: {
          ...valid.curriculum,
          structure: [
            ...valid.curriculum.structure,
            { id: 3, year: 1, term: 1, position: 2, courseId: 30 },
          ],
          plans: [{ ...valid.curriculum.plans[0], courseIds: [1, 2, 40] }],
        },
        areas: [{ ...valid.areas[0], courseIds: [1, 50, 51] }],
      };

      expect(validateCurriculum(file)).toEqual([
        { rule: "missing-course", message: "slot 3 places missing course 30" },
        {
          rule: "missing-course",
          message: "area 1 (Derecho Privado) lists missing courses: 50, 51",
        },
        {
          rule: "missing-course",
          message: "track 1 (Derecho) lists missing courses: 40",
        },
      ]);
    });
  });

  describe("course codes", () => {
    test("an empty code", () => {
      const file = curriculumFile({
        courses: [course(1, { code: " " }), course(2)],
      });

      expect(validateCurriculum(file)).toEqual([
        {
          rule: "empty-code",
          message: "course 1 (Course 1) has an empty code",
        },
      ]);
    });

    test("two courses with the same code", () => {
      const file = curriculumFile({
        courses: [course(1), course(2, { code: "CRS1" })],
      });

      expect(validateCurriculum(file)).toEqual([
        {
          rule: "duplicate-code",
          message: "courses 1, 2 share the code CRS1",
        },
      ]);
    });
  });

  test("prerequisite cycles", () => {
    const file = curriculumFile({
      courses: [
        course(1, { prerequisiteIds: [3] }),
        course(2, { prerequisiteIds: [1] }),
        course(3, { prerequisiteIds: [2] }),
        course(4, { prerequisiteIds: [4] }),
        course(5, { prerequisiteIds: [1] }),
      ],
    });

    expect(validateCurriculum(file)).toEqual([
      {
        rule: "prerequisite-cycle",
        message: "prerequisite cycle among courses 1, 2, 3",
      },
      {
        rule: "prerequisite-cycle",
        message: "prerequisite cycle among courses 4",
      },
    ]);
  });

  describe("fields", () => {
    test("a missing required field has no default", () => {
      const { isElective: _, ...withoutElectiveFlag } = course(2);
      const valid = curriculumFile();
      const file = {
        ...valid,
        program: { name: "Derecho" },
        courses: [course(1), withoutElectiveFlag],
      };

      expect(validateCurriculum(file)).toEqual([
        { rule: "missing-field", message: "program is missing schedule" },
        {
          rule: "missing-field",
          message: "course 2 (CRS2 Course 2) is missing isElective",
        },
      ]);
    });

    test("a field with an invalid value", () => {
      const valid = curriculumFile();
      const file = {
        ...valid,
        curriculum: {
          ...valid.curriculum,
          structure: [
            { id: 1, year: 1, term: 5, position: 1, courseId: 1 },
            { id: 2, year: 1, term: 2, position: 1, courseId: 2 },
          ],
        },
        courses: [course(1, { credits: "6" }), course(2)],
      };

      expect(validateCurriculum(file)).toEqual([
        { rule: "invalid-field", message: "slot 1 has an invalid term: 5" },
        {
          rule: "invalid-field",
          message: 'course 1 (CRS1 Course 1) has an invalid credits: "6"',
        },
      ]);
    });

    test("optional fields may be left out", () => {
      const valid = curriculumFile();
      const { description: _, ...withoutDescription } = course(1);
      const file = {
        ...valid,
        program: { name: "Derecho", schedule: "EVENING", siesCode: null },
        curriculum: { ...valid.curriculum, version: undefined },
        courses: [withoutDescription, course(2, { description: null })],
      };

      expect(validateCurriculum(file)).toEqual([]);
    });
  });

  describe("courses shared with other curriculums of the institution", () => {
    test("the same id in another file with a different code, name or credits", () => {
      const file = curriculumFile({
        courses: [
          course(1, { code: "CIG1013", name: "Inglés II", credits: 5 }),
          course(2),
        ],
      });
      const knownCourses = [
        {
          id: 1,
          code: "CIG1013",
          name: "Inglés II",
          credits: 6,
          source: "udp/diseno.json",
        },
        {
          id: 1,
          code: "CIG1012",
          name: "Inglés 2",
          credits: 5,
          source: "udp/psicologia.json",
        },
        {
          id: 1,
          code: "CIG1013",
          name: "Inglés II",
          credits: 5,
          source: "udp/derecho.json",
        },
      ];

      expect(validateCurriculum(file, knownCourses)).toEqual([
        {
          rule: "shared-course-conflict",
          message:
            "course 1 (CIG1013 Inglés II) disagrees with udp/diseno.json on credits (5 vs 6)",
        },
        {
          rule: "shared-course-conflict",
          message:
            'course 1 (CIG1013 Inglés II) disagrees with udp/psicologia.json on code ("CIG1013" vs "CIG1012"), name ("Inglés II" vs "Inglés 2")',
        },
      ]);
    });

    test("the same code in the institution's database with a different name", () => {
      const file = curriculumFile();
      const knownCourses = [
        {
          code: "CRS2",
          name: "Another course",
          credits: 6,
          source: "database",
        },
      ];

      expect(validateCurriculum(file, knownCourses)).toEqual([
        {
          rule: "shared-course-conflict",
          message:
            'course 2 (CRS2 Course 2) disagrees with database on name ("Course 2" vs "Another course")',
        },
      ]);
    });
  });

  test("files of the same institution are checked against each other", () => {
    const derecho = curriculumFile();
    const psicologia = curriculumFile({
      courses: [course(1, { credits: 5 }), course(2)],
    });
    const quimica = curriculumFile({
      institution: { name: "Universidad de Chile", acronym: "UCH" },
      courses: [course(1, { name: "Química General" }), course(2)],
    });

    expect(
      validateCurriculumFiles([
        { path: "udp/derecho.json", content: derecho },
        { path: "udp/psicologia.json", content: psicologia },
        { path: "uch/quimica.json", content: quimica },
      ]),
    ).toEqual([
      {
        path: "udp/derecho.json",
        problems: [
          {
            rule: "shared-course-conflict",
            message:
              "course 1 (CRS1 Course 1) disagrees with udp/psicologia.json on credits (6 vs 5)",
          },
        ],
      },
      {
        path: "udp/psicologia.json",
        problems: [
          {
            rule: "shared-course-conflict",
            message:
              "course 1 (CRS1 Course 1) disagrees with udp/derecho.json on credits (5 vs 6)",
          },
        ],
      },
      { path: "uch/quimica.json", problems: [] },
    ]);
  });

  test("two slots in the same program year, term and position", () => {
    const valid = curriculumFile();
    const file = {
      ...valid,
      curriculum: {
        ...valid.curriculum,
        structure: [
          { id: 1, year: 1, term: 1, position: 1, courseId: 1 },
          { id: 2, year: 1, term: 1, position: 1, courseId: 2 },
          { id: 3, year: 2, term: 1, position: 1, courseId: 2 },
        ],
      },
    };

    expect(validateCurriculum(file)).toEqual([
      {
        rule: "overlapping-slots",
        message: "slots 1, 2 share program year 1, term 1 and position 1",
      },
    ]);
  });
});
