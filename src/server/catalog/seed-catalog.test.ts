import { describe, expect, test } from "bun:test";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { getCurriculum } from "@/server/catalog/read-catalog";
import { readSeedFiles, seedCatalog } from "@/server/catalog/seed-catalog";
import { validateCurriculumFiles } from "@/server/catalog/validate-curriculum";
import * as schema from "@/server/db/schema";

type SeedContent = {
  institution: { acronym: string };
  courses: { code: string }[];
};

describe("sample seed", () => {
  test("holds at least two programs of one institution that share courses", () => {
    const contents = readSeedFiles().map(
      ({ content }) => content as SeedContent,
    );
    const codesOf = (content: SeedContent | undefined) =>
      new Set(content?.courses.map(({ code }) => code));
    const [first, second] = contents;

    expect(contents.length).toBeGreaterThanOrEqual(2);
    expect(
      new Set(contents.map(({ institution }) => institution.acronym)).size,
    ).toBe(1);
    expect([...codesOf(first)].some((code) => codesOf(second).has(code))).toBe(
      true,
    );
  });

  test("passes the validator", () => {
    const reports = validateCurriculumFiles(readSeedFiles());

    expect(reports.flatMap(({ problems }) => problems)).toEqual([]);
  });
});

describe("seeding the catalog", () => {
  test("publishes the seeded curriculums, and running it again adds nothing", async () => {
    const client = new PGlite();
    const db = drizzle({ client, schema, casing: "snake_case" });
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });

    const first = await seedCatalog(db, readSeedFiles());
    const second = await seedCatalog(db, readSeedFiles());
    const programs = await Promise.all(
      second.map(async ({ curriculumId }) => {
        const data = await getCurriculum(db, curriculumId);
        return {
          program: data?.program.name,
          courses: data?.courses.length,
          isCurrent: data?.curriculum.isCurrent,
        };
      }),
    );

    expect(first.map(({ seeded }) => seeded)).toEqual([true, true]);
    expect(second.map(({ seeded }) => seeded)).toEqual([false, false]);
    expect(second.map(({ curriculumId }) => curriculumId)).toEqual(
      first.map(({ curriculumId }) => curriculumId),
    );
    expect(programs).toEqual([
      {
        program: "Ingeniería Civil Industrial",
        courses: 11,
        isCurrent: true,
      },
      {
        program: "Ingeniería Civil en Informática",
        courses: 11,
        isCurrent: true,
      },
    ]);
    await client.close();
  });
});
