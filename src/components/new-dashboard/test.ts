"use server";

import type { CurriculumData } from "@/types/curriculum";
import fs from "fs";
import path from "path";

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

export async function getAllPrograms() {
  const institutionPath = path.join(
    process.cwd(),
    "src",
    "server",
    "db",
    "curriculums",
    "udp",
  );

  const files = fs.readdirSync(institutionPath);
  const programsMap = new Map();

  files
    .filter((file) => file.endsWith(".json"))
    .forEach((fileName) => {
      const filePath = path.join(institutionPath, fileName);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const contentObject = JSON.parse(fileContent) as CurriculumData;

      programsMap.set(fileName, contentObject);
    });

  return programsMap;
}
