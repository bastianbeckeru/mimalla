import { describe, expect, test } from "bun:test";
import { type Action, apply } from "@/builder/apply";
import { createDraft } from "@/builder/draft";
import { exportFile, getFileName } from "@/builder/export";

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
      `{"schemaVersion":1,"program":{"name":"Derecho"},"effectiveYear":2023,"termSystem":"semester","periods":${PERIODS},"courses":[]}`,
    );
  });

  test("sorts courses by their first slot and renumbers their ids from 1", () => {
    const draft = draftAfter(
      details,
      { type: "addCourse", period: { programYear: 2, term: 1 } },
      { type: "addCourse", period: { programYear: 1, term: 3 } },
      { type: "addCourse", period: { programYear: 1, term: 3 } },
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
      { type: "createCurriculum", termSystem: "annual" },
      details,
      { type: "removeLastProgramYear" },
      { type: "removeLastProgramYear" },
      { type: "removeLastProgramYear" },
      { type: "addIntensiveTerm", programYear: 2, term: 4 },
      { type: "addIntensiveTerm", programYear: 1, term: 4 },
    );

    expect(exportFile(draft)).toContain(
      '"termSystem":"annual","periods":[{"programYear":1,"term":1},{"programYear":1,"term":4},{"programYear":2,"term":1},{"programYear":2,"term":4}]',
    );
  });

  test("names the file after the program", () => {
    const draft = draftAfter({
      type: "editDetails",
      changes: { programName: "Ingeniería Civil Industrial" },
    });

    expect(getFileName(draft)).toBe("ingenieria-civil-industrial.json");
  });
});
