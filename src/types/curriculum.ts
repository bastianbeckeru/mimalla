import type { HexColor } from "@/types/colors";

export type TermSystem = "semester" | "annual";

export type Period = {
  programYear: number;
  term: number;
};

export type Slot = Period & {
  position: number;
};

export type Course = {
  id: number;
  name: string;
  code: string;
  credits: number;
  areaId: number | null;
  trackIds: number[];
  duration: number;
  prerequisiteIds: number[];
  prerequisiteCredits: number;
  isElective: boolean;
  slots: Slot[];
};

export type Area = {
  id: number;
  name: string;
  color: HexColor;
};

export type CredentialType =
  | "professional"
  | "academic"
  | "technical"
  | "certificate"
  | "mention";

export type Track = {
  id: number;
  name: string;
  credentialType: CredentialType | null;
};

export type Curriculum = {
  programName: string;
  institution: string;
  effectiveYear: number | null;
  versionName: string;
  termSystem: TermSystem;
  periods: Period[];
  areas: Area[];
  tracks: Track[];
  courses: Course[];
};

export type CurriculumDetails = Pick<
  Curriculum,
  "programName" | "institution" | "effectiveYear" | "versionName"
>;

export type PeriodKey = `${number}-${number}`;

export type Institution = {
  name: string;
  acronym: string;
};

type Department = {
  name: string;
  acronym: string;
};

export type Schedule = "DAYTIME" | "EVENING";

export type ProgramRecord = {
  department: Department;
  siesCode: string;
  demreCode: number;
  schedule: Schedule;
};

export type Program = ProgramRecord & {
  name: string;
  path: string;
  institution: Institution;
  effectiveYears: number[];
};

export type CatalogProgram = Pick<Program, "name" | "path" | "effectiveYears">;

export type CatalogDepartment = {
  name: string;
  programs: CatalogProgram[];
};

export type CatalogInstitution = Institution & {
  departments: CatalogDepartment[];
};

export type ExtendedCourse = Course & {
  successorIds: number[];
};
