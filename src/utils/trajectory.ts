import { nanoid } from "nanoid";
import type {
  Course,
  CurriculumData,
  ExtendedCourse,
  PeriodKey,
} from "@/types/curriculum";
import type {
  Enrollment,
  EnrollmentStatus,
  Entry,
  PeriodWithEnrollments,
} from "@/types/trajectory";
import { arabicToRoman } from "@/utils/numbers";
import {
  comparePeriodKeys,
  getSemesterIndex,
  isSemester,
  parsePeriodKey,
  TERM_LABELS,
} from "@/utils/period-key";

export const MAX_ENROLLMENTS_PER_PERIOD = 10;

export type EditError =
  | "PERIOD_FULL"
  | "DUPLICATE_COURSE"
  | "SUCCESSOR_IN_PERIOD"
  | "PREREQUISITE_IN_PERIOD"
  | "SUCCESSOR_ON_THE_WAY"
  | "PREREQUISITE_ON_THE_WAY";

type EditResult =
  | { periods: PeriodWithEnrollments[]; error?: never }
  | { periods?: never; error: EditError };

type EnrollmentLocation = {
  periodId: string;
  index: number;
};

type Progress = {
  approvedCourseIds: number[];
  approvedCredits: number;
};

export function createEnrollments({
  entry,
  curriculum: { curriculum, courses },
}: {
  entry: Entry;
  curriculum: Pick<CurriculumData, "curriculum" | "courses">;
}): Enrollment[] {
  const entryOffset = entry.term >= 3 ? 1 : 0;
  const codeOf = new Map(courses.map((course) => [course.id, course.code]));

  return curriculum.slots.map((slot) => {
    const semesterIndex =
      getSemesterIndex({
        year: entry.year + slot.programYear - 1,
        term: slot.term,
      }) + entryOffset;

    return {
      id: nanoid(),
      courseCode: codeOf.get(slot.courseId) ?? null,
      position: slot.position,
      status: "PENDING",
      year: Math.floor(semesterIndex / 2),
      term: semesterIndex % 2 === 0 ? 1 : 3,
    };
  });
}

export function groupEnrollmentsByPeriod(
  enrollments: Enrollment[],
): PeriodWithEnrollments[] {
  const periods = new Map<PeriodKey, Enrollment[]>();

  for (const enrollment of enrollments) {
    const key: PeriodKey = `${enrollment.year}-${enrollment.term}`;
    periods.set(key, [...(periods.get(key) ?? []), enrollment]);
  }

  const keys = [...periods.keys()].sort(comparePeriodKeys);
  const first = keys[0];
  const last = keys.at(-1);

  if (first && last) {
    const fromYear = parsePeriodKey(first).year;
    const toYear = parsePeriodKey(last).year;

    for (let year = fromYear; year <= toYear; year++) {
      for (const term of [1, 3]) {
        const key: PeriodKey = `${year}-${term}`;
        const isInRange =
          comparePeriodKeys(key, first) >= 0 &&
          comparePeriodKeys(key, last) <= 0;

        if (isInRange && !periods.has(key)) periods.set(key, []);
      }
    }
  }

  return [...periods.entries()]
    .sort(([a], [b]) => comparePeriodKeys(a, b))
    .map(([id, enrollments]) => ({ id, enrollments }));
}

export function trimEmptyPeriods(periods: PeriodWithEnrollments[]) {
  const lastIndex = periods.findLastIndex((p) => p.enrollments.length > 0);

  return periods
    .slice(0, lastIndex + 1)
    .filter(
      (p) => p.enrollments.length > 0 || isSemester(parsePeriodKey(p.id).term),
    );
}

export function findEnrollmentCourse<C extends Course>(
  courses: Map<number, C>,
  enrollment: Enrollment,
) {
  if (enrollment.courseCode === null) return undefined;
  for (const course of courses.values()) {
    if (course.code === enrollment.courseCode) return course;
  }
  return undefined;
}

export function extractCourseIds(
  enrollments: Enrollment[],
  status: EnrollmentStatus,
  courses: Map<number, Course>,
) {
  return enrollments
    .filter((e) => e.status === status)
    .flatMap((e) => findEnrollmentCourse(courses, e)?.id ?? []);
}

export function getTrajectoryStats(
  enrollments: Enrollment[],
  courses: Map<number, Course>,
) {
  let approvedCredits = 0;
  let approvedCourses = 0;
  let pendingCourses = 0;

  for (const enrollment of enrollments) {
    const course = findEnrollmentCourse(courses, enrollment);
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

export function getPeriodInfo(id: PeriodKey, entry: Entry) {
  const { year, term } = parsePeriodKey(id);
  const currentDate = new Date();

  const isCurrent =
    year === currentDate.getFullYear() &&
    term === (currentDate.getMonth() < 7 ? 1 : 3);

  if (!isSemester(term)) return { label: TERM_LABELS[term], isCurrent };

  const number = getSemesterIndex({ year, term }) - getSemesterIndex(entry) + 1;

  return {
    label: number > 0 ? `Semestre ${arabicToRoman(number)}` : "Semestre",
    isCurrent,
  };
}

export function isAvailable(course: Course, progress: Progress) {
  return (
    course.prerequisiteIds.every((id) =>
      progress.approvedCourseIds.includes(id),
    ) && course.prerequisiteCredits <= progress.approvedCredits
  );
}

export function getAddableCourses(
  courses: Map<number, Course>,
  enrollments: Enrollment[],
) {
  const approvedCourseIds = extractCourseIds(enrollments, "APPROVED", courses);
  const failedCourseIds = extractCourseIds(enrollments, "FAILED", courses);

  return [...courses.values()].filter(
    (c) =>
      (failedCourseIds.includes(c.id) && !approvedCourseIds.includes(c.id)) ||
      c.isElective,
  );
}

export function addPeriod(
  periods: PeriodWithEnrollments[],
  { year, term }: { year: number; term: number },
) {
  const newPeriodIds: PeriodKey[] = [`${year}-${term}`];
  if (term === 3 && !periods.some((p) => p.id === `${year}-1`)) {
    newPeriodIds.push(`${year}-1`);
  }

  return [
    ...periods,
    ...newPeriodIds.map((id) => ({ id, enrollments: [] })),
  ].sort((a, b) => comparePeriodKeys(a.id, b.id));
}

export function addEnrollment(
  periods: PeriodWithEnrollments[],
  periodId: PeriodKey,
  course: Course,
): EditResult {
  const period = periods.find((p) => p.id === periodId);
  if (!period) return { periods };

  if (period.enrollments.length >= MAX_ENROLLMENTS_PER_PERIOD) {
    return { error: "PERIOD_FULL" };
  }

  const isDuplicate = period.enrollments.some(
    (e) => e.courseCode === course.code,
  );
  if (isDuplicate && !course.isElective) {
    return { error: "DUPLICATE_COURSE" };
  }

  const { year, term } = parsePeriodKey(periodId);
  const enrollment: Enrollment = {
    id: nanoid(),
    courseCode: course.code,
    status: "PENDING",
    position: period.enrollments.length + 1,
    year,
    term,
  };

  return {
    periods: periods.map((p) =>
      p.id === periodId
        ? { ...p, enrollments: [...p.enrollments, enrollment] }
        : p,
    ),
  };
}

export function removeEnrollment(
  periods: PeriodWithEnrollments[],
  enrollmentId: string,
) {
  return periods.map((p) => ({
    ...p,
    enrollments: p.enrollments.filter((e) => e.id !== enrollmentId),
  }));
}

export function moveEnrollment(
  periods: PeriodWithEnrollments[],
  source: EnrollmentLocation,
  destination: EnrollmentLocation,
  courses: Map<number, ExtendedCourse>,
): EditResult {
  const sourceIndex = periods.findIndex((p) => p.id === source.periodId);
  const destinationIndex = periods.findIndex(
    (p) => p.id === destination.periodId,
  );
  const enrollment = periods[sourceIndex]?.enrollments[source.index];
  const destinationPeriod = periods[destinationIndex];
  if (!enrollment || !destinationPeriod) return { periods };

  if (
    sourceIndex !== destinationIndex &&
    destinationPeriod.enrollments.length >= MAX_ENROLLMENTS_PER_PERIOD
  ) {
    return { error: "PERIOD_FULL" };
  }

  const error = getMoveError(
    periods,
    sourceIndex,
    destinationIndex,
    findEnrollmentCourse(courses, enrollment),
    courses,
  );
  if (error) return { error };

  const enrollmentsByPeriod = new Map(
    periods.map((p) => [p.id as string, [...p.enrollments]]),
  );
  enrollmentsByPeriod.get(source.periodId)?.splice(source.index, 1);
  enrollmentsByPeriod
    .get(destination.periodId)
    ?.splice(destination.index, 0, enrollment);

  return {
    periods: periods.map((p) => {
      if (p.id !== source.periodId && p.id !== destination.periodId) {
        return p;
      }

      const { year, term } = parsePeriodKey(p.id);

      return {
        ...p,
        enrollments: (enrollmentsByPeriod.get(p.id) ?? []).map((e, index) => ({
          ...e,
          position: index + 1,
          year,
          term,
        })),
      };
    }),
  };
}

function getMoveError(
  periods: PeriodWithEnrollments[],
  sourceIndex: number,
  destinationIndex: number,
  course: ExtendedCourse | undefined,
  courses: Map<number, ExtendedCourse>,
): EditError | null {
  if (!course || course.isElective || sourceIndex === destinationIndex) {
    return null;
  }

  const destinationPeriod = periods[destinationIndex];
  if (!destinationPeriod) return null;

  if (destinationPeriod.enrollments.some((e) => e.courseCode === course.code)) {
    return "DUPLICATE_COURSE";
  }

  const isMovingForward = sourceIndex < destinationIndex;
  const relatedCodes = (
    isMovingForward ? course.successorIds : course.prerequisiteIds
  ).flatMap((id) => courses.get(id)?.code ?? []);

  const hasRelatedCourse = (period: PeriodWithEnrollments) =>
    period.enrollments.some(
      (e) => e.courseCode !== null && relatedCodes.includes(e.courseCode),
    );

  if (hasRelatedCourse(destinationPeriod)) {
    return isMovingForward ? "SUCCESSOR_IN_PERIOD" : "PREREQUISITE_IN_PERIOD";
  }

  const [start, end] = isMovingForward
    ? [sourceIndex, destinationIndex]
    : [destinationIndex, sourceIndex];

  if (periods.slice(start, end).some(hasRelatedCourse)) {
    return isMovingForward ? "SUCCESSOR_ON_THE_WAY" : "PREREQUISITE_ON_THE_WAY";
  }

  return null;
}

export function setEnrollmentStatus(
  periods: PeriodWithEnrollments[],
  enrollmentId: string,
  status: EnrollmentStatus,
  courses: Map<number, ExtendedCourse>,
) {
  const target = periods
    .flatMap((p) => p.enrollments)
    .find((e) => e.id === enrollmentId);
  if (!target) return periods;

  const targetCourse = findEnrollmentCourse(courses, target);
  const revertedCourseCodes = new Set(
    status === "APPROVED" || !targetCourse
      ? []
      : [...getApprovedSuccessorIds(periods, targetCourse.id, courses)].flatMap(
          (id) => courses.get(id)?.code ?? [],
        ),
  );

  return periods.map((p) => ({
    ...p,
    enrollments: p.enrollments.map((e) => {
      if (e.id === enrollmentId) return { ...e, status };
      if (e.courseCode !== null && revertedCourseCodes.has(e.courseCode)) {
        return { ...e, status: "PENDING" as const };
      }
      return e;
    }),
  }));
}

function getApprovedSuccessorIds(
  periods: PeriodWithEnrollments[],
  courseId: number,
  courses: Map<number, ExtendedCourse>,
) {
  const approvedCourseIds = new Set(
    extractCourseIds(
      periods.flatMap((p) => p.enrollments),
      "APPROVED",
      courses,
    ),
  );
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
