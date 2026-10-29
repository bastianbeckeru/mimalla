import { describe, expect, test } from "bun:test";
import { exportFile } from "@/builder/export";
import { importFile } from "@/builder/import";
import {
  getCatalog,
  getCurriculumParams,
  getProgram,
  getProgramParams,
  readCurriculumFile,
} from "@/server/db/curriculums";

const curriculums = getCurriculumParams();

describe("catalog curriculum files", () => {
  test.each(
    curriculums.map((params) => [
      `${params.institutionAcronym}/${params.programSlug}_${params.effectiveYear}`,
      params,
    ]),
  )("%s loads and exports back unchanged", (_, params) => {
    const text = readCurriculumFile(params);
    const result = importFile(text);
    if (!result.ok) throw new Error(result.reason);
    expect(exportFile(result.draft)).toBe(JSON.stringify(JSON.parse(text)));
    expect(result.draft.curriculum.effectiveYear).toBe(
      Number(params.effectiveYear),
    );
  });

  test.each(
    getProgramParams().map((params) => [
      `${params.institutionAcronym}/${params.programSlug}`,
      params,
    ]),
  )("%s is registered under the institution its files name", (_, params) => {
    const program = getProgram(params);
    for (const effectiveYear of program.effectiveYears) {
      const result = importFile(
        readCurriculumFile({ ...params, effectiveYear: String(effectiveYear) }),
      );
      if (!result.ok) throw new Error(result.reason);
      expect(result.draft.curriculum.institution).toBe(
        program.institution.name,
      );
    }
  });

  test("lists every program in the catalog once", () => {
    const paths = getCatalog().flatMap((institution) =>
      institution.departments.flatMap((department) =>
        department.programs.map((program) => program.path),
      ),
    );
    expect(paths.toSorted()).toEqual(
      getProgramParams()
        .map((p) => `${p.institutionAcronym}/${p.programSlug}`)
        .toSorted(),
    );
  });
});
