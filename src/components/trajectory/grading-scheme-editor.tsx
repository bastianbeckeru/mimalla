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
  ChevronRight,
  Copy,
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
  roundGrade,
} from "@/utils/grades";
import {
  canPlace,
  flattenScheme,
  getDropProjection,
  getSiblings,
  getVisibleRows,
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
const INDICATOR_LEFT_PX = 20;

const FIELD =
  "h-7 border-transparent bg-transparent shadow-none disabled:bg-transparent dark:bg-transparent dark:disabled:bg-transparent";
const NUMBER_FIELD =
  "tabular-nums group-hover/row:border-input pointer-coarse:border-input";
const REVEAL_ON_ROW =
  "pointer-fine:opacity-0 pointer-fine:focus-visible:opacity-100 pointer-fine:group-focus-within/row:opacity-100 pointer-fine:group-hover/row:opacity-100 pointer-fine:data-popup-open:opacity-100";

const ADD_BUTTON = "pointer-coarse:h-11";

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
  isReadOnly = false,
  copySource,
  onChange,
}: {
  assessments: Assessment[];
  scale: GradingScale;
  isReadOnly?: boolean;
  copySource?: { label: string; onCopy: () => void };
  onChange: (assessments: Assessment[]) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLElement>());
  const [focusId, setFocusId] = useState<string | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const rows = flattenScheme(assessments);
  // The single assessment the ongoing drag would turn into a group.
  const newGroupId =
    rows.find(
      ({ assessment }) =>
        assessment.id === drop?.parentId && assessment.kind === "SINGLE",
    )?.assessment.id ?? null;
  const visibleRows = getVisibleRows(rows, collapsedIds);
  const rootIssue = getWeightIssue(assessments);
  const hasInvalidGrade = rows.some(
    ({ assessment }) =>
      assessment.kind === "SINGLE" &&
      assessment.grade !== null &&
      !isValidGrade(assessment.grade, scale),
  );
  const hasEmptyGroup = rows.some(({ assessment }) =>
    flattenScheme([assessment]).every((row) => row.assessment.kind === "GROUP"),
  );

  function expand(id: string) {
    setCollapsedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  function add(assessment: Assessment, parentId: string | null) {
    if (parentId) expand(parentId);
    const index = getSiblings(assessments, parentId).length;
    onChange(insertAssessment(assessments, assessment, { parentId, index }));
    setFocusId(assessment.id);
  }

  function apply(next: Assessment[] | null) {
    if (next) onChange(next);
  }

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
    const y = operation.position.current.y;
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

  if (rows.length === 0 && isReadOnly)
    return (
      <p className="p-6 text-muted-foreground text-sm">
        Aún no hay evaluaciones.
      </p>
    );

  if (rows.length === 0)
    return (
      <div className="space-y-3 p-6">
        <div className="space-y-1 text-sm">
          <p className="font-medium">
            {copySource ? "Retomas este curso" : "Aún no hay evaluaciones"}
          </p>
          <p className="text-muted-foreground">
            {copySource
              ? `Usa el mismo esquema de ${copySource.label} o parte desde cero.`
              : "Agrégalas con su peso y calcularemos tu nota a medida que las completes."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {copySource && (
            <Button
              size="lg"
              className={ADD_BUTTON}
              onClick={copySource.onCopy}
            >
              <Copy />
              Copiar de {copySource.label}
            </Button>
          )}
          <Button
            variant={copySource ? "outline" : "default"}
            size="lg"
            className={ADD_BUTTON}
            onClick={() => add(createSingle(), null)}
          >
            <Plus />
            Evaluación
          </Button>
        </div>
      </div>
    );

  return (
    // Holding a drag handle must not select the text around it. Inputs opt back
    // in because Safari would otherwise not let them be edited.
    <div className="select-none py-3 pr-3 pl-1 [-webkit-touch-callout:none] [&_input]:select-text">
      <div className="flex h-6 items-center pr-1 text-muted-foreground text-xs">
        <span className="min-w-0 flex-1 pl-5">Evaluaciones</span>
        <span className="w-15 shrink-0 pr-2 text-right">Peso</span>
        <span className="w-13 shrink-0 pr-2 text-right">Nota</span>
        <span aria-hidden className="w-7 shrink-0" />
      </div>
      {rootIssue !== null && <WeightIssue sum={rootIssue} />}
      {hasInvalidGrade && (
        <p className="flex items-center gap-1.5 py-1 pl-5 text-destructive text-sm">
          <TriangleAlert className="size-3.5 shrink-0" />
          Las notas fuera de {formatGrade(scale.min)} a {formatGrade(scale.max)}{" "}
          no se cuentan.
        </p>
      )}
      <DragDropProvider
        sensors={sensors}
        plugins={(defaults) => [
          ...defaults,
          Feedback.configure({ dropAnimation: null }),
        ]}
        onDragMove={({ operation }) => {
          const next = getProjection(operation);
          if (!isSameDrop(drop, next)) setDrop(next);
        }}
        onDragEnd={({ operation, canceled }) => {
          const projection = getProjection(operation);
          setDrop(null);
          if (canceled || !projection) return;
          if (projection.parentId) expand(projection.parentId);
          apply(
            moveAssessment(assessments, projection.activeId, {
              parentId: projection.parentId,
              index: projection.index,
            }),
          );
        }}
      >
        <div ref={listRef} className="relative">
          {visibleRows.map((row) => (
            <AssessmentRow
              key={row.assessment.id}
              row={row}
              assessments={assessments}
              scale={scale}
              isLifted={drop?.activeId === row.assessment.id}
              isNewGroup={newGroupId === row.assessment.id}
              isCollapsed={collapsedIds.has(row.assessment.id)}
              isReadOnly={isReadOnly}
              autoFocus={focusId === row.assessment.id}
              onAutoFocused={() => setFocusId(null)}
              rowRef={(element) => {
                if (element) rowRefs.current.set(row.assessment.id, element);
                else rowRefs.current.delete(row.assessment.id);
              }}
              onToggleCollapsed={() =>
                setCollapsedIds((current) => {
                  const next = new Set(current);
                  if (!next.delete(row.assessment.id))
                    next.add(row.assessment.id);
                  return next;
                })
              }
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
                expand(row.assessment.id);
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
                left: drop.indicator.depth * INDENT_PX + INDICATOR_LEFT_PX,
              }}
            />
          )}
        </div>
      </DragDropProvider>
      {hasEmptyGroup && (
        <p className="py-1 pl-5 text-muted-foreground text-xs">
          Los grupos sin evaluaciones no cuentan para la nota.
        </p>
      )}
      {!isReadOnly && (
        <div className="pt-2 pl-5">
          <Button
            variant="outline"
            size="lg"
            className={cn(ADD_BUTTON, "w-full")}
            onClick={() => add(createSingle(), null)}
          >
            <Plus />
            Evaluación
          </Button>
        </div>
      )}
    </div>
  );
}

function AssessmentRow({
  row,
  assessments,
  scale,
  isLifted,
  isNewGroup,
  isCollapsed,
  isReadOnly,
  autoFocus,
  onAutoFocused,
  rowRef,
  onToggleCollapsed,
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
  isNewGroup: boolean;
  isCollapsed: boolean;
  isReadOnly: boolean;
  autoFocus: boolean;
  onAutoFocused: () => void;
  rowRef: (element: HTMLElement | null) => void;
  onToggleCollapsed: () => void;
  onUpdate: (update: (assessment: Assessment) => Assessment) => void;
  onAdd: (assessment: Assessment) => void;
  onAddBatch: (count: number) => void;
  onMove: (assessments: Assessment[] | null) => void;
  onRemove: () => void;
}) {
  const { assessment, depth, parentId } = row;
  const handleRef = useRef<HTMLButtonElement>(null);
  const { ref } = useDraggable({
    id: assessment.id,
    handle: handleRef,
    disabled: isReadOnly,
  });
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

  const droppedCount =
    assessment.kind === "GROUP" ? assessment.droppedCount : 0;
  const collapsedCount =
    assessment.kind === "GROUP" && isCollapsed
      ? assessment.assessments.length
      : null;
  const dropNote =
    droppedCount === 1
      ? "descarta la peor"
      : droppedCount > 1
        ? `descarta las ${droppedCount} peores`
        : null;

  return (
    <div
      ref={(element) => {
        ref(element);
        rowRef(element);
      }}
      className={cn(
        "group/row flex h-9 items-center rounded-md pr-1 transition-colors hover:bg-muted/50",
        isLifted && "bg-background opacity-60 shadow-md",
        isNewGroup && "bg-primary/10 hover:bg-primary/10",
      )}
    >
      {isReadOnly ? (
        <span aria-hidden className="w-5 shrink-0" />
      ) : (
        <button
          ref={handleRef}
          type="button"
          data-base-ui-swipe-ignore
          aria-label={`Mover ${assessment.name}`}
          className={cn(
            "flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-opacity active:cursor-grabbing",
            REVEAL_ON_ROW,
          )}
        >
          <GripVertical className="size-3.5" />
        </button>
      )}
      <div
        className="flex min-w-0 flex-1 items-center gap-1"
        style={{ paddingLeft: depth * INDENT_PX }}
      >
        {assessment.kind === "GROUP" ? (
          <button
            type="button"
            aria-expanded={!isCollapsed}
            aria-label={`${isCollapsed ? "Expandir" : "Colapsar"} ${assessment.name}`}
            className="flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
            onClick={onToggleCollapsed}
          >
            <ChevronRight
              className={cn(
                "size-3.5 transition-transform duration-150 ease-out motion-reduce:transition-none",
                !isCollapsed && "rotate-90",
              )}
            />
          </button>
        ) : (
          <span aria-hidden className="size-5 shrink-0" />
        )}
        <CommitInput
          aria-label="Nombre"
          autoFocus={autoFocus}
          disabled={isReadOnly}
          title={assessment.name}
          value={assessment.name}
          className={cn(
            FIELD,
            "truncate px-1 group-hover/row:border-input",
            collapsedCount !== null
              ? "field-sizing-content w-auto min-w-8 max-w-full"
              : dropNote
                ? "sm:field-sizing-content min-w-0 flex-1 sm:w-auto sm:min-w-8 sm:max-w-full sm:flex-none"
                : "min-w-0 flex-1",
            assessment.kind === "GROUP" && "font-medium",
          )}
          onFocus={(event) => {
            if (!autoFocus) return;
            event.currentTarget.select();
            onAutoFocused();
          }}
          onCommit={(name) =>
            onUpdate((current) => ({
              ...current,
              name: name.trim() || current.name,
            }))
          }
        />
        {collapsedCount !== null && (
          <span className="shrink-0 text-muted-foreground text-xs">
            {collapsedCount}
          </span>
        )}
        {dropNote && (
          <span className="hidden shrink-0 text-muted-foreground text-xs sm:inline">
            {collapsedCount !== null && "· "}
            {dropNote}
          </span>
        )}
        {childIssue !== null && <WeightIssue sum={childIssue} isCompact />}
      </div>
      <div className="relative w-15 shrink-0">
        <CommitInput
          aria-label={`Peso de ${assessment.name}`}
          disabled={isReadOnly}
          inputMode="decimal"
          value={
            assessment.weight === null ? "" : formatWeight(assessment.weight)
          }
          placeholder={formatWeight(sharedWeight)}
          className={cn(FIELD, NUMBER_FIELD, "pr-5 pl-1 text-right")}
          onCommit={(text) => {
            const weight = parseGrade(text);
            if (Number.isNaN(weight) || (weight !== null && weight < 0)) return;
            onUpdate((current) => ({ ...current, weight }));
          }}
        />
        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground text-xs">
          %
        </span>
      </div>
      {assessment.kind === "SINGLE" ? (
        <CommitInput
          aria-label={`Nota de ${assessment.name}`}
          aria-invalid={
            assessment.grade !== null && !isValidGrade(assessment.grade, scale)
          }
          disabled={isReadOnly}
          inputMode="decimal"
          placeholder="—"
          value={assessment.grade === null ? "" : formatGrade(assessment.grade)}
          className={cn(
            FIELD,
            NUMBER_FIELD,
            "pointer-coarse:ml-1 pointer-coarse:w-12 w-13 shrink-0 px-2 text-right",
          )}
          onCommit={(text) => {
            const grade = parseGrade(text);
            if (Number.isNaN(grade)) return;
            onUpdate((current) => ({ ...current, grade }));
          }}
        />
      ) : (
        <span
          className={cn(
            "w-13 shrink-0 px-2 text-right font-medium text-sm tabular-nums",
            grade?.isPartial && "text-muted-foreground italic",
            !grade && "text-muted-foreground",
            isReadOnly && "opacity-50",
          )}
          title={grade?.isPartial ? "Promedio parcial" : "Promedio del grupo"}
        >
          {grade ? formatGrade(roundGrade(grade.grade)) : "—"}
        </span>
      )}
      {isReadOnly ? (
        <span aria-hidden className="w-7 shrink-0" />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Opciones de ${assessment.name}`}
                className={cn(
                  "shrink-0 text-muted-foreground transition-opacity",
                  REVEAL_ON_ROW,
                )}
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
              onClick={() =>
                onMove(indentAssessment(assessments, assessment.id))
              }
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
      )}
    </div>
  );
}

function WeightIssue({ sum, isCompact }: { sum: number; isCompact?: boolean }) {
  const text = `Los pesos suman ${formatWeight(sum)}%.`;
  if (isCompact)
    return (
      <span title={text} className="shrink-0 text-warning">
        <TriangleAlert aria-label={text} className="size-3.5" />
      </span>
    );
  return (
    <p className="flex items-center gap-1.5 py-1 pl-5 text-sm text-warning">
      <TriangleAlert className="size-3.5 shrink-0" />
      {text}
    </p>
  );
}
