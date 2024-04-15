export type UserProps = {
  email?: string | null;
  name?: string | null;
  image?: string | null;
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
  grades: GradeProps[];
};

export type CourseProps = {
  id: string;
  name: string;
  code: string | null;
  credits: number;
  requiredCredits: number;
  dependentCourses: {
    code: string | null;
  }[];
  prerequisiteCourses: {
    code: string | null;
  }[];
  color?: string;
};

export type GradeProps = {
  id: number;
  name: string;
  value: number | null;
  weight: number;
  excluded: boolean;
  date?: Date;
  subgrades: SubgradeProps[];
};

export type SubgradeProps = {
  id: number;
  name: string;
  value: number | null;
  excluded: boolean;
  date?: Date;
};

export type AreaProps = {
  name: string;
  color: string | null; // "#FFFFFF"
  courses: CourseProps[];
};
