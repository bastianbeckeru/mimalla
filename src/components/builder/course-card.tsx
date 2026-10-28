"use client";

import { useDraggable } from "@dnd-kit/react";
import { cn } from "cn";
import { type CSSProperties, type ReactNode, useRef } from "react";
import { getTextColor } from "@/builder/colors";
import {
  useLayoutFlip,
  useSizeReveal,
} from "@/components/builder/use-layout-flip";
import type { Course } from "@/types/builder";
import type { HexColor } from "@/types/colors";

export default function CourseCard({
  dragId,
  course,
  color,
  isSelected,
  onSelect,
  onHoverChange,
  takeDropOrigin,
  style,
  children,
}: {
  dragId: string;
  course: Course;
  color: HexColor;
  isSelected: boolean;
  onSelect: () => void;
  onHoverChange: (isHovered: boolean) => void;
  takeDropOrigin: () => { x: number; y: number } | null;
  style: CSSProperties;
  children: ReactNode;
}) {
  const { ref, isDragging } = useDraggable({ id: dragId });
  const cellRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLSpanElement>(null);
  useLayoutFlip(cellRef, takeDropOrigin);
  useSizeReveal(cellRef, surfaceRef);

  return (
    <div
      ref={cellRef}
      className="group/card relative"
      data-selected={isSelected || undefined}
      style={{ ...style, color: getTextColor(color) }}
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
    >
      <button
        ref={ref}
        type="button"
        className={cn(
          "relative isolate size-full cursor-grab rounded-lg p-2 text-center text-xs transition-[filter] hover:brightness-110",
          isDragging && "cursor-grabbing shadow-lg",
        )}
        onClick={onSelect}
      >
        {/* The card's painted body, kept apart from the text so it can be
            clipped to animate a change of size. */}
        <span
          ref={surfaceRef}
          aria-hidden
          className={cn(
            "absolute top-0 left-0 -z-10 size-full rounded-lg ring-1 ring-foreground/10",
            isSelected &&
              "ring-2 ring-ring ring-offset-2 ring-offset-background",
          )}
          style={{ backgroundColor: color }}
        />
        <span className="flex size-full items-center justify-center overflow-hidden">
          <span className="line-clamp-3 font-medium">{course.name}</span>
        </span>
      </button>
      {children}
    </div>
  );
}
