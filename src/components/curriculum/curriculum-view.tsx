"use client";

import { cn } from "@/lib/utils";
import { checkContrasts } from "@/utils/colors";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "../ui/card";
import type {
  CurriculumData,
  ModifiedCourse,
  PeriodKey,
} from "@/types/curriculum";
import { getCourse, getCourseArea } from "@/utils/curriculum";
import ScrollAreaWrapper from "../scroll-area-wrapper";
import { arabicToRoman } from "@/utils/numbers";
import CourseSheet from "./course-sheet";
import {
  getPosition,
  getRelatedPaths,
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
  PADDING,
} from "@/utils/curriculum-grid";

type CurriculumViewProps = {
  data: CurriculumData;
  className?: string;
  periods: PeriodKey[];
  nCols: number;
  nRows: number;
};

export default function CurriculumView({
  data,
  periods,
  nCols,
  nRows,
  className,
}: CurriculumViewProps) {
  const { curriculum, areas } = data;
  const courses = new Map(data.courses.map((item) => [item.id, item]));
  const [isSelected, setIsSelected] = useState(false);
  const [tapTimeout, setTapTimeout] = useState<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<ModifiedCourse | null>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [relatedPaths, setRelatedPaths] = useState<
    { paths: string[]; color: string }[]
  >([]);

  const curriculumStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${nCols}, ${GRID_CELL_WIDTH}rem)`,
    gridTemplateRows: `repeat(${nRows}, ${GRID_CELL_HEIGHT}rem)`,
    gap: `${GRID_GAP}rem`,
    padding: `${PADDING}rem`,
  };

  // Handle clicks outside the card
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setSelectedCourses([]);
        setIsSelected(false);
      }
    };

    if (isSelected) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSelected]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (tapTimeout) {
        clearTimeout(tapTimeout);
      }
    };
  }, [tapTimeout]);

  const handleMouseEnter = (action: () => void) => {
    // Only apply hover effect on non-touch devices
    if (!("ontouchstart" in window)) {
      setIsSelected(true);
      action();
    }
  };

  const handleMouseLeave = () => {
    // Only apply hover effect on non-touch devices
    if (!("ontouchstart" in window)) {
      setSelectedCourses([]);
      setIsSelected(false);
    }
  };

  const handleTouchStart = (action: () => void) => {
    // Clear any existing timeout
    if (tapTimeout) {
      clearTimeout(tapTimeout);
    }

    // Set timeout for 0.5s
    const timeout = setTimeout(() => {
      setIsSelected(true);
      action();
    }, 500);

    setTapTimeout(timeout);
  };

  const handleTouchEnd = () => {
    // Clear timeout if touch ends before 0.5s
    if (tapTimeout) {
      clearTimeout(tapTimeout);
      setTapTimeout(null);
    }
  };

  return (
    <>
      <ScrollAreaWrapper className={cn(className)}>
        <div className="p-2 pb-4">
          <div
            className="flex flex-row gap-2"
            style={{
              paddingLeft: `${PADDING}rem`,
              paddingRight: `${PADDING}rem`,
            }}
          >
            {periods.map((pKey, pIndex) => {
              //const [year, term] = pKey.split("-").map(Number);

              return (
                <div
                  key={pKey}
                  className="relative flex h-7 justify-center rounded-md p-2"
                  style={{
                    width: `${GRID_CELL_WIDTH}rem`,
                  }}
                >
                  <span
                    className={`text-muted-foreground w-full text-center text-xs font-bold tracking-wider`}
                  >
                    SEMESTRE {arabicToRoman(pIndex + 1)}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={curriculumStyle} className="relative">
            {curriculum.slots.map((slot, sIndex) => {
              const position = getPosition(periods, slot);
              const course = getCourse({ id: slot.courseId, courses: courses });
              const area = course && getCourseArea(areas, course);
              // const enrollment = enrollments.get(slot.id);

              const color = area?.color ?? "#fafafa";
              const {
                hasLowBackgroundElementContrast,
                hasLowElementTextContrast,
              } = checkContrasts({ elementColor: color });

              const slotStyle = {
                backgroundColor: color,
                gridColumn: `${position.x} / span ${course?.duration ?? 1}`,
                gridRow: `${position.y} / span ${1}`,
              };

              const isRelated = course && selectedCourses.includes(course.id);

              function handleSelection() {
                if (!course) return;

                const relatedPaths = getRelatedPaths({
                  originSlot: slot,
                  slots: curriculum.slots,
                  periods: periods,
                  course: course,
                });

                setSelectedCourses([
                  ...course.prerequisiteIds,
                  ...course.subsequentIds,
                  ...[course.id],
                ]);
                setRelatedPaths(relatedPaths);
                setIsSelected(true);
              }

              return (
                <Card
                  key={`${slot.year}-${slot.term}-${slot.position}`}
                  ref={cardRef}
                  className={cn(
                    "hover:border-accent-foreground cursor-pointer transition-opacity select-none hover:border-3 hover:brightness-95 dark:hover:brightness-105",
                    hasLowBackgroundElementContrast &&
                      "border-foreground/50 border",
                    hasLowElementTextContrast && "text-background",
                    isSelected && !isRelated && "opacity-25",
                  )}
                  style={slotStyle}
                  onTouchStart={() => handleTouchStart(handleSelection)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                  onMouseEnter={() => handleMouseEnter(handleSelection)}
                  onMouseLeave={handleMouseLeave}
                  onFocus={() => handleTouchStart(handleSelection)}
                  onClick={() => {
                    if (!course?.isElective) return;

                    setSelectedCourse(course);
                    setIsOpen(true);
                  }}
                >
                  <CardContent className="flex h-full items-center justify-center p-2">
                    <h3 className="text-center text-xs font-medium">
                      {course?.name ?? `Slot ${sIndex + 1}`}
                    </h3>
                  </CardContent>
                </Card>
              );
            })}
            <svg className="absolute top-0 left-0 -z-50 size-full">
              {isSelected &&
                relatedPaths.map((related) => {
                  return related.paths.map((path, pIndex) => (
                    <Path key={pIndex} path={path} color={related.color} />
                  ));
                })}
            </svg>
          </div>
        </div>
      </ScrollAreaWrapper>

      <CourseSheet
        isOpen={isOpen}
        onOpenChange={() => setIsOpen(!isOpen)}
        course={selectedCourse}
        courses={courses}
        areas={areas}
      />
    </>
  );
}

function Path({ path, color }: { path: string; color: string }) {
  return (
    <path
      d={path}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-dash"
    />
  );
}
