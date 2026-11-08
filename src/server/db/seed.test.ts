import { describe, expect, test } from "bun:test";
import { institution, program } from "@/server/db/schema";
import { type SeedInstitution, seedCatalog } from "@/server/db/seed";
import { createTestDatabase } from "@/test/database";

const UDP: SeedInstitution = {
  slug: "udp",
  acronym: "UDP",
  name: "Universidad Diego Portales",
  country: "CL",
  programs: [
    {
      slug: "derecho",
      name: "Derecho",
      metadata: { siesCode: "I3S1C1J1V1", schedule: "DAYTIME" },
    },
    { slug: "psicologia", name: "Psicología", metadata: {} },
  ],
};

describe("seedCatalog", () => {
  test("running it twice updates instead of duplicating", async () => {
    const db = await createTestDatabase();
    await seedCatalog(db, [UDP]);
    await seedCatalog(db, [
      {
        ...UDP,
        programs: [{ slug: "derecho", name: "Derecho (UDP)", metadata: {} }],
      },
    ]);

    expect(await db.select().from(institution)).toHaveLength(1);
    const programs = await db.query.program.findMany({
      columns: { slug: true, name: true },
      orderBy: { slug: "asc" },
    });
    expect(programs).toEqual([
      { slug: "derecho", name: "Derecho (UDP)" },
      { slug: "psicologia", name: "Psicología" },
    ]);
  });

  test("two institutions can have programs with the same slug", async () => {
    const db = await createTestDatabase();
    await seedCatalog(db, [
      UDP,
      { ...UDP, slug: "uch", acronym: "UCH", name: "Universidad de Chile" },
    ]);

    expect(await db.select().from(program)).toHaveLength(4);
  });
});
