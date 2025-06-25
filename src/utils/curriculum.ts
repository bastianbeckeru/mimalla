import type { CurriculumData, PeriodKey } from "@/types/curriculum";
import type { EnrolledCourse, EnrolledCourseStatus } from "@/types/store";

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

export function getPeriods({
  enrollments,
}: {
  enrollments: CurriculumData["curriculum"]["slots"];
}): {
  nCols: number;
  nRows: number;
  periods: PeriodKey[];
} {
  const periodSet = new Set<PeriodKey>();
  let maxRows = 1;

  enrollments.forEach((e) => {
    periodSet.add(`${e.year}-${e.term}`);
    maxRows = Math.max(maxRows, e.position);
  });

  const sortedPeriods = Array.from(periodSet).sort((a, b) => {
    const [yearA, termA] = a.split("-").map(Number);
    const [yearB, termB] = b.split("-").map(Number);
    return yearA !== yearB ? yearA! - yearB! : termA! - termB!;
  });

  return { nCols: periodSet.size, nRows: maxRows, periods: sortedPeriods };
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
  let minYear = Infinity,
    maxYear = -Infinity;

  enrollments.forEach((e) => {
    const periodKey: PeriodKey = `${e.year}-${e.term}`;
    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, []);
    }

    periodMap.get(periodKey)!.push(e);

    maxRows = Math.max(maxRows, e.position);
    minYear = Math.min(minYear, e.year);
    maxYear = Math.max(maxYear, e.year);
  });

  for (let year = minYear; year <= maxYear; year++) {
    const firstSemesterKey: PeriodKey = `${year}-1`;
    const secondSemesterKey: PeriodKey = `${year}-3`;

    if (!periodMap.has(firstSemesterKey)) periodMap.set(firstSemesterKey, []);
    if (!periodMap.has(secondSemesterKey)) periodMap.set(secondSemesterKey, []);
  }

  const sortedPeriods = Array.from(periodMap.entries())
    .sort(([a], [b]) => {
      const [yearA, termA] = a.split("-").map(Number);
      const [yearB, termB] = b.split("-").map(Number);
      return yearA !== yearB ? yearA! - yearB! : termA! - termB!;
    })
    .map(([id, enrollments]) => {
      return { id, enrollments };
    });

  if (sortedPeriods.at(-1)?.enrollments.length === 0) {
    sortedPeriods.splice(-1, 1);
  }

  return {
    nCols: sortedPeriods.length,
    nRows: maxRows,
    periods: sortedPeriods,
  };
}

export function extractCourseIds(
  enrollments: EnrolledCourse[],
  status?: EnrolledCourseStatus,
) {
  const filtered = status
    ? enrollments.filter((e) => e.status === status)
    : enrollments;

  return filtered
    .map((e) => e.courseId)
    .filter((id) => id !== null && id !== undefined);
}

export function getCurriculumStats(
  enrollments: EnrolledCourse[],
  coursesMap: Map<number, CurriculumData["courses"][0]>,
) {
  const groupedByCourse = new Map<number, EnrolledCourseStatus[]>();

  for (const e of enrollments) {
    if (e.courseId == null) continue;
    if (!groupedByCourse.has(e.courseId)) {
      groupedByCourse.set(e.courseId, []);
    }
    groupedByCourse.get(e.courseId)!.push(e.status);
  }

  let approvedCredits = 0;
  let pendingCredits = 0;
  let approvedCourses = 0;
  let pendingCourses = 0;
  let failedCourses = 0;

  for (const [courseId, statuses] of groupedByCourse.entries()) {
    const course = coursesMap.get(courseId);
    if (!course) continue;

    if (statuses.includes("APPROVED")) {
      approvedCourses++;
      approvedCredits += course.credits;
    } else if (statuses.includes("PENDING")) {
      pendingCourses++;
      pendingCredits += course.credits;
    } else if (statuses.includes("FAILED")) {
      failedCourses++;
    }
  }

  return {
    progress: (approvedCourses / (approvedCourses + pendingCourses)) * 100,
    approvedCredits,
    pendingCredits,
    totalCredits: approvedCredits + pendingCredits,
    approvedCourses,
    pendingCourses,
    failedCourses,
    totalCourses: approvedCourses + pendingCourses,
  };
}
