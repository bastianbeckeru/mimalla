import fs from "node:fs";
import path from "node:path";
import { validateCurriculumFiles } from "@/server/catalog/validate-curriculum";
import { listJsonFiles } from "@/server/json-files";

const target = process.argv[2];
if (!target) {
  console.error("Usage: bun run validate <file|dir>");
  process.exit(2);
}

const isDirectory = fs.statSync(target).isDirectory();
const baseDirectory = isDirectory ? target : path.dirname(target);
const filePaths = isDirectory
  ? listJsonFiles(target).map((file) => path.join(target, file))
  : [target];

const unreadable: { path: string; message: string }[] = [];
const files = filePaths.flatMap((filePath) => {
  const relativePath = path.relative(baseDirectory, filePath);
  try {
    return [
      {
        path: relativePath,
        content: JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown,
      },
    ];
  } catch (error) {
    unreadable.push({ path: relativePath, message: String(error) });
    return [];
  }
});

const reports = [
  ...unreadable.map(({ path, message }) => ({
    path,
    messages: [`cannot be parsed: ${message}`],
  })),
  ...validateCurriculumFiles(files).map(({ path, problems }) => ({
    path,
    messages: problems.map((problem) => problem.message),
  })),
].filter(({ messages }) => messages.length > 0);

for (const { path, messages } of reports) {
  console.log(`${path} (${messages.length})`);
  for (const message of messages) console.log(`  - ${message}`);
  console.log();
}

process.exit(reports.length > 0 ? 1 : 0);
