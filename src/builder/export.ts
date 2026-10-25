import type { Curriculum, Draft, Slot } from "@/builder/draft";
import { comparePeriods } from "@/builder/periods";
import { slugify } from "@/utils/strings";

const MIN_EFFECTIVE_YEAR = 1900;
const MAX_EFFECTIVE_YEAR = 2100;

type RequiredDetail = keyof Pick<Curriculum, "programName" | "effectiveYear">;

function isValidEffectiveYear(year: number | null): year is number {
  return (
    year !== null &&
    Number.isInteger(year) &&
    year >= MIN_EFFECTIVE_YEAR &&
    year <= MAX_EFFECTIVE_YEAR
  );
}

const SCHEMA_VERSION = 1;

function compareSlots(a: Slot, b: Slot) {
  return comparePeriods(a, b) || a.position - b.position;
}

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

  return JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    program: { name: curriculum.programName },
    effectiveYear: curriculum.effectiveYear,
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
      credits: course.credits,
      ...(course.areaId !== null && { areaId: exportedAreaId(course.areaId) }),
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
  return missing;
}
