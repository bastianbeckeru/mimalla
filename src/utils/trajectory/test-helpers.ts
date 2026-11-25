import { crs } from "@/test/ids";
import type {
  Course,
  CourseId,
  Curriculum,
  PeriodKey,
  Slot,
} from "@/types/curriculum";
import type { Enrollment, EnrollmentStatus } from "@/types/trajectory";

function courseNumber(id: CourseId) {
  return Number(id.slice("crs_".length));
}

export function course(
  id: number,
  {
    prerequisiteIds = [] as CourseId[],
    isElective = false,
    slots = [] as Slot[],
    credits = 6,
    duration = 1,
  } = {},
): Course {
  return {
    id: crs(id),
    code: `C${id}`,
    name: `Course ${id}`,
    credits,
    areaId: null,
    trackIds: [],
    duration,
    prerequisiteCredits: 0,
    prerequisiteIds,
    isElective,
    slots,
  };
}

export function curriculumOf(courses: Course[]): Curriculum {
  return {
    programName: "Program",
    institution: "",
    effectiveYear: 2020,
    versionName: "",
    termSystem: "semester",
    periods: [],
    areas: [],
    tracks: [],
    courses,
  };
}

export const entry = { year: 2024, term: 1 };

export function trajectory(
  layout: Record<PeriodKey, number[]>,
  statuses: Record<number, EnrollmentStatus> = {},
): Enrollment[] {
  return Object.entries(layout).flatMap(([period, courseIds]) => {
    const [year = 0, term = 0] = period.split("-").map(Number);

    return courseIds.map((n, index) => ({
      id:
        courseIds.indexOf(n) === index
          ? `${period}/${n}`
          : `${period}/${n}/${index}`,
      courseId: crs(n),
      year,
      term,
      position: index + 1,
      status: statuses[n] ?? "PENDING",
    }));
  });
}

export function layoutOf(enrollments: Enrollment[] | undefined) {
  const layout: Record<string, number[]> = {};
  for (const e of (enrollments ?? []).toSorted(
    (a, b) => a.position - b.position,
  ))
    layout[`${e.year}-${e.term}`] = [
      ...(layout[`${e.year}-${e.term}`] ?? []),
      courseNumber(e.courseId),
    ];
  return layout;
}
