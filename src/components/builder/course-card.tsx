"use client";

import { useDraggable } from "@dnd-kit/react";
import { cn } from "cn";
import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import { getTextColor } from "@/builder/colors";
import { getConnectionRole } from "@/builder/connections";
import {
  useLayoutFlip,
  useSizeReveal,
} from "@/components/builder/use-layout-flip";
import { getFocusedCourseId, useConnectionFocus } from "@/stores/connections";
import type { Course, Curriculum } from "@/types/builder";
import type { HexColor } from "@/types/colors";

export default function CourseCard({
  dragId,
  course,
  curriculum,
  gestureCourseId,
  color,
  isSelected,
  onSelect,
  takeDropOrigin,
  style,
  children,
}: {
  dragId: string;
  course: Course;
  curriculum: Curriculum;
  gestureCourseId: number | null;
  color: HexColor;
  isSelected: boolean;
  onSelect: () => void;
  takeDropOrigin: () => { x: number; y: number } | null;
  style: CSSProperties;
  children: ReactNode;
}) {
  const { ref, isDragging } = useDraggable({ id: dragId });
  const cellRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLSpanElement>(null);
  useLayoutFlip(cellRef, takeDropOrigin);
  useSizeReveal(cellRef, surfaceRef);
  const { hover, focusByKeyboard, release } = useConnectionFocus.getState();
  // How this course stands toward the course whose connections are shown.
  const role = useConnectionFocus((state) =>
    getConnectionRole(
      curriculum,
      gestureCourseId ?? getFocusedCourseId(state),
      course.id,
    ),
  );

  useEffect(() => () => release(course.id), [release, course.id]);

  return (
    <div
      ref={cellRef}
      className="group/card relative"
      data-selected={isSelected || undefined}
      style={{ ...style, color: getTextColor(color) }}
      onPointerEnter={() => hover(course.id)}
      onPointerLeave={() => release(course.id, "hoveredCourseId")}
    >
      <button
        ref={ref}
        type="button"
        onFocus={(event) => {
          if (event.target.matches(":focus-visible"))
            focusByKeyboard(course.id);
        }}
        onBlur={() => release(course.id, "keyboardCourseId")}
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
            role === "misplaced" && "ring-2 ring-warning",
            isSelected &&
              "ring-2 ring-ring ring-offset-2 ring-offset-background",
          )}
          style={{ backgroundColor: color }}
        />
        <span className="flex size-full items-center justify-center overflow-hidden">
          <span className="line-clamp-3 font-medium">{course.name}</span>
        </span>
        {/* Dims the card while the connections shown leave it out. A veil
            over it, rather than fading it, keeps the connections running
            beneath from showing through. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-lg bg-background/60 opacity-0 transition-opacity duration-150 ease-out",
            role === "unrelated" && "opacity-100",
          )}
        />
      </button>
      {children}
    </div>
  );
}
