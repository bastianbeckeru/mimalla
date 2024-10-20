import type { CurriculumData } from "./curriculum";

export type newCurriculumStoreInitialStateProps = {
  studentEnrollment: {
    id: string;
    programName: string;
    year: number;
    term: number;
    enrolledCourses: EnrolledCourse[];
  } | null;
};

type EnrolledCourseStatus = "APPROVED" | "PENDING" | "FAILED";

export type EnrolledCourse = {
  id: string;
  year: number;
  term: number;
  position: number;
  status: EnrolledCourseStatus;
  courseId: number;
};

export type useNewCurriculumStoreProps = {
  resetStore: () => void;
  addProgramEnrollment: (newEnrollment: {
    year: number;
    term: number;
    program: CurriculumData["program"];
    slots: CurriculumData["curriculum"]["slots"];
  }) => void;
  removeProgramEnrollment: (enrollmentId: string) => void;
  updateCourseEnrollments: (
    enrollmentId: string,
    newEnrollments: EnrolledCourse[],
  ) => void;
} & newCurriculumStoreInitialStateProps;
