import type { CurriculumData } from "./curriculum";

type HistoryState<T> = {
  past: T[];
  present: T | null;
  future: T[];
};

type StudentEnrollment = {
  id: string;
  year: number;
  term: number;
  enrolledCourses: EnrolledCourse[];
};

export type newCurriculumStoreInitialStateProps = {
  curriculums: StudentEnrollment[];
  past: StudentEnrollment[];
  present: StudentEnrollment | null;
  future: StudentEnrollment[];
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
    program: CurriculumData["program"];
    slots: CurriculumData["curriculum"]["slots"];
  }) => void;
  removeCurriculum: (curriculumId: string) => void;
  updateCurriculumEnrollments: (
    curriculumId: string,
    newEnrollments: EnrolledCourse[],
  ) => void;
  selectCurriculum: (id: string) => void;
  undo: () => void;
  redo: () => void;
} & newCurriculumStoreInitialStateProps;
