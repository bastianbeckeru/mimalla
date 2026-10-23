import {
  getCachedCurriculumParams,
  getCachedProgramCurriculums,
} from "@/server/catalog/cached-catalog";

export function generateStaticParams() {
  return getCachedCurriculumParams();
}

export async function GET(
  _request: Request,
  {
    params,
  }: { params: Promise<{ institutionAcronym: string; programSlug: string }> },
) {
  const { institutionAcronym, programSlug } = await params;
  const curriculums = await getCachedProgramCurriculums(
    institutionAcronym,
    programSlug,
  );
  return curriculums.length > 0
    ? Response.json(curriculums)
    : new Response(null, { status: 404 });
}
