import type { AreaProps, CurriculumProps, PeriodProps } from "@/types/user";
import { create } from "zustand";
//import { persist } from "zustand/middleware";
import { customAlphabet, nanoid } from "nanoid";
import { subgradeAverage } from "@/utils/curriculumFunctions";

/* CURRICULUM STORE */

const initialState: StateProps = {
  curriculum: undefined,
  areas: [],
  taskQueue: [],
  approvedCourses: [],
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
                //requiredCredits: enrollment.course.requiredCredits,
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
                    //requiredCredits: course.requiredCredits,
                    dependentCourses: course.dependentCourses,
                    prerequisiteCourses: course.prerequisiteCourses,
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
                  //requiredCredits: course.requiredCredits,
                  dependentCourses: course.dependentCourses,
                  prerequisiteCourses: course.prerequisiteCourses,
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

      const { curriculum, approvedCourses } = state;
      const updatedApprovedCourses = [...approvedCourses];

      let depCourses: { code: string | null }[] = [];

      const updatedPeriods = curriculum.periods.map((period) => {
        if (!period.enrollments) return period;

        const updatedEnrollments = period.enrollments.map((enrollment) => {
          if (enrollment.id !== updatedEnrollment.id) return enrollment;

          enrollment.position = updatedEnrollment.position;
          enrollment.status = updatedEnrollment.status;
          depCourses = updatedEnrollment.dependentCourses ?? [];

          return enrollment;
        });
        return { ...period, enrollments: updatedEnrollments };
      });

      if (updatedEnrollment.courseCode) {
        if (
          updatedEnrollment.courseCode == "PENDING" ||
          approvedCourses.includes(updatedEnrollment.courseCode)
        ) {
          console.log("REMOVING");
          updatedApprovedCourses.splice(
            updatedApprovedCourses.indexOf(updatedEnrollment.courseCode),
            1,
          );
        } else {
          console.log("ADDING");

          updatedApprovedCourses.push(updatedEnrollment.courseCode);
        }
      }

      if (updatedEnrollment.status === "PENDING") {
        updateEnrollmentStatusCascade(
          updatedPeriods,
          updatedApprovedCourses,
          depCourses,
        );
      }
      console.log(updatedApprovedCourses);

      return {
        ...state,
        curriculum: {
          ...curriculum,
          periods: updatedPeriods,
        },
        approvedCourses: updatedApprovedCourses,
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
    courseCode?: string | null;
    dependentCourses?: {
      code: string | null;
    }[];
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
} & StateProps;

type StateProps = {
  curriculum: CurriculumProps | undefined;
  areas: AreaProps[];
  taskQueue: TaskProps[];
  approvedCourses: string[];
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

          enrollment.course.dependentCourses.forEach((course) =>
            cascade(course.code),
          );
        }
      });

      return updatedEnrollments;
    });
  }

  dependentCourses.forEach((course) => cascade(course.code));
  return { updatedPeriods, updatedApprovedCourses };
}
