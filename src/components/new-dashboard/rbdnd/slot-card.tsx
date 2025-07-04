import "@/styles/curriculum.css";
import { cn } from "@/lib/utils";
import type { CurriculumData } from "@/types/curriculum";
import type { ComponentProps, PropsWithChildren } from "react";
import type { EnrolledCourse } from "@/types/store";
import { checkContrasts } from "@/utils/colors";
import { MotionLi } from "@/components/motion";

type SlotProps = {
  color?: string;
  isAvailable?: boolean;
  enrollment: EnrolledCourse;
  course?: CurriculumData["courses"][0] | null;
  className?: string;
  onClick?: ComponentProps<"li">["onClick"];
} & PropsWithChildren;

export default function SlotCard({
  color = "#fafafa",
  isAvailable = true,
  enrollment,
  course,
  className,
  children,
  ...props
}: SlotProps) {
  const { hasLowBackgroundElementContrast, hasLowElementTextContrast } =
    checkContrasts({
      elementColor: color,
    });

  const style = {
    backgroundColor: color,
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <MotionLi
      {...props}
      variants={itemVariants}
      style={style}
      className={cn(
        "bg-card text-card-foreground relative mb-2 flex h-16 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-md p-2 shadow-sm transition-[filter] select-none hover:brightness-110",
        hasLowBackgroundElementContrast && "border-foreground/50 border",
        hasLowElementTextContrast && "text-background",
        !isAvailable && "brightness-[25%] hover:brightness-[35%]",
        className,
      )}
      onClick={props.onClick}
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
    </MotionLi>
  );
}
