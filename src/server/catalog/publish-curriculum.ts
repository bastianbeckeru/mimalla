import { eq } from "drizzle-orm";
import { curriculum } from "@/server/db/schema";
import type { Database } from "@/types/database";

export async function publishCurriculum(db: Database, curriculumId: number) {
  const published = await db
    .update(curriculum)
    .set({ status: "published" })
    .where(eq(curriculum.id, curriculumId))
    .returning({ id: curriculum.id });
  return published.length > 0;
}
