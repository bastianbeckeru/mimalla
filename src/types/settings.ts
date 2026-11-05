import type { GradingScale } from "@/types/trajectory";

export type SettingsSectionId = "trajectory" | "appearance" | "help";

export type TrajectorySettings = {
  programName: string;
  gradingScale: GradingScale;
  onGradingScaleChange: (scale: GradingScale) => void;
  onReset: () => void;
  onRemove: () => void;
};
