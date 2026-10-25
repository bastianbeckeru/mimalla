"use client";

import { cn } from "cn";
import type { CSSProperties } from "react";
import type { Course } from "@/builder/draft";

export default function CourseCard({
  course,
  isSelected,
  onSelect,
  style,
}: {
  course: Course;
  isSelected: boolean;
  onSelect: () => void;
  style: CSSProperties;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex flex-col justify-between overflow-hidden rounded-lg border bg-card p-2 text-left text-xs transition-colors hover:bg-muted",
        isSelected && "ring-2 ring-ring",
      )}
      style={style}
      onClick={onSelect}
    >
      <span className="line-clamp-3 font-medium">{course.name}</span>
      <span className="text-muted-foreground">{course.credits} créditos</span>
    </button>
  );
}
