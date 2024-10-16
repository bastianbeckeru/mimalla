import type { CurriculumData, PeriodKey } from "@/types/curriculum";

export function getPeriods({
  slots,
}: {
  slots: CurriculumData["curriculum"]["slots"];
}): {
  nCols: number;
  nRows: number;
  periods: PeriodKey[];
} {
  const periods = new Set<`${number}-${number}`>();
  let maxRows = 1;

  slots.forEach((slot) => {
    periods.add(`${slot.year}-${slot.term}`);
    maxRows = Math.max(maxRows, slot.position);
  });

  const sortedPeriods = Array.from(periods).sort((a, b) => {
    const [yearA, termA] = a.split("-").map(Number);
    const [yearB, termB] = b.split("-").map(Number);
    return yearA !== yearB ? yearA! - yearB! : termA! - termB!;
  });

  return { nCols: periods.size, nRows: maxRows, periods: sortedPeriods };
}
