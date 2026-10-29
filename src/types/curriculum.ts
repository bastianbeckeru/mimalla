import type { Course } from "@/types/builder";

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
