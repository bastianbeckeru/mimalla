import {
  BASE_COLORS,
  DEFAULT_BASE_COLOR,
  getAreaShades,
  isHexColor,
} from "@/builder/colors";
import { isValidEffectiveYear, SCHEMA_VERSION } from "@/builder/export";
import { pushDownCollisions, slotsFitInPeriods } from "@/builder/grid";
import {
  comparePeriods,
  INTENSIVE_TERMS,
  isSamePeriod,
  REGULAR_TERMS,
} from "@/builder/periods";
import { dependsOn } from "@/builder/prerequisites";
import type {
  Area,
  Course,
  Curriculum,
  Draft,
  Period,
  Slot,
  TermSystem,
} from "@/types/builder";
import type { HexColor } from "@/types/colors";

type ImportResult = { ok: true; draft: Draft } | { ok: false; reason: string };

type FileObject = Record<string, unknown>;

class InvalidFileError extends Error {}

function reject(reason: string): never {
  throw new InvalidFileError(reason);
}

function isObject(value: unknown): value is FileObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isInteger(value: unknown): value is number {
  return Number.isInteger(value);
}

function readOptionalText(value: unknown, reason: string) {
  if (value === undefined) return "";
  if (typeof value !== "string") reject(reason);
  return value;
}

function readObjects(value: unknown, reason: string) {
  if (!Array.isArray(value) || !value.every(isObject)) reject(reason);
  return value;
}

function readSchemaVersion(value: unknown) {
  if (isInteger(value) && value > SCHEMA_VERSION)
    reject(
      `El archivo usa la versión ${value} del formato, más nueva que la que reconoce este constructor.`,
    );
  if (value !== SCHEMA_VERSION)
    reject(
      `La versión del formato (schemaVersion) debe ser ${SCHEMA_VERSION}.`,
    );
}

function readProgramName(program: unknown) {
  const name = isObject(program) ? program.name : undefined;
  if (typeof name !== "string" || name.trim() === "")
    reject("Falta el nombre del programa.");
  return name;
}

function readTermSystem(value: unknown): TermSystem {
  if (value !== "semester" && value !== "annual")
    reject('El régimen debe ser "semester" o "annual".');
  return value;
}

const TERM_SYSTEM_NAMES: Record<TermSystem, string> = {
  semester: "semestral",
  annual: "anual",
};

function readPeriods(value: unknown, termSystem: TermSystem): Period[] {
  const periods = readObjects(
    value,
    "La malla debe tener al menos un período.",
  ).map(({ programYear, term }) => {
    if (!isInteger(programYear) || !isInteger(term))
      reject("Cada período debe tener un año y un término enteros.");
    return { programYear, term };
  });
  if (periods.length === 0) reject("La malla debe tener al menos un período.");

  const validTerms = [
    ...REGULAR_TERMS[termSystem],
    ...INTENSIVE_TERMS[termSystem],
  ];
  const invalid = periods.find(({ term }) => !validTerms.includes(term));
  if (invalid)
    reject(
      `El período Año ${invalid.programYear}, término ${invalid.term} no existe en el régimen ${TERM_SYSTEM_NAMES[termSystem]}.`,
    );

  const isChronological = periods.every(
    (period, index) =>
      index === 0 || comparePeriods(periods[index - 1] as Period, period) < 0,
  );
  if (!isChronological)
    reject("Los períodos deben estar en orden cronológico y sin repetirse.");
  return periods;
}

function checkIds(items: FileObject[], reason: string) {
  const ids = new Set(items.map(({ id }) => id));
  const isSequence =
    ids.size === items.length &&
    items.every(({ id }) => isInteger(id) && id >= 1 && id <= items.length);
  if (!isSequence) reject(reason);
}

function isLowerCaseHexColor(color: unknown): color is HexColor {
  return (
    typeof color === "string" &&
    isHexColor(color) &&
    color === color.toLowerCase()
  );
}

function readAreas(value: unknown): Area[] {
  const areas = readObjects(value, "La malla debe tener una lista de áreas.");
  checkIds(
    areas,
    `Los ids de las áreas deben ir de 1 a ${areas.length}, sin saltos ni repetirse.`,
  );
  return areas.map(({ id, name, color }) => {
    if (typeof name !== "string") reject(`El área ${id} debe tener un nombre.`);
    if (!isLowerCaseHexColor(color))
      reject(
        `El color del área "${name}" debe tener el formato #rrggbb en minúsculas.`,
      );
    return { id: id as number, name, color };
  });
}

function readOptional<T>(
  value: unknown,
  fallback: T,
  isValid: (value: unknown) => value is T,
  reason: string,
) {
  if (value === undefined) return fallback;
  if (!isValid(value)) reject(reason);
  return value;
}

function readSlots(
  value: unknown,
  courseName: string,
  periods: Period[],
): Slot[] {
  const slots = readObjects(
    value,
    `El curso "${courseName}" debe tener al menos una ubicación.`,
  );
  if (slots.length === 0)
    reject(`El curso "${courseName}" debe tener al menos una ubicación.`);

  return slots.map(({ programYear, term, position }) => {
    if (!isInteger(position) || position < 1)
      reject(
        `Las ubicaciones del curso "${courseName}" deben estar en una fila entera desde 1.`,
      );
    const slot = {
      programYear: programYear as number,
      term: term as number,
      position,
    };
    if (!periods.some((period) => isSamePeriod(period, slot)))
      reject(`El curso "${courseName}" está en un período que no existe.`);
    return slot;
  });
}

function readCourse(
  value: FileObject,
  periods: Period[],
  areas: Area[],
  courseCount: number,
): Course {
  const id = value.id as number;
  const { name } = value;
  if (typeof name !== "string") reject(`El curso ${id} debe tener un nombre.`);
  const code = readOptionalText(
    value.code,
    `El código del curso "${name}" debe ser texto.`,
  );
  if (!isInteger(value.credits) || value.credits < 0)
    reject(
      `Los créditos del curso "${name}" deben ser un número entero mayor o igual a 0.`,
    );
  const duration = readOptional<number>(
    value.duration,
    1,
    (duration): duration is number => isInteger(duration) && duration > 1,
    `La duración del curso "${name}" debe ser un número entero mayor que 1 (se omite cuando es 1).`,
  );
  const areaId = readOptional<number | null>(
    value.areaId,
    null,
    (areaId): areaId is number => areas.some((area) => area.id === areaId),
    `El área del curso "${name}" no existe.`,
  );
  const prerequisiteIds = readOptional(
    value.prerequisiteIds,
    [],
    (ids): ids is number[] =>
      Array.isArray(ids) &&
      ids.length > 0 &&
      ids.every(isInteger) &&
      new Set(ids).size === ids.length,
    `Los prerrequisitos del curso "${name}" deben ser una lista de ids distintos (se omite cuando no tiene).`,
  );
  if (prerequisiteIds.some((prerequisiteId) => prerequisiteId === id))
    reject(`El curso "${name}" no puede ser su propio prerrequisito.`);
  if (
    prerequisiteIds.some(
      (prerequisiteId) => prerequisiteId < 1 || prerequisiteId > courseCount,
    )
  )
    reject(`El curso "${name}" tiene un prerrequisito que no existe.`);
  const prerequisiteCredits = readOptional<number>(
    value.prerequisiteCredits,
    0,
    (credits): credits is number => isInteger(credits) && credits > 0,
    `Los créditos aprobados mínimos del curso "${name}" deben ser un número entero mayor que 0 (se omiten cuando son 0).`,
  );
  const isElective = readOptional(
    value.isElective,
    false,
    (isElective) => isElective === true,
    `El curso "${name}" solo puede tener isElective: true (se omite cuando no es electivo).`,
  );
  const slots = readSlots(value.slots, name, periods);
  if (!isElective && slots.length > 1)
    reject(`El curso "${name}" tiene varias ubicaciones pero no es electivo.`);

  return {
    id,
    name,
    code,
    credits: value.credits,
    areaId,
    duration,
    prerequisiteIds,
    prerequisiteCredits,
    isElective,
    slots,
  };
}

function checkLayout(curriculum: Curriculum) {
  for (const course of curriculum.courses) {
    if (!slotsFitInPeriods(curriculum, course.slots, course.duration))
      reject(
        `El curso "${course.name}" se extiende más allá de la última columna.`,
      );
  }

  for (const course of curriculum.courses) {
    if (
      course.prerequisiteIds.some((prerequisiteId) =>
        dependsOn(curriculum, prerequisiteId, course.id),
      )
    )
      reject(`Los prerrequisitos del curso "${course.name}" forman un ciclo.`);
  }

  const settled = pushDownCollisions(curriculum);
  const overlapping = curriculum.courses.find((course, index) =>
    course.slots.some(
      (slot, slotIndex) =>
        settled.courses[index]?.slots[slotIndex]?.position !== slot.position,
    ),
  );
  if (overlapping)
    reject(`El curso "${overlapping.name}" se superpone con otro curso.`);
}

function readCourses(
  value: unknown,
  periods: Period[],
  areas: Area[],
): Course[] {
  const courses = readObjects(
    value,
    "La malla debe tener una lista de cursos.",
  );
  checkIds(
    courses,
    `Los ids de los cursos deben ir de 1 a ${courses.length}, sin saltos ni repetirse.`,
  );
  return courses.map((course) =>
    readCourse(course, periods, areas, courses.length),
  );
}

function readCurriculum(file: unknown): Curriculum {
  if (!isObject(file)) reject("El archivo no contiene una malla curricular.");
  readSchemaVersion(file.schemaVersion);
  const programName = readProgramName(file.program);
  const institution = readOptionalText(
    (file.program as FileObject).institution,
    "La institución debe ser texto.",
  );
  if (!isValidEffectiveYear(file.effectiveYear))
    reject("El año de vigencia debe ser un número entero entre 1900 y 2100.");
  const versionName = readOptionalText(
    file.versionName,
    "La versión debe ser texto.",
  );
  const termSystem = readTermSystem(file.termSystem);
  const periods = readPeriods(file.periods, termSystem);
  const areas = readAreas(file.areas);

  const curriculum = {
    programName,
    institution,
    effectiveYear: file.effectiveYear,
    versionName,
    termSystem,
    periods,
    areas,
    courses: readCourses(file.courses, periods, areas),
  };
  checkLayout(curriculum);
  return curriculum;
}

function restoreDraft(curriculum: Curriculum): Draft {
  const isShadeOf = (baseColor: HexColor) => (area: Area) =>
    getAreaShades(baseColor).some((shade) => shade === area.color);
  const baseColor = BASE_COLORS.reduce<HexColor>(
    (best, candidate) =>
      curriculum.areas.filter(isShadeOf(candidate)).length >
      curriculum.areas.filter(isShadeOf(best)).length
        ? candidate
        : best,
    DEFAULT_BASE_COLOR,
  );

  return {
    curriculum,
    baseColor,
    handColoredAreaIds: curriculum.areas
      .filter((area) => !isShadeOf(baseColor)(area))
      .map((area) => area.id),
  };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    reject("El archivo no es un JSON válido.");
  }
}

export function importFile(text: string): ImportResult {
  try {
    return { ok: true, draft: restoreDraft(readCurriculum(parseJson(text))) };
  } catch (error) {
    if (error instanceof InvalidFileError)
      return { ok: false, reason: error.message };
    throw error;
  }
}
