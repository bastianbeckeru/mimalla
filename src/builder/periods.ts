import type { Curriculum, Period, Slot, TermSystem } from "@/types/builder";
import { arabicToRoman } from "@/utils/numbers";

export const REGULAR_TERMS: Record<TermSystem, number[]> = {
  semester: [1, 3],
  annual: [1],
};

export const INTENSIVE_TERMS: Record<TermSystem, number[]> = {
  semester: [2, 4],
  annual: [4],
};

export function findPeriodIndex(periods: Period[], period: Period) {
  return periods.findIndex((candidate) => isSamePeriod(candidate, period));
}

function isPeriodOccupied(curriculum: Curriculum, period: Period) {
  const index = findPeriodIndex(curriculum.periods, period);
  return curriculum.courses.some((course) =>
    course.slots.some((slot) => {
      const start = findPeriodIndex(curriculum.periods, slot);
      return start <= index && index < start + course.duration;
    }),
  );
}

export function canRemovePeriod(curriculum: Curriculum, period: Period) {
  return (
    curriculum.periods.length > 1 &&
    findPeriodIndex(curriculum.periods, period) !== -1 &&
    !isPeriodOccupied(curriculum, period)
  );
}

export function getAvailableIntensiveTerms(
  { termSystem, periods }: Curriculum,
  programYear: number,
) {
  if (!periods.some((period) => period.programYear === programYear)) return [];
  return INTENSIVE_TERMS[termSystem].filter(
    (term) =>
      !periods.some((period) => isSamePeriod(period, { programYear, term })),
  );
}

const PERIOD_NAMES: Record<TermSystem, Record<number, string>> = {
  semester: { 1: "SEMESTRE", 2: "INVIERNO", 3: "SEMESTRE", 4: "VERANO" },
  annual: { 1: "AÑO", 4: "VERANO" },
};

function getPeriodNumber(
  termSystem: TermSystem,
  { programYear, term }: Period,
) {
  const regularTerms = REGULAR_TERMS[termSystem];
  const regularIndex = regularTerms.indexOf(term);
  return regularIndex === -1
    ? programYear
    : (programYear - 1) * regularTerms.length + regularIndex + 1;
}

export function getPeriodLabel(termSystem: TermSystem, period: Period) {
  return `${PERIOD_NAMES[termSystem][period.term]} ${arabicToRoman(getPeriodNumber(termSystem, period))}`;
}

/** The period label in sentence case, e.g. "Semestre IV". */
export function getPeriodTitle(termSystem: TermSystem, period: Period) {
  return getPeriodLabel(termSystem, period).replace(
    /^(\S)(\S*)/,
    (_, first: string, rest: string) => first + rest.toLowerCase(),
  );
}

export function isSamePeriod(a: Period, b: Period) {
  return a.programYear === b.programYear && a.term === b.term;
}

export function comparePeriods(a: Period, b: Period) {
  return a.programYear - b.programYear || a.term - b.term;
}

export function compareSlots(a: Slot, b: Slot) {
  return comparePeriods(a, b) || a.position - b.position;
}
