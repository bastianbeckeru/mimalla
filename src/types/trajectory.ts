import type { PeriodKey } from "@/types/curriculum";

export type EnrollmentStatus = "APPROVED" | "PENDING" | "FAILED";

export type Enrollment = {
  id: string;
  year: number;
  term: number;
  position: number;
  status: EnrollmentStatus;
  courseId: number;
  // The enrollment's grading scheme, without the course at its root.
  assessments?: Assessment[];
  // A course grade the student entered, which prevails over the computed one.
  courseGrade?: number;
};

// An assessment's weight is a percentage of its parent, or null to share
// what the weighted assessments around it leave equally.
export type Assessment =
  | {
      kind: "SINGLE";
      id: string;
      name: string;
      weight: number | null;
      grade: number | null;
    }
  | {
      kind: "GROUP";
      id: string;
      name: string;
      weight: number | null;
      assessments: Assessment[];
      droppedCount: number;
    };

export type GradingScale = {
  min: number;
  max: number;
  passing: number;
};

export type RequiredGrade =
  | { status: "REACHED" }
  | { status: "UNREACHABLE" }
  | { status: "NEEDED"; grade: number };

export type Entry = {
  year: number;
  term: number;
};

export type Trajectory = {
  id: string;
  curriculumPath: string;
  entry: Entry;
  gradingScale: GradingScale;
  enrollments: Enrollment[];
};

export type TrajectoryProgress = {
  approvedCourseIds: Set<number>;
  approvedCredits: number;
};

export type Placement = {
  period: PeriodKey;
  row: number;
};

export type ChangeNotice = {
  title: string;
  description?: string;
  isShownOnDesktop?: boolean;
};
