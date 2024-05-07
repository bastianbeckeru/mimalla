import type { AreaProps, CurriculumProps, PeriodProps } from "@/types/user";
import { create } from "zustand";
//import { persist } from "zustand/middleware";
import { customAlphabet, nanoid } from "nanoid";
import { subgradeAverage } from "@/utils/curriculumFunctions";
import type { DropResult } from "react-beautiful-dnd";

const initialState: StateProps = {
  areas: [],
  curriculum: undefined,
  progress: {
    approvedCourses: [],
    earnedCredits: 0,
  },
  taskQueue: [],
};

export const useCurriculumStore = create<useCurriculumProps>((set) => ({
  ...initialState,

  reset: () => {
    set(initialState);
  },
  setData: (newData) =>
    set((state) => {
      if (!state || !newData.curriculum) return state;

      const newPeriods = newData.curriculum.periods.map((period) => {
        const newEnrollments = period.enrollments.map((enrollment) => {
          if (enrollment.course) {
            return {
              ...enrollment,
              course: {
                id: enrollment.course.id,
                name: enrollment.course.name,
                code: enrollment.course.code,
                credits: enrollment.course.credits,
                dependentCourses: enrollment.course.dependentCourses,
                prerequisiteCourses: enrollment.course.prerequisiteCourses,
                prerequisiteCredits: enrollment.course.prerequisiteCredits,
                color: undefined,
              },
            };
          } else {
            const area = newData.areas.find((area) =>
              area.courses.some((course) => course.id === enrollment.courseId),
            );
            if (area) {
              const course = area.courses.find(
                (course) => course.id === enrollment.courseId,
              );

              if (course) {
                return {
                  ...enrollment,
                  course: {
                    id: course.id,
                    name: course.name,
                    code: course.code,
                    credits: course.credits,
                    dependentCourses: course.dependentCourses,
                    prerequisiteCourses: course.prerequisiteCourses,
                    prerequisiteCredits: course.prerequisiteCredits,
                    color: area.color ?? undefined,
                  },
                };
              }
            } else {
              return {
                ...enrollment,
                course: null,
              };
            }
          }

          return enrollment;
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
  setPeriods: (newPeriods) =>
    set((state) => {
      if (!state.curriculum) return state;

      const { areas } = state;

      const updatedPeriods = newPeriods.map((period) => {
        const updatedEnrollments = period.enrollments.map((enrollment) => {
          const area = areas.find((area) =>
            area.courses.some((course) => course.id === enrollment.courseId),
          );

          if (area) {
            const course = area.courses.find(
              (course) => course.id === enrollment.courseId,
            );

            if (course) {
              return {
                ...enrollment,
                course: {
                  id: course.id,
                  name: course.name,
                  code: course.code,
                  credits: course.credits,
                  dependentCourses: course.dependentCourses,
                  prerequisiteCourses: course.prerequisiteCourses,
                  prerequisiteCredits: course.prerequisiteCredits,
                  color: area.color ?? undefined,
                },
              };
            }
          }

          return enrollment;
        });

        return {
          ...period,
          enrollments: updatedEnrollments,
        };
      });

      return {
        curriculum: {
          ...state.curriculum,
          periods: updatedPeriods,
        },
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

          enrollment.position = updatedEnrollment.position;
          enrollment.status = updatedEnrollment.status;

          return enrollment;
        });
        return { ...period, enrollments: updatedEnrollments };
      });

      // Update the progress
      if (updatedEnrollment.course.code) {
        if (
          updatedEnrollment.status === "PENDING" &&
          progress.approvedCourses.includes(updatedEnrollment.course.code)
        ) {
          updatedApprovedCourses.splice(
            updatedApprovedCourses.indexOf(updatedEnrollment.course.code),
            1,
          );
          updatedEarnedCredits -= updatedEnrollment.course.credits;

          ({ updatedPeriods, updatedApprovedCourses, updatedEarnedCredits } =
            updateEnrollmentStatusCascade(
              updatedPeriods,
              updatedApprovedCourses,
              updatedEarnedCredits,
              updatedEnrollment.course.dependentCourses ?? [],
            ));
        } else {
          updatedApprovedCourses.push(updatedEnrollment.course.code);
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

  /* GRADES */
  addGrade: (enrollmentId, newGrade) => {
    return set((state) => {
      if (!state.curriculum) return state;

      const generateRandomId = customAlphabet("1234567890", 10);
      const randomId = +generateRandomId(10);
      const { taskQueue, curriculum } = state;
      let updatedTaskQueue = taskQueue;

      const updatedPeriods = curriculum.periods.map((period) => {
        if (!period.enrollments) return period;

        const updatedEnrollments = period.enrollments.map((enrollment) => {
          if (enrollment.id !== enrollmentId) return enrollment;

          let updatedGrades = [...(enrollment.grades || [])];

          // Add subgrade
          if (newGrade.parentGradeId !== undefined) {
            updatedGrades = updatedGrades.map((grade) => {
              if (grade.id === newGrade.parentGradeId) {
                const updatedSubgrades = [
                  ...(grade.subgrades || []),
                  {
                    id: randomId,
                    name: newGrade.name,
                    value: newGrade.value,
                    weight: undefined,
                    excluded: false,
                    subgrades: [],
                  },
                ];

                grade.value = subgradeAverage(updatedSubgrades);

                updatedTaskQueue = [
                  ...updatedTaskQueue,
                  {
                    id: nanoid(10),
                    timestamp: Date.now(),
                    action: "updateGrade",
                    data: {
                      id: grade.id,
                      name: grade.name,
                      value: grade.value,
                      weight: grade.weight,
                      excluded: grade.excluded,
                      //
                      enrollmentId: enrollmentId,
                    },
                  },
                ];

                return { ...grade, subgrades: updatedSubgrades };
              }
              return grade;
            });
          } else {
            if (newGrade.weight === undefined) return enrollment;

            updatedGrades.push({
              id: randomId,
              name: newGrade.name,
              value: newGrade.value,
              weight: newGrade.weight,
              excluded: false,
              subgrades: [],
            });
          }
          return { ...enrollment, grades: updatedGrades };
        });
        return { ...period, enrollments: updatedEnrollments };
      });

      updatedTaskQueue = [
        ...updatedTaskQueue,
        {
          id: nanoid(10),
          timestamp: Date.now(),
          action: "createGrade",
          data: {
            id: randomId,
            name: newGrade.name,
            value: newGrade.value,
            weight: newGrade.weight,
            excluded: false,
            //
            enrollmentId: enrollmentId,
            parentGradeId: newGrade.parentGradeId,
          },
        },
      ];

      return {
        curriculum: { ...curriculum, periods: updatedPeriods },
        taskQueue: updatedTaskQueue,
      };
    });
  },
  updateGrade: (enrollmentId, updatedGrade) =>
    set((state) => {
      if (!state.curriculum?.periods || !updatedGrade) return state;

      const { curriculum, taskQueue } = state;
      let updatedTaskQueue = taskQueue;

      const updatedPeriods = curriculum.periods.map((period) => {
        if (!period.enrollments) return period;

        const updatedEnrollments = period.enrollments.map((enrollment) => {
          if (enrollment.id !== enrollmentId) return enrollment;

          let updatedGrades = [...(enrollment.grades || [])];

          // If the updated grade is a subgrade
          if (updatedGrade.parentGradeId !== undefined) {
            updatedGrades = updatedGrades.map((grade) => {
              if (grade.id === updatedGrade.parentGradeId) {
                const updatedSubgrades = (grade.subgrades || []).map(
                  (subgrade) => {
                    // If the subgrade matches, update its properties
                    if (subgrade.id === updatedGrade.id) {
                      return {
                        ...subgrade,
                        name: updatedGrade.name,
                        value: updatedGrade.value,
                        excluded: updatedGrade.excluded,
                      };
                    }
                    return subgrade;
                  },
                );

                grade.value = subgradeAverage(updatedSubgrades);

                updatedTaskQueue = [
                  ...updatedTaskQueue,
                  {
                    id: nanoid(10),
                    timestamp: Date.now(),
                    action: "updateGrade",
                    data: {
                      id: grade.id,
                      name: grade.name,
                      value: grade.value,
                      weight: grade.weight,
                      excluded: grade.excluded,
                      //
                      enrollmentId: enrollmentId,
                      parentGradeId: undefined,
                    },
                  },
                ];

                return { ...grade, subgrades: updatedSubgrades };
              }

              return grade;
            });
          } else {
            // If the updated grade is not a subgrade
            updatedGrades = updatedGrades.map((grade) => {
              // If the grade matches, update its properties
              if (grade.id === updatedGrade.id && updatedGrade.weight) {
                return {
                  ...grade,
                  name: updatedGrade.name,
                  weight: updatedGrade.weight,
                  value: updatedGrade.value,
                };
              }
              return grade;
            });
          }
          return { ...enrollment, grades: updatedGrades };
        });
        return { ...period, enrollments: updatedEnrollments };
      });

      updatedTaskQueue = [
        ...updatedTaskQueue,
        {
          id: nanoid(10),
          timestamp: Date.now(),
          action: "updateGrade",
          data: {
            id: updatedGrade.id,
            name: updatedGrade.name,
            value: updatedGrade.value,
            weight: updatedGrade.weight,
            excluded: updatedGrade.excluded,
            //
            enrollmentId: enrollmentId,
            parentGradeId: updatedGrade.parentGradeId,
          },
        },
      ];

      return {
        ...state,
        curriculum: {
          ...curriculum,
          periods: updatedPeriods,
        },
        taskQueue: updatedTaskQueue,
      };
    }),
  removeGrade: (enrollmentId, removedGrade) =>
    set((state) => {
      if (!state.curriculum?.periods || !removedGrade) return state;

      const { taskQueue, curriculum } = state;
      let updatedTaskQueue = taskQueue;

      const updatedPeriods = curriculum.periods.map((period) => {
        if (!period.enrollments) return period;
        const updatedEnrollments = period.enrollments.map((enrollment) => {
          if (enrollment.id !== enrollmentId) return enrollment;

          let updatedGrades = enrollment.grades || [];

          // Remove subgrade
          if (removedGrade.parentGradeId !== undefined) {
            updatedGrades = updatedGrades.map((grade) => {
              if (grade.id === removedGrade.parentGradeId) {
                const updatedSubgrades = (grade.subgrades || []).filter(
                  (subgrade) => subgrade.id !== removedGrade.id,
                );

                grade.value = subgradeAverage(updatedSubgrades);

                updatedTaskQueue = [
                  ...updatedTaskQueue,
                  {
                    id: nanoid(10),
                    timestamp: Date.now(),
                    action: "updateGrade",
                    data: {
                      id: grade.id,
                      name: grade.name,
                      value: grade.value,
                      weight: grade.weight,
                      excluded: grade.excluded,
                      //
                      enrollmentId: enrollmentId,
                    },
                  },
                ];

                return { ...grade, subgrades: updatedSubgrades };
              }
              return grade;
            });
          } else {
            updatedGrades = updatedGrades.filter(
              (grade) => grade.id !== removedGrade.id,
            );
          }
          return { ...enrollment, grades: updatedGrades };
        });
        return { ...period, enrollments: updatedEnrollments };
      });

      updatedTaskQueue = [
        ...updatedTaskQueue,
        {
          id: nanoid(10),
          timestamp: Date.now(),
          action: "deleteGrade",
          data: {
            id: removedGrade.id,
            name: removedGrade.name,
            //
            enrollmentId: enrollmentId,
            parentGradeId: removedGrade.parentGradeId,
          },
        },
      ];

      return {
        ...state,
        curriculum: {
          ...curriculum,
          periods: updatedPeriods,
        },
        taskQueue: updatedTaskQueue,
      };
    }),

  /* Drag and Drop Functions */
  onDragEnd: (result) =>
    set((state) => {
      if (!state.curriculum?.periods) return state;

      // In case of dropping outside the DnD context or in the same spot, do nothing.
      if (!result.destination) return state;
      if (
        result.source.index === result.destination.index &&
        result.source.droppableId === result.destination.droppableId
      )
        return state;

      const curriculum = { ...state.curriculum };
      const updatedPeriods = [...curriculum.periods];

      // Find the source and destination semesters
      const sourcePeriod = updatedPeriods.find(
        (e) => e.id.toString() === result.source.droppableId,
      );
      const destinationPeriod = updatedPeriods.find(
        (e) => e.id.toString() === result.destination?.droppableId,
      );
      const destinationIndex = result.destination.index;

      // In case of return undefined or null
      if (!sourcePeriod || !destinationPeriod) return state;

      // Case 1: Course stays in the same Semester.
      if (result.source.droppableId === result.destination.droppableId) {
        const movingUp = result.source.index > result.destination.index;

        sourcePeriod.enrollments.forEach((enrollment, index) => {
          if (
            enrollment.id.toString() !== result.draggableId &&
            (movingUp
              ? index <= result.source.index && index >= destinationIndex
              : index >= result.source.index && index <= destinationIndex)
          ) {
            const newPosition = movingUp ? index + 1 : index - 1;

            enrollment.position = newPosition;
          }
          if (enrollment.id.toString() === result.draggableId) {
            const newPosition = result.destination?.index ?? index;
            enrollment.position = newPosition;
          }
        });
      }
      // Case 2: Course migrates to another Semester.
      else {
        sourcePeriod.enrollments.forEach((enrollment, index) => {
          if (
            enrollment.id.toString() !== result.draggableId &&
            result.source.index < index
          ) {
            const newPosition = index - 1;

            enrollment.position = newPosition;
          }

          if (enrollment.id.toString() === result.draggableId) {
            const newPosition = result.destination?.index ?? index;

            enrollment.position = newPosition;
          }
        });
        destinationPeriod.enrollments.forEach((enrollment, index) => {
          if (
            enrollment.id.toString() !== result.draggableId &&
            destinationIndex <= index
          ) {
            const newPosition = index + 1;
            enrollment.position = newPosition;
          }
        });
      }

      // Optimistic UI
      const draggableEnrollment = sourcePeriod.enrollments[result.source.index];
      if (draggableEnrollment) {
        sourcePeriod.enrollments.splice(result.source.index, 1);
        destinationPeriod.enrollments.splice(
          result.destination?.index,
          0,
          draggableEnrollment,
        );
      }

      return {
        ...state,
        curriculum: {
          ...curriculum,
          periods: updatedPeriods,
        },
      };
    }),
}));

/* SETTINGS STORE */
type useSettingsStoreProps = {
  editMode: boolean;
  setEditMode: (newState?: boolean) => void;
};

export const useSettingsStore = create<useSettingsStoreProps>((set) => ({
  editMode: false,
  setEditMode: (newState) =>
    set((state) => ({ ...state, editMode: newState ?? !state.editMode })),
}));

/* TYPES */
type useCurriculumProps = {
  reset: () => void;
  setTaskQueue: (newTaskQueue: TaskProps[]) => void;
  setData: (newData: {
    curriculum: CurriculumProps | undefined;
    areas: AreaProps[];
  }) => void;
  setPeriods: (newPeriods: PeriodProps[]) => void;

  /* ENROLLMENTS */
  updateEnrollment: (updatedEnrollment: {
    id: number;
    position: number;
    status: string;
    course: {
      code?: string | null;
      credits: number;
      dependentCourses?: {
        code: string | null;
      }[];
    };
  }) => void;

  /* GRADES */
  addGrade: (
    enrollmentId: number,
    newGrade: {
      name: string;
      value: number | null;
      weight?: number;
      parentGradeId?: number;
    },
  ) => void;
  updateGrade: (
    enrollmentId: number,
    updatedGrade: {
      id: number;
      name: string;
      value: number | null;
      weight?: number;
      excluded: boolean;
      parentGradeId?: number;
    },
  ) => void;
  removeGrade: (
    enrollmentId: number,
    removedGrade: { id: number; name: string; parentGradeId?: number },
  ) => void;

  onDragEnd: (result: DropResult) => void;
} & StateProps;

type StateProps = {
  curriculum: CurriculumProps | undefined;
  areas: AreaProps[];
  taskQueue: TaskProps[];
  progress: {
    approvedCourses: string[];
    earnedCredits: number;
  };
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

function updateEnrollmentStatusCascade(
  updatedPeriods: PeriodProps[],
  updatedApprovedCourses: string[],
  updatedEarnedCredits: number,
  dependentCourses: { code: string | null }[],
) {
  function cascade(currentCourseCode: string | null) {
    if (!currentCourseCode) return;

    updatedPeriods.forEach((period) => {
      const updatedEnrollments = period.enrollments.map((enrollment) => {
        if (!enrollment?.course?.code) return enrollment;

        if (
          enrollment.course.code === currentCourseCode &&
          updatedApprovedCourses.includes(currentCourseCode)
        ) {
          enrollment.status = "PENDING";

          updatedApprovedCourses.splice(
            updatedApprovedCourses.indexOf(currentCourseCode),
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
