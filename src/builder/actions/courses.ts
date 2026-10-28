import { findCourse } from "@/builder/draft";
import {
  changeCourse,
  getDefaultCredits,
  getFirstFreePosition,
  slotsFitInPeriods,
} from "@/builder/grid";
import { compareSlots } from "@/builder/periods";
import type { Course, CourseAction, Draft, Handlers } from "@/types/builder";

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
  addCourse: (draft, { name, period, position }) => {
    const { curriculum } = draft;
    const course = {
      id: nextCourseId(draft),
      name,
      code: "",
      credits: getDefaultCredits(curriculum),
      areaId: null,
      trackIds: [],
      duration: 1,
      prerequisiteIds: [],
      prerequisiteCredits: 0,
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
    const { curriculum } = draft;
    const course = findCourse(curriculum, courseId);
    if (
      !course ||
      (changes.credits !== undefined && !isValidCredits(changes.credits))
    )
      return draft;

    const { duration } = changes;
    if (
      duration !== undefined &&
      !slotsFitInPeriods(curriculum, course.slots, duration)
    )
      return draft;

    return {
      ...draft,
      curriculum: changeCourse(
        curriculum,
        courseId,
        (course) => applyChanges(course, changes),
        course.slots.map((_, slotIndex) => slotIndex),
      ),
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
        courses: curriculum.courses
          .filter((course) => course.id !== courseId)
          .map((course) =>
            course.prerequisiteIds.includes(courseId)
              ? {
                  ...course,
                  prerequisiteIds: course.prerequisiteIds.filter(
                    (id) => id !== courseId,
                  ),
                }
              : course,
          ),
      },
    };
  },
};
