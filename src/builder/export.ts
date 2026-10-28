import { comparePeriods, compareSlots } from "@/builder/periods";
import { exportableCurriculumSchema } from "@/builder/schemas";
import type { Draft } from "@/types/builder";
import { slugify } from "@/utils/strings";

export const SCHEMA_VERSION = 1;

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

  const areaIds = [
    ...new Set([
      ...courses.flatMap((course) => course.areaId ?? []),
      ...curriculum.areas.map((area) => area.id),
    ]),
  ];
  const exportedAreaId = (areaId: number) => areaIds.indexOf(areaId) + 1;
  const exportedTrackId = (trackId: number) =>
    curriculum.tracks.findIndex((track) => track.id === trackId) + 1;
  const exportedCourseId = (courseId: number) =>
    courses.findIndex((course) => course.id === courseId) + 1;

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
      .map((area) => ({
        id: exportedAreaId(area.id),
        name: area.name,
        color: area.color,
      }))
      .toSorted((a, b) => a.id - b.id),
    tracks: curriculum.tracks.map((track, index) => ({
      id: index + 1,
      name: track.name,
      ...(track.credentialType !== null && {
        credentialType: track.credentialType,
      }),
    })),
    courses: courses.map((course, index) => ({
      id: index + 1,
      name: course.name,
      ...(course.code !== "" && { code: course.code }),
      credits: course.credits,
      ...(course.duration !== 1 && { duration: course.duration }),
      ...(course.areaId !== null && { areaId: exportedAreaId(course.areaId) }),
      ...(course.trackIds.length > 0 && {
        trackIds: course.trackIds
          .map(exportedTrackId)
          .toSorted((a, b) => a - b),
      }),
      ...(course.prerequisiteIds.length > 0 && {
        prerequisiteIds: course.prerequisiteIds
          .map(exportedCourseId)
          .toSorted((a, b) => a - b),
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
