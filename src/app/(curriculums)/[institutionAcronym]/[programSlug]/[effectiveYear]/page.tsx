import ProgramPage from "@/components/curriculum/program-page";
import { getCurriculumParams } from "@/server/db/curriculums";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCurriculumParams();
}

export default async function CurriculumVersionPage({
  params,
}: {
  params: Promise<{
    institutionAcronym: string;
    programSlug: string;
    effectiveYear: string;
  }>;
}) {
  return <ProgramPage {...(await params)} />;
}
