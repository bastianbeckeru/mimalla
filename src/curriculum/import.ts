import {
  BASE_COLORS,
  DEFAULT_BASE_COLOR,
  getAreaShades,
  isHexColor,
} from "@/curriculum/colors";
import { SCHEMA_VERSION } from "@/curriculum/export";
import {
  AREA_IDS,
  COURSE_IDS,
  readIds,
  TRACK_IDS,
  translateId,
} from "@/curriculum/file-ids";
import {
  type FileObject,
  InvalidFileError,
  isInteger,
  isObject,
  readObjects,
  readOptional,
  readOptionalText,
  reject,
} from "@/curriculum/file-reading";
import { pushDownCollisions, slotsFitInPeriods } from "@/curriculum/grid";
import {
  comparePeriods,
  INTENSIVE_TERMS,
  isSamePeriod,
  REGULAR_TERMS,
} from "@/curriculum/periods";
import { dependsOn } from "@/curriculum/prerequisites";
import { isValidEffectiveYear } from "@/curriculum/schemas";
import type { Draft } from "@/types/builder";
import type { HexColor } from "@/types/colors";
import type {
  Area,
  AreaId,
  Course,
  CourseId,
  CredentialType,
  Curriculum,
  Period,
  Slot,
  TermSystem,
  Track,
  TrackId,
} from "@/types/curriculum";

type ImportResult = { ok: true; draft: Draft } | { ok: false; reason: string };

function readSchemaVersion(value: unknown) {
  if (isInteger(value) && value > SCHEMA_VERSION)
    reject(
      `El archivo usa la versión ${value} del formato, más nueva que la que reconoce este constructor.`,
    );
  if (!isInteger(value) || value < 1)
    reject(
      `La versión del formato (schemaVersion) debe ser un número entre 1 y ${SCHEMA_VERSION}.`,
    );
  return value;
}

function readProgramName(program: unknown) {
  const name = isObject(program) ? program.name : undefined;
  if (typeof name !== "string" || name.trim() === "")
    reject("Falta el nombre del programa.");
  return name;
}

function readTermSystem(value: unknown, schemaVersion: number): TermSystem {
  if (value === "semester" || value === "annual") return value;
  if (value === "trimester" && schemaVersion >= 2) return value;
  reject(
    schemaVersion >= 2
      ? 'El régimen debe ser "semester", "trimester" o "annual".'
      : 'El régimen debe ser "semester" o "annual".',
  );
}

const TERM_SYSTEM_NAMES: Record<TermSystem, string> = {
  semester: "semestral",
  trimester: "trimestral",
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

function isLowerCaseHexColor(color: unknown): color is HexColor {
  return (
    typeof color === "string" &&
    isHexColor(color) &&
    color === color.toLowerCase()
  );
}

function readAreas(
  value: unknown,
  schemaVersion: number,
): { areas: Area[]; areaIds: Map<unknown, AreaId> } {
  const items = readObjects(value, "La malla debe tener una lista de áreas.");
  const areaIds = readIds(items, schemaVersion, AREA_IDS);
  const areas = items.map(({ id, name, color }) => {
    if (typeof name !== "string") reject(`El área ${id} debe tener un nombre.`);
    if (!isLowerCaseHexColor(color))
      reject(
        `El color del área "${name}" debe tener el formato #rrggbb en minúsculas.`,
      );
    return { id: translateId(areaIds, id), name, color };
  });
  return { areas, areaIds };
}

const CREDENTIAL_TYPES: CredentialType[] = [
  "professional",
  "academic",
  "technical",
  "certificate",
  "mention",
];

function isCredentialType(value: unknown): value is CredentialType {
  return CREDENTIAL_TYPES.includes(value as CredentialType);
}

function readTracks(
  value: unknown,
  schemaVersion: number,
): { tracks: Track[]; trackIds: Map<unknown, TrackId> } {
  const items = readObjects(value, "La malla debe tener una lista de planes.");
  const trackIds = readIds(items, schemaVersion, TRACK_IDS);
  const tracks = items.map(({ id, name, credentialType }) => {
    if (typeof name !== "string" || name.trim() === "")
      reject(`El plan ${id} debe tener un nombre.`);
    return {
      id: translateId(trackIds, id),
      name,
      credentialType: readOptional<CredentialType | null>(
        credentialType,
        null,
        isCredentialType,
        `La credencial del plan "${name}" debe ser "professional", "academic", "technical", "certificate" o "mention" (se omite cuando no otorga ninguna).`,
      ),
    };
  });
  return { tracks, trackIds };
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

type CourseContext = {
  periods: Period[];
  courseIds: Map<unknown, CourseId>;
  areaIds: Map<unknown, AreaId>;
  trackIds: Map<unknown, TrackId>;
};

function readCourse(
  value: FileObject,
  { periods, courseIds, areaIds, trackIds: knownTrackIds }: CourseContext,
): Course {
  const id = translateId(courseIds, value.id);
  const { name } = value;
  if (typeof name !== "string" || name.trim() === "")
    reject(`El curso ${id} debe tener un nombre.`);
  const code = readOptionalText(
    value.code,
    `El código del curso "${name}" debe ser texto.`,
    `El código del curso "${name}" no puede estar vacío (se omite cuando no tiene).`,
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
  const areaId =
    value.areaId === undefined
      ? null
      : (areaIds.get(value.areaId) ??
        reject(`El área del curso "${name}" no existe.`));
  const trackIds = readOptional(
    value.trackIds,
    [],
    (ids): ids is unknown[] =>
      Array.isArray(ids) &&
      ids.length > 0 &&
      new Set(ids).size === ids.length &&
      ids.every((trackId) => knownTrackIds.has(trackId)),
    `Los planes del curso "${name}" deben ser una lista de ids distintos de planes que existen (se omite cuando no tiene).`,
  ).map((trackId) => translateId(knownTrackIds, trackId));
  const fileIds = readOptional(
    value.prerequisiteIds,
    [],
    (ids): ids is unknown[] =>
      Array.isArray(ids) && ids.length > 0 && new Set(ids).size === ids.length,
    `Los prerrequisitos del curso "${name}" deben ser una lista de ids distintos (se omite cuando no tiene).`,
  );
  if (fileIds.some((prerequisiteId) => prerequisiteId === value.id))
    reject(`El curso "${name}" no puede ser su propio prerrequisito.`);
  if (fileIds.some((prerequisiteId) => !courseIds.has(prerequisiteId)))
    reject(`El curso "${name}" tiene un prerrequisito que no existe.`);
  const prerequisiteIds = fileIds.map((prerequisiteId) =>
    translateId(courseIds, prerequisiteId),
  );
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
    trackIds,
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
  schemaVersion: number,
  context: Omit<CourseContext, "courseIds">,
): Course[] {
  const courses = readObjects(
    value,
    "La malla debe tener una lista de cursos.",
  );
  const courseIds = readIds(courses, schemaVersion, COURSE_IDS);
  return courses.map((course) => readCourse(course, { ...context, courseIds }));
}

function checkTracksHaveCourses({ tracks, courses }: Curriculum) {
  const empty = tracks.find(
    (track) => !courses.some((course) => course.trackIds.includes(track.id)),
  );
  if (empty) reject(`El plan "${empty.name}" no tiene cursos.`);
}

function readCurriculum(file: unknown): Curriculum {
  if (!isObject(file)) reject("El archivo no contiene una malla curricular.");
  const schemaVersion = readSchemaVersion(file.schemaVersion);
  const programName = readProgramName(file.program);
  const institution = readOptionalText(
    (file.program as FileObject).institution,
    "La institución debe ser texto.",
    "La institución no puede estar vacía (se omite cuando no hay).",
  );
  if (!isValidEffectiveYear(file.effectiveYear))
    reject("El año de vigencia debe ser un número entero entre 1900 y 2100.");
  const versionName = readOptionalText(
    file.versionName,
    "La versión debe ser texto.",
    "La versión no puede estar vacía (se omite cuando no hay).",
  );
  const termSystem = readTermSystem(file.termSystem, schemaVersion);
  const periods = readPeriods(file.periods, termSystem);
  const { areas, areaIds } = readAreas(file.areas, schemaVersion);
  const { tracks, trackIds } = readTracks(file.tracks, schemaVersion);

  const curriculum = {
    programName,
    institution,
    effectiveYear: file.effectiveYear,
    versionName,
    termSystem,
    periods,
    areas,
    tracks,
    courses: readCourses(file.courses, schemaVersion, {
      periods,
      areaIds,
      trackIds,
    }),
  };
  checkTracksHaveCourses(curriculum);
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
