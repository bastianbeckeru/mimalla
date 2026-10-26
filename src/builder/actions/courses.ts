import type { Course, Draft, Handlers, Period } from "@/builder/draft";
import { getDefaultCredits, getFirstFreePosition } from "@/builder/grid";
import { compareSlots } from "@/builder/periods";

export type CourseAction =
  | { type: "addCourse"; period: Period; position?: number }
  | {
      type: "editCourse";
      courseId: number;
      changes: Partial<
        Pick<Course, "name" | "code" | "credits" | "isElective">
      >;
    }
  | { type: "deleteCourse"; courseId: number };

const NEW_COURSE_NAME = "Nuevo curso";

function nextCourseId(draft: Draft) {
  return (
    Math.max(0, ...draft.curriculum.courses.map((course) => course.id)) + 1
  );
}

function isValidCredits(credits: number) {
  return Number.isInteger(credits) && credits >= 0;
}

function applyChanges(course: Course, changes: Partial<Course>): Course {
  const edited = { ...course, ...changes };
  if (edited.isElective || edited.slots.length <= 1) return edited;

  const earliest = edited.slots.toSorted(compareSlots).slice(0, 1);
  return { ...edited, slots: earliest };
}

export const courseHandlers: Handlers<CourseAction> = {
  addCourse: (draft, { period, position }) => {
    const { curriculum } = draft;
    const course = {
      id: nextCourseId(draft),
      name: NEW_COURSE_NAME,
      code: "",
      credits: getDefaultCredits(curriculum),
      areaId: null,
      duration: 1,
      isElective: false,
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
          course.id === courseId ? applyChanges(course, changes) : course,
        ),
      },
    };
  },

  deleteCourse: (draft, { courseId }) => {
    const { curriculum } = draft;
    if (!curriculum.courses.some((course) => course.id === courseId))
      return draft;

    return {
      ...draft,
      curriculum: {
        ...curriculum,
        courses: curriculum.courses.filter((course) => course.id !== courseId),
      },
    };
  },
};
