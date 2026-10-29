import { importFile } from "@/builder/import";

export async function fetchCurriculum(curriculumPath: string) {
  const response = await fetch(`/api/curriculums/${curriculumPath}`);

  if (!response.ok) {
    throw new Error(
      `Failed to load curriculum "${curriculumPath}": ${response.status}`,
    );
  }

  const result = importFile(await response.text());
  if (!result.ok) {
    throw new Error(`Invalid curriculum "${curriculumPath}": ${result.reason}`);
  }

  return result.draft.curriculum;
}
