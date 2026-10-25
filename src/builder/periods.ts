import type { Period, TermSystem } from "@/builder/draft";
import { TERM_LABELS } from "@/utils/period-key";

export const REGULAR_TERMS: Record<TermSystem, number[]> = {
  semester: [1, 3],
  annual: [1],
};

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
