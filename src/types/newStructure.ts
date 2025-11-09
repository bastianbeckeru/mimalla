type Course = {
  id: number;
  code: string;
  name: string;
  credits: number;
  description?: string;
  duration: number;
  //
  prerequisiteCredits: number;
  prerequisiteIds: number[];
  corequisiteIds: number[];

  //areaId: number;
};

type Area = {
  id: number;
  name: string;
  color: string;
  courseIds: number[];
  subareaIds: number[];
};

type Category = {
  id: number;
  name: string;
};

type Institution = {
  name: string;
  acronym: string;
};

type Department = {
  name: string;
  acronym: string;
};

type ScheduleType = "DAYTIME" | "EVENING";
type Program = {
  name: string;
  siesCode: string;
  demreCode: number;
  schedule: ScheduleType;
};

type CurriculumSlot = {
  id: number;
  year: number;
  term: number;
  position: number;
  courseId: number;
  isElective?: boolean;
  //forceElection?: boolean;
  //electiveGroupId: number,
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

export type DataSchema = {
  // Info
  institution: Institution;
  department: Department;
  program: Program;
  //
  curriculum: {
    version: string;
    year: number;
    isCurrent: boolean;
    structure: CurriculumSlot[];
    plans: Plan[];
  };
  // Consumed Data
  courses: Course[];
  areas: Area[];
  //categories: Category[];
};
