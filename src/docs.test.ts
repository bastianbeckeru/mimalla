import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dir, "..");
const PATH_BASES = ["", "src", "src/server/db/curriculums"].map((base) =>
  path.join(REPO_ROOT, base),
);
const FOLDERS = new Set(
  PATH_BASES.flatMap((base) =>
    readdirSync(base, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name),
  ),
);

function getMarkdownFiles() {
  const { stdout } = Bun.spawnSync([
    "git",
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "*.md",
  ]);
  return stdout.toString().trim().split("\n");
}

function isPathToCheck(token: string) {
  const [folder = "", rest] = token.split("/");
  return rest !== undefined && FOLDERS.has(folder) && !/[<>*{}\s]/.test(token);
}

function getInlineCodePaths(markdown: string) {
  return [...markdown.matchAll(/`([^`\n]+)`/g)]
    .map((match) => match[1] ?? "")
    .filter(isPathToCheck);
}

function getLinkTargets(markdown: string) {
  return [...markdown.matchAll(/\]\(([^)\s]+)\)/g)]
    .map((match) => (match[1] ?? "").split("#")[0] ?? "")
    .filter((target) => target !== "" && !/^[a-z]+:/.test(target));
}

function getMissingPaths(file: string) {
  const markdown = readFileSync(path.join(REPO_ROOT, file), "utf8").replace(
    /^```[\s\S]*?^```/gm,
    "",
  );
  const missingCode = getInlineCodePaths(markdown).filter(
    (token) => !PATH_BASES.some((base) => existsSync(path.join(base, token))),
  );
  const missingLinks = getLinkTargets(markdown).filter(
    (target) => !existsSync(path.join(REPO_ROOT, path.dirname(file), target)),
  );
  return [...missingCode, ...missingLinks];
}

describe("markdown files", () => {
  test.each(getMarkdownFiles())("%s cites paths that exist", (file) => {
    expect(getMissingPaths(file)).toEqual([]);
  });
});
