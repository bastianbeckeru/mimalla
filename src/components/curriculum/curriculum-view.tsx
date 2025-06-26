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
import ScrollAreaWrapper from "../ScrollAreaWrapper";
import { arabicToRoman } from "@/utils/numbers";
import CourseSheet from "./course-sheet";

type CurriculumViewProps = {
  data: CurriculumData;
  className?: string;
  periods: PeriodKey[];
  nCols: number;
  nRows: number;
};

const GRID_CELL_WIDTH = 8;
const GRID_CELL_HEIGHT = 4;
const GRID_GAP = 0.5;
const PADDING = 0.5;
const FONTSIZE = 16; // px

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
                    className={`w-full text-center text-xs font-bold tracking-wider text-muted-foreground`}
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
                    "cursor-pointer select-none transition-opacity hover:border hover:border-foreground hover:brightness-95 dark:hover:brightness-105",
                    hasLowBackgroundElementContrast &&
                      "border border-foreground/50",
                    hasLowElementTextContrast && "text-background",
                    isSelected && !isRelated && "opacity-25",
                  )}
                  style={slotStyle}
                  onTouchStart={() => handleTouchStart(handleSelection)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                  onMouseEnter={() => handleMouseEnter(handleSelection)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => {
                    if (!course?.isElective) return;

                    setSelectedCourse(course);
                    setIsOpen(true);
                  }}
                >
                  <CardContent className="flex h-full select-none items-center justify-center p-2">
                    <h3 className="text-center text-xs font-medium">
                      {course?.name ?? `Slot ${sIndex + 1}`}
                    </h3>
                  </CardContent>
                </Card>
              );
            })}
            <svg className="absolute left-0 top-0 -z-50 size-full">
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

// COURSE FUNCTIONS
function getPosition(
  periods: PeriodKey[],
  slot: CurriculumData["curriculum"]["slots"][0],
) {
  const x = periods.findIndex((pKey) => pKey === `${slot.year}-${slot.term}`); // Start from 0
  const y = slot.position; // Start from 1

  return { x: x + 1, y: y };
}
function getCoordinates(position: Coordinate) {
  const { x, y } = position;

  const calculatePosition = (pos: number, size: number) =>
    (pos - 1) * (size + GRID_GAP) + size / 2 + PADDING;

  return {
    x: FONTSIZE * calculatePosition(x, GRID_CELL_WIDTH),
    y: FONTSIZE * calculatePosition(y, GRID_CELL_HEIGHT),
  };
}

/* SVG */
export type Coordinate = { x: number; y: number };

function getStepPathPoints({
  source,
  target,
}: {
  source: Coordinate;
  target: Coordinate;
}): Coordinate[] {
  const directionY = Math.pow(-1, source.y >= target.y ? 1 : 2);
  const midX = ((GRID_CELL_WIDTH + GRID_GAP) * FONTSIZE) / 2;
  const midY = (((GRID_CELL_HEIGHT + GRID_GAP) * FONTSIZE) / 2) * directionY;

  // Case 1: Next column and same row
  const points = [
    { x: source.x, y: source.y }, // Move to source
    { x: target.x, y: target.y }, // Line to target
  ];

  // Case 2: Next column but different row
  if (source.y !== target.y && target.x - source.x === midX * 2) {
    const newPoints = [
      { x: source.x + midX, y: source.y },
      { x: source.x + midX, y: target.y },
    ];

    points.splice(1, 0, ...newPoints);
  }
  // Case 3: Different column and row
  else if (target.x - source.x > midX * 2) {
    const newPoints = [
      { x: source.x + midX, y: source.y },
      { x: source.x + midX, y: source.y + midY },
      { x: target.x - midX, y: source.y + midY },
      { x: target.x - midX, y: target.y },
    ];

    points.splice(1, 0, ...newPoints);
  }

  return points;
}
function generatePathData(points: Coordinate[]) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
}

function getRelatedPaths({
  originSlot,
  slots,
  periods,
  course,
}: {
  originSlot: CurriculumData["curriculum"]["slots"][0];
  slots: CurriculumData["curriculum"]["slots"];
  periods: PeriodKey[];
  course: CurriculumData["courses"][0] & { subsequentIds: number[] };
}) {
  const { prerequisiteIds, subsequentIds } = course;
  const { year, term } = originSlot;

  const originCoordinates = getCoordinates(getPosition(periods, originSlot));

  // Considerando que se obtienen todos los paths de un tipo, estos se podrían optimizar
  // evitando repetir los mismos paths. Por ahora, se deja así para simplificar.
  const prerequisitePaths = prerequisiteIds
    .map((id) => {
      // 1. Busca al slot relacionado
      const relatedSlot = slots.find(
        (slot) =>
          slot.courseId === id &&
          ((slot.year === year && slot.term < term) || slot.year < year),
      );
      if (!relatedSlot) return null;

      const relatedPosition = getPosition(periods, relatedSlot);
      const relatedCoordinates = getCoordinates(relatedPosition);

      // 2. Generar los puntos de la ruta
      const points = getStepPathPoints({
        source: relatedCoordinates,
        target: originCoordinates,
      });

      // 3. Generar el path
      return generatePathData(points);
    })
    .filter((item) => item !== null);

  const subsequentPaths = subsequentIds
    .map((id) => {
      // 1. Busca al slot relacionado
      const relatedSlot = slots.find(
        (slot) =>
          slot.courseId === id &&
          ((slot.year === year && slot.term > term) || slot.year > year),
      );

      if (!relatedSlot) return null;

      const relatedPosition = getPosition(periods, relatedSlot);
      const relatedCoordinates = getCoordinates(relatedPosition);

      // 2. Generar los puntos de la ruta
      const points = getStepPathPoints({
        source: originCoordinates,
        target: relatedCoordinates,
      });

      // 3. Generar el path
      return generatePathData(points);
    })
    .filter((item) => item !== null);

  return [
    { paths: prerequisitePaths, color: "#dc2626" },
    { paths: subsequentPaths, color: "#22c55e" },
  ];
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
