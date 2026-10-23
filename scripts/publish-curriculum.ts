import { drizzle } from "drizzle-orm/node-postgres";
import { publishCurriculum } from "@/server/catalog/publish-curriculum";
import * as schema from "@/server/db/schema";

const [target] = process.argv.slice(2);
const curriculumId = Number(target);
const databaseUrl = process.env.DATABASE_URL;
if (!target || !Number.isInteger(curriculumId) || !databaseUrl) {
  console.error(
    "Usage: DATABASE_URL=<url> bun scripts/publish-curriculum.ts <curriculum-id>",
  );
  process.exit(2);
}

const db = drizzle(databaseUrl, { schema, casing: "snake_case" });

try {
  if (await publishCurriculum(db, curriculumId)) {
    console.log(`Published curriculum ${curriculumId}`);
  } else {
    console.error(`Curriculum ${curriculumId} does not exist`);
    process.exitCode = 1;
  }
} finally {
  await db.$client.end();
}
