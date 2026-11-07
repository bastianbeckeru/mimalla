"use client";

import { Feedback } from "@dnd-kit/dom";
import { DragDropProvider } from "@dnd-kit/react";
import { cn } from "cn";
import { Copy, Plus, TriangleAlert } from "lucide-react";
import { useState } from "react";
import AssessmentRow, {
  WeightIssue,
} from "@/components/trajectory/assessment-row";
import {
  INDENT_PX,
  sensors,
  useSchemeDrag,
} from "@/components/trajectory/use-scheme-drag";
import { Button } from "@/components/ui/button";
import type { Assessment, GradingScale } from "@/types/trajectory";
import { formatGrade, isValidGrade } from "@/utils/grades";
import {
  canPlace,
  convertToGroup,
  createSingle,
  flattenScheme,
  getSchemeSlots,
  getSiblings,
  getVisibleRows,
  getWeightIssue,
  insertAssessment,
  moveAssessment,
  removeAssessment,
  updateAssessment,
} from "@/utils/grading-scheme";

const INDICATOR_LEFT_PX = 20;
const NAME_LEFT_PX = 44;
const ADD_BUTTON = "pointer-coarse:h-11";

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
  const [focusId, setFocusId] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const rows = flattenScheme(assessments);
  const visibleRows = getVisibleRows(rows, collapsedIds);
  const { listRef, drop, setRowElement, handleDragMove, handleDragEnd } =
    useSchemeDrag({
      rows,
      visibleRows,
      onDrop({ activeId, parentId, index }) {
        if (parentId) expand(parentId);
        apply(moveAssessment(assessments, activeId, { parentId, index }));
      },
    });
  // The single assessment the ongoing drag would turn into a group.
  const newGroupId =
    rows.find(
      ({ assessment }) =>
        assessment.id === drop?.parentId && assessment.kind === "SINGLE",
    )?.assessment.id ?? null;
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
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <div ref={listRef} className="relative">
          {getSchemeSlots(visibleRows, collapsedIds).map((slot) => {
            if (slot.kind === "ADD")
              return canPlace(
                assessments,
                createSingle(),
                slot.group.assessment.id,
              ) ? (
                <div
                  key={`add-${slot.group.assessment.id}`}
                  className="flex h-9 items-center pr-1"
                  style={{
                    paddingLeft:
                      NAME_LEFT_PX + (slot.group.depth + 1) * INDENT_PX,
                  }}
                >
                  <Button
                    variant="ghost"
                    className="h-7 w-full justify-start px-1 text-muted-foreground"
                    onClick={() =>
                      add(createSingle(), slot.group.assessment.id)
                    }
                  >
                    <Plus />
                    Evaluación
                  </Button>
                </div>
              ) : null;
            const { row } = slot;
            return (
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
                rowRef={(element) => setRowElement(row.assessment.id, element)}
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
                onConvert={() =>
                  apply(convertToGroup(assessments, row.assessment.id))
                }
                onRemove={() =>
                  onChange(removeAssessment(assessments, row.assessment.id))
                }
              />
            );
          })}
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
