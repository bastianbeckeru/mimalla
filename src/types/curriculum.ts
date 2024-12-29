import type { EnrolledCourse } from "./store";

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

// NEW MIMALLA v0.2.0
export type CurriculumData = {
  //version: string; // MiMalla version
  institution: {
    name: string;
    acronym: string;
  };
  program: {
    name: string;
    acronym: string;
    siesCode: string;
    demreCode: number;
    schedule: string;
  };
  curriculum: {
    year: number;
    slots: {
      id: number | string;
      year: number;
      term: number;
      position: number;
      //type: 'MANDATORY' | 'ELECTIVE';
      courseId: number;
    }[];
  };
  areas: {
    id: number;
    name: string;
    color: string;
    subareaIds: number[];
    courseIds: number[];
    electiveIds: number[];
  }[];
  courses: {
    id: number;
    isElective: boolean;
    name: string;
    code: string | null;
    description: string | null;
    duration: number;
    credits: number;
    prerequisiteCredits: number;
    prerequisiteIds: number[];
  }[];
  degrees: {
    id: number;
    name: string;
    type: string;
  }[];
};

export type ModifiedCourse = {
  id: number;
  isElective: boolean;
  name: string;
  code: string | null;
  description: string | null;
  duration: number;
  credits: number;
  prerequisiteCredits: number;
  prerequisiteIds: number[];
  subsequentIds: number[];
} | null;

export type PeriodWithEnrollments = {
  id: PeriodKey;
  enrollments: EnrolledCourse[];
};

export type PeriodKey = `${number}-${number}`;

export type History<T> = {
  past: T[];
  present: T;
  future: T[];
};
