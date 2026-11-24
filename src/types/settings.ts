import type { Curriculum } from "@/types/curriculum";
import type {
  GradingScale,
  ImportedContent,
  Trajectory,
} from "@/types/trajectory";

export type SettingsSectionId = "trajectory" | "preferences" | "help";

export type TrajectorySettings = {
  programName: string;
  gradingScale: GradingScale;
  onGradingScaleChange: (scale: GradingScale) => void;
  trajectory: Trajectory;
  curriculum: Curriculum;
  onImport: (content: ImportedContent) => void;
  onReset: () => void;
  onRemove: () => void;
};
