export const TERM_LABELS: Record<number, string> = {
  1: "Primer semestre",
  2: "Invierno",
  3: "Segundo semestre",
  4: "Verano",
};

export const ENTRY_TERMS = [1, 3].map((value) => ({
  value,
  label: TERM_LABELS[value],
}));

export function parsePeriodKey(key: string) {
  const [year = 0, term = 0] = key.split("-").map(Number);
  return { year, term };
}

export function comparePeriodKeys(a: string, b: string) {
  const periodA = parsePeriodKey(a);
  const periodB = parsePeriodKey(b);
  return periodA.year - periodB.year || periodA.term - periodB.term;
}

export function isSemester(term: number) {
  return term === 1 || term === 3;
}

export function getSemesterIndex({
  year,
  term,
}: {
  year: number;
  term: number;
}) {
  return 2 * year + (term >= 3 ? 1 : 0);
}
