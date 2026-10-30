"use client";

import {
  type DragMoveEvent,
  Feedback,
  PointerActivationConstraints,
  PointerSensor,
} from "@dnd-kit/dom";
import { DragDropProvider, useDraggable } from "@dnd-kit/react";
import { cn } from "cn";
import {
  ArrowDown,
  ArrowUp,
  Ellipsis,
  FolderPlus,
  GripVertical,
  IndentDecrease,
  IndentIncrease,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useRef, useState } from "react";
import CommitInput from "@/components/trajectory/commit-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Assessment, GradingScale } from "@/types/trajectory";
import {
  formatGrade,
  getAssessmentGrade,
  getWeights,
  isValidGrade,
  parseGrade,
} from "@/utils/grades";
import {
  canPlace,
  flattenScheme,
  getDropProjection,
  getSiblings,
  getWeightIssue,
  indentAssessment,
  insertAssessment,
  moveAssessment,
  moveAssessmentBy,
  outdentAssessment,
  removeAssessment,
  type SchemePlacement,
  type SchemeRow,
  updateAssessment,
} from "@/utils/grading-scheme";

const INDENT_PX = 20;
const DRAG_ACTIVATION_DISTANCE = 4;
const BATCH_SIZES = [2, 3, 4, 5, 6, 7, 8];
const DROPPED_COUNTS = [0, 1, 2, 3];

const sensors = [
  PointerSensor.configure({
    activationConstraints: [
      new PointerActivationConstraints.Distance({
        value: DRAG_ACTIVATION_DISTANCE,
      }),
    ],
  }),
];

type Indicator = { top: number; depth: number };

function createSingle(name = "Evaluación"): Assessment {
  return { kind: "SINGLE", id: nanoid(), name, weight: null, grade: null };
}

function createGroup(): Assessment {
  return {
    kind: "GROUP",
    id: nanoid(),
    name: "Grupo",
    weight: null,
    assessments: [],
    droppedCount: 0,
  };
}

function formatWeight(weight: number) {
  return `${Math.round(weight * 10) / 10}`.replace(".", ",");
}

export default function GradingSchemeEditor({
  assessments,
  scale,
  onChange,
}: {
  assessments: Assessment[];
  scale: GradingScale;
  onChange: (assessments: Assessment[]) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLElement>());
  const [focusId, setFocusId] = useState<string | null>(null);
  const [drop, setDrop] = useState<
    (SchemePlacement & { activeId: string; indicator: Indicator }) | null
  >(null);
  const rows = flattenScheme(assessments);
  const rootIssue = getWeightIssue(assessments);

  function add(assessment: Assessment, parentId: string | null) {
    const index = getSiblings(assessments, parentId).length;
    onChange(insertAssessment(assessments, assessment, { parentId, index }));
    setFocusId(assessment.id);
  }

  function apply(next: Assessment[] | null) {
    if (next) onChange(next);
  }

  function getProjection(operation: DragMoveEvent["operation"]) {
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
    const rects = rest.map((row) =>
      rowRefs.current.get(row.assessment.id)?.getBoundingClientRect(),
    );
    const y = operation.position.current.y;
    const gapIndex = rects.filter(
      (rect) => rect && rect.top + rect.height / 2 < y,
    ).length;
    const projection = getDropProjection(
      rows,
      activeId,
      gapIndex,
      Math.round(operation.transform.x / INDENT_PX),
    );
    if (!projection) return null;
    const below = rects[gapIndex];
    const above = rects[gapIndex - 1];
    const top = below
      ? below.top - list.top
      : above
        ? above.bottom - list.top
        : 0;
    return {
      activeId,
      parentId: projection.parentId,
      index: projection.index,
      indicator: { top, depth: projection.depth },
    };
  }

  return (
    <div className="space-y-2">
      <DragDropProvider
        sensors={sensors}
        plugins={(defaults) => [
          ...defaults,
          Feedback.configure({ dropAnimation: null }),
        ]}
        onDragMove={({ operation }) => setDrop(getProjection(operation))}
        onDragEnd={({ operation, canceled }) => {
          const projection = getProjection(operation);
          setDrop(null);
          if (canceled || !projection) return;
          apply(
            moveAssessment(assessments, projection.activeId, {
              parentId: projection.parentId,
              index: projection.index,
            }),
          );
        }}
      >
        <div ref={listRef} className="relative">
          {rows.map((row) => (
            <AssessmentRow
              key={row.assessment.id}
              row={row}
              assessments={assessments}
              scale={scale}
              isLifted={drop?.activeId === row.assessment.id}
              autoFocus={focusId === row.assessment.id}
              rowRef={(element) => {
                if (element) rowRefs.current.set(row.assessment.id, element);
                else rowRefs.current.delete(row.assessment.id);
              }}
              onUpdate={(update) =>
                onChange(
                  updateAssessment(assessments, row.assessment.id, update),
                )
              }
              onAdd={(assessment) => add(assessment, row.assessment.id)}
              onAddBatch={(count) => {
                const prefix =
                  row.assessment.name.trim().charAt(0).toUpperCase() || "E";
                const start =
                  getSiblings(assessments, row.assessment.id).length + 1;
                const batch = Array.from({ length: count }, (_, offset) =>
                  createSingle(`${prefix}${start + offset}`),
                );
                onChange(
                  batch.reduce(
                    (scheme, assessment) =>
                      insertAssessment(scheme, assessment, {
                        parentId: row.assessment.id,
                        index: getSiblings(scheme, row.assessment.id).length,
                      }),
                    assessments,
                  ),
                );
              }}
              onMove={apply}
              onRemove={() =>
                onChange(removeAssessment(assessments, row.assessment.id))
              }
            />
          ))}
          {drop && (
            <div
              aria-hidden
              className="pointer-events-none absolute right-0 h-0.5 rounded-full bg-primary"
              style={{
                top: drop.indicator.top - 1,
                left: drop.indicator.depth * INDENT_PX + 4,
              }}
            />
          )}
        </div>
      </DragDropProvider>
      {rows.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Agrega las evaluaciones del curso con su peso para calcular tu nota
          final.
        </p>
      )}
      {rootIssue !== null && <WeightIssue sum={rootIssue} />}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => add(createSingle(), null)}
        >
          <Plus />
          Evaluación
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => add(createGroup(), null)}
        >
          <FolderPlus />
          Grupo
        </Button>
      </div>
    </div>
  );
}

function AssessmentRow({
  row,
  assessments,
  scale,
  isLifted,
  autoFocus,
  rowRef,
  onUpdate,
  onAdd,
  onAddBatch,
  onMove,
  onRemove,
}: {
  row: SchemeRow;
  assessments: Assessment[];
  scale: GradingScale;
  isLifted: boolean;
  autoFocus: boolean;
  rowRef: (element: HTMLElement | null) => void;
  onUpdate: (update: (assessment: Assessment) => Assessment) => void;
  onAdd: (assessment: Assessment) => void;
  onAddBatch: (count: number) => void;
  onMove: (assessments: Assessment[] | null) => void;
  onRemove: () => void;
}) {
  const { assessment, depth, parentId } = row;
  const handleRef = useRef<HTMLButtonElement>(null);
  const { ref } = useDraggable({ id: assessment.id, handle: handleRef });
  const siblings = getSiblings(assessments, parentId);
  const sharedWeight = getWeights(siblings)[siblings.indexOf(assessment)] ?? 0;
  const grade = getAssessmentGrade(assessment, scale);
  const childIssue =
    assessment.kind === "GROUP" ? getWeightIssue(assessment.assessments) : null;
  const index = siblings.indexOf(assessment);
  const canAddSingle =
    assessment.kind === "GROUP" &&
    canPlace(assessments, createSingle(), assessment.id);
  const canAddGroup =
    assessment.kind === "GROUP" &&
    canPlace(assessments, createGroup(), assessment.id);

  return (
    <div
      ref={(element) => {
        ref(element);
        rowRef(element);
      }}
      className={cn(
        "flex items-center gap-1 rounded-md bg-background py-0.5 pr-0.5",
        isLifted && "opacity-60 shadow-md",
      )}
      style={{ paddingLeft: depth * INDENT_PX }}
    >
      <button
        ref={handleRef}
        type="button"
        aria-label={`Mover ${assessment.name}`}
        className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <CommitInput
        aria-label="Nombre"
        autoFocus={autoFocus}
        value={assessment.name}
        className={cn(
          "h-8 min-w-0 flex-1 border-transparent bg-transparent px-1.5 shadow-none hover:border-input dark:bg-transparent",
          assessment.kind === "GROUP" && "font-medium",
        )}
        onFocus={(event) => {
          if (autoFocus) event.currentTarget.select();
        }}
        onCommit={(name) =>
          onUpdate((current) => ({
            ...current,
            name: name.trim() || current.name,
          }))
        }
      />
      {childIssue !== null && <WeightIssue sum={childIssue} isCompact />}
      <div className="relative w-16 shrink-0">
        <CommitInput
          aria-label={`Peso de ${assessment.name}`}
          inputMode="decimal"
          value={
            assessment.weight === null ? "" : formatWeight(assessment.weight)
          }
          placeholder={formatWeight(sharedWeight)}
          className="h-8 pr-5 text-right tabular-nums"
          onCommit={(text) => {
            const weight = parseGrade(text);
            if (Number.isNaN(weight) || (weight !== null && weight < 0)) return;
            onUpdate((current) => ({ ...current, weight }));
          }}
        />
        <span className="pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground text-xs">
          %
        </span>
      </div>
      {assessment.kind === "SINGLE" ? (
        <CommitInput
          aria-label={`Nota de ${assessment.name}`}
          aria-invalid={
            assessment.grade !== null && !isValidGrade(assessment.grade, scale)
          }
          inputMode="decimal"
          placeholder="—"
          value={assessment.grade === null ? "" : formatGrade(assessment.grade)}
          className="h-8 w-14 shrink-0 text-right tabular-nums"
          onCommit={(text) => {
            const grade = parseGrade(text);
            if (Number.isNaN(grade)) return;
            onUpdate((current) => ({ ...current, grade }));
          }}
        />
      ) : (
        <span
          className={cn(
            "w-14 shrink-0 px-2.5 text-right font-medium text-sm tabular-nums",
            grade?.isPartial && "text-muted-foreground italic",
          )}
          title={grade?.isPartial ? "Promedio parcial" : "Promedio del grupo"}
        >
          {grade ? formatGrade(Math.round(grade.grade * 100) / 100) : "—"}
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Opciones de ${assessment.name}`}
              className="shrink-0 text-muted-foreground"
            />
          }
        >
          <Ellipsis />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {assessment.kind === "GROUP" && (
            <>
              <DropdownMenuItem
                disabled={!canAddSingle}
                onClick={() => onAdd(createSingle())}
              >
                <Plus />
                Agregar evaluación
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={!canAddSingle}>
                  <Plus />
                  Agregar varias
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {BATCH_SIZES.map((count) => (
                    <DropdownMenuItem
                      key={count}
                      onClick={() => onAddBatch(count)}
                    >
                      {count} evaluaciones
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem
                disabled={!canAddGroup}
                onClick={() => onAdd(createGroup())}
              >
                <FolderPlus />
                Agregar grupo
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Descartar las peores notas
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={assessment.droppedCount}
                    onValueChange={(droppedCount: number) =>
                      onUpdate((current) =>
                        current.kind === "GROUP"
                          ? { ...current, droppedCount }
                          : current,
                      )
                    }
                  >
                    {DROPPED_COUNTS.map((count) => (
                      <DropdownMenuRadioItem key={count} value={count}>
                        {count === 0
                          ? "Ninguna"
                          : count === 1
                            ? "La peor"
                            : `Las ${count} peores`}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            disabled={index === 0}
            onClick={() =>
              onMove(moveAssessmentBy(assessments, assessment.id, -1))
            }
          >
            <ArrowUp />
            Subir
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={index === siblings.length - 1}
            onClick={() =>
              onMove(moveAssessmentBy(assessments, assessment.id, 1))
            }
          >
            <ArrowDown />
            Bajar
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={indentAssessment(assessments, assessment.id) === null}
            onClick={() => onMove(indentAssessment(assessments, assessment.id))}
          >
            <IndentIncrease />
            Meter en el grupo de arriba
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={parentId === null}
            onClick={() =>
              onMove(outdentAssessment(assessments, assessment.id))
            }
          >
            <IndentDecrease />
            Sacar del grupo
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onRemove}>
            <Trash2 />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function WeightIssue({ sum, isCompact }: { sum: number; isCompact?: boolean }) {
  const text = `Los pesos suman ${formatWeight(sum)}%.`;
  if (isCompact)
    return (
      <span title={text} className="shrink-0 text-warning">
        <TriangleAlert aria-label={text} className="size-4" />
      </span>
    );
  return (
    <p className="flex items-center gap-1.5 text-sm text-warning">
      <TriangleAlert className="size-4 shrink-0" />
      {text}
    </p>
  );
}
