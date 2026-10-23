import fs from "node:fs";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { importCurriculum } from "@/server/catalog/import-curriculum";
import { curriculum, institution, program } from "@/server/db/schema";
import type { Database } from "@/types/database";

type SeedFile = { path: string; programSlug: string; content: unknown };

type SeedHeader = {
  institution?: { acronym?: string };
  curriculum?: { year?: number };
};

const seedDirectory = path.join(process.cwd(), "seed");

export function readSeedFiles(): SeedFile[] {
  return fs
    .readdirSync(seedDirectory, { recursive: true, encoding: "utf-8" })
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => ({
      path: file,
      programSlug: path.basename(file, ".json"),
      content: JSON.parse(
        fs.readFileSync(path.join(seedDirectory, file), "utf-8"),
      ) as unknown,
    }));
}

async function findSeededCurriculum(db: Database, file: SeedFile) {
  const header = file.content as SeedHeader;
  const acronym = header.institution?.acronym;
  const year = header.curriculum?.year;
  if (acronym === undefined || year === undefined) return undefined;
  const [found] = await db
    .select({ id: curriculum.id })
    .from(curriculum)
    .innerJoin(program, eq(program.id, curriculum.programId))
    .innerJoin(institution, eq(institution.id, program.institutionId))
    .where(
      and(
        eq(institution.acronym, acronym),
        eq(program.slug, file.programSlug),
        eq(curriculum.year, year),
      ),
    );
  return found?.id;
}

export async function seedCatalog(db: Database, files: SeedFile[]) {
  const results: { path: string; curriculumId: number; seeded: boolean }[] = [];
  for (const file of files) {
    const existing = await findSeededCurriculum(db, file);
    if (existing !== undefined) {
      results.push({ path: file.path, curriculumId: existing, seeded: false });
      continue;
    }
    const result = await importCurriculum(db, file.content, {
      programSlug: file.programSlug,
    });
    if (!result.ok) {
      const messages = result.problems.map(({ message }) => message);
      throw new Error(
        `Seed file ${file.path} was rejected: ${messages.join("; ")}`,
      );
    }
    results.push({
      path: file.path,
      curriculumId: result.curriculumId,
      seeded: true,
    });
  }
  return results;
}
