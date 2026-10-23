import type {
  Area,
  Course,
  ExtendedCourse,
  PeriodKey,
  Slot,
} from "@/types/curriculum";
import { comparePeriodKeys } from "@/utils/period-key";

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

export function getCourseArea(areas: Area[], course: Course) {
  const { id, isElective } = course;

  if (isElective) {
    const electiveAreas = areas.filter((area) => area.courseIds.includes(id));

    const mainArea = areas.find((area) =>
      electiveAreas.every((eArea) => area.subareaIds.includes(eArea.id)),
    );

    if (!mainArea && electiveAreas.length === 1) return electiveAreas[0];

    return mainArea;
  }

  return areas.find((area) => area.courseIds.includes(id));
}

export function getPeriods(slots: Slot[]) {
  const periods = [
    ...new Set(slots.map((s): PeriodKey => `${s.programYear}-${s.term}`)),
  ].sort(comparePeriodKeys);

  return {
    periods,
    nCols: periods.length,
    nRows: Math.max(1, ...slots.map((s) => s.position)),
  };
}
