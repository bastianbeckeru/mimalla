import fs from "node:fs";
import path from "node:path";
import { importFile } from "@/builder/import";
import { INSTITUTIONS, PROGRAMS } from "@/server/db/programs";
import type { CatalogInstitution, Program } from "@/types/curriculum";
import { getCurrentYear } from "@/utils/curriculum";

const CURRICULUMS_DIR = path.join(
  process.cwd(),
  "src",
  "server",
  "db",
  "curriculums",
);

const FILE_NAME_PATTERN = /^(.+)_(\d+)\.malla$/;

type ProgramParams = {
  institutionAcronym: string;
  programSlug: string;
};

type CurriculumParams = ProgramParams & {
  effectiveYear: string;
};

export function getCurriculumParams(): CurriculumParams[] {
  return fs
    .readdirSync(CURRICULUMS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((institution) =>
      fs
        .readdirSync(path.join(CURRICULUMS_DIR, institution.name))
        .flatMap((file) => {
          const [, programSlug, effectiveYear] =
            FILE_NAME_PATTERN.exec(file) ?? [];
          if (!programSlug || !effectiveYear) return [];
          return [
            {
              institutionAcronym: institution.name,
              programSlug,
              effectiveYear,
            },
          ];
        }),
    );
}

function toProgramPath({ institutionAcronym, programSlug }: ProgramParams) {
  return `${institutionAcronym}/${programSlug}`;
}

export function getProgramParams(): ProgramParams[] {
  const programs = new Map(
    getCurriculumParams().map(({ institutionAcronym, programSlug }) => [
      toProgramPath({ institutionAcronym, programSlug }),
      { institutionAcronym, programSlug },
    ]),
  );
  return [...programs.values()];
}

export function readCurriculumFile({
  institutionAcronym,
  programSlug,
  effectiveYear,
}: CurriculumParams) {
  return fs.readFileSync(
    path.join(
      CURRICULUMS_DIR,
      institutionAcronym,
      `${programSlug}_${effectiveYear}.malla`,
    ),
    "utf-8",
  );
}

export function getCurriculum(params: CurriculumParams) {
  const result = importFile(readCurriculumFile(params));
  if (!result.ok)
    throw new Error(
      `Invalid curriculum file ${toProgramPath(params)}_${params.effectiveYear}.malla: ${result.reason}`,
    );
  return result.draft.curriculum;
}

export function getProgram(params: ProgramParams): Program {
  const programPath = toProgramPath(params);
  const institution = INSTITUTIONS[params.institutionAcronym];
  const record = PROGRAMS[programPath];
  if (!institution || !record)
    throw new Error(`Program ${programPath} is not registered`);

  const effectiveYears = getCurriculumParams()
    .filter((file) => toProgramPath(file) === programPath)
    .map((file) => Number(file.effectiveYear))
    .toSorted((a, b) => b - a);
  const { programName } = getCurriculum({
    ...params,
    effectiveYear: String(getCurrentYear(effectiveYears)),
  });

  return {
    ...record,
    name: programName,
    path: programPath,
    institution,
    effectiveYears,
  };
}

export function getCatalog(): CatalogInstitution[] {
  const institutions = new Map<string, CatalogInstitution>();

  for (const params of getProgramParams()) {
    const { institution, department, name, path, effectiveYears } =
      getProgram(params);

    const catalogInstitution = institutions.get(institution.acronym) ?? {
      ...institution,
      departments: [],
    };
    institutions.set(institution.acronym, catalogInstitution);

    let catalogDepartment = catalogInstitution.departments.find(
      (d) => d.name === department.name,
    );
    if (!catalogDepartment) {
      catalogDepartment = { name: department.name, programs: [] };
      catalogInstitution.departments.push(catalogDepartment);
    }

    catalogDepartment.programs.push({ name, path, effectiveYears });
  }

  const byName = (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name, "es");

  return [...institutions.values()].sort(byName).map((institution) => ({
    ...institution,
    departments: institution.departments.sort(byName).map((department) => ({
      ...department,
      programs: department.programs.sort(byName),
    })),
  }));
}
