import { findPeriodIndex } from "@/builder/periods";
import type { Course, Curriculum, Period, Slot } from "@/types/builder";

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
  const periodIndex = findPeriodIndex(curriculum.periods, period);
  const occupied = new Set<number>();

  for (const { box } of getSlotBoxes(
    curriculum,
    getDefaultCredits(curriculum),
  )) {
    if (box.left > periodIndex || periodIndex >= box.right) continue;
    for (let row = box.top; row < box.bottom; row++) occupied.add(row);
  }

  let position = 1;
  while (occupied.has(position)) position++;
  return position;
}

export function fitsInPeriods(
  curriculum: Curriculum,
  period: Period,
  duration: number,
) {
  const start = findPeriodIndex(curriculum.periods, period);
  return (
    start !== -1 &&
    Number.isInteger(duration) &&
    duration >= 1 &&
    start + duration <= curriculum.periods.length
  );
}

export function slotsFitInPeriods(
  curriculum: Curriculum,
  slots: Slot[],
  duration: number,
) {
  return slots.every((slot) => fitsInPeriods(curriculum, slot, duration));
}

export function getMaxDuration(curriculum: Curriculum, course: Course) {
  return Math.min(
    ...course.slots.map(
      (slot) =>
        curriculum.periods.length - findPeriodIndex(curriculum.periods, slot),
    ),
  );
}

type SlotRef = { courseId: number; slotIndex: number };

type Box = { left: number; right: number; top: number; bottom: number };

function overlaps(a: Box, b: Box) {
  return (
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
  );
}

function getSlotBoxes(curriculum: Curriculum, defaultCredits: number) {
  return curriculum.courses.flatMap((course) =>
    course.slots.map((slot, slotIndex) => {
      const left = findPeriodIndex(curriculum.periods, slot);
      return {
        courseId: course.id,
        slotIndex,
        box: {
          left,
          right: left + course.duration,
          top: slot.position,
          bottom:
            slot.position + getCourseHeight(course.credits, defaultCredits),
        },
      };
    }),
  );
}

export function pushDownCollisions(
  curriculum: Curriculum,
  anchors: SlotRef[] = [],
  defaultCredits = getDefaultCredits(curriculum),
): Curriculum {
  const anchorIndex = ({ courseId, slotIndex }: SlotRef) =>
    anchors.findIndex(
      (anchor) =>
        anchor.courseId === courseId && anchor.slotIndex === slotIndex,
    );
  const rank = (ref: SlotRef) => {
    const index = anchorIndex(ref);
    return index === -1 ? anchors.length : index;
  };

  const slots = getSlotBoxes(curriculum, defaultCredits).toSorted(
    (a, b) =>
      rank(a) - rank(b) || a.box.top - b.box.top || a.box.left - b.box.left,
  );

  const placed: Box[] = [];
  const newPositions = new Map<string, number>();

  for (const { courseId, slotIndex, box } of slots) {
    const height = box.bottom - box.top;
    const current = { ...box };
    let blocker = placed.find((other) => overlaps(other, current));
    while (blocker) {
      current.top = blocker.bottom;
      current.bottom = current.top + height;
      blocker = placed.find((other) => overlaps(other, current));
    }
    placed.push(current);
    if (current.top !== box.top)
      newPositions.set(`${courseId}/${slotIndex}`, current.top);
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

export function changeCourse(
  curriculum: Curriculum,
  courseId: number,
  change: (course: Course) => Course,
  anchorSlotIndexes: number[],
): Curriculum {
  const withChange = (target: Curriculum) => ({
    ...target,
    courses: target.courses.map((course) =>
      course.id === courseId ? change(course) : course,
    ),
  });
  const rescaled = pushDownCollisions(
    curriculum,
    [],
    getDefaultCredits(withChange(curriculum)),
  );
  return pushDownCollisions(
    withChange(rescaled),
    anchorSlotIndexes.map((slotIndex) => ({ courseId, slotIndex })),
  );
}
