import type { Course, Curriculum } from "@/builder/draft";
import { isSamePeriod } from "@/builder/periods";

function getColumnIndexes(curriculum: Curriculum, course: Course) {
  return course.slots.map((slot) =>
    curriculum.periods.findIndex((period) => isSamePeriod(period, slot)),
  );
}

export function getMisplacedPrerequisiteIds(
  curriculum: Curriculum,
  courseId: number,
) {
  const course = curriculum.courses.find((course) => course.id === courseId);
  if (!course) return [];
  const firstColumn = Math.min(...getColumnIndexes(curriculum, course));

  return course.prerequisiteIds.filter((prerequisiteId) => {
    const prerequisite = curriculum.courses.find(
      (course) => course.id === prerequisiteId,
    );
    if (!prerequisite) return false;
    const lastColumnOfFirstPlacement =
      Math.min(...getColumnIndexes(curriculum, prerequisite)) +
      prerequisite.duration -
      1;
    return lastColumnOfFirstPlacement >= firstColumn;
  });
}

function dependsOn(curriculum: Curriculum, fromId: number, targetId: number) {
  const visited = new Set<number>();
  const pending = [fromId];
  while (pending.length > 0) {
    const id = pending.pop();
    if (id === undefined || visited.has(id)) continue;
    if (id === targetId) return true;
    visited.add(id);
    const course = curriculum.courses.find((course) => course.id === id);
    pending.push(...(course?.prerequisiteIds ?? []));
  }
  return false;
}

export function canAddPrerequisite(
  curriculum: Curriculum,
  courseId: number,
  prerequisiteId: number,
) {
  const course = curriculum.courses.find((course) => course.id === courseId);
  return (
    course !== undefined &&
    !course.prerequisiteIds.includes(prerequisiteId) &&
    curriculum.courses.some((course) => course.id === prerequisiteId) &&
    !dependsOn(curriculum, prerequisiteId, courseId)
  );
}
