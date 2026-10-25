import type { Curriculum, Handlers, Slot } from "@/builder/draft";
import { pushDownCollisions } from "@/builder/grid";
import { isSamePeriod } from "@/builder/periods";

export type SlotAction = {
  type: "moveSlot";
  courseId: number;
  slotIndex: number;
  to: Slot;
};

function isValidSlot(curriculum: Curriculum, slot: Slot) {
  return (
    Number.isInteger(slot.position) &&
    slot.position >= 1 &&
    curriculum.periods.some((period) => isSamePeriod(period, slot))
  );
}

export const slotHandlers: Handlers<SlotAction> = {
  moveSlot: (draft, { courseId, slotIndex, to }) => {
    const { curriculum } = draft;
    const current = curriculum.courses.find((course) => course.id === courseId)
      ?.slots[slotIndex];
    if (
      !current ||
      !isValidSlot(curriculum, to) ||
      (isSamePeriod(current, to) && current.position === to.position)
    )
      return draft;

    const moved = {
      ...curriculum,
      courses: curriculum.courses.map((course) =>
        course.id === courseId
          ? {
              ...course,
              slots: course.slots.map((slot, index) =>
                index === slotIndex ? to : slot,
              ),
            }
          : course,
      ),
    };

    return {
      ...draft,
      curriculum: pushDownCollisions(moved, { courseId, slotIndex }),
    };
  },
};
