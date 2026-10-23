import CurriculumView from "@/components/curriculum/curriculum-view";
import ImportCurriculumButton from "@/components/curriculum/import-button";
import ProgramInfo from "@/components/curriculum/program-info";
import ProgramModal from "@/components/curriculum/program-modal";
import { getCurriculumParams, getProgramData } from "@/server/db/curriculums";
import { getPeriods } from "@/utils/curriculum";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCurriculumParams();
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ institutionAcronym: string; programSlug: string }>;
}) {
  const { institutionAcronym, programSlug } = await params;
  const data = getProgramData({ institutionAcronym, programSlug });
  const { institution, program, curriculum, stats } = data;

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
        duration={getPeriods(curriculum.structure).nCols}
      >
        <ProgramModal program={{ ...program, stats }} />
        <ImportCurriculumButton
          path={`${institutionAcronym}/${programSlug}`}
          institution={institution}
          program={program}
          curriculum={curriculum}
        />
      </ProgramInfo>
    </div>
  );
}
