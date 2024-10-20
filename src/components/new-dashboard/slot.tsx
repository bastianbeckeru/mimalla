import "@/styles/curriculum.css";
import { cn } from "@/lib/utils";
import type { CurriculumData } from "@/types/curriculum";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "../ui/card";
import { checkContrasts } from "@/utils/colors";
import { forwardRef } from "react";

// Definimos las props para el Slot
type SlotProps = {
  course?: CurriculumData["courses"][0] | null;
  color?: string;
  dragOverlay?: boolean;
  className?: string;
};

type ExtendedSlotProps = SlotProps & React.HTMLAttributes<HTMLDivElement>;

const Slot = forwardRef<HTMLDivElement, ExtendedSlotProps>(
  (
    {
      course,
      color = "#fafafa",
      dragOverlay = false,
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
      ...props.style, // Combina los estilos pasados manualmente
    };

    return (
      <Card
        {...props}
        ref={ref}
        style={style}
        className={cn(
          "slot flex h-16 w-32 items-center justify-center rounded-md p-2",
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
      </Card>
    );
  },
);

Slot.displayName = "Slot";

// Componente DraggableSlot
function DraggableSlot({
  slot,
  course,
  color,
}: SlotProps & {
  slot: CurriculumData["curriculum"]["slots"][0];
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
    opacity: isDragging ? 0.25 : 1,
  };

  return (
    <Slot
      {...attributes}
      {...listeners}
      ref={setNodeRef}
      style={style}
      className="cursor-grab hover:brightness-95 dark:hover:brightness-105"
      course={course}
      color={color}
    />
  );
}

export { Slot, DraggableSlot };
