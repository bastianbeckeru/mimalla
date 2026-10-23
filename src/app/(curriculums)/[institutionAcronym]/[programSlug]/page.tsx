import { notFound } from "next/navigation";
import CurriculumView from "@/components/curriculum/curriculum-view";
import ImportCurriculumButton from "@/components/curriculum/import-button";
import ProgramInfo from "@/components/curriculum/program-info";
import {
  getCachedCurrentCurriculum,
  getCachedCurriculumParams,
} from "@/server/catalog/cached-catalog";
import { getPeriods } from "@/utils/curriculum";

export const ensureStatic = "navigation";

export function generateStaticParams() {
  return getCachedCurriculumParams();
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ institutionAcronym: string; programSlug: string }>;
}) {
  const { institutionAcronym, programSlug } = await params;
  const data = await getCachedCurrentCurriculum(
    institutionAcronym,
    programSlug,
  );
  if (!data) notFound();
  const { institution, program, curriculum } = data;

  return (
    <div className="lg:max-y-full flex h-auto w-full max-w-full flex-col overflow-hidden border-t lg:max-h-[35.5rem] lg:flex-row lg:rounded-md lg:border">
      <CurriculumView
        data={data}
        className="h-[31rem] overflow-auto lg:h-auto lg:flex-1"
      />
      <ProgramInfo
        institution={institution}
        program={program}
        tracks={curriculum.tracks}
        duration={getPeriods(curriculum.slots).nCols}
      >
        <ImportCurriculumButton data={data} />
      </ProgramInfo>
    </div>
  );
}
