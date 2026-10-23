import { describe, expect, test } from "bun:test";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { importCurriculum } from "@/server/catalog/import-curriculum";
import { getCurriculum } from "@/server/catalog/read-catalog";
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
) {
  const result = await importCurriculum(db, file, { programSlug });
  if (!result.ok) throw new Error(JSON.stringify(result.problems));
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
});
