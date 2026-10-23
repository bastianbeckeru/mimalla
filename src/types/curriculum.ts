export type PeriodKey = `${number}-${number}`;

export type CurriculumData = {
  institution: Institution;
  department: Department;
  program: Program;
  curriculum: {
    id: number;
    version?: string;
    year: number;
    isCurrent: boolean;
    slots: Slot[];
    tracks: Track[];
  };
  areas: Area[];
  courses: Course[];
};

export type ProgramCurriculum = {
  id: number;
  year: number;
  version?: string;
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
  siesCode?: string;
  demreCode?: number;
  schedule: "DAYTIME" | "EVENING";
};

export type Track = {
  id: number;
  name: string;
  description?: string;
  courseIds: number[];
  subtrackIds: number[];
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
  successorIds: number[];
};

export type Slot = {
  id: number;
  programYear: number;
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
