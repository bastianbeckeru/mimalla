import type { HexColor } from "@/types/colors";

export type TermSystem = "semester" | "trimester" | "annual";

export type Period = {
  programYear: number;
  term: number;
};

export type Slot = Period & {
  position: number;
};

// Ids are stable: they are kept through every edit, export and load (ADR 0007).
export type CourseId = `crs_${string}`;
export type AreaId = `are_${string}`;
export type TrackId = `trk_${string}`;

export type Course = {
  id: CourseId;
  name: string;
  code: string;
  credits: number;
  areaId: AreaId | null;
  trackIds: TrackId[];
  duration: number;
  prerequisiteIds: CourseId[];
  prerequisiteCredits: number;
  isElective: boolean;
  slots: Slot[];
};

export type Area = {
  id: AreaId;
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
  id: TrackId;
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
  successorIds: CourseId[];
};
