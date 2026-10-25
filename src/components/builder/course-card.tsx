"use client";

import { useDraggable } from "@dnd-kit/react";
import { cn } from "cn";
import type { CSSProperties } from "react";
import type { Course } from "@/builder/draft";

export default function CourseCard({
  dragId,
  course,
  isSelected,
  onSelect,
  style,
}: {
  dragId: string;
  course: Course;
  isSelected: boolean;
  onSelect: () => void;
  style: CSSProperties;
}) {
  const { ref, isDragging } = useDraggable({ id: dragId });

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex cursor-grab flex-col justify-between overflow-hidden rounded-lg border bg-card p-2 text-left text-xs transition-colors hover:bg-muted",
        isSelected && "ring-2 ring-ring",
        isDragging && "cursor-grabbing shadow-lg",
      )}
      style={style}
      onClick={onSelect}
    >
      <span className="line-clamp-3 font-medium">{course.name}</span>
      <span className="text-muted-foreground">{course.credits} créditos</span>
    </button>
  );
}
