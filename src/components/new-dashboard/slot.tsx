import "@/styles/curriculum.css";
import { cn } from "@/lib/utils";
import type { CurriculumData } from "@/types/curriculum";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { checkContrasts } from "@/utils/colors";
import { forwardRef } from "react";
import { useNewCurriculumStore } from "@/stores/newCurriculum";
import type { EnrolledCourse, EnrolledCourseStatus } from "@/types/store";
import { MotionLi } from "../Motion";
import type { HTMLMotionProps, Variants } from "framer-motion";

type SlotProps = {
  course?: CurriculumData["courses"][0] | null;
  color?: string;
  className?: string;
  variants?: Variants;
  dragOverlay?: boolean;
  children?: React.ReactNode;
};

type ExtendedSlotProps = SlotProps & HTMLMotionProps<"li">;

const Slot = forwardRef<HTMLLIElement, ExtendedSlotProps>(
  (
    {
      course,
      color = "#fafafa",
      dragOverlay = false,
      className,
      variants,
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
      ...props.style, // Combina los estilos pasados manualmente
    };

    return (
      <MotionLi
        {...props}
        ref={ref}
        style={style}
        variants={variants}
        className={cn(
          "slot relative flex h-16 w-32 select-none items-center justify-center overflow-hidden rounded-md bg-card p-2 text-card-foreground shadow-sm",
          hasLowBackgroundElementContrast && "border border-foreground/50",
          hasLowElementTextContrast && "text-background",
          dragOverlay &&
            "dragOverlaySlot shadow-xl brightness-95 transition-shadow dark:brightness-105",
          className,
        )}
      >
        <span className="text-center text-xs font-medium">
          {course?.name ?? "Vacío"}
        </span>
        {children}
      </MotionLi>
    );
  },
);
Slot.displayName = "Slot";

// Componente DraggableSlot
function DraggableSlot({
  slot,
  course,
  color,
  isDisabled,
  openDialog,
  updateCourseEnrollmentStatus,
  ...props
}: SlotProps & {
  slot: EnrolledCourse;
  isDisabled: boolean;
  openDialog: () => void;
  updateCourseEnrollmentStatus: (newStatus: EnrolledCourseStatus) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id });

  // Aplicamos estilos de transformación y transición
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const variants = isDragging
    ? {
        hidden: { opacity: 0.15 },
        visible: { opacity: 0.15 },
      }
    : {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      };

  return (
    <Slot
      {...attributes}
      {...listeners}
      {...props}
      ref={setNodeRef}
      style={style}
      variants={variants}
      className={cn(
        "cursor-pointer hover:brightness-95 dark:hover:brightness-105",
        isDisabled && "cursor-pointer",
      )}
      course={course}
      color={color}
      onPointerUp={() => {
        if (!isDisabled && !isDragging) {
          updateCourseEnrollmentStatus(slot.status);
        }
      }}
      onClick={() => {
        if (isDisabled && !isDragging) {
          openDialog();
        }
      }}
    >
      {/* Strikethrough */}
      {slot.status !== "PENDING" && (
        <div
          className={cn(
            "diagonal-line",
            slot.status === "APPROVED" ? "bg-black" : "bg-red-700",
          )}
        />
      )}
    </Slot>
  );
}

export { Slot, DraggableSlot };
