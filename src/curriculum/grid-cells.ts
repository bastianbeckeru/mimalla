export const GRID_CELL_WIDTH = 8;
export const GRID_CELL_HEIGHT = 4;
export const GRID_GAP = 0.5;

export const HEADER_ROWS = 1;
const MIN_ROWS = 6;
const SPARE_ROWS = 1;

export type GridCell = { column: number; row: number };

type GridCard = GridCell & { duration: number; height: number };

type Rect = { left: number; top: number; width: number; height: number };

// Enough rows for every card plus a spare one to drop or add below them.
export function getRowCount(cards: GridCard[]) {
  return (
    Math.max(MIN_ROWS, ...cards.map((card) => card.row + card.height - 1)) +
    SPARE_ROWS
  );
}

export function getEmptyCells(
  cards: GridCard[],
  { rows, columns }: { rows: number; columns: number },
): GridCell[] {
  const occupied = new Set(
    cards.flatMap((card) =>
      Array.from({ length: card.height }, (_, rowOffset) =>
        Array.from(
          { length: card.duration },
          (_, columnOffset) =>
            `${card.column + columnOffset}/${card.row + rowOffset}`,
        ),
      ).flat(),
    ),
  );
  return Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: columns }, (_, columnIndex) => ({
      column: columnIndex + 1,
      row: rowIndex + 1,
    })),
  )
    .flat()
    .filter(({ column, row }) => !occupied.has(`${column}/${row}`));
}

// The cell nearest to a card's top left corner, keeping a card that spans
// `duration` columns within the grid's `columns`.
export function getCellAt(
  { left, top }: { left: number; top: number },
  {
    firstCell,
    gap,
    columns,
    duration,
  }: {
    firstCell: Rect;
    gap: number;
    columns: number;
    duration: number;
  },
): GridCell {
  const column = Math.round((left - firstCell.left) / (firstCell.width + gap));
  const row = Math.round((top - firstCell.top) / (firstCell.height + gap));
  return {
    column: Math.min(Math.max(column, 0), columns - duration) + 1,
    row: Math.max(row, 0) + 1,
  };
}
