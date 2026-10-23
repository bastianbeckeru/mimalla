import { getCachedPublishedCurriculum } from "@/server/catalog/cached-catalog";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ curriculumId: string }> },
) {
  const { curriculumId } = await params;
  if (!/^[1-9]\d{0,8}$/.test(curriculumId)) {
    return new Response(null, { status: 404 });
  }

  const data = await getCachedPublishedCurriculum(Number(curriculumId));
  return data ? Response.json(data) : new Response(null, { status: 404 });
}
