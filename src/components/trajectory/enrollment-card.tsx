"use client";

import { cn } from "cn";
import { Ellipsis } from "lucide-react";
import type { ComponentProps } from "react";
import DraggableCourseCard from "@/components/builder/course-card";
import type { EnrollmentStatus } from "@/types/trajectory";

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  PENDING: "pendiente",
  APPROVED: "aprobado",
  FAILED: "reprobado",
};

export default function EnrollmentCard({
  status,
  isAvailable,
  isShaking,
  isEntering,
  enterDelay,
  onOpenPanel,
  ...props
}: Omit<
  ComponentProps<typeof DraggableCourseCard>,
  "className" | "decoration" | "label" | "onContextMenu" | "onKeyDown"
> & {
  status: EnrollmentStatus;
  isAvailable: boolean;
  isShaking: boolean;
  isEntering: boolean;
  enterDelay: number;
  onOpenPanel: () => void;
}) {
  return (
    <DraggableCourseCard
      {...props}
      label={`${props.course.name}, ${STATUS_LABELS[status]}`}
      className={cn(
        "touch-manipulation select-none [-webkit-touch-callout:none]",
        !isAvailable && status === "PENDING" && "saturate-[0.15]",
        isEntering &&
          "fade-in slide-in-from-bottom-1 animate-in fill-mode-both duration-300 ease-out [--tw-animation-delay:var(--enter-delay)] motion-reduce:animate-none",
        isShaking && "animate-shake",
      )}
      style={{
        ...props.style,
        ...(isEntering && { "--enter-delay": `${enterDelay}ms` }),
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        const isTouch =
          "pointerType" in event.nativeEvent &&
          event.nativeEvent.pointerType === "touch";
        if (!isTouch) onOpenPanel();
      }}
      onKeyDown={(event) => {
        if (
          event.key === "ContextMenu" ||
          (event.shiftKey && event.key === "F10")
        ) {
          event.preventDefault();
          onOpenPanel();
        }
      }}
      decoration={status !== "PENDING" && <StrikeLine status={status} />}
    >
      <button
        type="button"
        aria-label={`Opciones de ${props.course.name}`}
        className="absolute top-1 right-1 hidden size-6 items-center justify-center rounded-md bg-background/80 text-foreground opacity-0 shadow-sm transition-opacity duration-150 ease-out hover:bg-background focus-visible:opacity-100 group-hover/card:opacity-100 md:flex"
        onClick={() => onOpenPanel()}
      >
        <Ellipsis className="size-4" />
      </button>
    </DraggableCourseCard>
  );
}

function StrikeLine({ status }: { status: EnrollmentStatus }) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full overflow-hidden rounded-lg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <line
        x1="0"
        y1="100"
        x2="100"
        y2="0"
        strokeWidth={3}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className={
          status === "FAILED" ? "stroke-red-700" : "stroke-neutral-950"
        }
      />
    </svg>
  );
}
