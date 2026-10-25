import type { Curriculum, Period, TermSystem } from "@/builder/draft";
import { TERM_LABELS } from "@/utils/period-key";

export const REGULAR_TERMS: Record<TermSystem, number[]> = {
  semester: [1, 3],
  annual: [1],
};

const INTENSIVE_TERMS: Record<TermSystem, number[]> = {
  semester: [2, 4],
  annual: [4],
};

function findPeriodIndex(periods: Period[], period: Period) {
  return periods.findIndex((candidate) => isSamePeriod(candidate, period));
}

export function isPeriodOccupied(curriculum: Curriculum, period: Period) {
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

const TERM_LABELS_BY_SYSTEM: Record<TermSystem, Record<number, string>> = {
  semester: TERM_LABELS,
  annual: { 1: "Año académico", 4: "Verano" },
};

export function getPeriodLabel(termSystem: TermSystem, period: Period) {
  return `Año ${period.programYear} · ${TERM_LABELS_BY_SYSTEM[termSystem][period.term]}`;
}

export function isSamePeriod(a: Period, b: Period) {
  return a.programYear === b.programYear && a.term === b.term;
}

export function comparePeriods(a: Period, b: Period) {
  return a.programYear - b.programYear || a.term - b.term;
}
