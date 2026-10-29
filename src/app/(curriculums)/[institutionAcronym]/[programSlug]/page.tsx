import ProgramPage from "@/components/curriculum/program-page";
import { getProgramParams } from "@/server/db/curriculums";

export const dynamicParams = false;

export function generateStaticParams() {
  return getProgramParams();
}

export default async function CurrentCurriculumPage({
  params,
}: {
  params: Promise<{ institutionAcronym: string; programSlug: string }>;
}) {
  return <ProgramPage {...(await params)} />;
}
