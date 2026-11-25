import { comparePeriods, compareSlots } from "@/curriculum/periods";
import { exportableCurriculumSchema } from "@/curriculum/schemas";
import type { Draft } from "@/types/builder";
import { slugify } from "@/utils/strings";

export const SCHEMA_VERSION = 2;

export function exportFile({ curriculum }: Draft) {
  const courses = curriculum.courses
    .map((course) => ({
      ...course,
      slots: course.slots.toSorted(compareSlots),
    }))
    .toSorted((a, b) => {
      const [slotA, slotB] = [a.slots[0], b.slots[0]];
      return slotA && slotB ? compareSlots(slotA, slotB) : 0;
    });

  // Areas in the order courses first use them, then unused ones.
  const areaOrder = [
    ...new Set([
      ...courses.flatMap((course) => course.areaId ?? []),
      ...curriculum.areas.map((area) => area.id),
    ]),
  ];
  const byIndexIn =
    <T>(ids: T[]) =>
    (a: T, b: T) =>
      ids.indexOf(a) - ids.indexOf(b);
  const trackOrder = curriculum.tracks.map((track) => track.id);
  const courseOrder = courses.map((course) => course.id);

  return JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    program: {
      name: curriculum.programName,
      ...(curriculum.institution !== "" && {
        institution: curriculum.institution,
      }),
    },
    effectiveYear: curriculum.effectiveYear,
    ...(curriculum.versionName !== "" && {
      versionName: curriculum.versionName,
    }),
    termSystem: curriculum.termSystem,
    periods: curriculum.periods
      .toSorted(comparePeriods)
      .map(({ programYear, term }) => ({ programYear, term })),
    areas: curriculum.areas
      .toSorted((a, b) => byIndexIn(areaOrder)(a.id, b.id))
      .map((area) => ({ id: area.id, name: area.name, color: area.color })),
    tracks: curriculum.tracks.map((track) => ({
      id: track.id,
      name: track.name,
      ...(track.credentialType !== null && {
        credentialType: track.credentialType,
      }),
    })),
    courses: courses.map((course) => ({
      id: course.id,
      name: course.name,
      ...(course.code !== "" && { code: course.code }),
      credits: course.credits,
      ...(course.duration !== 1 && { duration: course.duration }),
      ...(course.areaId !== null && { areaId: course.areaId }),
      ...(course.trackIds.length > 0 && {
        trackIds: course.trackIds.toSorted(byIndexIn(trackOrder)),
      }),
      ...(course.prerequisiteIds.length > 0 && {
        prerequisiteIds: course.prerequisiteIds.toSorted(
          byIndexIn(courseOrder),
        ),
      }),
      ...(course.prerequisiteCredits > 0 && {
        prerequisiteCredits: course.prerequisiteCredits,
      }),
      ...(course.isElective && { isElective: true }),
      slots: course.slots.map(({ programYear, term, position }) => ({
        programYear,
        term,
        position,
      })),
    })),
  });
}

export function getFileName({ curriculum }: Draft) {
  const slug = slugify(curriculum.programName);
  return curriculum.effectiveYear === null
    ? `${slug}.malla`
    : `${slug}_${curriculum.effectiveYear}.malla`;
}

export function isExportable({ curriculum }: Draft) {
  return exportableCurriculumSchema.safeParse(curriculum).success;
}
