import type { InstitutionParams } from "../layout";

import fs from "fs";
import path from "path";
import { createUrlSlug } from "@/utils/strings";

import CurriculumView from "@/components/curriculum/curriculum-view";
import { NavigationBreadcrumb } from "@/components/curriculum/nav-breadcrumb";
import { getPeriods } from "@/utils/curriculum";
import { CurriculumData } from "@/types/curriculum";

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
    <div className="w-dvw px-8">
      <NavigationBreadcrumb institution={institution} program={program} />

      <div className="flex flex-row gap-2">
        <CurriculumView
          className="w-3/4 rounded-sm border"
          nCols={nCols}
          nRows={nRows}
          periods={periods}
          data={data}
        />
        {/* SEPARAR ESTO EN UN COMPONENTE APARTE QUE RECIBA DEGREE Y PERIODS.LENGHT Y PROGRAM. */}
        {/* EN CASO DE NO DEGREE, NO MOSTRAR NINGÚN TITULO O GRADO, SOLO INFO */}
        <div className="w-1/4 space-y-2 rounded-sm bg-neutral-800 p-2 text-foreground">
          <p className="text-sm font-semibold">
            Titulo Profesional:{" "}
            <span className="font-normal">
              {degrees.find((d) => d.type === "PROFESSIONAL")?.name}
            </span>
          </p>
          <p className="text-sm font-semibold">
            Grado Académico:{" "}
            <span className="font-normal">
              {degrees.find((d) => d.type === "ACADEMIC")?.name}
            </span>
          </p>
          <p className="text-sm font-semibold">
            Duración:{" "}
            <span className="font-normal">{periods.length} semestres</span>
          </p>
          <p className="text-sm font-semibold">
            Jornada:{" "}
            <span className="font-normal">
              {program.schedule === "DAYTIME" ? "Diurna" : "Verspertina"}
            </span>
          </p>
          <p className="text-sm font-semibold">
            Código SIES: <span className="font-normal">{program.siesCode}</span>
          </p>
          <p className="text-sm font-semibold">
            Código DEMRE:{" "}
            <span className="font-normal">{program.demreCode}</span>
          </p>
        </div>
      </div>
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
