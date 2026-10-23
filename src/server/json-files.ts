import fs from "node:fs";

export function listJsonFiles(directory: string) {
  return fs
    .readdirSync(directory, { recursive: true, encoding: "utf-8" })
    .filter((file) => file.endsWith(".json"))
    .sort();
}
