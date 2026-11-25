import { INTENSIVE_TERMS } from "@/curriculum/periods";
import type { Curriculum } from "@/types/curriculum";
import type { EnrollmentStatus } from "@/types/trajectory";
import { ENTRY_TERMS, TERM_LABELS } from "@/utils/period-key";

export const FORMAT_VERSION = 1;

export type Cell = string | number | null;

export type Table = { name: string; rows: Cell[][] };

type DataSheet = "trajectory" | "courses" | "enrollments" | "assessments";

export type SheetName = "README" | DataSheet;

export const DATA_SHEETS: DataSheet[] = [
  "trajectory",
  "courses",
  "enrollments",
  "assessments",
];

export type ColumnType =
  | { kind: "text" }
  | { kind: "integer"; min: number }
  | { kind: "number"; min?: number; max?: number }
  | { kind: "grade" }
  | { kind: "courseId" }
  | { kind: "choice"; values: readonly (string | number)[] };

export type Column = {
  name: string;
  type: ColumnType;
  isRequired: boolean;
  isIgnored?: boolean;
  description: string;
};

const STATUSES: EnrollmentStatus[] = ["APPROVED", "PENDING", "FAILED"];

const ASSESSMENT_KINDS = ["SINGLE", "GROUP"] as const;

function getTrajectoryTerms({ termSystem }: Curriculum) {
  return [...new Set([1, 3, ...INTENSIVE_TERMS[termSystem]])].toSorted(
    (a, b) => a - b,
  );
}

const TEXT = { kind: "text" } as const;
const GRADE = { kind: "grade" } as const;

export function getSheetColumns(
  curriculum: Curriculum,
): Record<DataSheet, Column[]> {
  const terms = getTrajectoryTerms(curriculum);
  const termNames = terms
    .map((term) => `${term} ${TERM_LABELS[term]?.toLowerCase()}`)
    .join(", ");

  return {
    trajectory: [
      {
        name: "format_version",
        type: { kind: "choice", values: [FORMAT_VERSION] },
        isRequired: true,
        description: "Versión del formato del archivo. No la cambies.",
      },
      {
        name: "institution",
        type: TEXT,
        isRequired: true,
        description: "Sigla de la universidad de la malla. No la cambies.",
      },
      {
        name: "program",
        type: TEXT,
        isRequired: true,
        description: "Carrera de la malla. No la cambies.",
      },
      {
        name: "effective_year",
        type: { kind: "integer", min: 0 },
        isRequired: true,
        description: "Año desde el que rige la malla. No lo cambies.",
      },
      {
        name: "curriculum_version",
        type: TEXT,
        isRequired: false,
        description: "Versión de la malla cuando se descargó el archivo.",
      },
      {
        name: "entry_year",
        type: { kind: "integer", min: 0 },
        isRequired: true,
        description: "Año en que ingresaste a la carrera.",
      },
      {
        name: "entry_term",
        type: { kind: "choice", values: ENTRY_TERMS.map(({ value }) => value) },
        isRequired: true,
        description: `Semestre en que ingresaste: ${ENTRY_TERMS.map(
          ({ value, label }) => `${value} ${label?.toLowerCase()}`,
        ).join(", ")}.`,
      },
      {
        name: "grade_min",
        type: { kind: "number" },
        isRequired: true,
        description: "La nota más baja posible.",
      },
      {
        name: "grade_max",
        type: { kind: "number" },
        isRequired: true,
        description: "La nota más alta posible.",
      },
      {
        name: "grade_passing",
        type: { kind: "number" },
        isRequired: true,
        description: "Desde esta nota, un curso se considera aprobado.",
      },
    ],
    courses: [
      {
        name: "course_id",
        type: TEXT,
        isRequired: false,
        isIgnored: true,
        description: "Identificador del curso en la malla.",
      },
      {
        name: "course_code",
        type: TEXT,
        isRequired: false,
        isIgnored: true,
        description: "Código del curso.",
      },
      {
        name: "course_name",
        type: TEXT,
        isRequired: false,
        isIgnored: true,
        description: "Nombre del curso.",
      },
      {
        name: "program_year",
        type: { kind: "integer", min: 1 },
        isRequired: false,
        isIgnored: true,
        description: "Año de la carrera en que la malla oficial lo ubica.",
      },
      {
        name: "term",
        type: { kind: "integer", min: 1 },
        isRequired: false,
        isIgnored: true,
        description: "Periodo del año en que la malla oficial lo ubica.",
      },
      {
        name: "credits",
        type: { kind: "number", min: 0 },
        isRequired: false,
        isIgnored: true,
        description: "Créditos del curso.",
      },
    ],
    enrollments: [
      {
        name: "enrollment_id",
        type: TEXT,
        isRequired: true,
        description:
          "Identifica esta vez que cursas el curso. Único en el archivo; lo usa la hoja assessments.",
      },
      {
        name: "course_id",
        type: { kind: "courseId" },
        isRequired: true,
        description: "El curso, buscado en la hoja courses.",
      },
      {
        name: "course_code",
        type: TEXT,
        isRequired: false,
        isIgnored: true,
        description: "Solo para leer.",
      },
      {
        name: "course_name",
        type: TEXT,
        isRequired: false,
        isIgnored: true,
        description: "Solo para leer.",
      },
      {
        name: "year",
        type: { kind: "integer", min: 0 },
        isRequired: true,
        description: "Año calendario en que lo cursas.",
      },
      {
        name: "term",
        type: { kind: "choice", values: terms },
        isRequired: true,
        description: `Periodo del año: ${termNames}.`,
      },
      {
        name: "position",
        type: { kind: "integer", min: 0 },
        isRequired: false,
        description:
          "Fila del curso en su periodo. Si la dejas vacía, va al final del periodo.",
      },
      {
        name: "status",
        type: { kind: "choice", values: STATUSES },
        isRequired: true,
        description: "APPROVED aprobado, PENDING pendiente, FAILED reprobado.",
      },
      {
        name: "final_grade",
        type: GRADE,
        isRequired: false,
        description:
          "Nota final del curso. Si la escribes, prevalece sobre la que suman sus evaluaciones.",
      },
    ],
    assessments: [
      {
        name: "enrollment_id",
        type: TEXT,
        isRequired: true,
        description:
          "El enrollment_id de la hoja enrollments al que pertenece.",
      },
      {
        name: "assessment_id",
        type: TEXT,
        isRequired: true,
        description: "Identifica la evaluación. Único en el archivo.",
      },
      {
        name: "parent_id",
        type: TEXT,
        isRequired: false,
        description:
          "El assessment_id del grupo que la contiene. Vacío en el primer nivel.",
      },
      {
        name: "kind",
        type: { kind: "choice", values: ASSESSMENT_KINDS },
        isRequired: true,
        description:
          "SINGLE una evaluación con nota, GROUP un grupo de evaluaciones.",
      },
      {
        name: "name",
        type: TEXT,
        isRequired: true,
        description: "Nombre de la evaluación o del grupo.",
      },
      {
        name: "weight",
        type: { kind: "number", min: 0, max: 100 },
        isRequired: false,
        description:
          "Porcentaje dentro de su nivel. Vacío reparte en partes iguales lo que dejan las demás.",
      },
      {
        name: "grade",
        type: GRADE,
        isRequired: false,
        description:
          "Nota de una evaluación SINGLE. Vacía si aún no la tienes.",
      },
      {
        name: "dropped_count",
        type: { kind: "integer", min: 0 },
        isRequired: false,
        description: "En un GROUP, cuántas de sus notas más bajas no cuentan.",
      },
    ],
  };
}
