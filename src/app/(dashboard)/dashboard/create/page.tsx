import CurriculumForm from "@/components/dashboard/CurriculumForm";
import type { ModifiedCurriculumProps } from "@/types/curriculum";
import fs from "fs";
import path from "path";

export default function CreateCurriculumPage() {
  const programs = getAllPrograms();

  return <CurriculumForm programs={programs} />;
}

function getAllPrograms() {
  const institutionPath = path.join(
    process.cwd(),
    "src",
    "server",
    "old",
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
      const contentObject = JSON.parse(fileContent) as ModifiedCurriculumProps;

      programsMap.set(fileName, contentObject);
    });

  return programsMap;
}
