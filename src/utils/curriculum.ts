import type {
  CurriculumData,
  Area,
  PeriodKey,
  Course,
  ExtendedCourse,
} from "@/types/curriculum";
import type { EnrolledCourse, EnrolledCourseStatus } from "@/types/store";
import { arabicToRoman } from "./numbers";

export function getCourse({
  id,
  courses,
}: {
  id: number;
  courses: Map<number, Course>;
}) {
  const course = courses.get(id);

  if (!course) return null;

  const subsequentIds = course
    ? Array.from(courses.values())
        .filter((c) => c.prerequisiteIds.includes(course.id))
        .map((c) => c.id)
    : [];

  return { ...course, subsequentIds: subsequentIds };
}

export function getCourseArea(
  areas: Area[],
  course: ExtendedCourse & { isElective: boolean },
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
  slots,
}: {
  slots: CurriculumData["curriculum"]["structure"];
}): {
  nCols: number;
  nRows: number;
  periods: PeriodKey[];
} {
  const periodSet = new Set<PeriodKey>();
  let maxRows = 1;

  slots.forEach((s) => {
    periodSet.add(`${s.year}-${s.term}`);
    maxRows = Math.max(maxRows, s.position);
  });

  const sortedPeriods = Array.from(periodSet).sort((a, b) => {
    const [yearA, termA] = a.split("-").map(Number);
    const [yearB, termB] = b.split("-").map(Number);
    return yearA !== yearB ? yearA! - yearB! : termA! - termB!;
  });

  return { nCols: periodSet.size, nRows: maxRows, periods: sortedPeriods };
}

export function getPeriodsWithEnrollments({
  year,
  enrollments,
}: {
  year: number;
  enrollments: EnrolledCourse[];
}): {
  nCols: number;
  nRows: number;
  periods: {
    id: PeriodKey;
    enrollments: EnrolledCourse[];
  }[];
  hasToSave: boolean;
} {
  const periodMap = new Map<PeriodKey, EnrolledCourse[]>();
  let maxRows = 1;
  let minYear = Infinity;
  let maxYear = -Infinity;
  let hasToSave = false;

  enrollments.forEach((e) => {
    if (hasToSave === false && e.year < 1800) {
      hasToSave = true; // ⚠️ Temp: Fix outdated year format
    }
    e.year = !hasToSave ? e.year : year + e.year - 1; // ⚠️ Temp: Fix outdated year format

    const periodKey: PeriodKey = `${e.year}-${e.term}`;

    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, []);
    }

    periodMap.get(periodKey)!.push(e);

    maxRows = Math.max(maxRows, e.position);
    minYear = Math.min(minYear, e.year);
    maxYear = Math.max(maxYear, e.year);
  });

  for (let pYear = minYear; pYear <= maxYear; pYear++) {
    const firstSemesterKey: PeriodKey = `${pYear}-1`;
    const secondSemesterKey: PeriodKey = `${pYear}-3`;

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
    hasToSave,
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
  curriculumCourses: Map<number, CurriculumData["courses"][0]>,
) {
  let approvedCredits = 0;
  let pendingCredits = 0;
  let approvedCourses = 0;
  let pendingCourses = 0;
  let failedCourses = 0;

  for (const enrollment of enrollments) {
    const course = curriculumCourses.get(enrollment.courseId);
    if (!course) continue;

    if (enrollment.status === "APPROVED") {
      approvedCourses++;
      approvedCredits += course.credits;
    } else if (enrollment.status == "PENDING") {
      pendingCourses++;
      pendingCredits += course.credits;
    } else if (enrollment.status == "FAILED") {
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

export function getPeriodInfo(id: PeriodKey, startYear = 2020) {
  const [year, term] = id.split("-").map(Number);

  const number = 2 * (year! - startYear + 1) - (term === 1 ? 1 : 0);
  const currentDate = new Date();
  let label = "SEMESTRE";
  let isCurrent = false;

  if (
    year === currentDate.getFullYear() &&
    term === (currentDate.getMonth() < 7 ? 1 : 3)
  ) {
    isCurrent = true;
  }

  if (term === 1 || term === 3) {
    label = `SEMESTRE ${arabicToRoman(number)}`;
  } else if (term === 2) {
    label = `INVIERNO`;
  } else if (term === 4) {
    label = `VERANO`;
  }

  return {
    year,
    term,
    label,
    isCurrent,
    number,
  };
}

/*

areas
periods array
courses map
slots with x,y and course data 

*/
