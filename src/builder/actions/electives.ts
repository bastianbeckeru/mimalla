import type { Curriculum, Draft, Handlers, Slot } from "@/builder/draft";
import { getFirstFreePosition, pushDownCollisions } from "@/builder/grid";

export type ElectiveAction =
  | { type: "addSlot"; courseId: number }
  | { type: "removeSlot"; courseId: number; slotIndex: number };

function withSlots(
  { curriculum }: Draft,
  courseId: number,
  getSlots: (slots: Slot[]) => Slot[],
): Curriculum {
  return {
    ...curriculum,
    courses: curriculum.courses.map((course) =>
      course.id === courseId
        ? { ...course, slots: getSlots(course.slots) }
        : course,
    ),
  };
}

export const electiveHandlers: Handlers<ElectiveAction> = {
  addSlot: (draft, { courseId }) => {
    const { curriculum } = draft;
    const course = curriculum.courses.find((course) => course.id === courseId);
    const lastSlot = course?.slots.at(-1);
    if (!course?.isElective || !lastSlot) return draft;

    const period = { programYear: lastSlot.programYear, term: lastSlot.term };
    const slot = {
      ...period,
      position: getFirstFreePosition(curriculum, period),
    };

    return {
      ...draft,
      curriculum: pushDownCollisions(
        withSlots(draft, courseId, (slots) => [...slots, slot]),
        [{ courseId, slotIndex: course.slots.length }],
      ),
    };
  },

  removeSlot: (draft, { courseId, slotIndex }) => {
    const course = draft.curriculum.courses.find(
      (course) => course.id === courseId,
    );
    if (!course || course.slots.length <= 1 || !course.slots[slotIndex])
      return draft;

    return {
      ...draft,
      curriculum: withSlots(draft, courseId, (slots) =>
        slots.filter((_, index) => index !== slotIndex),
      ),
    };
  },
};
