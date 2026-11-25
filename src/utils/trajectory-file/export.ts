import type { Curriculum } from "@/types/curriculum";
import type { Assessment, Trajectory } from "@/types/trajectory";
import { MAX_ASSESSMENT_DEPTH } from "@/utils/grades";
import {
  type Cell,
  type Column,
  DATA_SHEETS,
  FORMAT_VERSION,
  getSheetColumns,
  type Table,
} from "@/utils/trajectory-file/columns";
import { describeType } from "@/utils/trajectory-file/sheets";

const README_RULES = [
  "No cambies los nombres de las hojas ni de las columnas.",
  "No cambies la hoja trajectory salvo entry_year, entry_term y la escala de notas.",
  "course_id identifica el curso; búscalo en la hoja courses. course_code y course_name son solo para leer.",
  "Para agregar un curso cursado, agrega una fila en enrollments con su course_id. Si lo cursaste dos veces, son dos filas.",
  `Las evaluaciones van en assessments y se unen a su curso por enrollment_id. Un grupo se indica con parent_id, nunca por nombre, y se anidan hasta ${MAX_ASSESSMENT_DEPTH} niveles.`,
  "Las notas usan punto decimal y van dentro de la escala (grade_min a grade_max).",
  "Si hay un error, no se carga nada y Mi Malla te muestra en qué hoja y fila está.",
];

function describeColumn(sheet: string, column: Column): Cell[] {
  return [
    sheet,
    column.name,
    column.isRequired ? "sí" : "no",
    describeType(column.type),
    column.isIgnored
      ? `${column.description} Al cargar el archivo se ignora.`
      : column.description,
  ];
}

function getReadme(columns: ReturnType<typeof getSheetColumns>): Cell[][] {
  return [
    ["Progreso de Mi Malla"],
    [
      "Este archivo guarda tu malla: tus cursos, sus estados y tus notas. Puedes editarlo y cargarlo de vuelta en Mi Malla, donde reemplaza tu malla.",
    ],
    [],
    ["Reglas"],
    ...README_RULES.map((rule, index) => [`${index + 1}. ${rule}`]),
    [],
    ["sheet", "column", "required", "allowed values", "description"],
    ...DATA_SHEETS.flatMap((sheet) =>
      columns[sheet].map((column) => describeColumn(sheet, column)),
    ),
  ];
}

type AssessmentRow = {
  assessment: Assessment;
  parentNumber: number | null;
};

function flattenAssessments(
  assessments: Assessment[],
  parentNumber: number | null = null,
  rows: AssessmentRow[] = [],
) {
  for (const assessment of assessments) {
    rows.push({ assessment, parentNumber });
    if (assessment.kind === "GROUP")
      flattenAssessments(assessment.assessments, rows.length, rows);
  }
  return rows;
}

function toTable(name: string, columns: Column[], rows: Cell[][]): Table {
  return { name, rows: [columns.map((column) => column.name), ...rows] };
}

export function exportTrajectory(
  { curriculumPath, entry, gradingScale, enrollments }: Trajectory,
  curriculum: Curriculum,
): Table[] {
  const columns = getSheetColumns(curriculum);
  const [institution = "", program = "", effectiveYear = ""] =
    curriculumPath.split("/");
  const courses = new Map(curriculum.courses.map((c) => [c.id, c]));

  let assessmentCount = 0;
  const assessmentRows = enrollments.flatMap((enrollment, index) => {
    const offset = assessmentCount;
    const rows = flattenAssessments(enrollment.assessments ?? []);
    assessmentCount += rows.length;
    return rows.map(({ assessment, parentNumber }, rowIndex): Cell[] => [
      `e${index + 1}`,
      `a${offset + rowIndex + 1}`,
      parentNumber === null ? null : `a${offset + parentNumber}`,
      assessment.kind,
      assessment.name,
      assessment.weight,
      assessment.kind === "SINGLE" ? assessment.grade : null,
      assessment.kind === "GROUP" ? assessment.droppedCount : null,
    ]);
  });

  return [
    { name: "README", rows: getReadme(columns) },
    toTable("trajectory", columns.trajectory, [
      [
        FORMAT_VERSION,
        institution,
        program,
        Number(effectiveYear),
        curriculum.versionName,
        entry.year,
        entry.term,
        gradingScale.min,
        gradingScale.max,
        gradingScale.passing,
      ],
    ]),
    toTable(
      "courses",
      columns.courses,
      curriculum.courses.map((course) => {
        const [slot] = course.slots;
        return [
          course.id,
          course.code,
          course.name,
          slot?.programYear ?? null,
          slot?.term ?? null,
          course.credits,
        ];
      }),
    ),
    toTable(
      "enrollments",
      columns.enrollments,
      enrollments.map((enrollment, index) => {
        const course = courses.get(enrollment.courseId);
        return [
          `e${index + 1}`,
          enrollment.courseId,
          course?.code ?? null,
          course?.name ?? null,
          enrollment.year,
          enrollment.term,
          enrollment.position,
          enrollment.status,
          enrollment.courseGrade ?? null,
        ];
      }),
    ),
    toTable("assessments", columns.assessments, assessmentRows),
  ];
}
