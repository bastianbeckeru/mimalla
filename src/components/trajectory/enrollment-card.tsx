import { cn } from "cn";
import { Check, Clock, Trash, X } from "lucide-react";
import { MotionDiv } from "@/components/motion";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { Course } from "@/types/curriculum";
import type { Enrollment, EnrollmentStatus } from "@/types/trajectory";
import { checkContrasts } from "@/utils/colors";

const STATUS_TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus> = {
  PENDING: "APPROVED",
  APPROVED: "FAILED",
  FAILED: "PENDING",
};

const STATUS_ACTIONS = [
  { status: "APPROVED", label: "Marcar como aprobado", Icon: Check },
  { status: "PENDING", label: "Marcar como pendiente", Icon: Clock },
  { status: "FAILED", label: "Marcar como reprobado", Icon: X },
] as const;

type EnrollmentCardProps = {
  enrollment: Enrollment;
  course: Course | undefined;
  color: string;
  isAvailable: boolean;
  editMode: boolean;
  isDragging: boolean;
  onOpen: () => void;
  onStatusChange: (status: EnrollmentStatus) => void;
  onDelete: () => void;
};

export default function EnrollmentCard({
  enrollment,
  course,
  color,
  isAvailable,
  editMode,
  isDragging,
  onOpen,
  onStatusChange,
  onDelete,
}: EnrollmentCardProps) {
  const { hasLowBackgroundElementContrast, hasLowElementTextContrast } =
    checkContrasts({ elementColor: color });

  function handleClick() {
    if (isDragging) return;

    if (!editMode) {
      onOpen();
      return;
    }

    if (isAvailable) onStatusChange(STATUS_TRANSITIONS[enrollment.status]);
  }

  return (
    <ContextMenu disabled={!editMode}>
      <ContextMenuTrigger
        render={
          <MotionDiv
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            style={{ backgroundColor: color }}
            className={cn(
              "relative flex size-full cursor-pointer select-none items-center justify-center overflow-hidden rounded-md bg-card p-2 text-card-foreground shadow-sm transition-[filter] hover:brightness-110",
              hasLowBackgroundElementContrast && "border border-foreground/50",
              hasLowElementTextContrast && "text-background",
              !isAvailable && "brightness-[25%] hover:brightness-[35%]",
              editMode && "cursor-grab",
              isDragging && "shadow-2xl",
            )}
            onClick={handleClick}
          />
        }
      >
        <span className="text-center font-medium text-xs">
          {course?.name ?? "Vacío"}
        </span>

        {enrollment.status !== "PENDING" && (
          <div
            className={cn(
              "diagonal-line",
              enrollment.status === "APPROVED" ? "bg-black" : "bg-red-700",
            )}
          />
        )}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {STATUS_ACTIONS.map(({ status, label, Icon }) => (
          <ContextMenuItem
            key={status}
            disabled={enrollment.status === status}
            onClick={() => onStatusChange(status)}
          >
            <Icon />
            {label}
          </ContextMenuItem>
        ))}
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onClick={onDelete}>
          <Trash />
          Eliminar
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
