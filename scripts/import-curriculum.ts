import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { drizzle } from "drizzle-orm/node-postgres";
import { importCurriculum } from "@/server/catalog/import-curriculum";
import * as schema from "@/server/db/schema";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { slug: { type: "string" } },
});
const [target] = positionals;
const databaseUrl = process.env.DATABASE_URL;
if (!target || !databaseUrl) {
  console.error(
    "Usage: DATABASE_URL=<url> bun run import <file> [--slug <program-slug>]",
  );
  process.exit(2);
}

const db = drizzle(databaseUrl, { schema, casing: "snake_case" });
const programSlug = values.slug ?? path.basename(target, ".json");

try {
  const result = await importCurriculum(
    db,
    JSON.parse(fs.readFileSync(target, "utf-8")),
    { programSlug },
  );
  if (result.ok) {
    console.log(`Imported ${target} as curriculum ${result.curriculumId}`);
  } else {
    console.error(`${target} was rejected (${result.problems.length})`);
    for (const problem of result.problems) {
      console.error(`  - ${problem.message}`);
    }
    process.exitCode = 1;
  }
} finally {
  await db.$client.end();
}
