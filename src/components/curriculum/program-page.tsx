import CurriculumView from "@/components/curriculum/curriculum-view";
import ProgramHeader from "@/components/curriculum/program-header";
import { getCurriculum, getProgram } from "@/server/db/curriculums";
import { getCurrentYear } from "@/utils/curriculum";

export default function ProgramPage({
  institutionAcronym,
  programSlug,
  effectiveYear,
}: {
  institutionAcronym: string;
  programSlug: string;
  effectiveYear?: string;
}) {
  const program = getProgram({ institutionAcronym, programSlug });
  const curriculum = getCurriculum({
    institutionAcronym,
    programSlug,
    effectiveYear:
      effectiveYear ?? String(getCurrentYear(program.effectiveYears)),
  });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-t lg:rounded-md lg:border">
      <ProgramHeader program={program} curriculum={curriculum} />
      <CurriculumView curriculum={curriculum} />
    </div>
  );
}
