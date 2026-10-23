import { publishCurriculum } from "@/server/catalog/publish-curriculum";
import { revalidateApp } from "@/server/catalog/revalidate-app";
import { connectNodePostgres } from "@/server/db/client";

const [target] = process.argv.slice(2);
const curriculumId = Number(target);
const databaseUrl = process.env.DATABASE_URL;
if (!target || !Number.isInteger(curriculumId) || !databaseUrl) {
  console.error(
    "Usage: DATABASE_URL=<url> bun scripts/publish-curriculum.ts <curriculum-id>",
  );
  process.exit(2);
}

const db = connectNodePostgres(databaseUrl);

try {
  if (await publishCurriculum(db, curriculumId)) {
    console.log(`Published curriculum ${curriculumId}`);
    await revalidateApp();
  } else {
    console.error(`Curriculum ${curriculumId} does not exist`);
    process.exitCode = 1;
  }
} finally {
  await db.$client.end();
}
