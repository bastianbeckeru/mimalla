import { type FileObject, isInteger, reject } from "@/curriculum/file-reading";
import {
  createAreaId,
  createCourseId,
  createTrackId,
  isAreaId,
  isCourseId,
  isTrackId,
} from "@/curriculum/ids";
import type { AreaId, CourseId, TrackId } from "@/types/curriculum";

export type IdKind<T> = {
  plural: string;
  prefix: string;
  isValid: (value: unknown) => value is T;
  create: () => T;
};

export const COURSE_IDS: IdKind<CourseId> = {
  plural: "los cursos",
  prefix: "crs",
  isValid: isCourseId,
  create: createCourseId,
};
export const AREA_IDS: IdKind<AreaId> = {
  plural: "las áreas",
  prefix: "are",
  isValid: isAreaId,
  create: createAreaId,
};
export const TRACK_IDS: IdKind<TrackId> = {
  plural: "los planes",
  prefix: "trk",
  isValid: isTrackId,
  create: createTrackId,
};

/**
 * Maps each id in the file to the id it gets: the same one from version 2 on,
 * a new one for the numbered ids of version 1 (ADR 0007).
 */
export function readIds<T>(
  items: FileObject[],
  schemaVersion: number,
  kind: IdKind<T>,
): Map<unknown, T> {
  const ids = items.map(({ id }) => id);
  const isUnique = new Set(ids).size === ids.length;
  if (schemaVersion === 1) {
    const isSequence =
      isUnique &&
      ids.every((id) => isInteger(id) && id >= 1 && id <= items.length);
    if (!isSequence)
      reject(
        `Los ids de ${kind.plural} deben ir de 1 a ${items.length}, sin saltos ni repetirse.`,
      );
    return new Map(ids.map((id) => [id, kind.create()]));
  }
  if (!isUnique || !ids.every(kind.isValid))
    reject(
      `Los ids de ${kind.plural} deben ser distintos y tener la forma ${kind.prefix}_ seguida de 8 letras o números.`,
    );
  return new Map(ids.map((id) => [id, id as T]));
}

export function translateId<T>(ids: Map<unknown, T>, id: unknown) {
  const translated = ids.get(id);
  if (translated === undefined) reject(`El id ${String(id)} no existe.`);
  return translated;
}
