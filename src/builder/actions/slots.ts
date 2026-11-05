import { findCourse } from "@/curriculum/courses";
import { fitsInPeriods, pushDownCollisions } from "@/curriculum/grid";
import { isSamePeriod } from "@/curriculum/periods";
import type { Handlers, SlotAction } from "@/types/builder";
import type { Curriculum, Slot } from "@/types/curriculum";

function isValidSlot(curriculum: Curriculum, slot: Slot, duration: number) {
  return (
    Number.isInteger(slot.position) &&
    slot.position >= 1 &&
    fitsInPeriods(curriculum, slot, duration)
  );
}

export const slotHandlers: Handlers<SlotAction> = {
  moveSlot: (draft, { courseId, slotIndex, to }) => {
    const { curriculum } = draft;
    const course = findCourse(curriculum, courseId);
    const current = course?.slots[slotIndex];
    if (
      !course ||
      !current ||
      !isValidSlot(curriculum, to, course.duration) ||
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
      curriculum: pushDownCollisions(moved, [{ courseId, slotIndex }]),
    };
  },
};
