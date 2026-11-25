"use client";

import {
  CircleAlert,
  Copy,
  FileUp,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  AdaptiveDialog,
  AdaptiveDialogBody,
  AdaptiveDialogClose,
  AdaptiveDialogContent,
  AdaptiveDialogDescription,
  AdaptiveDialogFooter,
  AdaptiveDialogHeader,
  AdaptiveDialogTitle,
} from "@/components/ui/adaptive-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { Curriculum } from "@/types/curriculum";
import type {
  Enrollment,
  ImportedContent,
  Trajectory,
} from "@/types/trajectory";
import { fetchCurriculum } from "@/utils/curriculum-file";
import {
  type ImportResult,
  type ImportTarget,
  importTrajectory,
  readCurriculumPath,
} from "@/utils/trajectory-file/import";
import type { ImportIssue } from "@/utils/trajectory-file/sheets";
import {
  type ImportSummary,
  summarizeImport,
} from "@/utils/trajectory-file/summary";
import { readWorkbook } from "@/utils/trajectory-file/workbook";

type ImportedFile = Pick<Trajectory, "curriculumPath"> &
  ImportedContent & { curriculum: Curriculum };

type Step =
  | { kind: "CHOOSE" }
  | { kind: "READING" }
  | { kind: "FAILED"; message: string }
  | {
      kind: "PREVIEW";
      fileName: string;
      target: ImportTarget;
      result: ImportResult;
      summary: ImportSummary | null;
    };

const XLSX_ACCEPT =
  ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const SHOWN_GRADED_COURSES = 5;

const ASSISTANT_PROMPT = `Te adjunto dos archivos: mi planilla de notas y un archivo de Mi Malla (.xlsx).
Completa el archivo de Mi Malla con los cursos, estados y notas de mi planilla:
- Sigue al pie de la letra las reglas y la tabla de columnas de su hoja README.
- Usa solo los course_id de la hoja courses. Si un curso de mi planilla no está ahí, dímelo en vez de inventar uno.
- No cambies los nombres de las hojas ni de las columnas, ni la hoja trajectory salvo entry_year, entry_term y la escala de notas.
- Escribe las notas con punto decimal y dentro de la escala (grade_min a grade_max).
Devuélveme el archivo .xlsx completo, listo para cargarlo en Mi Malla.`;

class ImportFailure extends Error {}

async function readFile(
  file: File,
  target: ImportTarget | null,
  current: Enrollment[] | null,
): Promise<Step> {
  const tables = await readWorkbook(await file.arrayBuffer()).catch(() => {
    throw new ImportFailure(
      "No se pudo leer el archivo. Debe ser un .xlsx descargado de Mi Malla.",
    );
  });

  let resolved = target;
  if (!resolved) {
    const curriculumPath = readCurriculumPath(tables);
    if (!curriculumPath)
      throw new ImportFailure(
        "El archivo no indica su malla: revisa institution, program y effective_year en la hoja trajectory.",
      );
    const curriculum = await fetchCurriculum(curriculumPath).catch(() => {
      throw new ImportFailure(
        `No encontramos la malla ${curriculumPath} en Mi Malla.`,
      );
    });
    resolved = { curriculumPath, curriculum };
  }

  const result = importTrajectory(tables, resolved);
  return {
    kind: "PREVIEW",
    fileName: file.name,
    target: resolved,
    result,
    summary: result.ok
      ? summarizeImport(current, result.enrollments, resolved.curriculum)
      : null,
  };
}

function describeLocation({ sheet, row }: ImportIssue) {
  return row === null ? `Hoja ${sheet}` : `Hoja ${sheet}, fila ${row}`;
}

function IssueList({ issues }: { issues: ImportIssue[] }) {
  return (
    <ul className="max-h-60 divide-y overflow-y-auto rounded-lg border text-sm">
      {issues.map((issue, index) => (
        <li
          // biome-ignore lint/suspicious/noArrayIndexKey: issues have no id and never reorder
          key={index}
          className="space-y-0.5 px-3 py-2"
        >
          <p className="text-muted-foreground text-xs">
            {describeLocation(issue)}
          </p>
          <p>{issue.message}</p>
        </li>
      ))}
    </ul>
  );
}

function pluralize(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

function describeChanges(
  changedCourseCount: number,
  createdProgramName: string | null,
) {
  if (createdProgramName)
    return `Se creará tu malla de ${createdProgramName} con ${pluralize(changedCourseCount, "curso inscrito", "cursos inscritos")}.`;
  if (changedCourseCount === 0) return "Ningún curso cambia.";
  return `${pluralize(changedCourseCount, "curso cambia", "cursos cambian")}.`;
}

function SummaryList({
  summary,
  createdProgramName,
}: {
  summary: ImportSummary;
  createdProgramName: string | null;
}) {
  const { changedCourseCount, gradedCourses } = summary;
  const hiddenCount = gradedCourses.length - SHOWN_GRADED_COURSES;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      <li>{describeChanges(changedCourseCount, createdProgramName)}</li>
      {gradedCourses
        .slice(0, SHOWN_GRADED_COURSES)
        .map(({ name, assessmentCount }) => (
          <li key={name}>
            {name} tendrá{" "}
            {pluralize(assessmentCount, "evaluación", "evaluaciones")}.
          </li>
        ))}
      {hiddenCount > 0 && (
        <li>
          {pluralize(hiddenCount, "curso más", "cursos más")} con evaluaciones.
        </li>
      )}
    </ul>
  );
}

function ReplaceNotice() {
  return (
    <p className="border-destructive/30 bg-destructive/5 flex gap-2 rounded-lg border px-3 py-2 text-sm">
      <TriangleAlert className="text-destructive mt-0.5 size-4 shrink-0" />
      Tu malla actual se reemplazará por la del archivo. Lo que no esté en el
      archivo se perderá.
    </p>
  );
}

async function copyPrompt() {
  await navigator.clipboard.writeText(ASSISTANT_PROMPT);
  toast.add({
    title: "Instrucción copiada",
    description: "Pégala en tu asistente junto con los dos archivos.",
  });
}

export default function ImportTrajectoryDialog({
  open,
  onOpenChange,
  target,
  current,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: ImportTarget | null;
  current: Enrollment[] | null;
  onImport: (imported: ImportedFile) => void;
}) {
  const [step, setStep] = useState<Step>({ kind: "CHOOSE" });
  const inputRef = useRef<HTMLInputElement>(null);
  const isReplacing = current !== null;

  async function chooseFile(file: File | undefined) {
    if (!file) return;
    setStep({ kind: "READING" });
    try {
      setStep(await readFile(file, target, current));
    } catch (error) {
      if (!(error instanceof ImportFailure)) throw error;
      setStep({ kind: "FAILED", message: error.message });
    }
  }

  function confirm() {
    if (step.kind !== "PREVIEW" || !step.result.ok) return;
    const { entry, gradingScale, enrollments } = step.result;
    onImport({ ...step.target, entry, gradingScale, enrollments });
    onOpenChange(false);
  }

  const result = step.kind === "PREVIEW" ? step.result : null;

  return (
    <AdaptiveDialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) setStep({ kind: "CHOOSE" });
      }}
    >
      <AdaptiveDialogContent className="sm:max-w-lg">
        <AdaptiveDialogHeader>
          <AdaptiveDialogTitle>
            {result && !result.ok
              ? "No se puede cargar el archivo"
              : "Cargar progreso"}
          </AdaptiveDialogTitle>
          <AdaptiveDialogDescription>
            {step.kind === "PREVIEW"
              ? step.fileName
              : "Carga un archivo .xlsx descargado de Mi Malla."}
          </AdaptiveDialogDescription>
        </AdaptiveDialogHeader>
        <AdaptiveDialogBody className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept={XLSX_ACCEPT}
            className="hidden"
            onChange={(event) => {
              chooseFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          {isReplacing &&
            (step.kind === "CHOOSE" || step.kind === "READING") && (
              <>
                <div className="space-y-2 rounded-lg border px-3 py-2.5 text-sm">
                  <p className="font-medium">
                    ¿Tus notas están en una planilla?
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Descarga tu progreso y pídele a un asistente como ChatGPT
                    que lo complete con tu planilla. Luego carga aquí el archivo
                    que te devuelva.
                  </p>
                  <Button variant="outline" size="sm" onClick={copyPrompt}>
                    <Copy data-icon="inline-start" />
                    Copiar instrucción
                  </Button>
                </div>
                <ReplaceNotice />
              </>
            )}

          {step.kind === "FAILED" && (
            <p className="flex gap-2 text-sm">
              <CircleAlert className="text-destructive mt-0.5 size-4 shrink-0" />
              {step.message}
            </p>
          )}

          {result && !result.ok && (
            <>
              <p className="text-muted-foreground text-sm">
                No se cargó nada. Corrige{" "}
                {result.errors.length === 1
                  ? "este error"
                  : `estos ${result.errors.length} errores`}{" "}
                y vuelve a intentarlo.
              </p>
              <IssueList issues={result.errors} />
            </>
          )}

          {step.kind === "PREVIEW" && step.result.ok && (
            <>
              {step.summary && (
                <SummaryList
                  summary={step.summary}
                  createdProgramName={
                    isReplacing ? null : step.target.curriculum.programName
                  }
                />
              )}
              {step.result.warnings.length > 0 && (
                <IssueList issues={step.result.warnings} />
              )}
              {isReplacing && <ReplaceNotice />}
            </>
          )}
        </AdaptiveDialogBody>
        <AdaptiveDialogFooter>
          <AdaptiveDialogClose render={<Button variant="ghost" />}>
            Cancelar
          </AdaptiveDialogClose>
          {result?.ok ? (
            <Button
              variant={isReplacing ? "destructive" : "default"}
              onClick={confirm}
            >
              {isReplacing ? "Reemplazar mi malla" : "Crear mi malla"}
            </Button>
          ) : (
            <Button
              disabled={step.kind === "READING"}
              onClick={() => inputRef.current?.click()}
            >
              {step.kind === "READING" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <FileUp data-icon="inline-start" />
              )}
              {step.kind === "CHOOSE" || step.kind === "READING"
                ? "Elegir archivo"
                : "Elegir otro archivo"}
            </Button>
          )}
        </AdaptiveDialogFooter>
      </AdaptiveDialogContent>
    </AdaptiveDialog>
  );
}
