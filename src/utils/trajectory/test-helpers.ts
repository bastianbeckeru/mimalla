import type { Course, Curriculum, PeriodKey, Slot } from "@/types/curriculum";
import type { Enrollment, EnrollmentStatus } from "@/types/trajectory";

export function course(
  id: number,
  {
    prerequisiteIds = [] as number[],
    isElective = false,
    slots = [] as Slot[],
    credits = 6,
    duration = 1,
  } = {},
): Course {
  return {
    id,
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

    return courseIds.map((courseId, index) => ({
      id:
        courseIds.indexOf(courseId) === index
          ? `${period}/${courseId}`
          : `${period}/${courseId}/${index}`,
      courseId,
      year,
      term,
      position: index + 1,
      status: statuses[courseId] ?? "PENDING",
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
      e.courseId,
    ];
  return layout;
}
