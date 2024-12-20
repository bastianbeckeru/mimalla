import type { InstitutionParams } from "../layout";

import fs from "fs";
import path from "path";
import { createUrlSlug } from "@/utils/strings";

import CurriculumView from "@/components/curriculum/curriculum-view";
import { getPeriods } from "@/utils/curriculum";
import type { CurriculumData } from "@/types/curriculum";
import ProgramInfo from "@/components/curriculum/program-info";

export const dynamicParams = false;

export async function generateStaticParams({ params }: InstitutionParams) {
  const institutionPath = path.join(
    process.cwd(),
    "src",
    "server",
    "db",
    "curriculums",
    params.institutionAcronym,
  );
  const files = fs.readdirSync(institutionPath);

  const institutionPrograms = files
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.basename(file, ".json"));

  return institutionPrograms.map((programName) => ({
    programName: createUrlSlug(programName),
  }));
}

type ProgramParams = InstitutionParams & { params: { programName: string } };

export default async function ProgramPage({ params }: ProgramParams) {
  const data = getProgramData(params.institutionAcronym, params.programName);

  if (!data) return <div>Error al cargar el programa</div>;

  const { institution, program, degrees } = data;
  const { periods, nCols, nRows } = getPeriods({
    slots: data.curriculum.slots,
  });

  return (
    <div className="flex w-dvw flex-col gap-2 border-t pt-2 md:flex-row md:p-4">
      <CurriculumView
        className="rounded-sm md:w-3/4 md:border"
        nCols={nCols}
        nRows={nRows}
        periods={periods}
        data={data}
      />

      <ProgramInfo
        institution={institution}
        program={program}
        degrees={degrees}
        duration={periods.length}
      />
    </div>
  );
}

function getProgramData(institutionAcronym: string, programSlug: string) {
  const curriculumPath = path.join(
    process.cwd(),
    "src",
    "server",
    "db",
    "curriculums",
    institutionAcronym,
    `${programSlug}.json`,
  );

  const fileContent = fs.readFileSync(curriculumPath, "utf-8");
  return JSON.parse(fileContent) as CurriculumData;
}
