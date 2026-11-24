import type { CourseId, Curriculum } from "@/types/curriculum";
import type { Assessment, Enrollment } from "@/types/trajectory";
import { flattenScheme } from "@/utils/grading-scheme";

export type ImportSummary = {
  changedCourseCount: number;
  gradedCourses: { name: string; assessmentCount: number }[];
};

function withoutIds(assessments: Assessment[] = []): unknown[] {
  return assessments.map(({ id: _, ...assessment }) =>
    assessment.kind === "GROUP"
      ? { ...assessment, assessments: withoutIds(assessment.assessments) }
      : assessment,
  );
}

function describeCourse(enrollments: Enrollment[], courseId: CourseId) {
  return JSON.stringify(
    enrollments
      .filter((enrollment) => enrollment.courseId === courseId)
      .map(({ year, term, status, courseGrade, assessments }) => [
        year,
        term,
        status,
        courseGrade ?? null,
        withoutIds(assessments),
      ])
      .toSorted((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  );
}

export function summarizeImport(
  current: Enrollment[] | null,
  imported: Enrollment[],
  curriculum: Curriculum,
): ImportSummary {
  const changed = curriculum.courses.filter(
    ({ id }) =>
      describeCourse(current ?? [], id) !== describeCourse(imported, id),
  );
  return {
    changedCourseCount: changed.length,
    gradedCourses: changed.flatMap(({ id, name }) => {
      const assessmentCount = imported
        .filter((enrollment) => enrollment.courseId === id)
        .reduce(
          (count, { assessments = [] }) =>
            count + flattenScheme(assessments).length,
          0,
        );
      return assessmentCount ? [{ name, assessmentCount }] : [];
    }),
  };
}
