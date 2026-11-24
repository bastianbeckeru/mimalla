import type { CourseId, Curriculum, PeriodKey } from "@/types/curriculum";
import type {
  Enrollment,
  EnrollmentStatus,
  Entry,
  GradingScale,
} from "@/types/trajectory";
import { isValidGradingScale } from "@/utils/grades";
import {
  addEnrollment,
  type EditError,
  MAX_ENROLLMENTS_PER_PERIOD,
} from "@/utils/trajectory/edits";
import { getPeriodEndRow, layOutTrajectory } from "@/utils/trajectory/layout";
import {
  type AssessmentRecord,
  buildSchemes,
  checkAssessments,
} from "@/utils/trajectory-file/assessments";
import { getSheetColumns, type Table } from "@/utils/trajectory-file/columns";
import {
  type ImportIssue,
  readRow,
  readSheet,
  type SheetRow,
  type Value,
} from "@/utils/trajectory-file/sheets";

export type ImportTarget = { curriculumPath: string; curriculum: Curriculum };

export type ImportResult = { warnings: ImportIssue[] } & (
  | {
      ok: true;
      entry: Entry;
      gradingScale: GradingScale;
      enrollments: Enrollment[];
    }
  | { ok: false; errors: ImportIssue[] }
);

type EnrollmentRecord = {
  row: number;
  key: string;
  courseId: CourseId;
  year: number;
  term: number;
  position: number | null;
  status: EnrollmentStatus;
  courseGrade: number | null;
};

function getCell(table: Table | undefined, column: string) {
  const [header = [], first = []] = table?.rows ?? [];
  const index = header.indexOf(column);
  return index === -1 ? null : (first[index] ?? null);
}

export function readCurriculumPath(tables: Table[]) {
  const table = tables.find(({ name }) => name === "trajectory");
  const parts = ["institution", "program", "effective_year"].map((column) =>
    String(getCell(table, column) ?? "").trim(),
  );
  return parts.every(Boolean) ? parts.join("/") : null;
}

function readTrajectorySheet(
  tables: Table[],
  { curriculumPath, curriculum }: ImportTarget,
  errors: ImportIssue[],
  warnings: ImportIssue[],
) {
  const columns = getSheetColumns(curriculum).trajectory;
  const rows = readSheet(tables, "trajectory", columns, errors);
  if (!rows) return null;
  const [first, ...rest] = rows;
  if (!first || rest.length) {
    errors.push({
      sheet: "trajectory",
      row: null,
      message: "La hoja debe tener exactamente una fila.",
    });
    return null;
  }

  const values = readRow(
    "trajectory",
    first,
    columns,
    { curriculum, gradingScale: null },
    errors,
  );
  if (!values) return null;
  const issue = (message: string) => ({
    sheet: "trajectory" as const,
    row: first.row,
    message,
  });

  const filePath = [
    values.institution,
    values.program,
    values.effective_year,
  ].join("/");
  if (filePath !== curriculumPath) {
    errors.push(
      issue(`El archivo es de la malla ${filePath}, no de ${curriculumPath}.`),
    );
    return null;
  }

  const version = values.curriculum_version;
  if (version !== null && version !== curriculum.versionName)
    warnings.push(
      issue(
        `El archivo es de la versión ${version} de la malla y ahora es la ${curriculum.versionName}. Tu progreso se mantiene.`,
      ),
    );

  const gradingScale = {
    min: values.grade_min as number,
    max: values.grade_max as number,
    passing: values.grade_passing as number,
  };
  if (!isValidGradingScale(gradingScale)) {
    errors.push(
      issue(
        "La escala de notas no es válida: grade_min debe ser menor que grade_max y grade_passing debe quedar entre ambas.",
      ),
    );
    return null;
  }

  return {
    entry: {
      year: values.entry_year as number,
      term: values.entry_term as number,
    },
    gradingScale,
  };
}

function readRecords<T>(
  tables: Table[],
  sheet: "enrollments" | "assessments",
  { curriculum }: ImportTarget,
  gradingScale: GradingScale,
  errors: ImportIssue[],
  toRecord: (row: number, values: Record<string, Value>) => T,
) {
  const columns = getSheetColumns(curriculum)[sheet];
  const rows = readSheet(tables, sheet, columns, errors);
  if (!rows) return null;
  return {
    rows,
    records: rows.flatMap((row) => {
      const values = readRow(
        sheet,
        row,
        columns,
        { curriculum, gradingScale },
        errors,
      );
      return values ? [toRecord(row.row, values)] : [];
    }),
  };
}

function readKeys(rows: SheetRow[], column: string) {
  return new Set(
    rows.map(({ cells }) => String(cells.get(column) ?? "").trim()),
  );
}

function toEnrollmentRecord(
  row: number,
  values: Record<string, Value>,
): EnrollmentRecord {
  return {
    row,
    key: values.enrollment_id as string,
    courseId: values.course_id as CourseId,
    year: values.year as number,
    term: values.term as number,
    position: values.position as number | null,
    status: values.status as EnrollmentStatus,
    courseGrade: values.final_grade as number | null,
  };
}

function toAssessmentRecord(
  row: number,
  values: Record<string, Value>,
): AssessmentRecord {
  return {
    row,
    enrollmentKey: values.enrollment_id as string,
    key: values.assessment_id as string,
    parentKey: values.parent_id as string | null,
    kind: values.kind as AssessmentRecord["kind"],
    name: values.name as string,
    weight: values.weight as number | null,
    grade: values.grade as number | null,
    droppedCount: values.dropped_count as number | null,
  };
}

function findDuplicateKeys(records: EnrollmentRecord[]): ImportIssue[] {
  const seen = new Set<string>();
  return records.flatMap(({ row, key }) => {
    if (!seen.has(key)) {
      seen.add(key);
      return [];
    }
    return [
      {
        sheet: "enrollments" as const,
        row,
        message: `El enrollment_id ${key} está repetido.`,
      },
    ];
  });
}

function describeEditError(
  error: EditError,
  record: EnrollmentRecord,
  curriculum: Curriculum,
) {
  const period = `${record.year}-${record.term}`;
  if (error === "PERIOD_FULL")
    return `El periodo ${period} tendría más de ${MAX_ENROLLMENTS_PER_PERIOD} cursos.`;
  const course = curriculum.courses.find(({ id }) => id === record.courseId);
  return `${course?.name ?? record.courseId} ya está en el periodo ${period}.`;
}

function placeEnrollments(
  records: EnrollmentRecord[],
  entry: Entry,
  curriculum: Curriculum,
  schemeOf: ReturnType<typeof buildSchemes>,
  errors: ImportIssue[],
) {
  const context = { entry, curriculum };
  const courses = new Map(curriculum.courses.map((c) => [c.id, c]));
  let enrollments: Enrollment[] = [];

  for (const record of records) {
    const course = courses.get(record.courseId);
    if (!course) continue;
    const period = `${record.year}-${record.term}` as PeriodKey;
    const { periods, cards } = layOutTrajectory(enrollments, context, [period]);
    const result = addEnrollment(
      enrollments,
      course,
      {
        period,
        row:
          record.position ??
          getPeriodEndRow(cards, periods.indexOf(period) + 1),
      },
      context,
    );
    if (result.error) {
      errors.push({
        sheet: "enrollments",
        row: record.row,
        message: describeEditError(result.error, record, curriculum),
      });
      continue;
    }

    const previousIds = new Set(enrollments.map(({ id }) => id));
    const assessments = schemeOf(record.key);
    enrollments = result.enrollments.map((enrollment) =>
      previousIds.has(enrollment.id)
        ? enrollment
        : {
            ...enrollment,
            status: record.status,
            ...(record.courseGrade === null
              ? {}
              : { courseGrade: record.courseGrade }),
            ...(assessments.length ? { assessments } : {}),
          },
    );
  }
  return enrollments;
}

export function importTrajectory(
  tables: Table[],
  target: ImportTarget,
): ImportResult {
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];
  const fail = (): ImportResult => ({ ok: false, errors, warnings });

  const header = readTrajectorySheet(tables, target, errors, warnings);
  if (!header) return fail();
  const scale = header.gradingScale;

  const enrollments = readRecords(
    tables,
    "enrollments",
    target,
    scale,
    errors,
    toEnrollmentRecord,
  );
  const assessments = readRecords(
    tables,
    "assessments",
    target,
    scale,
    errors,
    toAssessmentRecord,
  );
  if (!enrollments || !assessments) return fail();

  errors.push(
    ...findDuplicateKeys(enrollments.records),
    ...checkAssessments(assessments.records, {
      enrollmentKeys: readKeys(enrollments.rows, "enrollment_id"),
      assessmentKeys: readKeys(assessments.rows, "assessment_id"),
    }),
  );
  if (errors.length) return fail();

  const placed = placeEnrollments(
    enrollments.records,
    header.entry,
    target.curriculum,
    buildSchemes(assessments.records),
    errors,
  );
  if (errors.length) return fail();

  return { ok: true, warnings, ...header, enrollments: placed };
}
