"use client";

import { cn } from "@/lib/utils";
import { checkContrasts } from "@/utils/colors";

import { useState } from "react";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Card, CardContent } from "../ui/card";
import type { CurriculumData, PeriodKey } from "@/types/curriculum";

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

export default function CurriculumView({
  data,
  periods,
  nCols,
  nRows,
  className,
}: CurriculumViewProps) {
  const { curriculum, areas } = data;
  const courses = new Map(data.courses.map((item) => [item.id, item]));
  const [isHovering, setIsHovering] = useState(false);
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

  return (
    <ScrollArea
      className={cn("shadow-[inset_0_0_32px_rgba(0,0,0,0.75)]", className)}
    >
      <div className="p-2">
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
                  className={`text-xs font-bold tracking-wider text-muted-foreground`}
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
            const area = course && findArea(areas, course);
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

            return (
              <Card
                key={`${slot.year}-${slot.term}-${slot.position}`}
                className={cn(
                  "cursor-pointer hover:brightness-95 dark:hover:brightness-105",
                  hasLowBackgroundElementContrast &&
                    "border border-foreground/50",
                  hasLowElementTextContrast && "text-background",
                )}
                style={slotStyle}
                onMouseEnter={() => {
                  if (!course) return;

                  const relatedPaths = getRelatedPaths({
                    originSlot: slot,
                    slots: curriculum.slots,
                    periods: periods,
                    course: course,
                  });

                  setRelatedPaths(relatedPaths);
                  setIsHovering(true);
                }}
                onMouseLeave={() => {
                  if (!course) return;

                  setIsHovering(false);
                }}
                onClick={() => {
                  // Si no es electivo, no se hace nada
                  if (!course?.isElective) return null;

                  const eligibleCourses =
                    course && getEligibleCourses(areas, courses, course.id);

                  console.log("ELECTIVE COURSES", eligibleCourses);
                }}
              >
                <CardContent className="flex h-full items-center justify-center p-2">
                  <span className="text-center text-xs font-medium">
                    {course?.name ?? `Slot ${sIndex + 1}`}
                  </span>
                </CardContent>
              </Card>
            );
          })}
          <svg className="absolute -z-50 size-full">
            {isHovering &&
              relatedPaths.map((related) => {
                return related.paths.map((path, pIndex) => (
                  <Path key={pIndex} path={path} color={related.color} />
                ));
              })}
          </svg>
        </div>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

// COURSE FUNCTIONS
function getCourse({
  id,
  courses,
}: {
  id: number;
  courses: Map<number, CurriculumData["courses"][0]>;
}) {
  const course = courses.get(id);
  if (!course) return null;

  const subsequentIds =
    (course &&
      Array.from(courses.values())
        .filter((c) => c.prerequisiteIds.includes(course.id))
        .map((c) => c.id)) ??
    [];

  return { ...course, subsequentIds: subsequentIds };
}
function getPosition(
  periods: PeriodKey[],
  slot: CurriculumData["curriculum"]["slots"][0],
) {
  const x = periods.findIndex((pKey) => pKey === `${slot.year}-${slot.term}`); // Start from 0
  const y = slot.position; // Start from 1

  return { x: x + 1, y: y };
}
function getCoordinates(
  position: Coordinate,
  gridConfig: {
    cellWidth: number;
    cellHeight: number;
    gap: number;
    padding: number;
  },
) {
  const { cellWidth, cellHeight, gap, padding } = gridConfig;
  const { x, y } = position;

  const calculatePosition = (pos: number, size: number) =>
    (pos - 1) * (size + gap) + size / 2 + padding;

  // 1 rem = 16px
  return {
    x: 16 * calculatePosition(x, cellWidth),
    y: 16 * calculatePosition(y, cellHeight),
  };
}
function findArea(
  areas: CurriculumData["areas"],
  course: CurriculumData["courses"][0],
) {
  const { id, isElective } = course;

  if (isElective) {
    // Qué pasa en el caso de que el electivo pertenezca a un main area indicando que todos los cursos de esa main area son opciones para este electivo?
    const electiveAreas = areas.filter((area) => area.courseIds.includes(id));

    const mainArea = areas.find((area) =>
      electiveAreas.every((eArea) => area.subareaIds.includes(eArea.id)),
    );

    if (!mainArea && electiveAreas.length === 1) return electiveAreas[0];

    return mainArea;
  }

  return areas.find((area) => area.courseIds.includes(id));
}
function getEligibleCourses(
  areas: CurriculumData["areas"],
  courses: Map<number, CurriculumData["courses"][0]>,
  electiveId: number,
) {
  const electiveAreas = areas.filter((area) =>
    area.courseIds.includes(electiveId),
  );

  // Debería excluirse el mismo?
  return electiveAreas
    .flatMap((area) => area.courseIds.map((id) => courses.get(id)))
    .filter((course) => course !== undefined && !course.isElective);
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
  const midX = ((GRID_CELL_WIDTH + GRID_GAP) * 16) / 2;
  const midY = (((GRID_CELL_HEIGHT + GRID_GAP) * 16) / 2) * directionY;

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

  const gridConfig = {
    cellWidth: GRID_CELL_WIDTH,
    cellHeight: GRID_CELL_HEIGHT,
    gap: GRID_GAP,
    padding: PADDING,
  };

  const originCoordinates = getCoordinates(
    getPosition(periods, originSlot),
    gridConfig,
  );

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
      const relatedCoordinates = getCoordinates(relatedPosition, gridConfig);

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
      const relatedCoordinates = getCoordinates(relatedPosition, gridConfig);

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

function arabicToRoman(num: number): string {
  if (num < 1 || num > 100) {
    throw new Error("El número debe estar entre 1 y 100.");
  }

  const romanNumerals: { value: number; numeral: string }[] = [
    { value: 100, numeral: "C" },
    { value: 90, numeral: "XC" },
    { value: 50, numeral: "L" },
    { value: 40, numeral: "XL" },
    { value: 10, numeral: "X" },
    { value: 9, numeral: "IX" },
    { value: 5, numeral: "V" },
    { value: 4, numeral: "IV" },
    { value: 1, numeral: "I" },
  ];

  let result = "";

  for (const { value, numeral } of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }

  return result;
}
