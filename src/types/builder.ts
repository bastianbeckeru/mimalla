import type { HexColor } from "@/types/colors";
import type {
  Area,
  AreaId,
  Course,
  CourseId,
  Curriculum,
  CurriculumDetails,
  Period,
  Slot,
  TermSystem,
  Track,
  TrackId,
} from "@/types/curriculum";

export type Draft = {
  curriculum: Curriculum;
  baseColor: HexColor;
  handColoredAreaIds: AreaId[];
};

export type Handlers<A extends { type: string }> = {
  [K in A["type"]]: (draft: Draft, action: Extract<A, { type: K }>) => Draft;
};

export type CurriculumAction = {
  type: "editDetails";
  changes: Partial<CurriculumDetails>;
};

export type CourseAction =
  | {
      type: "addCourse";
      id: CourseId;
      name: string;
      period: Period;
      position?: number;
    }
  | {
      type: "editCourse";
      courseId: CourseId;
      changes: Partial<
        Pick<Course, "name" | "code" | "credits" | "duration" | "isElective">
      >;
    }
  | { type: "deleteCourse"; courseId: CourseId };

export type AreaAction =
  | { type: "addArea"; id: AreaId; name: string }
  | {
      type: "editArea";
      areaId: AreaId;
      changes: Partial<Pick<Area, "name">>;
    }
  | { type: "deleteArea"; areaId: AreaId }
  | { type: "setAreaColor"; areaId: AreaId; color: string }
  | { type: "setBaseColor"; color: string }
  | { type: "assignArea"; courseId: CourseId; areaId: AreaId | null };

export type TrackAction =
  | { type: "addTrack"; id: TrackId; name: string }
  | {
      type: "editTrack";
      trackId: TrackId;
      changes: Partial<Pick<Track, "name" | "credentialType">>;
    }
  | { type: "deleteTrack"; trackId: TrackId }
  | { type: "assignTracks"; courseId: CourseId; trackIds: TrackId[] };

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
  courseId: CourseId;
  slotIndex: number;
  to: Slot;
};

export type ResizeAction = {
  type: "resizeCourse";
  courseId: CourseId;
  slotIndex: number;
  rows: number;
  duration: number;
};

export type ElectiveAction =
  | { type: "addSlot"; courseId: CourseId }
  | { type: "removeSlot"; courseId: CourseId; slotIndex: number };

export type PrerequisiteAction =
  | { type: "addPrerequisite"; courseId: CourseId; prerequisiteId: CourseId }
  | { type: "removePrerequisite"; courseId: CourseId; prerequisiteId: CourseId }
  | { type: "setPrerequisiteCredits"; courseId: CourseId; credits: number };

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
