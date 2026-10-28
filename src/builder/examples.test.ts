import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { exportFile } from "@/builder/export";
import { importFile } from "@/builder/import";

const EXAMPLES_DIR = join(import.meta.dir, "../../public/builder/examples");

const examples = readdirSync(EXAMPLES_DIR, { recursive: true })
  .map(String)
  .filter((path) => path.endsWith(".malla"));

describe("example files", () => {
  test.each(examples)("%s loads and exports back unchanged", (path) => {
    const text = readFileSync(join(EXAMPLES_DIR, path), "utf8");
    const result = importFile(text);
    if (!result.ok) throw new Error(result.reason);
    expect(exportFile(result.draft)).toBe(JSON.stringify(JSON.parse(text)));
  });
});
