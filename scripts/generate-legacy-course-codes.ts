import fs from "node:fs";
import path from "node:path";
import { listJsonFiles } from "@/server/json-files";

const curriculumsDirectory = path.join(
  process.cwd(),
  "src/server/db/curriculums",
);
const outputPath = path.join(
  process.cwd(),
  "src/stores/legacy-course-codes.json",
);

type LegacyCurriculumFile = { courses: { id: number; code: string }[] };

const files = listJsonFiles(curriculumsDirectory);

const codesByPath = Object.fromEntries(
  files.map((file) => {
    const { courses } = JSON.parse(
      fs.readFileSync(path.join(curriculumsDirectory, file), "utf-8"),
    ) as LegacyCurriculumFile;
    const codes = Object.fromEntries(
      courses
        .filter((course) => course.code.trim() !== "")
        .sort((a, b) => a.id - b.id)
        .map((course) => [course.id, course.code.trim()]),
    );
    return [
      file
        .replace(/\.json$/, "")
        .split(path.sep)
        .join("/"),
      codes,
    ];
  }),
);

fs.writeFileSync(outputPath, `${JSON.stringify(codesByPath, null, 2)}\n`);

const mapped = Object.values(codesByPath).reduce(
  (total, codes) => total + Object.keys(codes).length,
  0,
);
console.log(`Wrote ${mapped} course codes for ${files.length} programs.`);
