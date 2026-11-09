import { customAlphabet } from "nanoid";
import type { AreaId, CourseId, TrackId } from "@/types/curriculum";

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  8,
);

const ID_PATTERN = /^(crs|are|trk)_[0-9A-Za-z]{8}$/;

export const createCourseId = (): CourseId => `crs_${nanoid()}`;
export const createAreaId = (): AreaId => `are_${nanoid()}`;
export const createTrackId = (): TrackId => `trk_${nanoid()}`;

export const isCourseId = (value: unknown): value is CourseId =>
  isId(value, "crs");
export const isAreaId = (value: unknown): value is AreaId => isId(value, "are");
export const isTrackId = (value: unknown): value is TrackId =>
  isId(value, "trk");

function isId(value: unknown, prefix: string) {
  return (
    typeof value === "string" &&
    ID_PATTERN.test(value) &&
    value.startsWith(`${prefix}_`)
  );
}
