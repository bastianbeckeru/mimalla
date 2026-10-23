import type { EnrolledCourse } from "@/types/store";

export type PeriodWithEnrollments = {
  id: PeriodKey;
  enrollments: EnrolledCourse[];
};

export type PeriodKey = `${number}-${number}`;

export type CurriculumData = {
  institution: Institution;
  department: Department;
  program: Program;
  stats?: Stat[];
  curriculum: {
    version: string;
    year: number;
    isCurrent: boolean;
    structure: Slot[];
    plans: Plan[];
  };
  areas: Area[];
  courses: Course[];
};

export type Institution = {
  name: string;
  acronym: string;
};

export type CatalogProgram = {
  name: string;
  path: string;
};

export type CatalogDepartment = {
  name: string;
  programs: CatalogProgram[];
};

export type CatalogInstitution = Institution & {
  departments: CatalogDepartment[];
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
  requiredCredits: number;
  credential: Credential | null;
};

export type CredentialType =
  | "PROFESSIONAL"
  | "ACADEMIC"
  | "TECHNICAL"
  | "CERTIFICATE";
type Credential = {
  type: CredentialType;
  name: string;
};

export type Area = {
  id: number;
  name: string;
  color: string;
  courseIds: number[];
  subareaIds: number[];
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

export type Course = {
  id: number;
  code: string;
  name: string;
  credits: number;
  description?: string;
  duration: number;
  prerequisiteCredits: number;
  prerequisiteIds: number[];
  isElective: boolean;
};
export type ExtendedCourse = Course & {
  subsequentIds: number[];
};

export type Slot = {
  id: number;
  year: number;
  term: number;
  position: number;
  courseId: number;
  isElective?: boolean;
};

export type ExtendedSlot = Slot & {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  course: ExtendedCourse | null;
};
