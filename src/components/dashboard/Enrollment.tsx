"use client";

/* import { useSettingsStore } from "@/stores/curriculum"; */
import type { CourseProps, ModifiedEnrollmentProps } from "@/types/curriculum";
import { MotionLi, type VariantProps } from "../Motion";
import { Checkbox } from "../ui/checkbox";
import { useCurriculumStore, useSettingsStore } from "@/stores/curriculum";
import { cn } from "@/lib/utils";
import { checkContrasts } from "@/utils/colors";

type Props = {
  variants: VariantProps;
  enrollment: ModifiedEnrollmentProps;
  course: CourseProps | null;
  color: string;
  openDialog: () => void;
};

export default function Enrollment({
  variants,
  enrollment,
  course,
  color,
  openDialog,
}: Props) {
  const { progress, updateEnrollment } = useCurriculumStore();
  const { editMode } = useSettingsStore();

  const { hasLowElementTextContrast } = checkContrasts({ elementColor: color });
  const available = getAviability(course, progress);

  const style = {
    backgroundColor: color,
  };

  return (
    <>
      <MotionLi
        variants={variants}
        className={cn(
          "relative mb-2 flex h-[5rem] select-none items-center justify-start overflow-hidden rounded-2xl p-2 shadow-md xl:h-[5.5rem]",
          editMode ? "hover:cursor-grab" : "hover:cursor-pointer",
          available
            ? "brightness-100 hover:brightness-[0.98]"
            : "brightness-[0.80] hover:brightness-[0.78]",
        )}
        style={style}
        onClick={() => {
          if (!editMode) openDialog();
        }}
      >
        <p
          className={cn(
            "flex h-full items-center justify-center text-pretty text-center text-xs font-normal xl:text-sm",
            editMode ? "w-10/12" : "w-full",
            hasLowElementTextContrast ? "text-background" : "text-foreground",
          )}
        >
          {course?.name ?? `Curso`}
        </p>

        <Checkbox
          tabIndex={-1}
          aria-label="Marcar curso como aprobado"
          className={cn(
            "absolute bottom-2 right-2 rounded-full border-black/40 bg-black/5 shadow-inner transition-colors hover:bg-black/10 focus:border",
            editMode ? "flex" : "hidden",
          )}
          disabled={!available}
          checked={enrollment.status === "APPROVED"}
          onCheckedChange={(checked: boolean) => {
            updateEnrollment({
              id: enrollment.id,
              position: enrollment.position,
              status: checked ? "APPROVED" : "PENDING",
              course: {
                code: course?.code,
                credits: course?.credits ?? 0,
                dependentCourses: course?.dependentCourses,
              },
            });
          }}
        />

        {/* Strikethrough */}
        {enrollment.status === "APPROVED" && (
          <div className={cn("diagonal-line bg-black")} />
        )}
      </MotionLi>

      {/* Course Modal */}
      {/*       <Dialog open={isOpen} onOpenChange={(open: boolean) => setIsOpen(open)}>
        <CourseModal enrollment={enrollment} course={course} color={color} />
      </Dialog> */}
    </>
  );
}

type ProgressProps = {
  earnedCredits: number;
  approvedCourses: string[];
};

function getAviability(course: CourseProps | null, progress: ProgressProps) {
  if (!course || !progress) return false;

  const hasEnoughCredits = course.prerequisiteCredits <= progress.earnedCredits;
  const hasApprovedPrerequisites = course.prerequisiteCourses.every(
    ({ code }) =>
      !code ||
      progress.approvedCourses.some((approvedCourse) =>
        approvedCourse.startsWith(code),
      ),
  );

  return hasApprovedPrerequisites && hasEnoughCredits;
}
