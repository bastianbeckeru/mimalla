import { describe, expect, test } from "bun:test";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { importCurriculum } from "@/server/catalog/import-curriculum";
import { publishCurriculum } from "@/server/catalog/publish-curriculum";
import {
  getCatalog,
  getCurrentCurriculum,
  getCurriculum,
  getCurriculumParams,
} from "@/server/catalog/read-catalog";
import * as schema from "@/server/db/schema";
import type { CurriculumData } from "@/types/curriculum";

const template = new PGlite();
await migrate(drizzle({ client: template, casing: "snake_case" }), {
  migrationsFolder: path.join(process.cwd(), "drizzle"),
});

async function freshDatabase() {
  return drizzle({
    client: (await template.clone()) as PGlite,
    schema,
    casing: "snake_case",
  });
}

function course(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    code: `CRS${id}`,
    name: `Course ${id}`,
    credits: 6,
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
        { id: 2, year: 1, term: 3, position: 1, courseId: 2 },
        { id: 3, year: 2, term: 1, position: 1, courseId: 3 },
        { id: 4, year: 2, term: 1, position: 2, courseId: 3 },
      ],
      plans: [
        {
          id: 1,
          name: "Licenciatura",
          description: "Grado de licenciado",
          requiredCredits: 240,
          courseIds: [1, 2],
          subplanIds: [2],
          credential: { type: "ACADEMIC", name: "Licenciado/a en Derecho" },
        },
        {
          id: 2,
          name: "Electivos Profesionales",
          requiredCredits: 36,
          courseIds: [3],
          subplanIds: [],
          credential: null,
        },
      ],
    },
    areas: [
      {
        id: 1,
        name: "Derecho Privado",
        color: "#FF0000",
        courseIds: [1, 2],
        subareaIds: [2],
      },
      {
        id: 2,
        name: "Formación General",
        color: "#00FF00",
        courseIds: [3],
        subareaIds: [],
      },
    ],
    courses: [
      course(1, { description: "Introducción" }),
      course(2, { prerequisiteIds: [1], prerequisiteCredits: 12, duration: 2 }),
      course(3, {
        code: "CFG",
        name: "Curso de Formación General",
        isElective: true,
      }),
    ],
    ...overrides,
  };
}

function byCode(data: CurriculumData) {
  const codeOf = new Map(data.courses.map((c) => [c.id, c.code]));
  const codes = (ids: number[]) => ids.map((id) => codeOf.get(id)).sort();
  const areaName = new Map(data.areas.map((a) => [a.id, a.name]));
  const trackName = new Map(data.curriculum.tracks.map((t) => [t.id, t.name]));
  return {
    institution: data.institution,
    department: data.department,
    program: data.program,
    curriculum: {
      version: data.curriculum.version,
      year: data.curriculum.year,
      isCurrent: data.curriculum.isCurrent,
      slots: data.curriculum.slots
        .map(({ id: _, courseId, ...slot }) => ({
          ...slot,
          course: codeOf.get(courseId),
        }))
        .sort(
          (a, b) =>
            a.programYear - b.programYear ||
            a.term - b.term ||
            a.position - b.position,
        ),
      tracks: data.curriculum.tracks
        .map(({ id: _, courseIds, subplanIds, ...track }) => ({
          ...track,
          courses: codes(courseIds),
          subtracks: subplanIds.map((id) => trackName.get(id)),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    },
    areas: data.areas
      .map(({ id: _, courseIds, subareaIds, ...area }) => ({
        ...area,
        courses: codes(courseIds),
        subareas: subareaIds.map((id) => areaName.get(id)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    courses: data.courses
      .map(({ id: _, prerequisiteIds, ...rest }) => ({
        ...rest,
        prerequisites: codes(prerequisiteIds),
      }))
      .sort((a, b) => a.code.localeCompare(b.code)),
  };
}

async function importValid(
  db: Awaited<ReturnType<typeof freshDatabase>>,
  file: unknown,
  programSlug = "derecho",
  options: { publish?: boolean; replace?: boolean } = {},
) {
  const result = await importCurriculum(db, file, { programSlug, ...options });
  if (!result.ok) throw new Error(JSON.stringify(result));
  return result.curriculumId;
}

describe("import, then read by id", () => {
  test("a valid curriculum file reads back as the same curriculum data", async () => {
    const db = await freshDatabase();

    const curriculumId = await importValid(db, curriculumFile());
    const data = await getCurriculum(db, curriculumId);

    expect(data && byCode(data)).toEqual({
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
        isCurrent: false,
        slots: [
          { programYear: 1, term: 1, position: 1, course: "CRS1" },
          { programYear: 1, term: 3, position: 1, course: "CRS2" },
          { programYear: 2, term: 1, position: 1, course: "CFG" },
          { programYear: 2, term: 1, position: 2, course: "CFG" },
        ],
        tracks: [
          {
            name: "Electivos Profesionales",
            requiredCredits: 36,
            credential: null,
            courses: ["CFG"],
            subtracks: [],
          },
          {
            name: "Licenciatura",
            description: "Grado de licenciado",
            requiredCredits: 240,
            credential: { type: "ACADEMIC", name: "Licenciado/a en Derecho" },
            courses: ["CRS1", "CRS2"],
            subtracks: ["Electivos Profesionales"],
          },
        ],
      },
      areas: [
        {
          name: "Derecho Privado",
          color: "#FF0000",
          courses: ["CRS1", "CRS2"],
          subareas: ["Formación General"],
        },
        {
          name: "Formación General",
          color: "#00FF00",
          courses: ["CFG"],
          subareas: [],
        },
      ],
      courses: [
        {
          code: "CFG",
          name: "Curso de Formación General",
          credits: 6,
          duration: 1,
          prerequisiteCredits: 0,
          isElective: true,
          prerequisites: [],
        },
        {
          code: "CRS1",
          name: "Course 1",
          credits: 6,
          description: "Introducción",
          duration: 1,
          prerequisiteCredits: 0,
          isElective: false,
          prerequisites: [],
        },
        {
          code: "CRS2",
          name: "Course 2",
          credits: 6,
          duration: 2,
          prerequisiteCredits: 12,
          isElective: false,
          prerequisites: ["CRS1"],
        },
      ],
    });
  });

  test("an invalid file is rejected with the validator's problems and nothing is stored", async () => {
    const db = await freshDatabase();

    const result = await importCurriculum(
      db,
      curriculumFile({
        courses: [
          course(1),
          course(2, { code: "" }),
          course(3, { prerequisiteIds: [9] }),
        ],
      }),
      { programSlug: "derecho" },
    );

    expect(result).toEqual({
      ok: false,
      problems: [
        {
          rule: "missing-course",
          message: "course 3 (CRS3 Course 3) lists missing prerequisites: 9",
        },
        {
          rule: "empty-code",
          message: "course 2 (Course 2) has an empty code",
        },
      ],
    });
    expect(await getCurriculum(db, 1)).toBeNull();
  });

  test("a course that disagrees with the one the institution already has is rejected", async () => {
    const db = await freshDatabase();
    const firstId = await importValid(db, curriculumFile());

    const result = await importCurriculum(
      db,
      curriculumFile({
        program: { name: "Psicología", schedule: "DAYTIME" },
        courses: [
          course(1, { credits: 5 }),
          course(2, { prerequisiteIds: [1] }),
          course(3, {
            code: "CFG",
            name: "Curso de Formación General",
            isElective: true,
          }),
        ],
      }),
      { programSlug: "psicologia" },
    );

    expect(result).toEqual({
      ok: false,
      problems: [
        {
          rule: "shared-course-conflict",
          message:
            "course 1 (CRS1 Course 1) disagrees with UDP catalog on credits (5 vs 6)",
        },
      ],
    });
    expect(await getCurriculum(db, firstId + 1)).toBeNull();
  });

  describe("two curriculums of one institution that share a course", () => {
    const psicologia = () =>
      curriculumFile({
        department: { name: "Facultad de Psicología", acronym: "FP" },
        program: { name: "Psicología", schedule: "DAYTIME" },
        curriculum: {
          year: 2020,
          structure: [
            { id: 1, year: 1, term: 1, position: 1, courseId: 10 },
            { id: 2, year: 1, term: 3, position: 1, courseId: 20 },
          ],
          plans: [],
        },
        areas: [
          {
            id: 1,
            name: "Formación General",
            color: "#0000FF",
            courseIds: [20],
            subareaIds: [],
          },
        ],
        courses: [
          course(10, { code: "PSI1", name: "Psicología General" }),
          course(20, {
            code: "CRS2",
            name: "Course 2",
            prerequisiteIds: [10],
            isElective: true,
            duration: 1,
          }),
        ],
      });

    test("each keeps its own prerequisites, elective flag and duration", async () => {
      const db = await freshDatabase();
      const derechoId = await importValid(db, curriculumFile());
      const psicologiaId = await importValid(db, psicologia(), "psicologia");

      const shared = async (curriculumId: number) => {
        const data = (await getCurriculum(db, curriculumId)) as CurriculumData;
        const { prerequisites, isElective, duration } = byCode(
          data,
        ).courses.find((c) => c.code === "CRS2") as ReturnType<
          typeof byCode
        >["courses"][number];
        return { prerequisites, isElective, duration };
      };

      expect(await shared(derechoId)).toEqual({
        prerequisites: ["CRS1"],
        isElective: false,
        duration: 2,
      });
      expect(await shared(psicologiaId)).toEqual({
        prerequisites: ["PSI1"],
        isElective: true,
        duration: 1,
      });
    });

    test("the course can belong to a different area in each", async () => {
      const db = await freshDatabase();
      const derechoId = await importValid(db, curriculumFile());
      const psicologiaId = await importValid(db, psicologia(), "psicologia");

      const areasOf = async (curriculumId: number) =>
        byCode((await getCurriculum(db, curriculumId)) as CurriculumData)
          .areas.filter((a) => a.courses.includes("CRS2"))
          .map((a) => a.name);

      expect(await areasOf(derechoId)).toEqual(["Derecho Privado"]);
      expect(await areasOf(psicologiaId)).toEqual(["Formación General"]);
    });
  });

  describe("the database rejects a reference to a course of another curriculum", () => {
    async function twoCurriculums() {
      const db = await freshDatabase();
      const curriculumId = await importValid(db, curriculumFile());
      const otherId = await importValid(
        db,
        curriculumFile({ program: { name: "Diseño", schedule: "DAYTIME" } }),
        "diseno",
      );
      const idOf = async (id: number, code: string) =>
        (
          ((await getCurriculum(db, id)) as CurriculumData).courses.find(
            (c) => c.code === code,
          ) as { id: number }
        ).id;
      return {
        db,
        curriculumId,
        own: await idOf(curriculumId, "CFG"),
        foreign: await idOf(otherId, "CRS1"),
      };
    }

    const foreignKeyViolation = expect.objectContaining({
      cause: expect.objectContaining({ code: "23503" }),
    });

    test("a prerequisite", async () => {
      const { db, curriculumId, own, foreign } = await twoCurriculums();

      const insert = async (requiredCurriculumCourseId: number) => {
        await db.insert(schema.prerequisite).values({
          curriculumId,
          curriculumCourseId: own,
          requiredCurriculumCourseId,
        });
      };

      await expect(insert(foreign)).rejects.toEqual(foreignKeyViolation);
    });

    test("a slot", async () => {
      const { db, curriculumId, own, foreign } = await twoCurriculums();

      const insert = async (curriculumCourseId: number, position: number) => {
        await db.insert(schema.slot).values({
          curriculumId,
          curriculumCourseId,
          programYear: 5,
          term: 1,
          position,
        });
      };

      await insert(own, 1);
      await expect(insert(foreign, 2)).rejects.toEqual(foreignKeyViolation);
    });
  });
});

describe("import, then read the catalog", () => {
  const derecho = { institutionAcronym: "udp", programSlug: "derecho" };

  test("a draft curriculum is not in the catalog nor the static parameters, and its program does not resolve", async () => {
    const db = await freshDatabase();

    const curriculumId = await importValid(db, curriculumFile());

    expect(await getCatalog(db)).toEqual([]);
    expect(await getCurriculumParams(db)).toEqual([]);
    expect(await getCurrentCurriculum(db, derecho)).toBeNull();
    expect(await getCurriculum(db, curriculumId)).not.toBeNull();
  });

  test("once published, it is in the catalog and the static parameters, and its program resolves to it", async () => {
    const db = await freshDatabase();
    const curriculumId = await importValid(db, curriculumFile());

    expect(await publishCurriculum(db, curriculumId)).toBe(true);

    expect(await getCatalog(db)).toEqual([
      {
        name: "Universidad Diego Portales",
        acronym: "UDP",
        departments: [
          {
            name: "Facultad de Derecho",
            programs: [{ name: "Derecho", path: "udp/derecho" }],
          },
        ],
      },
    ]);
    expect(await getCurriculumParams(db)).toEqual([derecho]);
    const current = await getCurrentCurriculum(db, derecho);
    expect(current).toEqual(await getCurriculum(db, curriculumId));
    expect(current?.curriculum.isCurrent).toBe(true);
  });

  test("publishing an unknown curriculum reports that nothing was published", async () => {
    const db = await freshDatabase();

    expect(await publishCurriculum(db, 1)).toBe(false);
  });

  test("an import can publish right away, and the catalog groups published programs by institution and department, sorted by name", async () => {
    const db = await freshDatabase();
    const published = { publish: true };
    const psicologiaDepartment = {
      name: "Facultad de Psicología",
      acronym: "FP",
    };
    await importValid(
      db,
      curriculumFile({
        department: psicologiaDepartment,
        program: { name: "Psicología", schedule: "DAYTIME" },
      }),
      "psicologia",
      published,
    );
    await importValid(db, curriculumFile(), "derecho", published);
    await importValid(
      db,
      curriculumFile({
        department: psicologiaDepartment,
        program: { name: "Diseño", schedule: "DAYTIME" },
      }),
      "diseno",
      published,
    );
    await importValid(
      db,
      curriculumFile({
        program: { name: "Obstetricia", schedule: "DAYTIME" },
      }),
      "obstetricia",
    );
    await importValid(
      db,
      curriculumFile({
        institution: { name: "Universidad de Chile", acronym: "UCH" },
        department: { name: "Facultad de Química", acronym: "FQ" },
        program: { name: "Química y Farmacia", schedule: "DAYTIME" },
      }),
      "quimica-y-farmacia",
      published,
    );

    expect(await getCatalog(db)).toEqual([
      {
        name: "Universidad de Chile",
        acronym: "UCH",
        departments: [
          {
            name: "Facultad de Química",
            programs: [
              { name: "Química y Farmacia", path: "uch/quimica-y-farmacia" },
            ],
          },
        ],
      },
      {
        name: "Universidad Diego Portales",
        acronym: "UDP",
        departments: [
          {
            name: "Facultad de Derecho",
            programs: [{ name: "Derecho", path: "udp/derecho" }],
          },
          {
            name: "Facultad de Psicología",
            programs: [
              { name: "Diseño", path: "udp/diseno" },
              { name: "Psicología", path: "udp/psicologia" },
            ],
          },
        ],
      },
    ]);
    const params = await getCurriculumParams(db);
    expect(
      params.map((p) => `${p.institutionAcronym}/${p.programSlug}`).sort(),
    ).toEqual([
      "uch/quimica-y-farmacia",
      "udp/derecho",
      "udp/diseno",
      "udp/psicologia",
    ]);
  });

  test("with two published curriculums, the program resolves to the latest year and the other stays reachable by id", async () => {
    const db = await freshDatabase();
    const yearOf = (year: number, version: string) =>
      curriculumFile({
        curriculum: { ...curriculumFile().curriculum, year, version },
      });
    const latestId = await importValid(db, yearOf(2023, "v6.0"), "derecho", {
      publish: true,
    });
    const olderId = await importValid(db, yearOf(2018, "v5.0"), "derecho", {
      publish: true,
    });
    await importValid(db, yearOf(2026, "v7.0"));

    const current = await getCurrentCurriculum(db, derecho);
    const older = await getCurriculum(db, olderId);

    expect(current).toEqual(await getCurriculum(db, latestId));
    expect(current?.curriculum).toMatchObject({
      year: 2023,
      version: "v6.0",
      isCurrent: true,
    });
    expect(older?.curriculum).toMatchObject({
      year: 2018,
      version: "v5.0",
      isCurrent: false,
    });
    expect(await getCurriculumParams(db)).toEqual([derecho]);
  });

  describe("an import for a program and year that already have a curriculum", () => {
    const revised = () =>
      curriculumFile({
        curriculum: { ...curriculumFile().curriculum, version: "v6.1" },
        courses: [
          course(1, { description: "Introducción" }),
          course(2, { prerequisiteIds: [1], prerequisiteCredits: 18 }),
          course(3, {
            code: "CFG",
            name: "Curso de Formación General",
            isElective: true,
          }),
        ],
      });

    test("is refused by default and leaves the existing curriculum as it was", async () => {
      const db = await freshDatabase();
      const existingId = await importValid(db, curriculumFile(), "derecho", {
        publish: true,
      });
      const before = await getCurriculum(db, existingId);

      const result = await importCurriculum(db, revised(), {
        programSlug: "derecho",
      });

      expect(result).toEqual({ ok: false, existingCurriculumId: existingId });
      expect(await getCurrentCurriculum(db, derecho)).toEqual(before);
    });

    test("replaces the existing curriculum, under the same id, when replacement is requested", async () => {
      const db = await freshDatabase();
      const existingId = await importValid(db, curriculumFile(), "derecho", {
        publish: true,
      });

      const replacedId = await importValid(db, revised(), "derecho", {
        replace: true,
        publish: true,
      });

      const current = await getCurrentCurriculum(db, derecho);
      expect(replacedId).toBe(existingId);
      expect(current).toEqual(await getCurriculum(db, existingId));
      const { curriculum: replaced, courses } = byCode(
        current as CurriculumData,
      );
      expect(replaced.version).toBe("v6.1");
      expect(replaced.slots).toHaveLength(4);
      expect(replaced.tracks).toHaveLength(2);
      expect(courses.map((c) => [c.code, c.prerequisiteCredits])).toEqual([
        ["CFG", 0],
        ["CRS1", 0],
        ["CRS2", 18],
      ]);
      expect(byCode(current as CurriculumData).areas).toHaveLength(2);
    });

    test("a replacement is a draft unless it is published", async () => {
      const db = await freshDatabase();
      const existingId = await importValid(db, curriculumFile(), "derecho", {
        publish: true,
      });

      await importValid(db, revised(), "derecho", { replace: true });

      expect(await getCurrentCurriculum(db, derecho)).toBeNull();
      expect((await getCurriculum(db, existingId))?.curriculum.version).toBe(
        "v6.1",
      );
    });
  });
});
