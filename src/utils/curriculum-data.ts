"use server";

import fs from "node:fs";
import path from "node:path";
import type { CurriculumData } from "@/types/curriculum";

export async function getProgramData({
  institutionAcronym,
  programSlug,
}: {
  institutionAcronym: string;
  programSlug: string;
}) {
  const curriculumPath = path.join(
    process.cwd(),
    "src",
    "server",
    "db",
    "curriculums",
    institutionAcronym,
    `${programSlug}.json`,
  );

  const fileContent = fs.readFileSync(curriculumPath, "utf-8");
  return JSON.parse(fileContent) as CurriculumData;
}
