import "@/styles/curriculum.css";
import { cn } from "@/lib/utils";
import type { CurriculumData } from "@/types/curriculum";

import { checkContrasts } from "@/utils/colors";
import {
  type ComponentPropsWithoutRef,
  forwardRef,
  PropsWithChildren,
} from "react";
import type { EnrolledCourse } from "@/types/store";

type SlotProps = {
  color?: string;
  isDragging?: boolean;
  isAvailable?: boolean;
  enrollment: EnrolledCourse;
  course?: CurriculumData["courses"][0] | null;
  className?: string;
} & PropsWithChildren &
  ComponentPropsWithoutRef<"li">;

const SlotCard = forwardRef<HTMLLIElement, SlotProps>(
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
          "bg-card text-card-foreground relative mb-2 flex h-16 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-md p-2 shadow-sm transition-[filter] select-none hover:brightness-110",
          hasLowBackgroundElementContrast && "border-foreground/50 border",
          hasLowElementTextContrast && "text-background",
          !isAvailable && "brightness-[25%] hover:brightness-[35%]",
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
