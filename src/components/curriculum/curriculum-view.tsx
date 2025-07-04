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
import SelectableCard from "./selectable-card";

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

  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<ModifiedCourse | null>(
    null,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [relatedPaths, setRelatedPaths] = useState<
    { paths: string[]; color: string }[]
  >([]);

  useEffect(() => {
    if (!selectedId) return;

    let touchStartTime = 0;

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType === "touch") {
        touchStartTime = Date.now();
      }
    }

    function handlePointerUp(event: PointerEvent) {
      if (event.pointerType === "touch") {
        const duration = Date.now() - touchStartTime;
        if (duration < 300) {
          // ajusta 300ms a tu gusto
          const el = event.target as HTMLElement;
          if (el.closest(".selectable-card")?.id !== selectedId) {
            setSelectedId(null);
          }
        }
      } else if (event.pointerType === "mouse") {
        const el = event.target as HTMLElement;
        if (el.closest(".selectable-card")?.id !== selectedId) {
          setSelectedId(null);
        }
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [selectedId]);

  const curriculumStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${nCols}, ${GRID_CELL_WIDTH}rem)`,
    gridTemplateRows: `repeat(${nRows}, ${GRID_CELL_HEIGHT}rem)`,
    gap: `${GRID_GAP}rem`,
    padding: `${PADDING}rem`,
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

              const cardId = `${slot.year}-${slot.term}-${slot.position}`;
              const isRelated = course && selectedCourses.includes(course.id);

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

              function handleOnSelect(id: string | null) {
                if (!course) return;

                if (id === null) {
                  setSelectedId(null);
                  setSelectedCourses([]);
                } else {
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
                  setSelectedId(id);
                }
              }

              function handleOnClick() {
                if (!course?.isElective) return;

                setSelectedCourse(course);
                setIsOpen(true);
              }

              return (
                <SelectableCard
                  key={cardId}
                  id={cardId}
                  className={cn(
                    "cursor-pointer transition-[filter] select-none",
                    hasLowBackgroundElementContrast &&
                      "border-foreground/50 border",
                    hasLowElementTextContrast && "text-background",
                    selectedId && !isRelated && "brightness-[25%]",
                  )}
                  style={slotStyle}
                  selectedId={selectedId}
                  onSelect={(id: any) => handleOnSelect(id)}
                  onClick={handleOnClick}
                >
                  <h3 className="text-center text-xs font-medium">
                    {course?.name ?? `Slot ${sIndex + 1}`}
                  </h3>
                </SelectableCard>
              );
            })}
            <svg className="absolute top-0 left-0 -z-50 size-full">
              {selectedId &&
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
