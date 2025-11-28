import type { ExtendedSlot } from '@/types/curriculum';
import {
  FONTSIZE,
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
} from './curriculum-grid';

type Point = { row: number; col: number };
type Card = {
  id: string | number;
  x: number;
  y: number;
  h: number;
  w: number;
};
type GridCell = {
  row: number;
  col: number;
  isOccupied: boolean;
};
type NavigationGrid = GridCell[][];
type Node = Point & { g: number; h: number; f: number; parent?: Node };
type Path = {
  originCardId: string;
  destinationCardId: string;
  data: string;
};
export type Coordinates = { x: number; y: number };
export type Dimensions = { w: number; h: number };

const CELL_WIDTH_PX = GRID_CELL_WIDTH * FONTSIZE;
const CELL_HEIGHT_PX = GRID_CELL_HEIGHT * FONTSIZE;
const GAP_PX = GRID_GAP * FONTSIZE;

export function createConnectionPaths(
  rows: number,
  cols: number,
  cards: ExtendedSlot[]
): Path[] {
  const grid = createNavigationGrid(rows, cols, cards);
  const paths: Path[] = [];

  cards.forEach((card) => {
    if (!card.course) return;

    const { year, term, course } = card;
    const { prerequisiteIds } = course;

    prerequisiteIds.forEach((id) => {
      const relatedCard = cards.find(
        (slot) =>
          slot.courseId === id &&
          ((slot.year === year && slot.term < term) || slot.year < year)
      );

      if (!relatedCard) return;

      const start = getCardEdgePoint(relatedCard, 'right');
      const end = getCardEdgePoint(card, 'left');
      const path = findPath(grid, start, end);

      const fixedPath: Path = {
        originCardId: relatedCard.id.toString(),
        destinationCardId: card.id.toString(),
        data: pathToSVGPath(path),
      };

      paths.push(fixedPath);
    });
  });

  return paths;
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/* Crea un grid expandido donde se puede navegar por los gaps.
 *
 * Ejemplo para grid 2x2:
 *   0   1   2   3   4
 * 0 C - H - C - H - C
 * 1 V   •   V   •   V
 * 2 C - H - C - H - C
 * 3 V   •   V   •   V
 * 4 C - H - C - H - C
 *
 * C = corner gap
 * H = horizontal gap
 * V = vertical gap
 * • = card
 */
function createNavigationGrid(
  rows: number,
  cols: number,
  cards: Card[]
): NavigationGrid {
  const expandedRows = rows * 2 + 1;
  const expandedCols = cols * 2 + 1;

  const grid: NavigationGrid = Array.from({ length: expandedRows }, (_, row) =>
    Array.from({ length: expandedCols }, (_, col) => ({
      row,
      col,
      isOccupied: false,
    }))
  );

  // Marcar celdas ocupadas (bloquear todo el área de la card)
  cards.forEach((card) => {
    const { colStart, colEnd, rowStart, rowEnd } = getCardGridPositions(card);

    for (let r = rowStart; r <= rowEnd; r++) {
      for (let c = colStart; c <= colEnd; c++) {
        if (grid[r]![c]!) {
          grid[r]![c]!.isOccupied = true;
        }
      }
    }
  });

  return grid;
}

function getCardEdgePoint(
  card: Card,
  side: 'left' | 'right' | 'top' | 'bottom'
): Point {
  const { colStart, colEnd, rowStart, rowEnd } = getCardGridPositions(card);

  const centerCol = colStart + (colEnd - colStart) / 2;
  const centerRow = rowStart + (rowEnd - rowStart) / 2;

  switch (side) {
    case 'left':
      return { col: colStart, row: centerRow };
    case 'right':
      return { col: colEnd, row: centerRow };
    case 'top':
      return { col: centerCol, row: rowStart };
    case 'bottom':
      return { col: centerCol, row: rowEnd };
  }
}

// A* Pathfinding
function findPath(grid: NavigationGrid, start: Point, end: Point): Point[] {
  const openSet: Node[] = [
    {
      ...start,
      g: 0,
      h: manhattanDistance(start, end),
      f: manhattanDistance(start, end),
    },
  ];

  const closedSet = new Set<string>();

  const isSamePoint = (p1: Point, p2: Point): boolean => {
    return p1.col === p2.col && p1.row === p2.row;
  };

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    // ¿Llegamos al destino?
    if (current.row === end.row && current.col === end.col) {
      return reconstructPath(current);
    }

    closedSet.add(`${current.row},${current.col}`);

    const directions = [
      { row: 0, col: 1 }, // derecha (Prioridad)
      { row: -1, col: 0 }, // arriba
      { row: 1, col: 0 }, // abajo
      { row: 0, col: -1 }, // izquierda
    ];

    // Explorar vecinos
    for (const dir of directions) {
      const neighbor = {
        row: current.row + dir.row,
        col: current.col + dir.col,
      };

      const canNavigate =
        isSamePoint(start, neighbor) ||
        isSamePoint(end, neighbor) ||
        isNavigable(grid, neighbor);

      if (!canNavigate || closedSet.has(`${neighbor.row},${neighbor.col}`)) {
        continue;
      }

      let g = current.g + 1;

      // BONIFICACIÓN: reducir costo si cumple las preferencias
      if (isSamePoint(start, current) && dir.col === 1) g -= 0.1;
      if (isSamePoint(end, neighbor) && dir.col === 1) g -= 0.1;

      const h = manhattanDistance(neighbor, end);
      const f = g + h;

      const existingIndex = openSet.findIndex(
        (n) => n.row === neighbor.row && n.col === neighbor.col
      );

      if (existingIndex === -1) {
        // Agregar nuevo nodo
        openSet.push({ ...neighbor, g, h, f, parent: current });
      } else if (g < openSet[existingIndex]!.g) {
        // Actualizar nodo existente con mejor camino
        openSet[existingIndex] = { ...neighbor, g, h, f, parent: current };
      }
    }
  }

  //console.warn("No path found between", start, "and", end);
  return [];
}

function pathToSVGPath(path: Point[]): string {
  if (path.length === 0) return '';

  const pixels = path.map(gridToPixel);

  return pixels
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');
}

// ============================================
// AUXILIAR FUNCTIONS
// ============================================
function gridToPixel(point: Point): { x: number; y: number } {
  const phi = Math.trunc(point.col / 2);
  const alpha = Math.trunc(point.row / 2);

  const offsetX = point.col % 2 === 0 ? GAP_PX / 2 : CELL_WIDTH_PX / 2 + GAP_PX;
  const offsetY =
    point.row % 2 === 0 ? GAP_PX / 2 : CELL_HEIGHT_PX / 2 + GAP_PX;

  const x = offsetX + (CELL_WIDTH_PX + GAP_PX) * phi;
  const y = offsetY + (CELL_HEIGHT_PX + GAP_PX) * alpha;

  return { x, y };
}

function getCardGridPositions(card: Card) {
  const x0 = card.x - 1;
  const y0 = card.y - 1;

  return {
    colStart: x0 * 2 + 1,
    colEnd: (x0 + card.w - 1) * 2 + 1,
    rowStart: y0 * 2 + 1,
    rowEnd: (y0 + card.h - 1) * 2 + 1,
  };
}

function isNavigable(grid: NavigationGrid, point: Point): boolean {
  if (
    point.row < 0 ||
    point.row >= grid.length ||
    point.col < 0 ||
    point.col >= grid[0]!.length
  ) {
    return false;
  }

  return !grid[point.row]![point.col]!.isOccupied;
}

function manhattanDistance(a: Point, b: Point): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function reconstructPath(node: Node | undefined): Point[] {
  const path: Point[] = [];
  let current = node;

  while (current) {
    path.unshift({ row: current.row, col: current.col });
    current = current.parent;
  }

  return path;
}

function debugGrid(grid: NavigationGrid): string {
  return grid
    .map((row) =>
      row
        .map((cell) => {
          const isRowGap = cell.row % 2 === 1;
          const isColGap = cell.col % 2 === 1;

          let type;
          if (!isRowGap && !isColGap) type = 'corner';
          else if (!isRowGap && isColGap) type = 'horizontal';
          else if (isRowGap && !isColGap) type = 'vertical';
          else type = 'card';

          if (cell.isOccupied) return 'X';
          if (type === 'card') return '•';
          if (type === 'horizontal') return '─';
          if (type === 'vertical') return '│';
          return '┼';
        })
        .join('')
    )
    .join('\n');
}
