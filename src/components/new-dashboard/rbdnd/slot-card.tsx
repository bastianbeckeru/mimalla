import "@/styles/curriculum.css";
import { cn } from "@/lib/utils";
import type { CurriculumData } from "@/types/curriculum";

import { checkContrasts } from "@/utils/colors";
import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { useNewCurriculumStore } from "@/stores/newCurriculum";
import type { EnrolledCourse } from "@/types/store";

type SlotProps = {
  color?: string;
  isDragging?: boolean;
  isAvailable?: boolean;
  enrollment: EnrolledCourse;
  course?: CurriculumData["courses"][0] | null;
  className?: string;
  children?: React.ReactNode;
};

type ExtendedSlotProps = SlotProps & ComponentPropsWithoutRef<"li">;

const SlotCard = forwardRef<HTMLLIElement, ExtendedSlotProps>(
  (
    {
      color = "#fafafa",
      isDragging = false,
      isAvailable = true,
      enrollment,
      course,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const { hasLowBackgroundElementContrast, hasLowElementTextContrast } =
      checkContrasts({
        elementColor: color,
      });

    const style = {
      backgroundColor: color,
      ...props.style,
    };

    return (
      <li
        {...props}
        ref={ref}
        style={style}
        className={cn(
          "relative mb-2 flex h-16 w-32 cursor-pointer select-none items-center justify-center overflow-hidden rounded-md bg-card p-2 text-card-foreground shadow-sm",
          hasLowBackgroundElementContrast && "border border-foreground/50",
          hasLowElementTextContrast && "text-background",
          isAvailable
            ? "hover:brightness-[1.05]"
            : "brightness-[0.5] hover:brightness-[0.55]",
          isDragging && "shadow-2xl",
          className,
        )}
      >
        <span className="text-center text-xs font-medium">
          {course ? course.name : "Vacío"}
        </span>

        {children}

        {/* Strikethrough */}
        {enrollment.status !== "PENDING" && (
          <div
            className={cn(
              "diagonal-line",
              enrollment.status === "APPROVED" ? "bg-black" : "bg-red-700",
            )}
          />
        )}
      </li>
    );
  },
);
SlotCard.displayName = "SlotCard";

export default SlotCard;
