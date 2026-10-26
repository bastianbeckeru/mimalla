import { findCourse } from "@/builder/draft";
import { canAddPrerequisite } from "@/builder/prerequisites";
import type {
  Course,
  Draft,
  Handlers,
  PrerequisiteAction,
} from "@/types/builder";

function updateCourse(
  draft: Draft,
  courseId: number,
  update: (course: Course) => Course,
): Draft {
  const { curriculum } = draft;
  return {
    ...draft,
    curriculum: {
      ...curriculum,
      courses: curriculum.courses.map((course) =>
        course.id === courseId ? update(course) : course,
      ),
    },
  };
}

export const prerequisiteHandlers: Handlers<PrerequisiteAction> = {
  addPrerequisite: (draft, { courseId, prerequisiteId }) => {
    if (!canAddPrerequisite(draft.curriculum, courseId, prerequisiteId))
      return draft;
    return updateCourse(draft, courseId, (course) => ({
      ...course,
      prerequisiteIds: [...course.prerequisiteIds, prerequisiteId],
    }));
  },

  removePrerequisite: (draft, { courseId, prerequisiteId }) => {
    const course = findCourse(draft.curriculum, courseId);
    if (!course?.prerequisiteIds.includes(prerequisiteId)) return draft;
    return updateCourse(draft, courseId, (course) => ({
      ...course,
      prerequisiteIds: course.prerequisiteIds.filter(
        (id) => id !== prerequisiteId,
      ),
    }));
  },

  setPrerequisiteCredits: (draft, { courseId, credits }) => {
    if (!Number.isInteger(credits) || credits < 0) return draft;
    return updateCourse(draft, courseId, (course) => ({
      ...course,
      prerequisiteCredits: credits,
    }));
  },
};
