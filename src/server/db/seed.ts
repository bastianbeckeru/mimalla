import { sql } from "drizzle-orm";
import type { Database } from "@/server/db/database";
import { institution, type ProgramMetadata, program } from "@/server/db/schema";

export type SeedProgram = {
  slug: string;
  name: string;
  metadata: ProgramMetadata;
};

export type SeedInstitution = {
  slug: string;
  acronym: string;
  name: string;
  country: string;
  programs: SeedProgram[];
};

/** Inserts or updates institutions and programs by slug, so it can run again. */
export async function seedCatalog(
  db: Database,
  institutions: SeedInstitution[],
) {
  await db.transaction(async (tx) => {
    for (const { programs, ...fields } of institutions) {
      const [inserted] = await tx
        .insert(institution)
        .values(fields)
        .onConflictDoUpdate({
          target: institution.slug,
          set: {
            acronym: sql`excluded.acronym`,
            name: sql`excluded.name`,
            country: sql`excluded.country`,
          },
        })
        .returning({ id: institution.id });
      if (!inserted)
        throw new Error(`Institution ${fields.slug} was not saved`);
      const institutionId = inserted.id;

      if (programs.length === 0) continue;
      await tx
        .insert(program)
        .values(programs.map((p) => ({ ...p, institutionId })))
        .onConflictDoUpdate({
          target: [program.institutionId, program.slug],
          set: {
            name: sql`excluded.name`,
            metadata: sql`excluded.metadata`,
          },
        });
    }
  });
}
