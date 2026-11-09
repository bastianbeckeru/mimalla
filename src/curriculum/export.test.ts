import { describe, expect, test } from "bun:test";
import { apply } from "@/builder/apply";
import { createDraft } from "@/builder/draft";
import { exportFile, getFileName } from "@/curriculum/export";
import { are, crs, trk } from "@/test/ids";
import type { Action } from "@/types/builder";
import type { Area, CourseId } from "@/types/curriculum";

function draftAfter(...actions: Action[]) {
  return actions.reduce(apply, createDraft("semester"));
}

const details: Action = {
  type: "editDetails",
  changes: { programName: "Derecho", effectiveYear: 2023 },
};

const PERIODS =
  '[{"programYear":1,"term":1},{"programYear":1,"term":3},' +
  '{"programYear":2,"term":1},{"programYear":2,"term":3},' +
  '{"programYear":3,"term":1},{"programYear":3,"term":3},' +
  '{"programYear":4,"term":1},{"programYear":4,"term":3},' +
  '{"programYear":5,"term":1},{"programYear":5,"term":3}]';

describe("exporting a curriculum", () => {
  test("writes minified JSON with schema version 2 and only the fields set", () => {
    expect(exportFile(draftAfter(details))).toBe(
      `{"schemaVersion":2,"program":{"name":"Derecho"},"effectiveYear":2023,"termSystem":"semester","periods":${PERIODS},"areas":[],"tracks":[],"courses":[]}`,
    );
  });

  test("writes the institution in the program and the version name after the effective year", () => {
    const draft = draftAfter(details, {
      type: "editDetails",
      changes: { versionName: "v6.0", institution: "UDP" },
    });

    expect(exportFile(draft)).toStartWith(
      '{"schemaVersion":2,"program":{"name":"Derecho","institution":"UDP"},"effectiveYear":2023,"versionName":"v6.0","termSystem":"semester",',
    );
  });

  test("omits an institution and version name cleared back to empty", () => {
    const draft = draftAfter(
      details,
      {
        type: "editDetails",
        changes: { institution: "UDP", versionName: "v6.0" },
      },
      { type: "editDetails", changes: { institution: "", versionName: "" } },
    );

    expect(exportFile(draft)).toStartWith(
      '{"schemaVersion":2,"program":{"name":"Derecho"},"effectiveYear":2023,"termSystem":"semester",',
    );
  });

  test("writes areas by first appearance with their ids, and each course's areaId", () => {
    const draft = draftAfter(
      details,
      { type: "addArea", id: are(1), name: "Sin cursos" },
      { type: "addArea", id: are(2), name: "Público" },
      { type: "addArea", id: are(3), name: "Privado" },
      { type: "setAreaColor", areaId: are(3), color: "#ff8800" },
      { type: "setBaseColor", color: "#16a34a" },
      {
        type: "addCourse",
        id: crs(1),
        name: "Nuevo curso",
        period: { programYear: 2, term: 1 },
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
        period: { programYear: 1, term: 1 },
      },
      { type: "assignArea", courseId: crs(1), areaId: are(2) },
      { type: "assignArea", courseId: crs(2), areaId: are(3) },
    );
    const [unused, publico] = draft.curriculum.areas as [Area, Area];
    const file = exportFile(draft);

    expect(JSON.parse(file).areas).toEqual([
      { id: are(3), name: "Privado", color: "#ff8800" },
      { id: are(2), name: "Público", color: publico.color },
      { id: are(1), name: "Sin cursos", color: unused.color },
    ]);
    expect(file).toContain(
      `"courses":[{"id":"${crs(2)}","name":"Nuevo curso","credits":5,"areaId":"${are(3)}","slots":[{"programYear":1,"term":1,"position":1}]},` +
        `{"id":"${crs(3)}","name":"Nuevo curso","credits":5,"slots":[{"programYear":1,"term":1,"position":2}]},` +
        `{"id":"${crs(1)}","name":"Nuevo curso","credits":5,"areaId":"${are(2)}","slots":[{"programYear":2,"term":1,"position":1}]}]`,
    );
    expect(file).not.toContain("16a34a");
    expect(file).not.toContain("baseColor");
    expect(file).not.toContain("handColored");
  });

  test("writes tracks in order with their credential type when set, and each course's trackIds after its area", () => {
    const draft = draftAfter(
      details,
      { type: "addArea", id: are(1), name: "Privado" },
      { type: "addTrack", id: trk(1), name: "Sin uso" },
      { type: "addTrack", id: trk(2), name: "Plan Común" },
      { type: "addTrack", id: trk(3), name: "Licenciatura en Derecho" },
      {
        type: "editTrack",
        trackId: trk(3),
        changes: { credentialType: "academic" },
      },
      { type: "deleteTrack", trackId: trk(1) },
      {
        type: "addCourse",
        id: crs(1),
        name: "Nuevo curso",
        period: { programYear: 1, term: 1 },
      },
      { type: "assignArea", courseId: crs(1), areaId: are(1) },
      { type: "assignTracks", courseId: crs(1), trackIds: [trk(3), trk(2)] },
    );
    const file = exportFile(draft);

    expect(file).toContain(
      `"tracks":[{"id":"${trk(2)}","name":"Plan Común"},{"id":"${trk(3)}","name":"Licenciatura en Derecho","credentialType":"academic"}],` +
        `"courses":[{"id":"${crs(1)}","name":"Nuevo curso","credits":5,"areaId":"${are(1)}","trackIds":["${trk(2)}","${trk(3)}"],"slots":[{"programYear":1,"term":1,"position":1}]}]`,
    );
  });

  test("sorts courses by their first slot and keeps their ids", () => {
    const draft = draftAfter(
      details,
      {
        type: "addCourse",
        id: crs(1),
        name: "Nuevo curso",
        period: { programYear: 2, term: 1 },
      },
      {
        type: "addCourse",
        id: crs(2),
        name: "Nuevo curso",
        period: { programYear: 1, term: 3 },
      },
      {
        type: "addCourse",
        id: crs(3),
        name: "Nuevo curso",
        period: { programYear: 1, term: 3 },
      },
      { type: "editCourse", courseId: crs(1), changes: { name: "Penal" } },
      { type: "editCourse", courseId: crs(2), changes: { name: "Romano" } },
      {
        type: "editCourse",
        courseId: crs(3),
        changes: { credits: 6, name: "Civil" },
      },
    );

    expect(JSON.parse(exportFile(draft)).courses).toEqual([
      {
        id: crs(2),
        name: "Romano",
        credits: 5,
        slots: [{ programYear: 1, term: 3, position: 1 }],
      },
      {
        id: crs(3),
        name: "Civil",
        credits: 6,
        slots: [{ programYear: 1, term: 3, position: 2 }],
      },
      {
        id: crs(1),
        name: "Penal",
        credits: 5,
        slots: [{ programYear: 2, term: 1, position: 1 }],
      },
    ]);
  });

  test("writes keys in a fixed order regardless of the editing order", () => {
    const course: Action = {
      type: "addCourse",
      id: crs(1),
      name: "Nuevo curso",
      period: { programYear: 1, term: 1 },
    };
    const first = draftAfter(details, course, {
      type: "editCourse",
      courseId: crs(1),
      changes: { credits: 6, name: "Civil" },
    });
    const second = draftAfter(
      {
        type: "editDetails",
        changes: { effectiveYear: 2023, programName: "Derecho" },
      },
      course,
      { type: "editCourse", courseId: crs(1), changes: { name: "Civil" } },
      { type: "editCourse", courseId: crs(1), changes: { credits: 6 } },
    );

    expect(exportFile(first)).toBe(exportFile(second));
    expect(exportFile(first)).toBe(exportFile(first));
    expect(exportFile(first)).toContain(
      `"courses":[{"id":"${crs(1)}","name":"Civil","credits":6,"slots":[{"programYear":1,"term":1,"position":1}]}]`,
    );
  });

  test("writes the term system and the periods in chronological order", () => {
    const draft = draftAfter(
      {
        type: "createCurriculum",
        termSystem: "annual",
        details: {
          programName: "Derecho",
          institution: "",
          effectiveYear: 2023,
          versionName: "",
        },
      },
      { type: "removePeriod", period: { programYear: 5, term: 1 } },
      { type: "removePeriod", period: { programYear: 4, term: 1 } },
      { type: "removePeriod", period: { programYear: 3, term: 1 } },
      { type: "addIntensiveTerm", programYear: 2, term: 4 },
      { type: "addIntensiveTerm", programYear: 1, term: 4 },
    );

    expect(exportFile(draft)).toContain(
      '"termSystem":"annual","periods":[{"programYear":1,"term":1},{"programYear":1,"term":4},{"programYear":2,"term":1},{"programYear":2,"term":4}]',
    );
  });

  test("writes the course code after the name, and omits it when empty", () => {
    const course = (id: CourseId): Action => ({
      type: "addCourse",
      id,
      name: "Nuevo curso",
      period: { programYear: 1, term: 1 },
    });
    const draft = draftAfter(
      details,
      course(crs(1)),
      course(crs(2)),
      { type: "editCourse", courseId: crs(1), changes: { code: "DER101" } },
      { type: "editCourse", courseId: crs(2), changes: { code: "DER102" } },
      { type: "editCourse", courseId: crs(2), changes: { code: "" } },
    );

    expect(exportFile(draft)).toContain(
      `"courses":[{"id":"${crs(1)}","name":"Nuevo curso","code":"DER101","credits":5,"slots":[{"programYear":1,"term":1,"position":1}]},` +
        `{"id":"${crs(2)}","name":"Nuevo curso","credits":5,"slots":[{"programYear":1,"term":1,"position":2}]}]`,
    );
  });

  test("writes isElective before the slots of an elective and omits it otherwise", () => {
    const draft = draftAfter(
      details,
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
      { type: "editCourse", courseId: crs(1), changes: { isElective: true } },
      { type: "addSlot", courseId: crs(1) },
      {
        type: "moveSlot",
        courseId: crs(1),
        slotIndex: 1,
        to: { programYear: 2, term: 1, position: 1 },
      },
    );

    expect(exportFile(draft)).toContain(
      `"courses":[{"id":"${crs(1)}","name":"Nuevo curso","credits":5,"isElective":true,"slots":[{"programYear":1,"term":1,"position":1},{"programYear":2,"term":1,"position":1}]},` +
        `{"id":"${crs(2)}","name":"Nuevo curso","credits":5,"slots":[{"programYear":1,"term":1,"position":2}]}]`,
    );
  });

  test("writes prerequisites in course order and prerequisite credits after the area, and omits them when empty or 0", () => {
    const draft = draftAfter(
      details,
      { type: "addArea", id: are(1), name: "Privado" },
      {
        type: "addCourse",
        id: crs(1),
        name: "Nuevo curso",
        period: { programYear: 2, term: 1 },
      },
      {
        type: "addCourse",
        id: crs(2),
        name: "Nuevo curso",
        period: { programYear: 1, term: 3 },
      },
      {
        type: "addCourse",
        id: crs(3),
        name: "Nuevo curso",
        period: { programYear: 1, term: 1 },
      },
      { type: "assignArea", courseId: crs(1), areaId: are(1) },
      { type: "editCourse", courseId: crs(1), changes: { isElective: true } },
      { type: "addPrerequisite", courseId: crs(1), prerequisiteId: crs(2) },
      { type: "addPrerequisite", courseId: crs(1), prerequisiteId: crs(3) },
      { type: "setPrerequisiteCredits", courseId: crs(1), credits: 30 },
      { type: "setPrerequisiteCredits", courseId: crs(2), credits: 10 },
      { type: "setPrerequisiteCredits", courseId: crs(2), credits: 0 },
    );

    expect(exportFile(draft)).toContain(
      `"courses":[{"id":"${crs(3)}","name":"Nuevo curso","credits":5,"slots":[{"programYear":1,"term":1,"position":1}]},` +
        `{"id":"${crs(2)}","name":"Nuevo curso","credits":5,"slots":[{"programYear":1,"term":3,"position":1}]},` +
        `{"id":"${crs(1)}","name":"Nuevo curso","credits":5,"areaId":"${are(1)}","prerequisiteIds":["${crs(3)}","${crs(2)}"],"prerequisiteCredits":30,"isElective":true,"slots":[{"programYear":2,"term":1,"position":1}]}]`,
    );
  });

  test("names the file after the program and its effective year", () => {
    const draft = draftAfter({
      type: "editDetails",
      changes: {
        programName: "Ingeniería Civil Industrial",
        effectiveYear: 2020,
      },
    });

    expect(getFileName(draft)).toBe("ingenieria-civil-industrial_2020.malla");
  });

  test("leaves the year out of the name while it is missing", () => {
    const draft = draftAfter({
      type: "editDetails",
      changes: { programName: "Ingeniería Civil Industrial" },
    });

    expect(getFileName(draft)).toBe("ingenieria-civil-industrial.malla");
  });
});
