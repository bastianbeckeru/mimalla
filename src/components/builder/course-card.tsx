"use client";

import { useDraggable } from "@dnd-kit/react";
import { cn } from "cn";
import type { CSSProperties } from "react";
import { getTextColor } from "@/builder/colors";
import type { Course } from "@/builder/draft";

export default function CourseCard({
  dragId,
  course,
  color,
  isSelected,
  onSelect,
  style,
}: {
  dragId: string;
  course: Course;
  color: string;
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
        "flex cursor-grab flex-col justify-between overflow-hidden rounded-lg p-2 text-left text-xs ring-1 ring-foreground/10 transition-[filter] hover:brightness-110",
        isSelected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        isDragging && "cursor-grabbing shadow-lg",
      )}
      style={{ ...style, backgroundColor: color, color: getTextColor(color) }}
      onClick={onSelect}
    >
      <span className="line-clamp-3 font-medium">{course.name}</span>
      <span className="opacity-75">{course.credits} créditos</span>
    </button>
  );
}
