import type { CourseId, Curriculum } from "@/types/curriculum";

export function findCourse(curriculum: Curriculum, courseId: CourseId) {
  return curriculum.courses.find((course) => course.id === courseId);
}
