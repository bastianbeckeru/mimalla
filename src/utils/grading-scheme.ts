import { nanoid } from "nanoid";
import type { Assessment } from "@/types/trajectory";
import { MAX_ASSESSMENT_DEPTH } from "@/utils/grades";

export type SchemeRow = {
  assessment: Assessment;
  depth: number;
  parentId: string | null;
};

export type SchemePlacement = { parentId: string | null; index: number };

export type SchemeSlot =
  | { kind: "ROW"; row: SchemeRow }
  | { kind: "ADD"; group: SchemeRow };

// How many levels to the right an assessment has to be dragged to go below a
// single assessment. Further than into a group, because it turns that one into
// a group and a finger easily drifts one level while reordering.
const LEVELS_TO_NEST_BELOW_SINGLE = 2;

// A group and the level below it for its single assessments.
const GROUP_MIN_LEVELS = 2;

export function flattenScheme(
  assessments: Assessment[],
  depth = 0,
  parentId: string | null = null,
): SchemeRow[] {
  return assessments.flatMap((assessment) => [
    { assessment, depth, parentId },
    ...(assessment.kind === "GROUP"
      ? flattenScheme(assessment.assessments, depth + 1, assessment.id)
      : []),
  ]);
}

export function getVisibleRows(
  rows: SchemeRow[],
  collapsedIds: ReadonlySet<string>,
) {
  let collapsedDepth: number | null = null;
  return rows.filter(({ assessment, depth }) => {
    if (collapsedDepth !== null && depth > collapsedDepth) return false;
    collapsedDepth = collapsedIds.has(assessment.id) ? depth : null;
    return true;
  });
}

// The visible rows with a place to add an assessment after the last row of each
// expanded group.
export function getSchemeSlots(
  visibleRows: SchemeRow[],
  collapsedIds: ReadonlySet<string>,
) {
  const slots: SchemeSlot[] = [];
  const open: SchemeRow[] = [];
  const closeDownTo = (depth: number) => {
    while ((open.at(-1)?.depth ?? -1) >= depth) {
      const group = open.pop();
      if (group) slots.push({ kind: "ADD", group });
    }
  };
  for (const row of visibleRows) {
    closeDownTo(row.depth);
    slots.push({ kind: "ROW", row });
    if (row.assessment.kind === "GROUP" && !collapsedIds.has(row.assessment.id))
      open.push(row);
  }
  closeDownTo(0);
  return slots;
}

// The levels an assessment takes up. A group keeps one below it for its
// single assessments even while empty.
export function getAssessmentHeight(assessment: Assessment): number {
  if (assessment.kind === "SINGLE") return 1;
  return 1 + Math.max(1, ...assessment.assessments.map(getAssessmentHeight));
}

export function findAssessment(
  assessments: Assessment[],
  id: string,
): (SchemeRow & { index: number }) | null {
  const rows = flattenScheme(assessments);
  const row = rows.find((row) => row.assessment.id === id);
  if (!row) return null;
  return {
    ...row,
    index: getSiblings(assessments, row.parentId).indexOf(row.assessment),
  };
}

export function getSiblings(
  assessments: Assessment[],
  parentId: string | null,
): Assessment[] {
  if (parentId === null) return assessments;
  const parent = findAssessment(assessments, parentId)?.assessment;
  return parent?.kind === "GROUP" ? parent.assessments : [];
}

export function updateAssessment(
  assessments: Assessment[],
  id: string,
  update: (assessment: Assessment) => Assessment,
): Assessment[] {
  return assessments.map((assessment) => {
    if (assessment.id === id) return update(assessment);
    if (assessment.kind === "SINGLE") return assessment;
    return {
      ...assessment,
      assessments: updateAssessment(assessment.assessments, id, update),
    };
  });
}

export function removeAssessment(
  assessments: Assessment[],
  id: string,
): Assessment[] {
  return assessments.flatMap((assessment): Assessment[] => {
    if (assessment.id === id) return [];
    if (assessment.kind === "SINGLE") return [assessment];
    return [
      {
        ...assessment,
        assessments: removeAssessment(assessment.assessments, id),
      },
    ];
  });
}

export function canPlace(
  assessments: Assessment[],
  assessment: Assessment,
  parentId: string | null,
) {
  if (parentId === null)
    return getAssessmentHeight(assessment) <= MAX_ASSESSMENT_DEPTH;
  const parent = findAssessment(assessments, parentId);
  return (
    parent?.assessment.kind === "GROUP" &&
    parent.depth + 1 + getAssessmentHeight(assessment) <= MAX_ASSESSMENT_DEPTH
  );
}

export function insertAssessment(
  assessments: Assessment[],
  assessment: Assessment,
  { parentId, index }: SchemePlacement,
): Assessment[] {
  const insert = (siblings: Assessment[]) => [
    ...siblings.slice(0, index),
    assessment,
    ...siblings.slice(index),
  ];
  if (parentId === null) return insert(assessments);
  return updateAssessment(assessments, parentId, (parent) =>
    parent.kind === "GROUP"
      ? { ...parent, assessments: insert(parent.assessments) }
      : parent,
  );
}

// A group in place of a single assessment. A grade it had stays in an
// assessment of the group, so that nothing the student entered is lost.
function toGroup(assessments: Assessment[], id: string): Assessment[] {
  return updateAssessment(assessments, id, (assessment) =>
    assessment.kind === "SINGLE"
      ? {
          kind: "GROUP",
          id: assessment.id,
          name: assessment.name,
          weight: assessment.weight,
          droppedCount: 0,
          assessments:
            assessment.grade === null
              ? []
              : [{ ...assessment, id: nanoid(), weight: null }],
        }
      : assessment,
  );
}

// Turns a single assessment into a group that keeps its name and weight. A grade
// stays on an assessment of the same name inside it. Returns null when there is
// no level left below it.
export function convertToGroup(assessments: Assessment[], id: string) {
  const found = findAssessment(assessments, id);
  if (found?.assessment.kind !== "SINGLE") return null;
  if (found.depth + GROUP_MIN_LEVELS > MAX_ASSESSMENT_DEPTH) return null;
  return toGroup(assessments, id);
}

// Moves an assessment with everything in it. `index` counts its new siblings
// once it has left its place. Moved below a single assessment, it turns that
// one into a group and goes last in it. Returns null when it cannot go there:
// inside itself, or deeper than three levels.
export function moveAssessment(
  assessments: Assessment[],
  id: string,
  placement: SchemePlacement,
): Assessment[] | null {
  const source = findAssessment(assessments, id)?.assessment;
  if (!source) return null;
  const isInsideSource =
    placement.parentId !== null &&
    flattenScheme([source]).some(
      ({ assessment }) => assessment.id === placement.parentId,
    );
  if (isInsideSource) return null;

  const parentId = placement.parentId;
  const removed = removeAssessment(assessments, id);
  const isParentSingle =
    parentId !== null &&
    findAssessment(removed, parentId)?.assessment.kind === "SINGLE";
  const rest =
    parentId !== null && isParentSingle ? toGroup(removed, parentId) : removed;
  if (!canPlace(rest, source, parentId)) return null;
  return insertAssessment(rest, source, {
    parentId,
    index: isParentSingle
      ? getSiblings(rest, parentId).length
      : placement.index,
  });
}

// The structure and weights of a grading scheme, without its grades.
export function copyScheme(assessments: Assessment[]): Assessment[] {
  return assessments.map((assessment) =>
    assessment.kind === "SINGLE"
      ? { ...assessment, id: nanoid(), grade: null }
      : {
          ...assessment,
          id: nanoid(),
          assessments: copyScheme(assessment.assessments),
        },
  );
}

// The sum of the weights of some sibling assessments, when it is not what it
// should: 100%, or at most 100% if some share what is left.
export function getWeightIssue(assessments: Assessment[]) {
  if (assessments.length === 0) return null;
  const sum = assessments.reduce((sum, { weight }) => sum + (weight ?? 0), 0);
  const hasShared = assessments.some(({ weight }) => weight === null);
  const isIssue = hasShared ? sum > 100 + 1e-9 : Math.abs(sum - 100) > 1e-9;
  return isIssue ? sum : null;
}

// Where a dragged assessment lands when dropped in the gap before
// `gapIndex`, among the rows left once it and everything in it are lifted.
// `depthOffset` is how many levels it was dragged to the right.
export function getDropProjection(
  rows: SchemeRow[],
  activeId: string,
  gapIndex: number,
  depthOffset: number,
): (SchemePlacement & { depth: number }) | null {
  const active = rows.find((row) => row.assessment.id === activeId);
  if (!active) return null;
  const lifted = new Set(
    flattenScheme([active.assessment]).map(({ assessment }) => assessment.id),
  );
  const rest = rows.filter((row) => !lifted.has(row.assessment.id));
  const previous = rest[gapIndex - 1];
  const next = rest[gapIndex];

  const canGoBelowPrevious =
    previous?.assessment.kind === "GROUP" ||
    depthOffset >= LEVELS_TO_NEST_BELOW_SINGLE;
  const deepest = previous ? previous.depth + (canGoBelowPrevious ? 1 : 0) : 0;
  const maxDepth = Math.min(
    deepest,
    MAX_ASSESSMENT_DEPTH - getAssessmentHeight(active.assessment),
  );
  const minDepth = next?.depth ?? 0;
  if (minDepth > maxDepth) return null;
  const depth = Math.min(
    Math.max(active.depth + depthOffset, minDepth),
    maxDepth,
  );

  const before = rest.slice(0, gapIndex);
  const parentIndex = before.findLastIndex((row) => row.depth === depth - 1);
  const parentId =
    depth === 0 ? null : (before[parentIndex]?.assessment.id ?? null);
  const index = before
    .slice(depth === 0 ? 0 : parentIndex + 1)
    .filter((row) => row.depth === depth).length;
  return { parentId, index, depth };
}
