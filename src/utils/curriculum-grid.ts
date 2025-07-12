import { CurriculumData, PeriodKey } from "@/types/curriculum";

export const GRID_CELL_WIDTH = 8;
export const GRID_CELL_HEIGHT = 4;
export const GRID_GAP = 0.5;
export const PADDING = 0.5;
export const FONTSIZE = 16; // px

// COURSE FUNCTIONS
export function getPosition(
  periods: PeriodKey[],
  slot: CurriculumData["curriculum"]["structure"][0],
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

export function getStepPathPoints({
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

export function generatePathData(points: Coordinate[]) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
}

export function getRelatedPaths({
  originSlot,
  slots,
  periods,
  course,
}: {
  originSlot: CurriculumData["curriculum"]["structure"][0];
  slots: CurriculumData["curriculum"]["structure"];
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
    { paths: prerequisitePaths, color: "#f87171" }, // Tailwind Red 400
    { paths: subsequentPaths, color: "#4ADE80" }, // Tailwind Green 400
  ];
}
