import type { CurriculumData } from "@/types/curriculum";

export async function fetchProgramData(path: string): Promise<CurriculumData> {
  const response = await fetch(`/api/curriculums/${path}`);

  if (!response.ok) {
    throw new Error(`Failed to load curriculum "${path}": ${response.status}`);
  }

  return response.json();
}
