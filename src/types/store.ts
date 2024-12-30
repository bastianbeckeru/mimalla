import type { CurriculumData } from "./curriculum";

type StudentEnrollment = {
  id: string;
  path: string;
  year: number;
  term: number;
  enrolledCourses: EnrolledCourse[];
};

export type newCurriculumStoreInitialStateProps = {
  curriculums: StudentEnrollment[];
  activeCurriculumId: string | null;
};

export type EnrolledCourseStatus = "APPROVED" | "PENDING" | "FAILED";

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
  /* CURRICULUM */
  addCurriculum: (newCurriculum: {
    year: number;
    term: number;
    path: string;
    slots: CurriculumData["curriculum"]["slots"];
  }) => void;
  removeCurriculum: (curriculumId: string) => void;
  updateCurriculumEnrollments: (newEnrollments: EnrolledCourse[]) => void;
  selectCurriculum: (id: string) => void;
} & newCurriculumStoreInitialStateProps;
