import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Database } from "@/server/db/database";
import { relations } from "@/server/db/relations";

const template = new PGlite();
await migrate(drizzle({ client: template }), {
  migrationsFolder: path.join(import.meta.dir, "..", "..", "drizzle"),
});

/** A migrated, empty database in memory, cloned for each test. */
export async function createTestDatabase(): Promise<Database> {
  const client = (await template.clone()) as PGlite;
  return drizzle({ client, relations });
}
