import type { InstitutionParams } from "../layout";

import fs from "fs";
import path from "path";
import { createUrlSlug } from "@/utils/strings";

import CurriculumView from "@/components/curriculum/curriculum-view";
import { getPeriods } from "@/utils/curriculum";
import ProgramInfo from "@/components/curriculum/program-info";
import { getProgramData } from "@/utils/curriculum-data";
import ImportCurriculumButton from "@/components/curriculum/import-button";

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
  const data = await getProgramData({
    institutionAcronym: params.institutionAcronym,
    programSlug: params.programName,
  });

  if (!data) return <div>Error al cargar el programa</div>;

  const { institution, program, degrees } = data;
  const { periods, nCols, nRows } = getPeriods({
    enrollments: data.curriculum.slots,
  });

  return (
    <div className="lg:max-y-full mx-auto flex h-auto w-full max-w-full flex-col overflow-hidden border-t lg:flex-row lg:rounded-md lg:border">
      <CurriculumView
        nCols={nCols}
        nRows={nRows}
        periods={periods}
        data={data}
        className="h-[31rem] overflow-auto lg:h-auto lg:flex-1"
      />
      <ProgramInfo
        institution={institution}
        program={program}
        degrees={degrees}
        duration={periods.length}
      >
        <ImportCurriculumButton
          institution={institution}
          program={program}
          curriculum={data.curriculum}
        />
      </ProgramInfo>
    </div>
  );
}
