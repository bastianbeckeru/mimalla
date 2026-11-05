import type { Course, ExtendedCourse, PeriodKey } from "@/types/curriculum";
import type {
  Enrollment,
  EnrollmentStatus,
  TrajectoryContext,
  TrajectoryProgress,
} from "@/types/trajectory";
import { extendCourses } from "@/utils/curriculum";
import { getEnd, layOutTrajectory } from "@/utils/trajectory/layout";

export function approveThroughPeriod(
  enrollments: Enrollment[],
  period: PeriodKey,
  context: TrajectoryContext,
) {
  const { periods, cards } = layOutTrajectory(enrollments, context);
  const lastColumn = periods.indexOf(period) + 1;
  const courses = extendCourses(context.curriculum.courses);
  const candidates = cards
    .filter(
      (card) =>
        card.enrollment.status === "PENDING" && getEnd(card) <= lastColumn,
    )
    .toSorted((a, b) => a.column - b.column);

  const approvedIds = new Set<string>();
  const approve = () =>
    enrollments.map((e) =>
      approvedIds.has(e.id) ? { ...e, status: "APPROVED" as const } : e,
    );
  for (let wasApproved = true; wasApproved; ) {
    wasApproved = false;
    for (const card of candidates) {
      if (
        !approvedIds.has(card.id) &&
        isAvailable(card.course, getProgress(approve(), courses))
      ) {
        approvedIds.add(card.id);
        wasApproved = true;
      }
    }
  }

  return { enrollments: approve(), approvedCount: approvedIds.size };
}

export function setEnrollmentStatuses(
  enrollments: Enrollment[],
  statuses: Map<string, EnrollmentStatus>,
  courses: Map<number, ExtendedCourse>,
) {
  return [...statuses].reduce(
    (result, [enrollmentId, status]) => {
      const next = setEnrollmentStatus(
        result.enrollments,
        enrollmentId,
        status,
        courses,
      );
      return {
        enrollments: next.enrollments,
        revertedCount: result.revertedCount + next.revertedCount,
      };
    },
    { enrollments, revertedCount: 0 },
  );
}

export function extractCourseIds(
  enrollments: Enrollment[],
  status: EnrollmentStatus,
) {
  return enrollments.filter((e) => e.status === status).map((e) => e.courseId);
}

export function getProgress(
  enrollments: Enrollment[],
  courses: Map<number, Course>,
): TrajectoryProgress {
  return {
    approvedCourseIds: new Set(extractCourseIds(enrollments, "APPROVED")),
    approvedCredits: getTrajectoryStats(enrollments, courses).approvedCredits,
  };
}

export function getTrajectoryStats(
  enrollments: Enrollment[],
  courses: Map<number, Course>,
) {
  let approvedCredits = 0;
  let approvedCourses = 0;
  let pendingCourses = 0;

  for (const enrollment of enrollments) {
    const course = courses.get(enrollment.courseId);
    if (!course) continue;

    if (enrollment.status === "APPROVED") {
      approvedCourses++;
      approvedCredits += course.credits;
    } else if (enrollment.status === "PENDING") {
      pendingCourses++;
    }
  }

  const totalCourses = approvedCourses + pendingCourses;

  return {
    progress: totalCourses > 0 ? (approvedCourses / totalCourses) * 100 : 0,
    approvedCredits,
    approvedCourses,
    totalCourses,
  };
}

export function isAvailable(course: Course, progress: TrajectoryProgress) {
  return (
    course.prerequisiteIds.every((id) => progress.approvedCourseIds.has(id)) &&
    course.prerequisiteCredits <= progress.approvedCredits
  );
}

export function getAddableCourses(
  courses: Map<number, Course>,
  enrollments: Enrollment[],
) {
  const takenCourseIds = new Set(
    enrollments.filter((e) => e.status !== "FAILED").map((e) => e.courseId),
  );

  return [...courses.values()].filter(
    (c) => c.isElective || !takenCourseIds.has(c.id),
  );
}

export function setEnrollmentStatus(
  enrollments: Enrollment[],
  enrollmentId: string,
  status: EnrollmentStatus,
  courses: Map<number, ExtendedCourse>,
) {
  const target = enrollments.find((e) => e.id === enrollmentId);
  if (!target) return { enrollments, revertedCount: 0 };

  const revertedCourseIds =
    status === "APPROVED"
      ? new Set<number>()
      : getApprovedSuccessorIds(enrollments, target.courseId, courses);

  let revertedCount = 0;
  const updated = enrollments.map((e) => {
    if (e.id === enrollmentId) return { ...e, status };
    if (e.status === "APPROVED" && revertedCourseIds.has(e.courseId)) {
      revertedCount++;
      return { ...e, status: "PENDING" as const };
    }
    return e;
  });
  return { enrollments: updated, revertedCount };
}

function getApprovedSuccessorIds(
  enrollments: Enrollment[],
  courseId: number,
  courses: Map<number, ExtendedCourse>,
) {
  const approvedCourseIds = new Set(extractCourseIds(enrollments, "APPROVED"));
  const successorIds = new Set<number>();
  const pendingIds = [courseId];

  for (let id = pendingIds.pop(); id !== undefined; id = pendingIds.pop()) {
    for (const successorId of courses.get(id)?.successorIds ?? []) {
      if (
        approvedCourseIds.has(successorId) &&
        !successorIds.has(successorId)
      ) {
        successorIds.add(successorId);
        pendingIds.push(successorId);
      }
    }
  }

  return successorIds;
}
