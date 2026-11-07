import {
  type DragEndEvent,
  type DragMoveEvent,
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
} from "@dnd-kit/dom";
import { useEffect, useRef, useState } from "react";
import {
  flattenScheme,
  getDropProjection,
  type SchemePlacement,
  type SchemeRow,
} from "@/utils/grading-scheme";

export const INDENT_PX = 20;
const DRAG_ACTIVATION_DISTANCE = 4;
const ROW_HEIGHT_PX = 36;

export const sensors = [
  PointerSensor.configure({
    activationConstraints: [
      new PointerActivationConstraints.Distance({
        value: DRAG_ACTIVATION_DISTANCE,
      }),
    ],
  }),
  KeyboardSensor.configure({ offset: { x: INDENT_PX, y: ROW_HEIGHT_PX } }),
];

type Indicator = { top: number; depth: number };
type Drop = SchemePlacement & { activeId: string; indicator: Indicator };

function isSameDrop(a: Drop | null, b: Drop | null) {
  return (
    a?.activeId === b?.activeId &&
    a?.parentId === b?.parentId &&
    a?.index === b?.index &&
    a?.indicator.top === b?.indicator.top &&
    a?.indicator.depth === b?.indicator.depth
  );
}

export function useSchemeDrag({
  rows,
  visibleRows,
  onDrop,
}: {
  rows: SchemeRow[];
  visibleRows: SchemeRow[];
  onDrop: (drop: Drop) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLElement>());
  const refocusIdRef = useRef<string | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);

  // Moving a row in the DOM blurs its handle, and a keyboard drag has to be able
  // to go on from there.
  useEffect(() => {
    const id = refocusIdRef.current;
    if (id === null) return;
    refocusIdRef.current = null;
    rowRefs.current.get(id)?.querySelector("button")?.focus();
  });

  function getProjection(operation: DragMoveEvent["operation"]): Drop | null {
    const activeId = operation.source?.id;
    const list = listRef.current?.getBoundingClientRect();
    if (typeof activeId !== "string" || !list) return null;
    const lifted = new Set(
      flattenScheme(
        rows.flatMap((row) =>
          row.assessment.id === activeId ? [row.assessment] : [],
        ),
      ).map(({ assessment }) => assessment.id),
    );
    const rest = rows.filter((row) => !lifted.has(row.assessment.id));
    const visibleRest = visibleRows.filter(
      (row) => !lifted.has(row.assessment.id),
    );
    const rects = visibleRest.map((row) =>
      rowRefs.current.get(row.assessment.id)?.getBoundingClientRect(),
    );
    // A key press lands exactly on a row's middle. Moving down, that row counts
    // as passed, so every press moves one row in either direction.
    const y =
      operation.position.current.y + (operation.transform.y > 0 ? 1 : 0);
    const gapIndex = rects.filter(
      (rect) => rect && rect.top + rect.height / 2 < y,
    ).length;
    const nextRow = visibleRest[gapIndex];
    const projection = getDropProjection(
      rows,
      activeId,
      nextRow ? rest.indexOf(nextRow) : rest.length,
      Math.round(operation.transform.x / INDENT_PX),
    );
    if (!projection) return null;
    const below = rects[gapIndex];
    const above = rects[gapIndex - 1];
    // Past the last row of a group, the group's add button sits between them.
    const top =
      above && projection.depth > (nextRow?.depth ?? 0)
        ? above.bottom - list.top
        : below
          ? below.top - list.top
          : list.height;
    return {
      activeId,
      parentId: projection.parentId,
      index: projection.index,
      indicator: { top, depth: projection.depth },
    };
  }

  function setRowElement(id: string, element: HTMLElement | null) {
    if (element) rowRefs.current.set(id, element);
    else rowRefs.current.delete(id);
  }

  function handleDragMove({ operation }: DragMoveEvent) {
    const next = getProjection(operation);
    if (!isSameDrop(drop, next)) setDrop(next);
  }

  function handleDragEnd({ operation, canceled }: DragEndEvent) {
    const projection = getProjection(operation);
    setDrop(null);
    if (operation.activatorEvent instanceof KeyboardEvent)
      refocusIdRef.current = String(operation.source?.id);
    if (canceled || !projection) return;
    onDrop(projection);
  }

  return { listRef, drop, setRowElement, handleDragMove, handleDragEnd };
}
