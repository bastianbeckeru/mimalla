import { nanoid } from "nanoid";
import type { Assessment } from "@/types/trajectory";
import { MAX_ASSESSMENT_DEPTH } from "@/utils/grades";
import type { ImportIssue } from "@/utils/trajectory-file/sheets";

export type AssessmentRecord = {
  row: number;
  enrollmentKey: string;
  key: string;
  parentKey: string | null;
  kind: "SINGLE" | "GROUP";
  name: string;
  weight: number | null;
  grade: number | null;
  droppedCount: number | null;
};

export type SheetKeys = {
  enrollmentKeys: Set<string>;
  assessmentKeys: Set<string>;
};

const SHEET = "assessments";

function issue(row: number, message: string): ImportIssue {
  return { sheet: SHEET, row, message };
}

function checkRecord(
  record: AssessmentRecord,
  byKey: Map<string, AssessmentRecord>,
  { enrollmentKeys, assessmentKeys }: SheetKeys,
): ImportIssue[] {
  const { row, kind, enrollmentKey, parentKey } = record;
  const issues: ImportIssue[] = [];
  if (kind === "GROUP" && record.grade !== null)
    issues.push(issue(row, "Un GROUP no lleva grade."));
  if (kind === "SINGLE" && record.droppedCount !== null)
    issues.push(issue(row, "Una evaluación SINGLE no lleva dropped_count."));
  if (!enrollmentKeys.has(enrollmentKey))
    issues.push(
      issue(
        row,
        `El enrollment_id ${enrollmentKey} no está en la hoja enrollments.`,
      ),
    );
  if (parentKey === null) return issues;

  const parent = byKey.get(parentKey);
  const isParentRowInvalid = !parent && assessmentKeys.has(parentKey);
  if (isParentRowInvalid) return issues;
  if (parent?.kind !== "GROUP" || parent.enrollmentKey !== enrollmentKey) {
    issues.push(
      issue(
        row,
        `El parent_id ${parentKey} no es un grupo de la misma inscripción.`,
      ),
    );
    return issues;
  }

  const ancestors = new Set<string>();
  for (
    let current: AssessmentRecord | undefined = parent;
    current;
    current =
      current.parentKey === null ? undefined : byKey.get(current.parentKey)
  ) {
    if (current.key === record.key) {
      issues.push(issue(row, `El grupo ${record.key} se contiene a sí mismo.`));
      return issues;
    }
    if (ancestors.has(current.key)) return issues;
    ancestors.add(current.key);
  }

  const level = ancestors.size + 1 + (kind === "GROUP" ? 1 : 0);
  if (level > MAX_ASSESSMENT_DEPTH)
    issues.push(
      issue(
        row,
        `Las evaluaciones se anidan hasta ${MAX_ASSESSMENT_DEPTH} niveles.`,
      ),
    );
  return issues;
}

function checkWeights(records: AssessmentRecord[]): ImportIssue[] {
  const levels = Map.groupBy(
    records,
    ({ enrollmentKey, parentKey }) => `${enrollmentKey}\u0000${parentKey}`,
  );
  return [...levels.values()].flatMap((siblings) => {
    const sum = siblings.reduce(
      (total, { weight }) => total + (weight ?? 0),
      0,
    );
    const [first] = siblings;
    return sum > 100 + 1e-9 && first
      ? [
          issue(
            first.row,
            `Los pesos de este nivel suman ${Math.round(sum * 100) / 100}%, más de 100%.`,
          ),
        ]
      : [];
  });
}

export function checkAssessments(
  records: AssessmentRecord[],
  keys: SheetKeys,
): ImportIssue[] {
  const byKey = new Map<string, AssessmentRecord>();
  const issues: ImportIssue[] = [];
  for (const record of records) {
    if (byKey.has(record.key))
      issues.push(
        issue(record.row, `El assessment_id ${record.key} está repetido.`),
      );
    else byKey.set(record.key, record);
  }
  return [
    ...issues,
    ...records.flatMap((record) => checkRecord(record, byKey, keys)),
    ...checkWeights(records),
  ].toSorted((a, b) => (a.row ?? 0) - (b.row ?? 0));
}

export function buildSchemes(records: AssessmentRecord[]) {
  const children = Map.groupBy(
    records,
    ({ enrollmentKey, parentKey }) => `${enrollmentKey}\u0000${parentKey}`,
  );
  const build = (
    enrollmentKey: string,
    parentKey: string | null,
  ): Assessment[] =>
    (children.get(`${enrollmentKey}\u0000${parentKey}`) ?? []).map(
      (record): Assessment =>
        record.kind === "GROUP"
          ? {
              kind: "GROUP",
              id: nanoid(),
              name: record.name,
              weight: record.weight,
              droppedCount: record.droppedCount ?? 0,
              assessments: build(enrollmentKey, record.key),
            }
          : {
              kind: "SINGLE",
              id: nanoid(),
              name: record.name,
              weight: record.weight,
              grade: record.grade,
            },
    );
  return (enrollmentKey: string) => build(enrollmentKey, null);
}
