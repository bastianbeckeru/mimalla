"use client";

import { useDraggable } from "@dnd-kit/react";
import { cn } from "cn";
import { ChevronRight, GripVertical, TriangleAlert } from "lucide-react";
import { useRef } from "react";
import AssessmentMenu from "@/components/trajectory/assessment-menu";
import CommitInput from "@/components/trajectory/commit-input";
import { INDENT_PX } from "@/components/trajectory/use-scheme-drag";
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
  getSiblings,
  getWeightIssue,
  type SchemeRow,
} from "@/utils/grading-scheme";

const FIELD =
  "h-7 border-transparent bg-transparent shadow-none disabled:bg-transparent dark:bg-transparent dark:disabled:bg-transparent";
const NUMBER_FIELD =
  "tabular-nums group-hover/row:border-input pointer-coarse:border-input";
const REVEAL_ON_ROW =
  "pointer-fine:opacity-0 pointer-fine:focus-visible:opacity-100 pointer-fine:group-focus-within/row:opacity-100 pointer-fine:group-hover/row:opacity-100 pointer-fine:data-popup-open:opacity-100";

function formatWeight(weight: number) {
  return `${Math.round(weight * 10) / 10}`.replace(".", ",");
}

export default function AssessmentRow({
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
  onAddBatch,
  onConvert,
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
  onAddBatch: (count: number) => void;
  onConvert: () => void;
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
        <AssessmentMenu
          assessment={assessment}
          assessments={assessments}
          triggerClassName={REVEAL_ON_ROW}
          onUpdate={onUpdate}
          onAddBatch={onAddBatch}
          onConvert={onConvert}
          onRemove={onRemove}
        />
      )}
    </div>
  );
}

export function WeightIssue({
  sum,
  isCompact,
}: {
  sum: number;
  isCompact?: boolean;
}) {
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
