import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { importCurriculum } from "@/server/catalog/import-curriculum";
import { revalidateApp } from "@/server/catalog/revalidate-app";
import { connectNodePostgres } from "@/server/db/client";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    slug: { type: "string" },
    publish: { type: "boolean", default: false },
    replace: { type: "boolean", default: false },
  },
});
const [target] = positionals;
const databaseUrl = process.env.DATABASE_URL;
if (!target || !databaseUrl) {
  console.error(
    "Usage: DATABASE_URL=<url> bun run import <file> [--slug <program-slug>] [--publish] [--replace]",
  );
  process.exit(2);
}

const db = connectNodePostgres(databaseUrl);
const programSlug = values.slug ?? path.basename(target, ".json");

try {
  const result = await importCurriculum(
    db,
    JSON.parse(fs.readFileSync(target, "utf-8")),
    { programSlug, publish: values.publish, replace: values.replace },
  );
  if (result.ok) {
    const published = values.publish ? ", published" : "";
    console.log(
      `Imported ${target} as curriculum ${result.curriculumId}${published}`,
    );
    await revalidateApp();
  } else if ("existingCurriculumId" in result) {
    console.error(
      `${target} was refused: curriculum ${result.existingCurriculumId} already exists for this program and year (pass --replace to replace it)`,
    );
    process.exitCode = 1;
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
