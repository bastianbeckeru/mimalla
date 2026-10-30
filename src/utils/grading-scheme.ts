import { nanoid } from "nanoid";
import type { Assessment } from "@/types/trajectory";
import { MAX_ASSESSMENT_DEPTH } from "@/utils/grades";

export type SchemeRow = {
  assessment: Assessment;
  depth: number;
  parentId: string | null;
};

export type SchemePlacement = { parentId: string | null; index: number };

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

// Moves an assessment with everything in it. `index` counts its new siblings
// once it has left its place. Returns null when it cannot go there: inside
// itself, or deeper than three levels.
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

  const rest = removeAssessment(assessments, id);
  if (!canPlace(rest, source, placement.parentId)) return null;
  return insertAssessment(rest, source, placement);
}

export function moveAssessmentBy(
  assessments: Assessment[],
  id: string,
  offset: -1 | 1,
) {
  const found = findAssessment(assessments, id);
  if (!found) return null;
  const index = found.index + offset;
  const siblingCount = getSiblings(assessments, found.parentId).length;
  if (index < 0 || index >= siblingCount) return null;
  return moveAssessment(assessments, id, { parentId: found.parentId, index });
}

// Moves an assessment into the group just above it, as its last assessment.
export function indentAssessment(assessments: Assessment[], id: string) {
  const found = findAssessment(assessments, id);
  const previous =
    found && getSiblings(assessments, found.parentId)[found.index - 1];
  if (previous?.kind !== "GROUP") return null;
  return moveAssessment(assessments, id, {
    parentId: previous.id,
    index: previous.assessments.length,
  });
}

// Moves an assessment out of its group, right after it.
export function outdentAssessment(assessments: Assessment[], id: string) {
  const found = findAssessment(assessments, id);
  if (!found?.parentId) return null;
  const parent = findAssessment(assessments, found.parentId);
  if (!parent) return null;
  return moveAssessment(assessments, id, {
    parentId: parent.parentId,
    index: parent.index + 1,
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

  const deepest = previous
    ? previous.depth + (previous.assessment.kind === "GROUP" ? 1 : 0)
    : 0;
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
