import type { AreaId, CourseId, TrackId } from "@/types/curriculum";

// Readable stable ids for tests: crs(7) is "crs_00000007".
const pad = (n: number) => String(n).padStart(8, "0");

export const crs = (n: number): CourseId => `crs_${pad(n)}`;
export const are = (n: number): AreaId => `are_${pad(n)}`;
export const trk = (n: number): TrackId => `trk_${pad(n)}`;
