import type { Course, Draft, Handlers, Period } from "@/builder/draft";
import {
  fitsInColumns,
  getDefaultCredits,
  getFirstFreePosition,
  pushDownCollisions,
} from "@/builder/grid";

export type CourseAction =
  | { type: "addCourse"; period: Period; position?: number }
  | {
      type: "editCourse";
      courseId: number;
      changes: Partial<Pick<Course, "name" | "credits" | "duration">>;
    };

const NEW_COURSE_NAME = "Nuevo curso";

function nextCourseId(draft: Draft) {
  return (
    Math.max(0, ...draft.curriculum.courses.map((course) => course.id)) + 1
  );
}

function isValidCredits(credits: number) {
  return Number.isInteger(credits) && credits >= 0;
}

export const courseHandlers: Handlers<CourseAction> = {
  addCourse: (draft, { period, position }) => {
    const { curriculum } = draft;
    const course = {
      id: nextCourseId(draft),
      name: NEW_COURSE_NAME,
      credits: getDefaultCredits(curriculum),
      areaId: null,
      duration: 1,
      slots: [
        {
          ...period,
          position: position ?? getFirstFreePosition(curriculum, period),
        },
      ],
    };

    return {
      ...draft,
      curriculum: { ...curriculum, courses: [...curriculum.courses, course] },
    };
  },

  editCourse: (draft, { courseId, changes }) => {
    const { curriculum } = draft;
    const course = curriculum.courses.find((course) => course.id === courseId);
    if (
      !course ||
      (changes.credits !== undefined && !isValidCredits(changes.credits))
    )
      return draft;

    const { duration } = changes;
    if (
      duration !== undefined &&
      !course.slots.every((slot) => fitsInColumns(curriculum, slot, duration))
    )
      return draft;

    const edited = {
      ...curriculum,
      courses: curriculum.courses.map((candidate) =>
        candidate === course ? { ...course, ...changes } : candidate,
      ),
    };
    return {
      ...draft,
      curriculum: pushDownCollisions(
        edited,
        course.slots.map((_, slotIndex) => ({ courseId, slotIndex })),
      ),
    };
  },
};
