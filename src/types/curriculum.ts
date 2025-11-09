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

//////////////////////////////////////////
// NEW MIMALLA v0.3.0
//////////////////////////////////////////

export type CurriculumData = {
  //version: string; // MiMalla version
  institution: Institution;
  department: Department;
  program: Program;
  stats: Stat[];
  curriculum: {
    version: string;
    year: number;
    isCurrent: boolean;
    structure: Slot[];
    plans: Plan[];
  };
  areas: Area[];
  courses: Course[];
  //categories: Category[];
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

export type Institution = {
  name: string;
  acronym: string;
};

type Department = {
  name: string;
  acronym: string;
};

export type Program = {
  name: string;
  siesCode: string;
  demreCode: number;
  schedule: "DAYTIME" | "EVENING";
};

export type Plan = {
  id: number;
  name: string;
  description?: string;
  courseIds: number[];
  subplanIds: number[];
  requiredCredits: number; // (-1) All courses and subplans. (>0) X courses until reach that amount.
  credential: Credential | null;
};

type Credential = {
  type: "PROFESSIONAL" | "ACADEMIC" | "TECHNICAL" | "CERTIFICATE";
  name: string;
};

type Area = {
  id: number;
  name: string;
  color: string;
  courseIds: number[];
  subareaIds: number[];
  electiveIds: number[];
};

type Stat = {
  year: number;
  admissions: {
    paesRequirements: {
      nem: number;
      ranking: number;
      language: number;
      science: number;
      history: number;
      math1: number;
      math2: number;
    };
    averageScore: number;
    vacancies: number;
  };
  academics: {
    firstYearRetentionRate: number;
    avgRealDuration: number;
    avgRealDurationUnit: string;
    totalEnrollment: number;
    freshmenEnrollment: number;
    graduates: number;
    acreditationYears: number;
  };
  employment: {
    employmentRate1stYear: number;
    employmentRate2ndYear: number;
    avgIncome4thYear: {
      min: number;
      max: number;
    };
  };
  costs: {
    annualTuition: number;
    annualEnrollment: number;
  };
};

type Course = {
  id: number;
  code: string;
  name: string;
  credits: number;
  description?: string;
  duration: number;
  prerequisiteCredits: number;
  prerequisiteIds: number[];
  //corequisiteIds: number[];
  //subsequentIds: number[]
  //areaId: number;
  //isElective: boolean
};

/* type Category = {
  id: number;
  name: string;
};
 */

type Slot = {
  id: number;
  year: number;
  term: number;
  position: number;
  courseId: number;
  isElective?: boolean;
  //forceElection?: boolean;
  //electiveGroupId: number,
  //type: 'MANDATORY' || 'ELECTIVE'
};
