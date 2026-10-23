import fs from "node:fs";
import path from "node:path";
import type {
  CatalogInstitution,
  CurriculumData,
  Slot,
  Track,
} from "@/types/curriculum";

const CURRICULUMS_DIR = path.join(
  process.cwd(),
  "src",
  "server",
  "db",
  "curriculums",
);

type CurriculumFile = Omit<CurriculumData, "curriculum"> & {
  curriculum: Omit<CurriculumData["curriculum"], "slots" | "tracks"> & {
    structure: (Omit<Slot, "programYear"> & { year: number })[];
    plans: Track[];
  };
};

type CurriculumParams = {
  institutionAcronym: string;
  programSlug: string;
};

export function getCurriculumParams(): CurriculumParams[] {
  return fs
    .readdirSync(CURRICULUMS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((institution) =>
      fs
        .readdirSync(path.join(CURRICULUMS_DIR, institution.name))
        .filter((file) => file.endsWith(".json"))
        .map((file) => ({
          institutionAcronym: institution.name,
          programSlug: path.basename(file, ".json"),
        })),
    );
}

export function getProgramData({
  institutionAcronym,
  programSlug,
}: CurriculumParams): CurriculumData {
  const file = path.join(
    CURRICULUMS_DIR,
    institutionAcronym,
    `${programSlug}.json`,
  );

  const { curriculum, ...data }: CurriculumFile = JSON.parse(
    fs.readFileSync(file, "utf-8"),
  );
  const { structure, plans, ...version } = curriculum;

  return {
    ...data,
    curriculum: {
      ...version,
      slots: structure.map(({ year, ...slot }) => ({
        ...slot,
        programYear: year,
      })),
      tracks: plans,
    },
  };
}

export function getCatalog(): CatalogInstitution[] {
  const institutions = new Map<string, CatalogInstitution>();

  for (const params of getCurriculumParams()) {
    const { institution, department, program } = getProgramData(params);

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

    catalogDepartment.programs.push({
      name: program.name,
      path: `${params.institutionAcronym}/${params.programSlug}`,
    });
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
