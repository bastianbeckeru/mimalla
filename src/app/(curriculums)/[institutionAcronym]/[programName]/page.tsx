import type { InstitutionParams } from "../layout";

import fs from "fs";
import path from "path";

import CurriculumView from "@/components/curriculum/curriculum-view";
import ProgramInfo from "@/components/curriculum/program-info";
import ImportCurriculumButton from "@/components/curriculum/import-button";
import { getPeriods } from "@/utils/curriculum";
import { getProgramData } from "@/utils/curriculum-data";
import { slugify } from "@/utils/strings";

export const dynamicParams = false;
export async function generateStaticParams({ params }: InstitutionParams) {
  const resolvedParams = await params;
  const institutionPath = path.join(
    process.cwd(),
    "src",
    "server",
    "db",
    "curriculums",
    resolvedParams.institutionAcronym,
  );
  const files = fs.readdirSync(institutionPath);

  const institutionPrograms = files
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.basename(file, ".json"));

  return institutionPrograms.map((programName) => ({
    programName: slugify(programName),
  }));
}

type ProgramParams = InstitutionParams & {
  params: Promise<{ programName: string }>;
};

export default async function ProgramPage({ params }: ProgramParams) {
  const resolvedParams = await params;
  const data = await getProgramData({
    institutionAcronym: resolvedParams.institutionAcronym,
    programSlug: resolvedParams.programName,
  });

  if (!data) return <div>Error al cargar el programa</div>;

  const { institution, program, curriculum } = data;
  const { periods, nCols, nRows } = getPeriods({
    slots: data.curriculum.structure,
  });

  return (
    <div className="lg:max-y-full flex h-auto w-full max-w-full flex-col overflow-hidden border-t lg:max-h-[35.5rem] lg:flex-row lg:rounded-md lg:border">
      <CurriculumView
        data={data}
        className="h-[31rem] overflow-auto lg:h-auto lg:flex-1"
      />
      <ProgramInfo
        institution={institution}
        program={program}
        plans={curriculum.plans}
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
