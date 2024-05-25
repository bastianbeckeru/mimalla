import type { ModifiedPeriodProps } from "@/types/curriculum";
import type { StateProps, useCurriculumStoreProps } from "./types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const initialState: StateProps = {
  version: "1.0.0",
  areas: [],
  curriculum: undefined,
  progress: {
    approvedCourses: [],
    earnedCredits: 0,
  },
  taskQueue: [],
};

export const useCurriculumStore = create(
  persist<useCurriculumStoreProps>(
    (set) => ({
      ...initialState,

      reset: () => {
        set(initialState);
      },
      updateVersion: (newVersion) => {
        set((state) => ({ ...state, version: newVersion }));
      },
      setData: (newData) =>
        set((state) => {
          if (!state || !newData.curriculum) return state;

          const newPeriods: ModifiedPeriodProps[] =
            newData.curriculum.periods.map((period) => {
              const newEnrollments = period.enrollments.map((enrollment) => {
                // Desde la BD llegan los enrollment sin curso generalmente, esto debería ser SIEMPRE así. (ARREGLAR)

                if (enrollment.course) {
                  function findCourseNames(courses: { code: string | null }[]) {
                    const validCourses = courses.filter(
                      (course) => course.code !== null,
                    );

                    const relatedCourses = validCourses
                      .map((course) => {
                        const foundCourse = newData.curriculum?.periods
                          .flatMap((p) => p.enrollments)
                          .find((e) => e.course?.code === course.code)?.course;

                        if (foundCourse) {
                          return { code: course.code, name: foundCourse.name };
                        }
                        return null;
                      })
                      .filter((course) => course !== null) as {
                      code: string;
                      name: string;
                    }[];

                    return relatedCourses;
                  }

                  return {
                    ...enrollment,
                    course: {
                      ...enrollment.course,
                      color: enrollment.course.color ?? undefined,
                      dependentCourses: findCourseNames(
                        enrollment.course.dependentCourses,
                      ),
                      prerequisiteCourses: findCourseNames(
                        enrollment.course.prerequisiteCourses,
                      ),
                    },
                  };
                } else {
                  const area = newData.areas.find((area) =>
                    area.courses.some(
                      (course) => course.id === enrollment.courseId,
                    ),
                  );
                  const course = area?.courses.find(
                    (course) => course.id === enrollment.courseId,
                  );

                  function findCourseNames(courses: { code: string | null }[]) {
                    const validCourses = courses.filter(
                      (course) => course.code !== null,
                    );

                    const relatedCourses = validCourses
                      .map((course) => {
                        const foundCourse = newData.areas
                          .flatMap((a) => a.courses)
                          .find((c) => c.code === course.code);

                        if (foundCourse) {
                          return { code: course.code, name: foundCourse.name };
                        }
                        return null;
                      })
                      .filter((course) => course !== null) as {
                      code: string;
                      name: string;
                    }[];

                    return relatedCourses;
                  }

                  if (area && course) {
                    return {
                      ...enrollment,
                      course: {
                        ...course,
                        color: area.color ?? undefined,
                        dependentCourses: findCourseNames(
                          course.dependentCourses,
                        ),
                        prerequisiteCourses: findCourseNames(
                          course.prerequisiteCourses,
                        ),
                      },
                    };
                  } else {
                    return {
                      ...enrollment,
                      course: null,
                    };
                  }
                }
              });

              return {
                ...period,
                enrollments: newEnrollments,
              };
            });

          return {
            curriculum: {
              ...newData.curriculum,
              periods: newPeriods,
            },
            areas: newData.areas,
          };
        }),
      setTaskQueue: (newTaskQueue) =>
        set((state) => {
          return { ...state, taskQueue: newTaskQueue };
        }),

      /* ENROLLMENTS */
      updateEnrollment: (updatedEnrollment) =>
        set((state) => {
          if (!state.curriculum?.periods || !updatedEnrollment) return state;

          const { curriculum, progress } = state;
          let updatedApprovedCourses = [...progress.approvedCourses];
          let updatedEarnedCredits = progress.earnedCredits;

          // Update enrollment status and position
          let updatedPeriods = curriculum.periods.map((period) => {
            if (!period.enrollments) return period;

            const updatedEnrollments = period.enrollments.map((enrollment) => {
              if (enrollment.id !== updatedEnrollment.id) return enrollment;

              return {
                ...enrollment,
                position: updatedEnrollment.position,
                status: updatedEnrollment.status,
              };
            });
            return { ...period, enrollments: updatedEnrollments };
          });

          // Update the progress
          if (updatedEnrollment.course.code) {
            const courseCode =
              updatedEnrollment.course.code + "-" + updatedEnrollment.id;

            if (
              updatedEnrollment.status === "PENDING" &&
              progress.approvedCourses.includes(courseCode)
            ) {
              updatedApprovedCourses.splice(
                updatedApprovedCourses.indexOf(courseCode),
                1,
              );
              updatedEarnedCredits -= updatedEnrollment.course.credits;

              ({
                updatedPeriods,
                updatedApprovedCourses,
                updatedEarnedCredits,
              } = updateEnrollmentStatusCascade(
                updatedPeriods,
                updatedApprovedCourses,
                updatedEarnedCredits,
                updatedEnrollment.course.dependentCourses,
              ));
            } else {
              updatedApprovedCourses.push(courseCode);
              updatedEarnedCredits += updatedEnrollment.course.credits;
            }
          }

          return {
            ...state,
            curriculum: {
              ...curriculum,
              periods: updatedPeriods,
            },
            progress: {
              approvedCourses: updatedApprovedCourses,
              earnedCredits: updatedEarnedCredits,
            },
          };
        }),

      /* DRAG AND DROP */
      onDragEnd: (result) =>
        set((state) => {
          const source = result.source;
          const destination = result.destination;

          if (!state.curriculum || !destination) return state;
          if (
            source.index === destination.index &&
            source.droppableId === destination.droppableId
          )
            return state;

          const updatedPeriods = [...state.curriculum.periods];

          const sourcePeriod = updatedPeriods.find(
            (e) => e.id.toString() === source.droppableId,
          );
          const destinationPeriod = updatedPeriods.find(
            (e) => e.id.toString() === destination.droppableId,
          );

          if (!sourcePeriod || !destinationPeriod) return state;

          // Case 1: Course stays in the same Semester.
          if (source.droppableId === destination.droppableId) {
            const movingUp = source.index > destination.index;

            sourcePeriod.enrollments.forEach((enrollment, index) => {
              if (
                enrollment.id.toString() !== result.draggableId &&
                (movingUp
                  ? index <= source.index && index >= destination.index
                  : index >= source.index && index <= destination.index)
              ) {
                const newPosition = movingUp ? index + 1 : index - 1;

                enrollment.position = newPosition;
              }
              if (enrollment.id.toString() === result.draggableId) {
                const newPosition = destination.index;
                enrollment.position = newPosition;
              }
            });
          }
          // Case 2: Course migrates to another Semester.
          else {
            sourcePeriod.enrollments.forEach((enrollment, index) => {
              if (
                enrollment.id.toString() !== result.draggableId &&
                source.index < index
              ) {
                const newPosition = index - 1;

                enrollment.position = newPosition;
              }

              if (enrollment.id.toString() === result.draggableId) {
                const newPosition = destination.index ?? index;

                enrollment.position = newPosition;
              }
            });
            destinationPeriod.enrollments.forEach((enrollment, index) => {
              if (
                enrollment.id.toString() !== result.draggableId &&
                destination.index <= index
              ) {
                const newPosition = index + 1;
                enrollment.position = newPosition;
              }
            });
          }

          // Optimistic UI
          const draggableEnrollment = sourcePeriod.enrollments[source.index];

          if (draggableEnrollment) {
            sourcePeriod.enrollments.splice(source.index, 1);
            destinationPeriod.enrollments.splice(
              destination.index,
              0,
              draggableEnrollment,
            );
          }

          return {
            ...state,
            curriculum: {
              ...state.curriculum,
              periods: updatedPeriods,
            },
          };
        }),
    }),
    { name: "curriculum" },
  ),
);

/* SETTINGS STORE */
export const useSettingsStore = create<useSettingsStoreProps>((set) => ({
  editMode: false,
  setEditMode: (newState) =>
    set((state) => ({ ...state, editMode: newState ?? !state.editMode })),
}));

/* TYPES */
type useSettingsStoreProps = {
  editMode: boolean;
  setEditMode: (newState?: boolean) => void;
};

export type TaskProps = {
  id: string;
  timestamp: number;
  action: string;
  data: {
    id: number;
    name: string;
    position?: number;
    status?: string;
    requiredCourses?: string[];
    // Grade
    value?: number | null;
    weight?: number | null;
    excluded?: boolean;
    subgrades?: {
      name: string;
      value?: number | null;
      excluded: boolean;
    }[];
    //
    parentGradeId?: number;
    enrollmentId?: number | null;
    periodId?: number | null;
  };
};

/* FUNCTIONS */
function updateEnrollmentStatusCascade(
  updatedPeriods: ModifiedPeriodProps[],
  updatedApprovedCourses: string[],
  updatedEarnedCredits: number,
  dependentCourses: { code: string | null }[] | undefined,
) {
  if (!dependentCourses)
    return { updatedPeriods, updatedApprovedCourses, updatedEarnedCredits };

  function cascade(currentCourseCode: string | null) {
    if (!currentCourseCode) return;

    updatedPeriods.forEach((period) => {
      const updatedEnrollments = period.enrollments.map((enrollment) => {
        if (!enrollment?.course?.code) return enrollment;

        const courseCode = enrollment.course.code + "-" + enrollment.id;

        if (
          enrollment.course.code === currentCourseCode &&
          updatedApprovedCourses.includes(courseCode)
        ) {
          enrollment.status = "PENDING";

          updatedApprovedCourses.splice(
            updatedApprovedCourses.indexOf(courseCode),
            1,
          );
          updatedEarnedCredits -= enrollment.course.credits;

          enrollment.course.dependentCourses.forEach((course) =>
            cascade(course.code),
          );
        }
      });

      return updatedEnrollments;
    });
  }

  dependentCourses.forEach((course) => cascade(course.code));
  return { updatedPeriods, updatedApprovedCourses, updatedEarnedCredits };
}
