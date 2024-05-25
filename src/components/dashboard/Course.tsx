"use client";

/* import { useSettingsStore } from "@/stores/curriculum"; */
import type { ModifiedEnrollmentProps } from "@/types/curriculum";
import { MotionLi, type VariantProps } from "../Motion";
import { Dialog } from "../ui/dialog";
import { useState } from "react";
import CourseModal from "./CourseModal";
import { Checkbox } from "../ui/checkbox";
import { useCurriculumStore, useSettingsStore } from "@/stores/curriculum";
import { cn } from "@/lib/utils";
import { getHexContrastRatio } from "@/utils/colorFunctions";

type Props = {
  variants: VariantProps;
  enrollment: ModifiedEnrollmentProps;
  color: string;
};

export default function Course({ variants, enrollment, color }: Props) {
  const { progress, updateEnrollment } = useCurriculumStore();
  const { editMode } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);

  const lowContrast = getHexContrastRatio(color) < 1.9;
  const available =
    enrollment.course?.prerequisiteCourses.every((course) =>
      course.code
        ? progress.approvedCourses.some((approvedCourse) =>
            approvedCourse.startsWith(course.code),
          )
        : true,
    ) && enrollment.course?.prerequisiteCredits <= progress.earnedCredits;

    const style = {
      backgroundColor: color,
    };

  return (
    <>
      <MotionLi
        variants={variants}
        className={cn(
          "relative flex h-[5rem] select-none items-center justify-start  overflow-hidden rounded-2xl p-2 shadow-md xl:h-[5.5rem]",
          editMode ? "hover:cursor-grab" : "hover:cursor-pointer",
          available
            ? "brightness-100 hover:brightness-[0.98]"
            : "brightness-[0.80] hover:brightness-[0.78]",
        )}
        style={style}
        onClick={() => {
          if (!editMode) setIsOpen(true);
        }}
      >
        <p
          className={cn(
            "flex h-full items-center justify-center text-pretty text-center text-xs font-normal xl:text-sm",
            editMode ? "w-10/12" : "w-full",
            lowContrast ? "text-background" : "text-foreground",
          )}
        >
          {enrollment.course?.name ?? `Curso`}
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
                code: enrollment.course?.code,
                credits: enrollment.course?.credits ?? 0,
                dependentCourses: enrollment.course?.dependentCourses,
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
      <Dialog open={isOpen} onOpenChange={(open: boolean) => setIsOpen(open)}>
        <CourseModal enrollment={enrollment} color={color} />
      </Dialog>
    </>
  );
}
