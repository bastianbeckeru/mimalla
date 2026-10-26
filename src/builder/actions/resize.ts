import { findCourse } from "@/builder/draft";
import {
  changeCourse,
  getCourseHeight,
  getDefaultCredits,
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

    return {
      ...draft,
      curriculum: changeCourse(
        curriculum,
        courseId,
        (course) => ({ ...course, credits, duration }),
        [slotIndex],
      ),
    };
  },
};
