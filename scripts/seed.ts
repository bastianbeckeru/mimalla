import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { readSeedFiles, seedCatalog } from "@/server/catalog/seed-catalog";
import * as schema from "@/server/db/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Usage: DATABASE_URL=<url> bun run db:seed");
  process.exit(2);
}

const db = drizzle(databaseUrl, { schema, casing: "snake_case" });

try {
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  for (const result of await seedCatalog(db, readSeedFiles())) {
    console.log(
      result.seeded
        ? `Seeded ${result.path} as curriculum ${result.curriculumId}`
        : `Skipped ${result.path}, already seeded as curriculum ${result.curriculumId}`,
    );
  }
  console.log(
    "Skipped revalidating the app on purpose: db:seed is for local development",
  );
} finally {
  await db.$client.end();
}
