import type { Course } from "@/types/builder";
import type { ExtendedCourse } from "@/types/curriculum";

export function extendCourses(courses: Course[]) {
  const successorIds = new Map<number, number[]>();

  for (const course of courses) {
    for (const prerequisiteId of course.prerequisiteIds) {
      successorIds.set(prerequisiteId, [
        ...(successorIds.get(prerequisiteId) ?? []),
        course.id,
      ]);
    }
  }

  return new Map<number, ExtendedCourse>(
    courses.map((course) => [
      course.id,
      { ...course, successorIds: successorIds.get(course.id) ?? [] },
    ]),
  );
}

export function getApplicableYear(effectiveYears: number[], entryYear: number) {
  const [earliest = entryYear, ...later] = effectiveYears.toSorted(
    (a, b) => a - b,
  );
  return later.findLast((year) => year <= entryYear) ?? earliest;
}

export function getCurrentYear(effectiveYears: number[]) {
  return getApplicableYear(effectiveYears, new Date().getFullYear());
}

export function getCurriculumPath(programPath: string, effectiveYear: number) {
  return `${programPath}/${effectiveYear}`;
}

export function getProgramPath(curriculumPath: string) {
  return curriculumPath.split("/").slice(0, 2).join("/");
}

export function getVersionLabel(
  effectiveYear: number,
  effectiveYears: number[],
) {
  if (effectiveYear === getCurrentYear(effectiveYears)) return "Vigente";
  if (effectiveYear > new Date().getFullYear()) return "Próxima";
  return null;
}
