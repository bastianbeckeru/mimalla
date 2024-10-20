import type { CurriculumData, PeriodKey } from "@/types/curriculum";
import { EnrolledCourse } from "@/types/store";

export function getPeriods({
  slots,
}: {
  slots: CurriculumData["curriculum"]["slots"];
}): {
  nCols: number;
  nRows: number;
  periods: PeriodKey[];
} {
  const periodSet = new Set<PeriodKey>();
  let maxRows = 1;

  slots.forEach((slot) => {
    periodSet.add(`${slot.year}-${slot.term}`);
    maxRows = Math.max(maxRows, slot.position);
  });

  const sortedPeriods = Array.from(periodSet).sort((a, b) => {
    const [yearA, termA] = a.split("-").map(Number);
    const [yearB, termB] = b.split("-").map(Number);
    return yearA !== yearB ? yearA! - yearB! : termA! - termB!;
  });

  return { nCols: periodSet.size, nRows: maxRows, periods: sortedPeriods };
}

export function getPeriodsWithSlots({
  slots,
}: {
  slots: CurriculumData["curriculum"]["slots"];
}): {
  nCols: number;
  nRows: number;
  periods: {
    id: PeriodKey;
    slots: CurriculumData["curriculum"]["slots"];
  }[];
} {
  const periodMap = new Map<PeriodKey, CurriculumData["curriculum"]["slots"]>();
  let maxRows = 1;

  slots.forEach((slot) => {
    const periodKey: PeriodKey = `${slot.year}-${slot.term}`;
    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, []);
    }

    periodMap.get(periodKey)!.push(slot);
    maxRows = Math.max(maxRows, slot.position);
  });

  const sortedPeriods = Array.from(periodMap.entries())
    .sort(([a], [b]) => {
      const [yearA, termA] = a.split("-").map(Number);
      const [yearB, termB] = b.split("-").map(Number);
      return yearA !== yearB ? yearA! - yearB! : termA! - termB!;
    })
    .map(([id, slots]) => ({ id, slots }));

  return {
    nCols: periodMap.size,
    nRows: maxRows,
    periods: sortedPeriods,
  };
}

export function getCourse({
  id,
  courses,
}: {
  id: number;
  courses: Map<number, CurriculumData["courses"][0]>;
}) {
  const course = courses.get(id);
  if (!course) return null;

  const subsequentIds =
    (course &&
      Array.from(courses.values())
        .filter((c) => c.prerequisiteIds.includes(course.id))
        .map((c) => c.id)) ??
    [];

  return { ...course, subsequentIds: subsequentIds };
}

export function getCourseArea(
  areas: CurriculumData["areas"],
  course: CurriculumData["courses"][0],
) {
  const { id, isElective } = course;

  if (isElective) {
    // Qué pasa en el caso de que el electivo pertenezca a un main area indicando que todos los cursos de esa main area son opciones para este electivo?
    const electiveAreas = areas.filter((area) => area.courseIds.includes(id));

    const mainArea = areas.find((area) =>
      electiveAreas.every((eArea) => area.subareaIds.includes(eArea.id)),
    );

    if (!mainArea && electiveAreas.length === 1) return electiveAreas[0];

    return mainArea;
  }

  return areas.find((area) => area.courseIds.includes(id));
}

export function getPeriodsWithEnrollments({
  enrollments,
}: {
  enrollments: EnrolledCourse[];
}): {
  nCols: number;
  nRows: number;
  periods: {
    id: PeriodKey;
    enrollments: EnrolledCourse[];
  }[];
} {
  const periodMap = new Map<PeriodKey, EnrolledCourse[]>();
  let maxRows = 1;

  enrollments.forEach((enrollment) => {
    const periodKey: PeriodKey = `${enrollment.year}-${enrollment.term}`;
    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, []);
    }

    periodMap.get(periodKey)!.push(enrollment);
    maxRows = Math.max(maxRows, enrollment.position);
  });

  const sortedPeriods = Array.from(periodMap.entries())
    .sort(([a], [b]) => {
      const [yearA, termA] = a.split("-").map(Number);
      const [yearB, termB] = b.split("-").map(Number);
      return yearA !== yearB ? yearA! - yearB! : termA! - termB!;
    })
    .map(([id, enrollments]) => ({ id, enrollments }));

  return {
    nCols: periodMap.size,
    nRows: maxRows,
    periods: sortedPeriods,
  };
}
