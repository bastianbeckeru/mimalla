import type { CurriculumData } from "@/types/curriculum";
import fs from "fs";
import path from "path";
import EnrollmentForm from "@/components/new-dashboard/enrollment-form";

export default function CreateCurriculumPage() {
  const programs = getAllPrograms();

  return <EnrollmentForm programs={programs} />;
}

function getAllPrograms() {
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
