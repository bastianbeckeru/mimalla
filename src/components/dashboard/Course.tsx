"use client";

/* import { useSettingsStore } from "@/stores/curriculum"; */
import { MotionLi, type VariantProps } from "../Motion";
import { Dialog } from "../ui/dialog";
import { useState } from "react";
import type { EnrollmentProps } from "@/types/user";
import CourseModal from "./CourseModal";
import { Checkbox } from "../ui/checkbox";
import { useCurriculumStore, useSettingsStore } from "@/stores/curriculum";
import { cn } from "@/lib/utils";
import { getContrastRatio } from "@/utils/colorFunctions";

type Props = {
  variants: VariantProps;
  enrollment: EnrollmentProps;
};

export default function Course({ variants, enrollment }: Props) {
  const { progress, updateEnrollment } = useCurriculumStore();
  const { editMode } = useSettingsStore();

  const [isOpen, setIsOpen] = useState(false);

  const available =
    enrollment.course?.prerequisiteCourses.every((course) =>
      course.code ? progress.approvedCourses.includes(course.code) : true,
    ) && enrollment.course?.prerequisiteCredits <= 0;
  const lowContrast = getContrastRatio(enrollment.course?.color) < 1.9;

  return (
    <>
      <MotionLi
        variants={variants}
        className={cn(
          "relative mb-2 flex h-20 select-none items-center justify-start rounded-2xl bg-slate-100 p-2 shadow-md xl:h-[5.5rem]",
          editMode ? "hover:cursor-grab" : "hover:cursor-pointer",
          available
            ? "brightness-100 hover:brightness-[0.98]"
            : "brightness-[0.80] hover:brightness-[0.78]",
        )}
        style={{ backgroundColor: enrollment.course?.color }}
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
          onClick={(e) => e.stopPropagation()}
        />

        {/* Strikethrough */}
        {enrollment.status === "APPROVED" && (
          <div
            className={cn(
              "absolute z-10 h-[4px] transform bg-black",
              editMode && "bottom-[42px] left-[-8px] w-36 rotate-[-33deg]",
            )}
          />
        )}
      </MotionLi>

      {/* Course Modal */}
      <Dialog open={isOpen} onOpenChange={(open: boolean) => setIsOpen(open)}>
        {/* <CourseModal enrollment={enrollment} /> */}
      </Dialog>
    </>
  );
}
