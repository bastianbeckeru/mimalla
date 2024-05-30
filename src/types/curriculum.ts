export type AreaProps = {
  name: string;
  color: string | null; // "#FFFFFF"
  courses: CourseProps[];
};

export type CareerProps = {
  siesCode: string;
  name: string;
  faculty: {
    name: string;
    university: {
      name: string;
    };
  };
};

export type CurriculumProps = {
  id: number;
  startedAt: Date;
  updatedAt: Date;
  career: CareerProps | null;
  periods: PeriodProps[];
};

export type PeriodProps = {
  id: number;
  enrollments: EnrollmentProps[];
};

export type EnrollmentProps = {
  id: number; // BORRAR
  position: number;
  status: string;
  courseId: string | null;
  course?: CourseProps | null;
};

export type CourseProps = {
  id: string;
  name: string;
  code: string | null;
  credits: number;
  dependentCourses: {
    code: string | null;
    name: string;
  }[];
  prerequisiteCourses: {
    code: string | null;
    name: string;
  }[];
  prerequisiteCredits: number;
};

//////////////////////////////////////////
/* MODIFIED VERSION USED IN CLIENT SIDE */
//////////////////////////////////////////
export type ModifiedCurriculumProps = {
  id: number;
  startedAt: Date;
  updatedAt: Date;
  career: CareerProps | null;
  periods: ModifiedPeriodProps[];
};

export type ModifiedPeriodProps = {
  id: number;
  enrollments: ModifiedEnrollmentProps[];
};

export type ModifiedEnrollmentProps = {
  id: number; // BORRAR
  position: number;
  status: string;
  courseId: string | null;
  course?: ModifiedCourseProps | null;
};

export type ModifiedCourseProps = {
  id: string;
  name: string;
  code: string | null;
  credits: number;
  dependentCourses: {
    code: string;
    name: string;
  }[];
  prerequisiteCourses: {
    code: string;
    name: string;
  }[];
  prerequisiteCredits: number;
};
