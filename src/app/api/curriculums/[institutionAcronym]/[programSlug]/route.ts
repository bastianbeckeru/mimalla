import { getCurriculumParams, getProgramData } from "@/server/db/curriculums";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getCurriculumParams();
}

export async function GET(
  _request: Request,
  {
    params,
  }: { params: Promise<{ institutionAcronym: string; programSlug: string }> },
) {
  return Response.json(getProgramData(await params));
}
