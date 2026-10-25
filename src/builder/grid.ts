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

type SlotRef = { courseId: number; slotIndex: number };

export function pushDownCollisions(
  curriculum: Curriculum,
  anchor: SlotRef,
): Curriculum {
  const defaultCredits = getDefaultCredits(curriculum);
  const anchorCourse = curriculum.courses.find(
    (course) => course.id === anchor.courseId,
  );
  const anchorSlot = anchorCourse?.slots[anchor.slotIndex];
  if (!anchorCourse || !anchorSlot) return curriculum;

  const isAnchor = (courseId: number, slotIndex: number) =>
    courseId === anchor.courseId && slotIndex === anchor.slotIndex;

  const others = curriculum.courses
    .flatMap((course) =>
      course.slots.map((slot, slotIndex) => ({
        courseId: course.id,
        slotIndex,
        slot,
        height: getCourseHeight(course.credits, defaultCredits),
      })),
    )
    .filter(
      ({ courseId, slotIndex, slot }) =>
        !isAnchor(courseId, slotIndex) && isSamePeriod(slot, anchorSlot),
    )
    .sort((a, b) => a.slot.position - b.slot.position);

  const placed = [
    {
      start: anchorSlot.position,
      end:
        anchorSlot.position +
        getCourseHeight(anchorCourse.credits, defaultCredits),
    },
  ];
  const newPositions = new Map<string, number>();

  for (const { courseId, slotIndex, slot, height } of others) {
    let position = slot.position;
    let blocker = placed.find(
      ({ start, end }) => position < end && start < position + height,
    );
    while (blocker) {
      position = blocker.end;
      blocker = placed.find(
        ({ start, end }) => position < end && start < position + height,
      );
    }
    placed.push({ start: position, end: position + height });
    if (position !== slot.position)
      newPositions.set(`${courseId}/${slotIndex}`, position);
  }

  if (newPositions.size === 0) return curriculum;

  return {
    ...curriculum,
    courses: curriculum.courses.map((course) => ({
      ...course,
      slots: course.slots.map((slot, slotIndex) => {
        const position = newPositions.get(`${course.id}/${slotIndex}`);
        return position === undefined ? slot : { ...slot, position };
      }),
    })),
  };
}
