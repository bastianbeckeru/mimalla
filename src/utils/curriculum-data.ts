import type { CurriculumData, ProgramCurriculum } from "@/types/curriculum";

export async function fetchCurriculum(
  curriculumId: number,
): Promise<CurriculumData> {
  const response = await fetch(`/api/curriculums/by-id/${curriculumId}`);

  if (!response.ok) {
    throw new Error(
      `Failed to load curriculum ${curriculumId}: ${response.status}`,
    );
  }

  return response.json();
}

export async function fetchProgramCurriculums(
  path: string,
): Promise<ProgramCurriculum[]> {
  const response = await fetch(`/api/curriculums/${path}/curriculums`);

  if (response.status === 404) return [];
  if (!response.ok) {
    throw new Error(
      `Failed to load the curriculums of "${path}": ${response.status}`,
    );
  }

  return response.json();
}
