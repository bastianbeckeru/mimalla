import {
  getCachedCurrentCurriculum,
  getCachedCurriculumParams,
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
  const data = await getCachedCurrentCurriculum(
    institutionAcronym,
    programSlug,
  );
  return data ? Response.json(data) : new Response(null, { status: 404 });
}
