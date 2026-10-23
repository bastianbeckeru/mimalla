export type EnrolledCourseStatus = "APPROVED" | "PENDING" | "FAILED";

export type EnrolledCourse = {
  id: string;
  year: number;
  term: number;
  position: number;
  status: EnrolledCourseStatus;
  courseId: number;
};

export type StudentCurriculum = {
  id: string;
  path: string;
  year: number;
  term: number;
  enrolledCourses: EnrolledCourse[];
};
