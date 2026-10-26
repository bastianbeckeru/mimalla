import { findCourse } from "@/builder/draft";
import {
  getCourseHeight,
  getDefaultCredits,
  pushDownCollisions,
  slotsFitInPeriods,
} from "@/builder/grid";
import type { Handlers, ResizeAction } from "@/types/builder";

export const resizeHandlers: Handlers<ResizeAction> = {
  resizeCourse: (draft, { courseId, slotIndex, rows, duration }) => {
    const { curriculum } = draft;
    const defaultCredits = getDefaultCredits(curriculum);
    const course = findCourse(curriculum, courseId);
    if (
      !course?.slots[slotIndex] ||
      !Number.isInteger(rows) ||
      rows < 1 ||
      !slotsFitInPeriods(curriculum, course.slots, duration)
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
