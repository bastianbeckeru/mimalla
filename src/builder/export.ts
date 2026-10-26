import { comparePeriods, compareSlots } from "@/builder/periods";
import type { Curriculum, Draft } from "@/types/builder";
import { slugify } from "@/utils/strings";

const MIN_EFFECTIVE_YEAR = 1900;
const MAX_EFFECTIVE_YEAR = 2100;

type RequiredDetail =
  | keyof Pick<Curriculum, "programName" | "effectiveYear">
  | "courseNames";

export function isValidEffectiveYear(year: unknown): year is number {
  return (
    typeof year === "number" &&
    Number.isInteger(year) &&
    year >= MIN_EFFECTIVE_YEAR &&
    year <= MAX_EFFECTIVE_YEAR
  );
}

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
    courses: courses.map((course, index) => ({
      id: index + 1,
      name: course.name,
      ...(course.code !== "" && { code: course.code }),
      credits: course.credits,
      ...(course.duration !== 1 && { duration: course.duration }),
      ...(course.areaId !== null && { areaId: exportedAreaId(course.areaId) }),
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
  return `${slugify(curriculum.programName)}.json`;
}

export function getMissingDetails({ curriculum }: Draft): RequiredDetail[] {
  const missing: RequiredDetail[] = [];
  if (curriculum.programName.trim() === "") missing.push("programName");
  if (!isValidEffectiveYear(curriculum.effectiveYear))
    missing.push("effectiveYear");
  if (curriculum.courses.some((course) => course.name.trim() === ""))
    missing.push("courseNames");
  return missing;
}
