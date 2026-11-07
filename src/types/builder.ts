import type { HexColor } from "@/types/colors";
import type {
  Area,
  Course,
  Curriculum,
  CurriculumDetails,
  Period,
  Slot,
  TermSystem,
  Track,
} from "@/types/curriculum";

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
  changes: Partial<CurriculumDetails>;
};

export type CourseAction =
  | { type: "addCourse"; name: string; period: Period; position?: number }
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

export type TrackAction =
  | { type: "addTrack"; name: string }
  | {
      type: "editTrack";
      trackId: number;
      changes: Partial<Pick<Track, "name" | "credentialType">>;
    }
  | { type: "deleteTrack"; trackId: number }
  | { type: "assignTracks"; courseId: number; trackIds: number[] };

export type PeriodAction =
  | {
      type: "createCurriculum";
      termSystem: TermSystem;
      details: CurriculumDetails;
    }
  | { type: "setTermSystem"; termSystem: TermSystem }
  | { type: "addPeriod" }
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
  | TrackAction
  | PeriodAction
  | SlotAction
  | ResizeAction
  | ElectiveAction
  | PrerequisiteAction;
