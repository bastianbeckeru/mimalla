"use client";

import { useDraggable } from "@dnd-kit/react";
import { cn } from "cn";
import { type ComponentProps, useRef } from "react";
import {
  useLayoutFlip,
  useSizeReveal,
} from "@/components/builder/use-layout-flip";
import CourseCard from "@/components/curriculum/course-card";

export default function DraggableCourseCard({
  dragId,
  takeDropOrigin,
  className,
  ...props
}: ComponentProps<typeof CourseCard> & {
  dragId: string;
  takeDropOrigin: () => { x: number; y: number } | null;
}) {
  const { ref, isDragging } = useDraggable({ id: dragId });
  const cellRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLSpanElement>(null);
  useLayoutFlip(cellRef, takeDropOrigin);
  useSizeReveal(cellRef, surfaceRef);

  return (
    <CourseCard
      {...props}
      cellRef={cellRef}
      buttonRef={ref}
      surfaceRef={surfaceRef}
      className={cn(
        "cursor-grab",
        isDragging && "cursor-grabbing shadow-lg",
        className,
      )}
    />
  );
}
