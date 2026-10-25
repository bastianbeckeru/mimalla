import type { Curriculum, Period } from "@/builder/draft";
import { isSamePeriod } from "@/builder/periods";

const FALLBACK_DEFAULT_CREDITS = 5;

export function getDefaultCredits(curriculum: Curriculum) {
  const counts = new Map<number, number>();
  for (const { credits } of curriculum.courses)
    counts.set(credits, (counts.get(credits) ?? 0) + 1);

  let defaultCredits = FALLBACK_DEFAULT_CREDITS;
  let maxCount = 0;
  for (const [credits, count] of counts) {
    if (count > maxCount || (count === maxCount && credits < defaultCredits)) {
      defaultCredits = credits;
      maxCount = count;
    }
  }
  return defaultCredits;
}

export function getCourseHeight(credits: number, defaultCredits: number) {
  if (defaultCredits === 0) return 1;
  return Math.max(1, Math.round(credits / defaultCredits));
}

export function getFirstFreePosition(curriculum: Curriculum, period: Period) {
  const defaultCredits = getDefaultCredits(curriculum);
  const occupied = new Set<number>();

  for (const course of curriculum.courses) {
    const height = getCourseHeight(course.credits, defaultCredits);
    for (const slot of course.slots) {
      if (!isSamePeriod(slot, period)) continue;
      for (let row = slot.position; row < slot.position + height; row++)
        occupied.add(row);
    }
  }

  let position = 1;
  while (occupied.has(position)) position++;
  return position;
}
