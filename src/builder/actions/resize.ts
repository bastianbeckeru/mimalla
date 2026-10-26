import type { Handlers } from "@/builder/draft";
import {
  fitsInColumns,
  getCourseHeight,
  getDefaultCredits,
  pushDownCollisions,
} from "@/builder/grid";

export type ResizeAction = {
  type: "resizeCourse";
  courseId: number;
  slotIndex: number;
  rows: number;
  duration: number;
};

export const resizeHandlers: Handlers<ResizeAction> = {
  resizeCourse: (draft, { courseId, slotIndex, rows, duration }) => {
    const { curriculum } = draft;
    const defaultCredits = getDefaultCredits(curriculum);
    const course = curriculum.courses.find((course) => course.id === courseId);
    if (
      !course?.slots[slotIndex] ||
      !Number.isInteger(rows) ||
      rows < 1 ||
      !course.slots.every((slot) => fitsInColumns(curriculum, slot, duration))
    )
      return draft;

    const isSameHeight =
      rows === getCourseHeight(course.credits, defaultCredits);
    if (isSameHeight && duration === course.duration) return draft;

    const credits = isSameHeight ? course.credits : rows * defaultCredits;

    const resized = {
      ...curriculum,
      courses: curriculum.courses.map((candidate) =>
        candidate === course ? { ...course, credits, duration } : candidate,
      ),
    };

    return {
      ...draft,
      curriculum: pushDownCollisions(resized, [{ courseId, slotIndex }]),
    };
  },
};
