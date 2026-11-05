import type { Curriculum } from "@/types/curriculum";

export function findCourse(curriculum: Curriculum, courseId: number) {
  return curriculum.courses.find((course) => course.id === courseId);
}
