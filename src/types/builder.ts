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

export type Curriculum = {
  programName: string;
  institution: string;
  effectiveYear: number | null;
  versionName: string;
  termSystem: TermSystem;
  periods: Period[];
  areas: Area[];
  courses: Course[];
};

export type Draft = {
  curriculum: Curriculum;
  baseColor: HexColor;
  handColoredAreaIds: number[];
};

export type Handlers<A extends { type: string }> = {
  [K in A["type"]]: (draft: Draft, action: Extract<A, { type: K }>) => Draft;
};

export type CurriculumAction = {
  type: "editDetails";
  changes: Partial<
    Pick<
      Curriculum,
      "programName" | "institution" | "effectiveYear" | "versionName"
    >
  >;
};

export type CourseAction =
  | { type: "addCourse"; period: Period; position?: number }
  | {
      type: "editCourse";
      courseId: number;
      changes: Partial<
        Pick<Course, "name" | "code" | "credits" | "duration" | "isElective">
      >;
    }
  | { type: "deleteCourse"; courseId: number };

export type AreaAction =
  | { type: "addArea"; name: string }
  | {
      type: "editArea";
      areaId: number;
      changes: Partial<Pick<Area, "name">>;
    }
  | { type: "deleteArea"; areaId: number }
  | { type: "setAreaColor"; areaId: number; color: string }
  | { type: "setBaseColor"; color: string }
  | { type: "assignArea"; courseId: number; areaId: number | null };

export type PeriodAction =
  | { type: "createCurriculum"; termSystem: TermSystem }
  | { type: "setTermSystem"; termSystem: TermSystem }
  | { type: "addProgramYear" }
  | { type: "removeLastProgramYear" }
  | { type: "addIntensiveTerm"; programYear: number; term: number }
  | { type: "removePeriod"; period: Period };

export type SlotAction = {
  type: "moveSlot";
  courseId: number;
  slotIndex: number;
  to: Slot;
};

export type ResizeAction = {
  type: "resizeCourse";
  courseId: number;
  slotIndex: number;
  rows: number;
  duration: number;
};

export type ElectiveAction =
  | { type: "addSlot"; courseId: number }
  | { type: "removeSlot"; courseId: number; slotIndex: number };

export type PrerequisiteAction =
  | { type: "addPrerequisite"; courseId: number; prerequisiteId: number }
  | { type: "removePrerequisite"; courseId: number; prerequisiteId: number }
  | { type: "setPrerequisiteCredits"; courseId: number; credits: number };

export type Action =
  | CurriculumAction
  | CourseAction
  | AreaAction
  | PeriodAction
  | SlotAction
  | ResizeAction
  | ElectiveAction
  | PrerequisiteAction;
