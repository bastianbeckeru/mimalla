import { describe, expect, test } from "bun:test";
import { apply } from "@/builder/apply";
import { createDraft } from "@/builder/draft";
import { exportFile, getFileName } from "@/builder/export";
import type { Action, Area } from "@/types/builder";

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
  test("writes minified JSON with schema version 1 and only the fields set", () => {
    expect(exportFile(draftAfter(details))).toBe(
      `{"schemaVersion":1,"program":{"name":"Derecho"},"effectiveYear":2023,"termSystem":"semester","periods":${PERIODS},"areas":[],"tracks":[],"courses":[]}`,
    );
  });

  test("writes the institution in the program and the version name after the effective year", () => {
    const draft = draftAfter(details, {
      type: "editDetails",
      changes: { versionName: "v6.0", institution: "UDP" },
    });

    expect(exportFile(draft)).toStartWith(
      '{"schemaVersion":1,"program":{"name":"Derecho","institution":"UDP"},"effectiveYear":2023,"versionName":"v6.0","termSystem":"semester",',
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
      '{"schemaVersion":1,"program":{"name":"Derecho"},"effectiveYear":2023,"termSystem":"semester",',
    );
  });

  test("writes areas by first appearance with renumbered ids, and each course's areaId", () => {
    const draft = draftAfter(
      details,
      { type: "addArea", name: "Sin cursos" },
      { type: "addArea", name: "Público" },
      { type: "addArea", name: "Privado" },
      { type: "setAreaColor", areaId: 3, color: "#ff8800" },
      { type: "setBaseColor", color: "#16a34a" },
      {
        type: "addCourse",
        name: "Nuevo curso",
        period: { programYear: 2, term: 1 },
      },
      {
        type: "addCourse",
        name: "Nuevo curso",
        period: { programYear: 1, term: 1 },
      },
      {
        type: "addCourse",
        name: "Nuevo curso",
        period: { programYear: 1, term: 1 },
      },
      { type: "assignArea", courseId: 1, areaId: 2 },
      { type: "assignArea", courseId: 2, areaId: 3 },
    );
    const [unused, publico] = draft.curriculum.areas as [Area, Area];
    const file = exportFile(draft);

    expect(JSON.parse(file).areas).toEqual([
      { id: 1, name: "Privado", color: "#ff8800" },
      { id: 2, name: "Público", color: publico.color },
      { id: 3, name: "Sin cursos", color: unused.color },
    ]);
    expect(file).toContain(
      '"courses":[{"id":1,"name":"Nuevo curso","credits":5,"areaId":1,"slots":[{"programYear":1,"term":1,"position":1}]},' +
        '{"id":2,"name":"Nuevo curso","credits":5,"slots":[{"programYear":1,"term":1,"position":2}]},' +
        '{"id":3,"name":"Nuevo curso","credits":5,"areaId":2,"slots":[{"programYear":2,"term":1,"position":1}]}]',
    );
    expect(file).not.toContain("16a34a");
    expect(file).not.toContain("baseColor");
    expect(file).not.toContain("handColored");
  });

  test("writes tracks in order with their credential type when set, and each course's trackIds after its area", () => {
    const draft = draftAfter(
      details,
      { type: "addArea", name: "Privado" },
      { type: "addTrack", name: "Sin uso" },
      { type: "addTrack", name: "Plan Común" },
      { type: "addTrack", name: "Licenciatura en Derecho" },
      {
        type: "editTrack",
        trackId: 3,
        changes: { credentialType: "academic" },
      },
      { type: "deleteTrack", trackId: 1 },
      {
        type: "addCourse",
        name: "Nuevo curso",
        period: { programYear: 1, term: 1 },
      },
      { type: "assignArea", courseId: 1, areaId: 1 },
      { type: "assignTracks", courseId: 1, trackIds: [3, 2] },
    );
    const file = exportFile(draft);

    expect(file).toContain(
      '"tracks":[{"id":1,"name":"Plan Común"},{"id":2,"name":"Licenciatura en Derecho","credentialType":"academic"}],' +
        '"courses":[{"id":1,"name":"Nuevo curso","credits":5,"areaId":1,"trackIds":[1,2],"slots":[{"programYear":1,"term":1,"position":1}]}]',
    );
  });

  test("sorts courses by their first slot and renumbers their ids from 1", () => {
    const draft = draftAfter(
      details,
      {
        type: "addCourse",
        name: "Nuevo curso",
        period: { programYear: 2, term: 1 },
      },
      {
        type: "addCourse",
        name: "Nuevo curso",
        period: { programYear: 1, term: 3 },
      },
      {
        type: "addCourse",
        name: "Nuevo curso",
        period: { programYear: 1, term: 3 },
      },
      { type: "editCourse", courseId: 1, changes: { name: "Penal" } },
      { type: "editCourse", courseId: 2, changes: { name: "Romano" } },
      {
        type: "editCourse",
        courseId: 3,
        changes: { credits: 6, name: "Civil" },
      },
    );

    expect(JSON.parse(exportFile(draft)).courses).toEqual([
      {
        id: 1,
        name: "Romano",
        credits: 5,
        slots: [{ programYear: 1, term: 3, position: 1 }],
      },
      {
        id: 2,
        name: "Civil",
        credits: 6,
        slots: [{ programYear: 1, term: 3, position: 2 }],
      },
      {
        id: 3,
        name: "Penal",
        credits: 5,
        slots: [{ programYear: 2, term: 1, position: 1 }],
      },
    ]);
  });

  test("writes keys in a fixed order regardless of the editing order", () => {
    const course: Action = {
      type: "addCourse",
      name: "Nuevo curso",
      period: { programYear: 1, term: 1 },
    };
    const first = draftAfter(details, course, {
      type: "editCourse",
      courseId: 1,
      changes: { credits: 6, name: "Civil" },
    });
    const second = draftAfter(
      {
        type: "editDetails",
        changes: { effectiveYear: 2023, programName: "Derecho" },
      },
      course,
      { type: "editCourse", courseId: 1, changes: { name: "Civil" } },
      { type: "editCourse", courseId: 1, changes: { credits: 6 } },
    );

    expect(exportFile(first)).toBe(exportFile(second));
    expect(exportFile(first)).toBe(exportFile(first));
    expect(exportFile(first)).toContain(
      '"courses":[{"id":1,"name":"Civil","credits":6,"slots":[{"programYear":1,"term":1,"position":1}]}]',
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
    const course: Action = {
      type: "addCourse",
      name: "Nuevo curso",
      period: { programYear: 1, term: 1 },
    };
    const draft = draftAfter(
      details,
      course,
      course,
      { type: "editCourse", courseId: 1, changes: { code: "DER101" } },
      { type: "editCourse", courseId: 2, changes: { code: "DER102" } },
      { type: "editCourse", courseId: 2, changes: { code: "" } },
    );

    expect(exportFile(draft)).toContain(
      '"courses":[{"id":1,"name":"Nuevo curso","code":"DER101","credits":5,"slots":[{"programYear":1,"term":1,"position":1}]},' +
        '{"id":2,"name":"Nuevo curso","credits":5,"slots":[{"programYear":1,"term":1,"position":2}]}]',
    );
  });

  test("writes isElective before the slots of an elective and omits it otherwise", () => {
    const draft = draftAfter(
      details,
      {
        type: "addCourse",
        name: "Nuevo curso",
        period: { programYear: 1, term: 1 },
      },
      {
        type: "addCourse",
        name: "Nuevo curso",
        period: { programYear: 1, term: 1 },
      },
      { type: "editCourse", courseId: 1, changes: { isElective: true } },
      { type: "addSlot", courseId: 1 },
      {
        type: "moveSlot",
        courseId: 1,
        slotIndex: 1,
        to: { programYear: 2, term: 1, position: 1 },
      },
    );

    expect(exportFile(draft)).toContain(
      '"courses":[{"id":1,"name":"Nuevo curso","credits":5,"isElective":true,"slots":[{"programYear":1,"term":1,"position":1},{"programYear":2,"term":1,"position":1}]},' +
        '{"id":2,"name":"Nuevo curso","credits":5,"slots":[{"programYear":1,"term":1,"position":2}]}]',
    );
  });

  test("writes renumbered prerequisites and prerequisite credits after the area, and omits them when empty or 0", () => {
    const draft = draftAfter(
      details,
      { type: "addArea", name: "Privado" },
      {
        type: "addCourse",
        name: "Nuevo curso",
        period: { programYear: 2, term: 1 },
      },
      {
        type: "addCourse",
        name: "Nuevo curso",
        period: { programYear: 1, term: 3 },
      },
      {
        type: "addCourse",
        name: "Nuevo curso",
        period: { programYear: 1, term: 1 },
      },
      { type: "assignArea", courseId: 1, areaId: 1 },
      { type: "editCourse", courseId: 1, changes: { isElective: true } },
      { type: "addPrerequisite", courseId: 1, prerequisiteId: 2 },
      { type: "addPrerequisite", courseId: 1, prerequisiteId: 3 },
      { type: "setPrerequisiteCredits", courseId: 1, credits: 30 },
      { type: "setPrerequisiteCredits", courseId: 2, credits: 10 },
      { type: "setPrerequisiteCredits", courseId: 2, credits: 0 },
    );

    expect(exportFile(draft)).toContain(
      '"courses":[{"id":1,"name":"Nuevo curso","credits":5,"slots":[{"programYear":1,"term":1,"position":1}]},' +
        '{"id":2,"name":"Nuevo curso","credits":5,"slots":[{"programYear":1,"term":3,"position":1}]},' +
        '{"id":3,"name":"Nuevo curso","credits":5,"areaId":1,"prerequisiteIds":[1,2],"prerequisiteCredits":30,"isElective":true,"slots":[{"programYear":2,"term":1,"position":1}]}]',
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
