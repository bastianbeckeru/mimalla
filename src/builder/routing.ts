import {
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
} from "@/utils/curriculum-grid";

// Routes connections between cards along the gaps of the grid, in rem.
//
// The grid is walked as a navigation grid twice as fine plus one, where even
// rows and columns are gaps and odd ones are cells:
//
//     0   1   2   3   4
//   0 +   -   +   -   +
//   1 |   ■   |   ■   |
//   2 +   -   +   -   +
//
// Cards block the nodes they cover, so routes go around them.

export type Box = {
  column: number;
  row: number;
  duration: number;
  height: number;
};

export type Route = { id: string; from: Box; to: Box };

export type GridSize = { rows: number; columns: number };

type Node = { row: number; col: number };
type Point = { x: number; y: number };
type Side = "left" | "right";

const STEP_X = (GRID_CELL_WIDTH + GRID_GAP) / 2;
const STEP_Y = (GRID_CELL_HEIGHT + GRID_GAP) / 2;
const TURN_COST = GRID_CELL_HEIGHT;
// Crossing an empty cell instead of a gap costs this much more.
const CELL_COST = GRID_GAP * 3;
const LANE_SPACING = 0.15;
const MAX_LANE_OFFSET = GRID_GAP / 2 - 0.05;
const CORNER_RADIUS = 0.375;

// Right, down, left, up.
const DIRECTIONS: Node[] = [
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: -1, col: 0 },
];
const RIGHT = 0;
const LEFT = 2;

export function getCanvasSize({ rows, columns }: GridSize) {
  return {
    width: columns * (GRID_CELL_WIDTH + GRID_GAP) + GRID_GAP,
    height: rows * (GRID_CELL_HEIGHT + GRID_GAP) + GRID_GAP,
  };
}

// The SVG path of each route that could be drawn, by route id. `boxes` are
// every card of the grid, which routes go around.
export function routeConnections(
  routes: Route[],
  boxes: Box[],
  size: GridSize,
): Map<string, string> {
  const navigation = createNavigation(boxes, size);
  const routed = routes.flatMap((route) => {
    const nodes = findRoute(navigation, route);
    return nodes ? [{ route, nodes }] : [];
  });

  const lanes = new Map<string, string[]>();
  for (const { route, nodes } of routed)
    for (const key of getEdgeKeys(nodes))
      lanes.set(key, [...(lanes.get(key) ?? []), route.id]);

  return new Map(
    routed.map(({ route, nodes }) => [
      route.id,
      toPathData(getPoints(route, nodes, lanes)),
    ]),
  );
}

function getSides(from: Box, to: Box): [Side, Side] {
  if (from.column + from.duration <= to.column) return ["right", "left"];
  if (to.column + to.duration <= from.column) return ["left", "right"];
  return ["right", "right"];
}

function getSpan(box: Box) {
  return {
    colStart: (box.column - 1) * 2 + 1,
    colEnd: (box.column + box.duration - 2) * 2 + 1,
    rowStart: (box.row - 1) * 2 + 1,
    rowEnd: (box.row + box.height - 2) * 2 + 1,
    centerRow: (box.row - 1) * 2 + box.height,
  };
}

// The gap node right beside a side of the box, level with its center.
function getDoor(box: Box, side: Side): Node {
  const { colStart, colEnd, centerRow } = getSpan(box);
  return { row: centerRow, col: side === "left" ? colStart - 1 : colEnd + 1 };
}

// Where a route touches the side of the box.
function getEdgePoint(box: Box, side: Side): Point {
  const { colStart, colEnd, centerRow } = getSpan(box);
  const center = toPoint({
    row: centerRow,
    col: side === "left" ? colStart : colEnd,
  });
  const halfWidth = GRID_CELL_WIDTH / 2;
  return {
    x: side === "left" ? center.x - halfWidth : center.x + halfWidth,
    y: center.y,
  };
}

function toPoint({ row, col }: Node): Point {
  return { x: col * STEP_X + GRID_GAP / 2, y: row * STEP_Y + GRID_GAP / 2 };
}

type Navigation = {
  rows: number;
  cols: number;
  blocked: Uint8Array;
};

function createNavigation(boxes: Box[], size: GridSize): Navigation {
  const rows = size.rows * 2 + 1;
  const cols = size.columns * 2 + 1;
  const blocked = new Uint8Array(rows * cols);
  for (const box of boxes) {
    const { colStart, colEnd, rowStart, rowEnd } = getSpan(box);
    for (let row = rowStart; row <= Math.min(rowEnd, rows - 1); row++)
      for (let col = colStart; col <= Math.min(colEnd, cols - 1); col++)
        blocked[row * cols + col] = 1;
  }
  return { rows, cols, blocked };
}

// A* over (node, direction) so turns can cost extra, which keeps routes to
// as few bends as their length allows. Routes leave the origin and enter the
// destination horizontally, through their doors.
function findRoute(navigation: Navigation, route: Route): Node[] | null {
  const { rows, cols, blocked } = navigation;
  const [fromSide, toSide] = getSides(route.from, route.to);
  const start = getDoor(route.from, fromSide);
  const goal = getDoor(route.to, toSide);
  const startDirection = fromSide === "right" ? RIGHT : LEFT;
  const goalDirection = toSide === "left" ? RIGHT : LEFT;
  const isInside = ({ row, col }: Node) =>
    row >= 0 && row < rows && col >= 0 && col < cols;
  if (!isInside(start) || !isInside(goal)) return null;

  const costs = new Map<number, number>();
  const parents = new Map<number, number>();
  const heap = new MinHeap();
  const heuristic = (node: Node) =>
    Math.abs(node.col - goal.col) * STEP_X +
    Math.abs(node.row - goal.row) * STEP_Y;
  const toState = (node: Node, direction: number) =>
    (node.row * cols + node.col) * 4 + direction;
  const toNode = (state: number): Node => {
    const index = Math.floor(state / 4);
    return { row: Math.floor(index / cols), col: index % cols };
  };

  const first = toState(start, startDirection);
  costs.set(first, 0);
  heap.push(first, heuristic(start));
  let best = Number.POSITIVE_INFINITY;
  let bestState: number | null = null;

  for (let state = heap.pop(); state !== undefined; state = heap.pop()) {
    const cost = costs.get(state) ?? Number.POSITIVE_INFINITY;
    const node = toNode(state);
    if (cost + heuristic(node) >= best) break;
    const direction = state % 4;

    const isGoal = node.row === goal.row && node.col === goal.col;
    if (isGoal && (direction + 2) % 4 !== goalDirection) {
      const total = cost + (direction === goalDirection ? 0 : TURN_COST);
      if (total < best) {
        best = total;
        bestState = state;
      }
    }

    DIRECTIONS.forEach((step, next) => {
      if ((next + 2) % 4 === direction) return;
      const neighbor = { row: node.row + step.row, col: node.col + step.col };
      if (!isInside(neighbor) || blocked[neighbor.row * cols + neighbor.col])
        return;
      const isCell = neighbor.row % 2 === 1 && neighbor.col % 2 === 1;
      const nextCost =
        cost +
        (next % 2 === 0 ? STEP_X : STEP_Y) +
        (next === direction ? 0 : TURN_COST) +
        (isCell ? CELL_COST : 0);
      const nextState = toState(neighbor, next);
      if (nextCost >= (costs.get(nextState) ?? Number.POSITIVE_INFINITY))
        return;
      costs.set(nextState, nextCost);
      parents.set(nextState, state);
      heap.push(nextState, nextCost + heuristic(neighbor));
    });
  }

  if (bestState === null) return null;
  const nodes: Node[] = [];
  for (
    let state: number | undefined = bestState;
    state !== undefined;
    state = parents.get(state)
  )
    nodes.unshift(toNode(state));
  return nodes;
}

function getEdgeKey(a: Node, b: Node) {
  const [first, second] =
    a.row < b.row || (a.row === b.row && a.col < b.col) ? [a, b] : [b, a];
  return `${first.row},${first.col}/${second.row},${second.col}`;
}

function getEdgeKeys(nodes: Node[]) {
  return nodes.slice(1).map((node, i) => getEdgeKey(nodes[i] ?? node, node));
}

type Run = { isHorizontal: boolean; nodes: Node[]; offset: number };

// The corners of the route, with each straight run moved aside when it shares
// its gap with other routes, so they read as separate lines.
function getPoints(
  route: Route,
  nodes: Node[],
  lanes: Map<string, string[]>,
): Point[] {
  const [fromSide, toSide] = getSides(route.from, route.to);
  const [door, ...rest] = nodes;
  if (!door) return [];
  // The first run leaves the origin horizontally, through its door.
  const runs: Run[] = [{ isHorizontal: true, nodes: [door], offset: 0 }];
  let previousNode = door;
  for (const node of rest) {
    const isHorizontal = node.row === previousNode.row;
    const run = runs.at(-1);
    if (run && run.isHorizontal === isHorizontal) run.nodes.push(node);
    else runs.push({ isHorizontal, nodes: [previousNode, node], offset: 0 });
    previousNode = node;
  }

  for (const run of runs) {
    let shared: string[] = [];
    for (const key of getEdgeKeys(run.nodes)) {
      const ids = lanes.get(key) ?? [];
      if (ids.length > shared.length) shared = ids;
    }
    const lane = shared.indexOf(route.id) - (shared.length - 1) / 2;
    run.offset =
      shared.length > 1
        ? Math.max(
            -MAX_LANE_OFFSET,
            Math.min(MAX_LANE_OFFSET, lane * LANE_SPACING),
          )
        : 0;
  }

  // Runs alternate between horizontal and vertical, so each corner sits where
  // a run meets the next one.
  const lineOf = (run: Run) => {
    const point = toPoint(run.nodes[0] ?? door);
    return run.isHorizontal ? point.y + run.offset : point.x + run.offset;
  };
  const start = getEdgePoint(route.from, fromSide);
  const end = getEdgePoint(route.to, toSide);
  const points: Point[] = [];
  runs.forEach((run, i) => {
    const previous = runs[i - 1];
    if (!previous) points.push({ x: start.x, y: lineOf(run) });
    else if (previous.isHorizontal)
      points.push({ x: lineOf(run), y: lineOf(previous) });
    else points.push({ x: lineOf(previous), y: lineOf(run) });
  });
  const last = runs.at(-1);
  if (!last || last.isHorizontal)
    points.push({ x: end.x, y: last ? lineOf(last) : end.y });
  else points.push({ x: lineOf(last), y: end.y }, end);
  return points;
}

function format(value: number) {
  return Number(value.toFixed(3));
}

function moveToward(from: Point, to: Point, distance: number): Point {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (length === 0) return from;
  return {
    x: from.x + ((to.x - from.x) / length) * distance,
    y: from.y + ((to.y - from.y) / length) * distance,
  };
}

// Draws the points as straight lines with rounded corners.
function toPathData(points: Point[]) {
  const commands = points.map((corner, i) => {
    const previous = points[i - 1];
    const next = points[i + 1];
    if (!previous) return `M ${format(corner.x)} ${format(corner.y)}`;
    if (!next) return `L ${format(corner.x)} ${format(corner.y)}`;
    const radius = Math.min(
      CORNER_RADIUS,
      Math.hypot(corner.x - previous.x, corner.y - previous.y) / 2,
      Math.hypot(next.x - corner.x, next.y - corner.y) / 2,
    );
    const before = moveToward(corner, previous, radius);
    const after = moveToward(corner, next, radius);
    return `L ${format(before.x)} ${format(before.y)} Q ${format(corner.x)} ${format(corner.y)} ${format(after.x)} ${format(after.y)}`;
  });
  return commands.join(" ");
}

type HeapItem = { value: number; priority: number };

class MinHeap {
  private items: HeapItem[] = [];

  push(value: number, priority: number) {
    this.items.push({ value, priority });
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.swapIfSmaller(i, parent)) break;
      i = parent;
    }
  }

  pop(): number | undefined {
    const top = this.items[0];
    const last = this.items.pop();
    if (!top || !last) return undefined;
    if (this.items.length === 0) return top.value;
    this.items[0] = last;
    let i = 0;
    for (;;) {
      const left = i * 2 + 1;
      const smallest = [left, left + 1].reduce(
        (smallest, child) =>
          this.priorityAt(child) < this.priorityAt(smallest) ? child : smallest,
        i,
      );
      if (smallest === i) break;
      this.swapIfSmaller(smallest, i);
      i = smallest;
    }
    return top.value;
  }

  private priorityAt(i: number) {
    return this.items[i]?.priority ?? Number.POSITIVE_INFINITY;
  }

  // Swaps the items at `i` and `j` when the one at `i` comes first.
  private swapIfSmaller(i: number, j: number) {
    const [a, b] = [this.items[i], this.items[j]];
    if (!a || !b || a.priority >= b.priority) return false;
    [this.items[i], this.items[j]] = [b, a];
    return true;
  }
}
