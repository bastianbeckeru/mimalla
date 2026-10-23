import type { PeriodKey } from "@/types/curriculum";

export type EnrollmentStatus = "APPROVED" | "PENDING" | "FAILED";

export type Enrollment = {
  id: string;
  year: number;
  term: number;
  position: number;
  status: EnrollmentStatus;
  courseCode: string | null;
};

export type Entry = {
  year: number;
  term: number;
};

export type Trajectory = {
  id: string;
  curriculumId: number | null;
  entry: Entry;
  enrollments: Enrollment[];
};

export type PeriodWithEnrollments = {
  id: PeriodKey;
  enrollments: Enrollment[];
};
