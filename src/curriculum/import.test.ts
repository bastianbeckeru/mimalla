import { describe, expect, test } from "bun:test";
import { apply } from "@/builder/apply";
import { createDraft } from "@/builder/draft";
import { exportFile, isExportable } from "@/curriculum/export";
import { importFile } from "@/curriculum/import";
import { are, crs, trk } from "@/test/ids";
import type { Action } from "@/types/builder";

type FileRecord = Record<string, unknown>;
type CourseFixture = FileRecord & { slots: FileRecord[] };
type FileFixture = FileRecord & {
  program: FileRecord;
  periods: FileRecord[];
  areas: [FileRecord];
  tracks: [FileRecord];
  courses: [CourseFixture, CourseFixture, CourseFixture];
};

function exampleFile(): FileFixture {
  return {
    schemaVersion: 2,
    program: { name: "Derecho", institution: "UDP" },
    effectiveYear: 2023,
    versionName: "v6.0",
    termSystem: "semester",
    periods: [
      { programYear: 1, term: 1 },
      { programYear: 1, term: 3 },
      { programYear: 1, term: 4 },
      { programYear: 2, term: 1 },
    ],
    areas: [{ id: are(1), name: "Derecho Privado", color: "#4f46e5" }],
    tracks: [
      {
        id: trk(1),
        name: "Licenciatura en Derecho",
        credentialType: "academic",
      },
    ],
    courses: [
      {
        id: crs(1),
        name: "Introducción al Derecho",
        code: "DER101",
        credits: 6,
        areaId: are(1),
        trackIds: [trk(1)],
        slots: [{ programYear: 1, term: 1, position: 1 }],
      },
      {
        id: crs(2),
        name: "Derecho Civil",
        credits: 10,
        duration: 2,
        trackIds: [trk(1)],
        prerequisiteIds: [crs(1)],
        prerequisiteCredits: 30,
        slots: [{ programYear: 1, term: 3, position: 1 }],
      },
      {
        id: crs(3),
        name: "Curso de Formación General",
        credits: 5,
        isElective: true,
        slots: [
          { programYear: 1, term: 1, position: 3 },
          { programYear: 2, term: 1, position: 3 },
        ],
      },
    ],
  };
}

function importChanged(change: (file: FileFixture) => void) {
  const file = exampleFile();
  change(file);
  return importFile(JSON.stringify(file));
}

function rejection(reason: string) {
  return { ok: false as const, reason };
}

describe("rejecting an invalid file", () => {
  test("rejects text that is not JSON", () => {
    expect(importFile("{nope")).toEqual(
      rejection("El archivo no es un JSON válido."),
    );
  });

  test("rejects JSON that is not an object", () => {
    expect(importFile("[1, 2]")).toEqual(
      rejection("El archivo no contiene una malla curricular."),
    );
  });

  test("rejects a missing schema version", () => {
    expect(
      importChanged((file) => {
        delete file.schemaVersion;
      }),
    ).toEqual(
      rejection(
        "La versión del formato (schemaVersion) debe ser un número entre 1 y 2.",
      ),
    );
  });

  test("rejects a higher schema version", () => {
    expect(
      importChanged((file) => {
        file.schemaVersion = 3;
      }),
    ).toEqual(
      rejection(
        "El archivo usa la versión 3 del formato, más nueva que la que reconoce este constructor.",
      ),
    );
  });

  test("rejects an empty program name", () => {
    expect(
      importChanged((file) => {
        file.program.name = "  ";
      }),
    ).toEqual(rejection("Falta el nombre del programa."));
  });

  test("rejects a missing program", () => {
    expect(
      importChanged((file) => {
        Reflect.deleteProperty(file, "program");
      }),
    ).toEqual(rejection("Falta el nombre del programa."));
  });

  test("rejects an institution that is not text", () => {
    expect(
      importChanged((file) => {
        file.program.institution = 7;
      }),
    ).toEqual(rejection("La institución debe ser texto."));
  });

  test("rejects an empty institution written in the file", () => {
    expect(
      importChanged((file) => {
        file.program.institution = "";
      }),
    ).toEqual(
      rejection(
        "La institución no puede estar vacía (se omite cuando no hay).",
      ),
    );
  });

  test("rejects an effective year outside 1900–2100", () => {
    expect(
      importChanged((file) => {
        file.effectiveYear = 2101;
      }),
    ).toEqual(
      rejection(
        "El año de vigencia debe ser un número entero entre 1900 y 2100.",
      ),
    );
  });

  test("rejects an effective year that is not an integer", () => {
    expect(
      importChanged((file) => {
        file.effectiveYear = "2023";
      }),
    ).toEqual(
      rejection(
        "El año de vigencia debe ser un número entero entre 1900 y 2100.",
      ),
    );
  });

  test("rejects a version name that is not text", () => {
    expect(
      importChanged((file) => {
        file.versionName = 6;
      }),
    ).toEqual(rejection("La versión debe ser texto."));
  });

  test("rejects an empty version name written in the file", () => {
    expect(
      importChanged((file) => {
        file.versionName = "";
      }),
    ).toEqual(
      rejection("La versión no puede estar vacía (se omite cuando no hay)."),
    );
  });

  test("rejects an unknown term system", () => {
    expect(
      importChanged((file) => {
        file.termSystem = "quarter";
      }),
    ).toEqual(
      rejection('El régimen debe ser "semester", "trimester" o "annual".'),
    );
  });

  test("rejects a curriculum without periods", () => {
    expect(
      importChanged((file) => {
        file.periods = [];
        file.courses = [] as unknown as FileFixture["courses"];
      }),
    ).toEqual(rejection("La malla debe tener al menos un período."));
  });

  test("rejects a period whose program year is not an integer", () => {
    expect(
      importChanged((file) => {
        file.periods[0] = { programYear: 1.5, term: 1 };
      }),
    ).toEqual(
      rejection("Cada período debe tener un año y un término enteros."),
    );
  });

  test("rejects a term that does not belong to the term system", () => {
    expect(
      importChanged((file) => {
        file.termSystem = "annual";
      }),
    ).toEqual(
      rejection("El período Año 1, término 3 no existe en el régimen anual."),
    );
  });

  test("rejects repeated periods", () => {
    expect(
      importChanged((file) => {
        file.periods.splice(1, 0, { programYear: 1, term: 1 });
      }),
    ).toEqual(
      rejection(
        "Los períodos deben estar en orden cronológico y sin repetirse.",
      ),
    );
  });

  test("rejects periods out of chronological order", () => {
    expect(
      importChanged((file) => {
        file.periods.reverse();
      }),
    ).toEqual(
      rejection(
        "Los períodos deben estar en orden cronológico y sin repetirse.",
      ),
    );
  });

  test("rejects an area id without its prefix", () => {
    expect(
      importChanged((file) => {
        file.areas[0].id = crs(1);
        file.courses[0].areaId = crs(1);
      }),
    ).toEqual(
      rejection(
        "Los ids de las áreas deben ser distintos y tener la forma are_ seguida de 8 letras o números.",
      ),
    );
  });

  test("rejects repeated course ids", () => {
    expect(
      importChanged((file) => {
        file.courses[2].id = crs(2);
      }),
    ).toEqual(
      rejection(
        "Los ids de los cursos deben ser distintos y tener la forma crs_ seguida de 8 letras o números.",
      ),
    );
  });

  test("rejects an area without a name", () => {
    expect(
      importChanged((file) => {
        delete file.areas[0].name;
      }),
    ).toEqual(rejection("El área are_00000001 debe tener un nombre."));
  });

  test("rejects an area color that is not lowercase #rrggbb", () => {
    expect(
      importChanged((file) => {
        file.areas[0].color = "#4F46E5";
      }),
    ).toEqual(
      rejection(
        'El color del área "Derecho Privado" debe tener el formato #rrggbb en minúsculas.',
      ),
    );
  });

  test("rejects a missing track list", () => {
    expect(
      importChanged((file) => {
        Reflect.deleteProperty(file, "tracks");
      }),
    ).toEqual(rejection("La malla debe tener una lista de planes."));
  });

  test("rejects a track id that is a number", () => {
    expect(
      importChanged((file) => {
        file.tracks[0].id = 1;
      }),
    ).toEqual(
      rejection(
        "Los ids de los planes deben ser distintos y tener la forma trk_ seguida de 8 letras o números.",
      ),
    );
  });

  test("rejects a track with a blank name", () => {
    expect(
      importChanged((file) => {
        file.tracks[0].name = " ";
      }),
    ).toEqual(rejection("El plan trk_00000001 debe tener un nombre."));
  });

  test("rejects an unknown credential type", () => {
    expect(
      importChanged((file) => {
        file.tracks[0].credentialType = "doctorate";
      }),
    ).toEqual(
      rejection(
        'La credencial del plan "Licenciatura en Derecho" debe ser "professional", "academic", "technical", "certificate" o "mention" (se omite cuando no otorga ninguna).',
      ),
    );
  });

  test("rejects a credential type written as null", () => {
    expect(
      importChanged((file) => {
        file.tracks[0].credentialType = null;
      }),
    ).toEqual(
      rejection(
        'La credencial del plan "Licenciatura en Derecho" debe ser "professional", "academic", "technical", "certificate" o "mention" (se omite cuando no otorga ninguna).',
      ),
    );
  });

  test("rejects a track without courses", () => {
    expect(
      importChanged((file) => {
        file.tracks.push({ id: trk(2), name: "Título de Abogado" });
      }),
    ).toEqual(rejection('El plan "Título de Abogado" no tiene cursos.'));
  });

  test("rejects a course without a name", () => {
    expect(
      importChanged((file) => {
        file.courses[1].name = null;
      }),
    ).toEqual(rejection("El curso crs_00000002 debe tener un nombre."));
  });

  test("rejects a course with a blank name", () => {
    expect(
      importChanged((file) => {
        file.courses[1].name = "  ";
      }),
    ).toEqual(rejection("El curso crs_00000002 debe tener un nombre."));
  });

  test("rejects a course code that is not text", () => {
    expect(
      importChanged((file) => {
        file.courses[0].code = 101;
      }),
    ).toEqual(
      rejection(
        'El código del curso "Introducción al Derecho" debe ser texto.',
      ),
    );
  });

  test("rejects an empty course code written in the file", () => {
    expect(
      importChanged((file) => {
        file.courses[0].code = "";
      }),
    ).toEqual(
      rejection(
        'El código del curso "Introducción al Derecho" no puede estar vacío (se omite cuando no tiene).',
      ),
    );
  });

  test("rejects negative credits", () => {
    expect(
      importChanged((file) => {
        file.courses[1].credits = -1;
      }),
    ).toEqual(
      rejection(
        'Los créditos del curso "Derecho Civil" deben ser un número entero mayor o igual a 0.',
      ),
    );
  });

  test("rejects credits that are not an integer", () => {
    expect(
      importChanged((file) => {
        file.courses[1].credits = 5.5;
      }),
    ).toEqual(
      rejection(
        'Los créditos del curso "Derecho Civil" deben ser un número entero mayor o igual a 0.',
      ),
    );
  });

  test("rejects a duration of 1 written in the file", () => {
    expect(
      importChanged((file) => {
        file.courses[0].duration = 1;
      }),
    ).toEqual(
      rejection(
        'La duración del curso "Introducción al Derecho" debe ser un número entero mayor que 1 (se omite cuando es 1).',
      ),
    );
  });

  test("rejects a duration below 1", () => {
    expect(
      importChanged((file) => {
        file.courses[0].duration = 0;
      }),
    ).toEqual(
      rejection(
        'La duración del curso "Introducción al Derecho" debe ser un número entero mayor que 1 (se omite cuando es 1).',
      ),
    );
  });

  test("rejects a duration that spans past the last column", () => {
    expect(
      importChanged((file) => {
        file.courses[1].duration = 4;
      }),
    ).toEqual(
      rejection(
        'El curso "Derecho Civil" se extiende más allá de la última columna.',
      ),
    );
  });

  test("rejects an area that does not exist", () => {
    expect(
      importChanged((file) => {
        file.courses[0].areaId = are(2);
      }),
    ).toEqual(
      rejection('El área del curso "Introducción al Derecho" no existe.'),
    );
  });

  test("rejects an area written as null", () => {
    expect(
      importChanged((file) => {
        file.courses[1].areaId = null;
      }),
    ).toEqual(rejection('El área del curso "Derecho Civil" no existe.'));
  });

  test("rejects a track that does not exist", () => {
    expect(
      importChanged((file) => {
        file.courses[0].trackIds = [trk(1), trk(2)];
      }),
    ).toEqual(
      rejection(
        'Los planes del curso "Introducción al Derecho" deben ser una lista de ids distintos de planes que existen (se omite cuando no tiene).',
      ),
    );
  });

  test("rejects an empty or repeated track list", () => {
    for (const trackIds of [[], [trk(1), trk(1)]])
      expect(
        importChanged((file) => {
          file.courses[0].trackIds = trackIds;
        }),
      ).toEqual(
        rejection(
          'Los planes del curso "Introducción al Derecho" deben ser una lista de ids distintos de planes que existen (se omite cuando no tiene).',
        ),
      );
  });

  test("rejects an empty prerequisite list", () => {
    expect(
      importChanged((file) => {
        file.courses[1].prerequisiteIds = [];
      }),
    ).toEqual(
      rejection(
        'Los prerrequisitos del curso "Derecho Civil" deben ser una lista de ids distintos (se omite cuando no tiene).',
      ),
    );
  });

  test("rejects a repeated prerequisite", () => {
    expect(
      importChanged((file) => {
        file.courses[1].prerequisiteIds = [crs(1), crs(1)];
      }),
    ).toEqual(
      rejection(
        'Los prerrequisitos del curso "Derecho Civil" deben ser una lista de ids distintos (se omite cuando no tiene).',
      ),
    );
  });

  test("rejects a prerequisite that does not exist", () => {
    expect(
      importChanged((file) => {
        file.courses[1].prerequisiteIds = [crs(4)];
      }),
    ).toEqual(
      rejection(
        'El curso "Derecho Civil" tiene un prerrequisito que no existe.',
      ),
    );
  });

  test("rejects a course that is its own prerequisite", () => {
    expect(
      importChanged((file) => {
        file.courses[1].prerequisiteIds = [crs(2)];
      }),
    ).toEqual(
      rejection(
        'El curso "Derecho Civil" no puede ser su propio prerrequisito.',
      ),
    );
  });

  test("rejects a cycle of prerequisites", () => {
    expect(
      importChanged((file) => {
        file.courses[0].prerequisiteIds = [crs(3)];
        file.courses[2].prerequisiteIds = [crs(2)];
      }),
    ).toEqual(
      rejection(
        'Los prerrequisitos del curso "Introducción al Derecho" forman un ciclo.',
      ),
    );
  });

  test("rejects prerequisite credits of 0 written in the file", () => {
    expect(
      importChanged((file) => {
        file.courses[0].prerequisiteCredits = 0;
      }),
    ).toEqual(
      rejection(
        'Los créditos aprobados mínimos del curso "Introducción al Derecho" deben ser un número entero mayor que 0 (se omiten cuando son 0).',
      ),
    );
  });

  test("rejects isElective written as false", () => {
    expect(
      importChanged((file) => {
        file.courses[0].isElective = false;
      }),
    ).toEqual(
      rejection(
        'El curso "Introducción al Derecho" solo puede tener isElective: true (se omite cuando no es electivo).',
      ),
    );
  });

  test("rejects a course that is not elective in more than one slot", () => {
    expect(
      importChanged((file) => {
        delete file.courses[2].isElective;
      }),
    ).toEqual(
      rejection(
        'El curso "Curso de Formación General" tiene varias ubicaciones pero no es electivo.',
      ),
    );
  });

  test("rejects a course without slots", () => {
    expect(
      importChanged((file) => {
        file.courses[0].slots = [];
      }),
    ).toEqual(
      rejection(
        'El curso "Introducción al Derecho" debe tener al menos una ubicación.',
      ),
    );
  });

  test("rejects a slot in a period that does not exist", () => {
    expect(
      importChanged((file) => {
        file.courses[0].slots = [{ programYear: 1, term: 2, position: 1 }];
      }),
    ).toEqual(
      rejection(
        'El curso "Introducción al Derecho" está en un período que no existe.',
      ),
    );
  });

  test("rejects a slot position below 1", () => {
    expect(
      importChanged((file) => {
        file.courses[0].slots = [{ programYear: 1, term: 1, position: 0 }];
      }),
    ).toEqual(
      rejection(
        'Las ubicaciones del curso "Introducción al Derecho" deben estar en una fila entera desde 1.',
      ),
    );
  });

  test("rejects overlapping courses", () => {
    expect(
      importChanged((file) => {
        file.courses[2].slots = [{ programYear: 1, term: 4, position: 2 }];
        delete file.courses[2].isElective;
      }),
    ).toEqual(
      rejection(
        'El curso "Curso de Formación General" se superpone con otro curso.',
      ),
    );
  });
});

describe("importing a file", () => {
  test("loads a file without an institution as an incomplete draft", () => {
    const result = importChanged((file) => {
      Reflect.deleteProperty(file.program, "institution");
    });

    expect(result.ok && result.draft.curriculum.institution).toBe("");
    expect(result.ok && isExportable(result.draft)).toBe(false);
  });

  test("restores the curriculum of a valid file", () => {
    const result = importFile(JSON.stringify(exampleFile()));

    expect(result).toEqual({
      ok: true,
      draft: {
        curriculum: {
          programName: "Derecho",
          institution: "UDP",
          effectiveYear: 2023,
          versionName: "v6.0",
          termSystem: "semester",
          periods: [
            { programYear: 1, term: 1 },
            { programYear: 1, term: 3 },
            { programYear: 1, term: 4 },
            { programYear: 2, term: 1 },
          ],
          areas: [{ id: are(1), name: "Derecho Privado", color: "#4f46e5" }],
          tracks: [
            {
              id: trk(1),
              name: "Licenciatura en Derecho",
              credentialType: "academic",
            },
          ],
          courses: [
            {
              id: crs(1),
              name: "Introducción al Derecho",
              code: "DER101",
              credits: 6,
              areaId: are(1),
              trackIds: [trk(1)],
              duration: 1,
              prerequisiteIds: [],
              prerequisiteCredits: 0,
              isElective: false,
              slots: [{ programYear: 1, term: 1, position: 1 }],
            },
            {
              id: crs(2),
              name: "Derecho Civil",
              code: "",
              credits: 10,
              areaId: null,
              trackIds: [trk(1)],
              duration: 2,
              prerequisiteIds: [crs(1)],
              prerequisiteCredits: 30,
              isElective: false,
              slots: [{ programYear: 1, term: 3, position: 1 }],
            },
            {
              id: crs(3),
              name: "Curso de Formación General",
              code: "",
              credits: 5,
              areaId: null,
              trackIds: [],
              duration: 1,
              prerequisiteIds: [],
              prerequisiteCredits: 0,
              isElective: true,
              slots: [
                { programYear: 1, term: 1, position: 3 },
                { programYear: 2, term: 1, position: 3 },
              ],
            },
          ],
        },
        baseColor: "#4f46e5",
        handColoredAreaIds: [are(1)],
      },
    });
  });
});

/** The example file as version 1 wrote it, with ids numbered from 1. */
function exampleFileV1() {
  const file = exampleFile();
  const numbers = new Map<unknown, number>([
    [crs(1), 1],
    [crs(2), 2],
    [crs(3), 3],
    [are(1), 1],
    [trk(1), 1],
  ]);
  const number = (id: unknown) => numbers.get(id);
  return {
    ...file,
    schemaVersion: 1,
    areas: file.areas.map((area) => ({ ...area, id: number(area.id) })),
    tracks: file.tracks.map((track) => ({ ...track, id: number(track.id) })),
    courses: file.courses.map((course) => ({
      ...course,
      id: number(course.id),
      ...(course.areaId !== undefined && { areaId: number(course.areaId) }),
      ...(Array.isArray(course.trackIds) && {
        trackIds: course.trackIds.map(number),
      }),
      ...(Array.isArray(course.prerequisiteIds) && {
        prerequisiteIds: course.prerequisiteIds.map(number),
      }),
    })),
  };
}

describe("importing a version 1 file", () => {
  test("gives new ids to courses, areas and tracks and keeps their references", () => {
    const result = importFile(JSON.stringify(exampleFileV1()));
    if (!result.ok) throw new Error(result.reason);
    const { areas, tracks, courses } = result.draft.curriculum;
    const [intro, civil] = courses;

    expect(areas[0]?.id).toMatch(/^are_[A-Za-z0-9]{8}$/);
    expect(tracks[0]?.id).toMatch(/^trk_[A-Za-z0-9]{8}$/);
    expect(courses.map((course) => course.id)).toEqual([
      expect.stringMatching(/^crs_[A-Za-z0-9]{8}$/),
      expect.stringMatching(/^crs_[A-Za-z0-9]{8}$/),
      expect.stringMatching(/^crs_[A-Za-z0-9]{8}$/),
    ]);
    expect(intro?.areaId).toBe(areas[0]?.id ?? null);
    expect(intro?.trackIds).toEqual(tracks.map((track) => track.id));
    expect(civil?.prerequisiteIds).toEqual(intro ? [intro.id] : []);
  });

  test("rejects ids with gaps", () => {
    const file = exampleFileV1();
    file.areas[0] = { ...file.areas[0], id: 2 };

    expect(importFile(JSON.stringify(file))).toEqual(
      rejection(
        "Los ids de las áreas deben ir de 1 a 1, sin saltos ni repetirse.",
      ),
    );
  });

  test("rejects the trimester term system", () => {
    expect(
      importFile(
        JSON.stringify({ ...exampleFileV1(), termSystem: "trimester" }),
      ),
    ).toEqual(rejection('El régimen debe ser "semester" o "annual".'));
  });
});

describe("importing a trimester file", () => {
  test("loads three regular terms and an intensive one per year", () => {
    const result = importChanged((file) => {
      file.termSystem = "trimester";
      file.periods = [
        { programYear: 1, term: 1 },
        { programYear: 1, term: 2 },
        { programYear: 1, term: 3 },
        { programYear: 1, term: 4 },
        { programYear: 2, term: 1 },
      ];
    });

    expect(result.ok && result.draft.curriculum.termSystem).toBe("trimester");
    expect(result.ok && result.draft.curriculum.periods).toHaveLength(5);
  });
});

function draftAfter(...actions: Action[]) {
  return actions.reduce(apply, createDraft("semester"));
}

function importDraft(text: string) {
  const result = importFile(text);
  if (!result.ok) throw new Error(result.reason);
  return result.draft;
}

const curriculumActions: Action[] = [
  {
    type: "editDetails",
    changes: {
      programName: "Derecho",
      effectiveYear: 2023,
      institution: "UDP",
      versionName: "v6.0",
    },
  },
  { type: "addIntensiveTerm", programYear: 1, term: 4 },
  { type: "addArea", id: are(1), name: "Privado" },
  { type: "addArea", id: are(2), name: "Público" },
  {
    type: "addCourse",
    id: crs(1),
    name: "Nuevo curso",
    period: { programYear: 1, term: 1 },
  },
  {
    type: "addCourse",
    id: crs(2),
    name: "Nuevo curso",
    period: { programYear: 1, term: 1 },
  },
  {
    type: "addCourse",
    id: crs(3),
    name: "Nuevo curso",
    period: { programYear: 1, term: 3 },
  },
  {
    type: "editCourse",
    courseId: crs(1),
    changes: { name: "Civil", code: "D1" },
  },
  { type: "editCourse", courseId: crs(2), changes: { isElective: true } },
  { type: "addSlot", courseId: crs(2) },
  {
    type: "moveSlot",
    courseId: crs(2),
    slotIndex: 1,
    to: { programYear: 2, term: 1, position: 2 },
  },
  {
    type: "editCourse",
    courseId: crs(3),
    changes: { credits: 10, duration: 2 },
  },
  { type: "assignArea", courseId: crs(1), areaId: are(2) },
  { type: "assignArea", courseId: crs(3), areaId: are(1) },
  { type: "addPrerequisite", courseId: crs(3), prerequisiteId: crs(1) },
  { type: "setPrerequisiteCredits", courseId: crs(3), credits: 30 },
  { type: "addTrack", id: trk(1), name: "Plan Común" },
  { type: "addTrack", id: trk(2), name: "Licenciatura" },
  {
    type: "editTrack",
    trackId: trk(2),
    changes: { credentialType: "academic" },
  },
  { type: "assignTracks", courseId: crs(1), trackIds: [trk(1), trk(2)] },
  { type: "assignTracks", courseId: crs(3), trackIds: [trk(2)] },
];

describe("loading back a downloaded file", () => {
  test("export, import and export again yields the same file", () => {
    const file = exportFile(draftAfter(...curriculumActions));

    expect(exportFile(importDraft(file))).toBe(file);
  });

  test("restores the same draft when it was built in file order", () => {
    const draft = draftAfter(
      ...curriculumActions,
      { type: "assignArea", courseId: crs(1), areaId: are(1) },
      { type: "assignArea", courseId: crs(3), areaId: are(2) },
    );

    expect(importDraft(exportFile(draft))).toEqual(draft);
  });

  test("restores the base color from the area shades and keeps other colors as hand-colored", () => {
    const draft = draftAfter(
      ...curriculumActions,
      { type: "addArea", id: are(3), name: "Sin cursos" },
      { type: "setBaseColor", color: "#16a34a" },
      { type: "setAreaColor", areaId: are(3), color: "#123456" },
    );

    const imported = importDraft(exportFile(draft));

    expect(imported.baseColor).toBe("#16a34a");
    expect(imported.handColoredAreaIds).toEqual([are(3)]);
  });
});
