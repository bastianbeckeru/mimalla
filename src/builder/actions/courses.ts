import type { Course, Draft, Handlers, Period } from "@/builder/draft";
import { getDefaultCredits, getFirstFreePosition } from "@/builder/grid";

export type CourseAction =
  | { type: "addCourse"; period: Period; position?: number }
  | {
      type: "editCourse";
      courseId: number;
      changes: Partial<Pick<Course, "name" | "credits">>;
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
    if (changes.credits !== undefined && !isValidCredits(changes.credits))
      return draft;

    const { curriculum } = draft;
    return {
      ...draft,
      curriculum: {
        ...curriculum,
        courses: curriculum.courses.map((course) =>
          course.id === courseId ? { ...course, ...changes } : course,
        ),
      },
    };
  },
};
