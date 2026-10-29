import {
  getCurriculumParams,
  readCurriculumFile,
} from "@/server/db/curriculums";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getCurriculumParams();
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      institutionAcronym: string;
      programSlug: string;
      effectiveYear: string;
    }>;
  },
) {
  return new Response(readCurriculumFile(await params), {
    headers: { "Content-Type": "application/json" },
  });
}
