import type { ModifiedPeriodProps } from "@/types/curriculum";
import type {
  EnrolledCourse,
  newCurriculumStoreInitialStateProps,
  useNewCurriculumStoreProps,
} from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";

const initialState: newCurriculumStoreInitialStateProps = {
  //version: "0.1.4",
  /*   progress: {
    approvedCourses: [],
    earnedCredits: 0,
  }, */
  studentEnrollment: null,
};

export const useNewCurriculumStore = create(
  persist<useNewCurriculumStoreProps>(
    (set) => ({
      ...initialState,

      resetStore: () => {
        set(initialState);
      },
      addProgramEnrollment: (newEnrollment) =>
        set((state) => {
          if (!state || !newEnrollment) return state;

          const { year, term, program, slots } = newEnrollment;

          const newProgramEnrollment = {
            id: nanoid(),
            programName: program.name,
            year: year,
            term: term,
            enrolledCourses: [],
          };

          const newCourseEnrollments: EnrolledCourse[] = slots.map((slot) => ({
            id: nanoid(),
            year: slot.year, // Slot Year - Curriculum Year + Student Year
            term: slot.term,
            position: slot.position,
            status: "PENDING",
            courseId: slot.courseId,
          }));

          return {
            ...state,
            studentEnrollment: {
              ...newProgramEnrollment,
              enrolledCourses: newCourseEnrollments,
            },
          };
        }),
      removeProgramEnrollment: (enrollmentId) =>
        set((state) => {
          if (!state || !state.studentEnrollment) return state;

          if (state.studentEnrollment.id === enrollmentId) {
            return {
              ...state,
              studentEnrollment: null,
            };
          }

          return state;
        }),

      /* ENROLLMENT */
      updateCourseEnrollmentStatus: (enrollmentId, newStatus) =>
        set((state) => {
          if (!state || !state.studentEnrollment) return state;

          const currentCourseEnrollments =
            state.studentEnrollment.enrolledCourses;
          const updatedEnrollments = currentCourseEnrollments.map(
            (enrollment) => {
              if (enrollment.id === enrollmentId) {
                return {
                  ...enrollment,
                  status: newStatus,
                };
              }
              return enrollment;
            },
          );

          return {
            ...state,
            studentEnrollment: {
              ...state.studentEnrollment,
              enrolledCourses: updatedEnrollments,
            },
          };
        }),

      /* DRAG AND DROP */
      updateCourseEnrollments: (enrollmentId, enrolledCourses) =>
        set((state) => {
          if (!state || !state.studentEnrollment) return state;

          if (state.studentEnrollment.id === enrollmentId) {
            return {
              ...state,
              studentEnrollment: {
                ...state.studentEnrollment,
                enrolledCourses: enrolledCourses,
              },
            };
          }

          return state;
        }),
    }),
    { name: "data" },
  ),
);

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
