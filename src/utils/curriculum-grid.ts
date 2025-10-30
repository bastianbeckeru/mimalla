import { CurriculumData, ModifiedCourse, PeriodKey } from "@/types/curriculum";
import { getCourse, getCourseArea } from "./curriculum";

export const GRID_CELL_WIDTH = 8;
export const GRID_CELL_HEIGHT = 4;
export const GRID_GAP = 0.5;
export const GRID_MARGIN = 0.25;
export const PADDING = 0.5;
export const FONTSIZE = 16; // px

type Slot = CurriculumData["curriculum"]["structure"][0];
type Course = CurriculumData["courses"][0];
export type SlotExtended = Slot & {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  course: ModifiedCourse | null;
};

// COURSE FUNCTIONS
export function getPosition(periods: PeriodKey[], slot: Slot) {
  const x = periods.findIndex((pKey) => pKey === `${slot.year}-${slot.term}`); // Start from 0
  const y = slot.position; // Start from 1

  return { x: x + 1, y: y };
}

function getCellCenterCoordinates(
  position: Coordinate,
  dimensions: Dimensions = { w: 1, h: 1 },
) {
  const { x, y } = position;
  const { w, h } = dimensions;

  // Cell Center + Column or Row GAP Adjustment + Dimension GAP Adjustment + Padding Adjustment
  const calculatePosition = (pos: number, dim: number, size: number) =>
    (size * dim + GRID_GAP * (dim - 1)) * 0.5 +
    (pos - 1) * (size + GRID_GAP) +
    PADDING;

  return {
    x: FONTSIZE * calculatePosition(x, w, GRID_CELL_WIDTH),
    y: FONTSIZE * calculatePosition(y, h, GRID_CELL_HEIGHT),
  };
}

/* SVG */
export type Coordinate = { x: number; y: number };
export type Dimensions = { w: number; h: number };

const midY = (GRID_CELL_HEIGHT + GRID_GAP) * 0.5 * FONTSIZE;
const midX = (GRID_CELL_WIDTH + GRID_GAP) * 0.5 * FONTSIZE;

export function getStepPathPoints({
  source,
  target,
}: {
  source: Coordinate & Dimensions;
  target: Coordinate & Dimensions;
}): Coordinate[] {
  const directionY = Math.pow(-1, source.y >= target.y ? 1 : 2);

  // Case 1: Next column and same row
  const points = [
    { x: source.x, y: source.y }, // Move to source
    { x: target.x, y: target.y }, // Line to target
  ];

  // Case 2: Next column but different row
  if (source.y !== target.y && target.x - source.x === midX * 2) {
    const newPoints = [
      { x: source.x + source.w * midX, y: source.y },
      { x: source.x + source.w * midX, y: target.y },
    ];

    points.splice(1, 0, ...newPoints);
  }
  // Case 3: Different column and row
  else if (target.x - source.x > midX * 2) {
    const newPoints = [
      {
        x: source.x + source.w * midX,
        y: source.y,
      },
      {
        x: source.x + source.w * midX,
        y: source.y + midY * directionY,
      },
      {
        x: target.x - target.w * midX,
        y: source.y + midY * directionY,
      },
      {
        x: target.x - target.w * midX,
        y: target.y,
      },
    ];

    points.splice(1, 0, ...newPoints);
  }

  return points;
}

export function generatePathData(points: Coordinate[]) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
}

export function getRelatedPaths({
  originSlot,
  slots,
}: {
  originSlot: SlotExtended;
  slots: SlotExtended[];
}) {
  if (!originSlot.course) return [];

  const { year, term, course } = originSlot;
  const { prerequisiteIds, subsequentIds } = course;

  const originCoordinates = getCellCenterCoordinates(
    {
      x: originSlot.x,
      y: originSlot.y,
    },
    { w: originSlot.w, h: originSlot.h },
  );

  // Si A es requisito de B, entonces los path subsequent de A y los prerequisite de B son iguales, con distinto color y orientación.
  // Se puede evitar repetir los mismos paths. Por ahora, se deja así para simplificar.
  const prerequisitePaths = prerequisiteIds
    .map((id) => {
      // 1. Busca al slot relacionado
      const relatedSlot = slots.find(
        (slot) =>
          slot.courseId === id &&
          ((slot.year === year && slot.term < term) || slot.year < year),
      );

      if (!relatedSlot) return null;

      const relatedCoordinates = getCellCenterCoordinates(
        { x: relatedSlot.x, y: relatedSlot.y },
        { w: relatedSlot.w, h: relatedSlot.h },
      );

      // 2. Generar los puntos de la ruta
      const points = getStepPathPoints({
        source: { ...relatedCoordinates, w: relatedSlot.w, h: relatedSlot.h },
        target: { ...originCoordinates, w: originSlot.w, h: relatedSlot.h },
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

      const relatedCoordinates = getCellCenterCoordinates(
        { x: relatedSlot.x, y: relatedSlot.y },
        { w: relatedSlot.w, h: relatedSlot.h },
      );

      // 2. Generar los puntos de la ruta
      const points = getStepPathPoints({
        source: { ...originCoordinates, w: originSlot.w, h: relatedSlot.h },
        target: { ...relatedCoordinates, w: relatedSlot.w, h: relatedSlot.h },
      });

      // 3. Generar el path
      return generatePathData(points);
    })
    .filter((item) => item !== null);

  const relatedPaths = [
    ...prerequisitePaths.map((path, idx) => ({
      id: `prerequisite-${idx}`,
      path,
      color: "#f87171", // Tailwind Red 400
    })),
    ...subsequentPaths.map((path, idx) => ({
      id: `subsequent-${idx}`,
      path,
      color: "#34d399", // Tailwind Green 400
    })),
  ];

  return relatedPaths;
}

export function getCurriculumGridData(data: CurriculumData) {
  const { periods, nCols, nRows } = getPeriods({
    slots: data.curriculum.structure,
  });
  const creditsMode = getMostFrequentCredits(data.courses);

  const courses = new Map(data.courses.map((item) => [item.id, item]));

  const serializedSlots = data.curriculum.structure.map((slot) => {
    const position = getPosition(periods, slot);
    const course = getCourse({ id: slot.courseId, courses });
    const area = course ? getCourseArea(data.areas, course) : null;

    return {
      ...slot,
      x: position.x,
      y: position.y,
      w: course?.duration ?? 1,
      h:
        course && creditsMode > 0
          ? Math.round(course.credits / creditsMode)
          : 1,
      color: area?.color ?? "#fafafa",
      course: course ? { ...course, areaId: area?.id ?? null } : null,
    };
  });

  return {
    courses,
    periods,
    nCols,
    nRows,
    creditsMode,
    slots: serializedSlots,
  };
}

export function getMostFrequentCredits(courses: Course[]): number {
  if (courses.length === 0) return 0;

  const frequencyMap = new Map<number, number>();

  courses.forEach((course) => {
    const count = frequencyMap.get(course.credits) || 0;
    frequencyMap.set(course.credits, count + 1);
  });

  let maxFrequency = 0;
  let mode = 0;

  frequencyMap.forEach((frequency, credit) => {
    if (frequency > maxFrequency) {
      maxFrequency = frequency;
      mode = credit;
    }
  });

  return mode;
}

function getPeriods({ slots }: { slots: Slot[] }): {
  nCols: number;
  nRows: number;
  periods: PeriodKey[];
} {
  const uniquePeriods = new Set<PeriodKey>(
    slots.map((s) => `${s.year}-${s.term}` as PeriodKey),
  );

  const sortedPeriods = Array.from(uniquePeriods).sort((a, b) => {
    const [yearA, termA] = a.split("-").map(Number);
    const [yearB, termB] = b.split("-").map(Number);

    return yearA! - yearB! || termA! - termB!;
  });

  const nCols = sortedPeriods.length;
  const nRows = Math.max(1, ...slots.map((s) => s.position));

  return { periods: sortedPeriods, nCols, nRows };
}
