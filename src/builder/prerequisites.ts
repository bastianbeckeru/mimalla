import { findCourse } from "@/builder/draft";
import { findPeriodIndex } from "@/builder/periods";
import type { Course, Curriculum } from "@/types/builder";

function getPeriodIndexes(curriculum: Curriculum, course: Course) {
  return course.slots.map((slot) => findPeriodIndex(curriculum.periods, slot));
}

export function getMisplacedPrerequisiteIds(
  curriculum: Curriculum,
  courseId: number,
) {
  const course = findCourse(curriculum, courseId);
  if (!course) return [];
  const firstPeriodIndex = Math.min(...getPeriodIndexes(curriculum, course));

  return course.prerequisiteIds.filter((prerequisiteId) => {
    const prerequisite = findCourse(curriculum, prerequisiteId);
    if (!prerequisite) return false;
    const lastPeriodIndexOfFirstPlacement =
      Math.min(...getPeriodIndexes(curriculum, prerequisite)) +
      prerequisite.duration -
      1;
    return lastPeriodIndexOfFirstPlacement >= firstPeriodIndex;
  });
}

export function dependsOn(
  curriculum: Curriculum,
  fromId: number,
  targetId: number,
) {
  const visited = new Set<number>();
  const pending = [fromId];
  while (pending.length > 0) {
    const id = pending.pop();
    if (id === undefined || visited.has(id)) continue;
    if (id === targetId) return true;
    visited.add(id);
    const course = findCourse(curriculum, id);
    pending.push(...(course?.prerequisiteIds ?? []));
  }
  return false;
}

export function canAddPrerequisite(
  curriculum: Curriculum,
  courseId: number,
  prerequisiteId: number,
) {
  const course = findCourse(curriculum, courseId);
  return (
    course !== undefined &&
    !course.prerequisiteIds.includes(prerequisiteId) &&
    curriculum.courses.some((course) => course.id === prerequisiteId) &&
    !dependsOn(curriculum, prerequisiteId, courseId)
  );
}
