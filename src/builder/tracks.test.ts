import { describe, expect, test } from "bun:test";
import { apply } from "@/builder/apply";
import { createDraft } from "@/builder/draft";
import { isExportable } from "@/builder/export";
import type { Action } from "@/types/builder";

const FIRST_SEMESTER = { programYear: 1, term: 1 };

function draftAfter(...actions: Action[]) {
  return actions.reduce(apply, createDraft("semester"));
}

const twoCourses: Action[] = [
  { type: "addCourse", name: "Cálculo I", period: FIRST_SEMESTER },
  { type: "addCourse", name: "Álgebra", period: FIRST_SEMESTER },
];

function trackIdsOf(...actions: Action[]) {
  return draftAfter(...actions).curriculum.courses.map(
    (course) => course.trackIds,
  );
}

describe("creating a track", () => {
  test("adds it with its name, the next id and no credential", () => {
    const draft = draftAfter(
      { type: "addTrack", name: "Plan Común" },
      { type: "addTrack", name: "Licenciatura" },
    );

    expect(draft.curriculum.tracks).toEqual([
      { id: 1, name: "Plan Común", credentialType: null },
      { id: 2, name: "Licenciatura", credentialType: null },
    ]);
  });

  test("starts new courses in no track", () => {
    expect(trackIdsOf(...twoCourses)).toEqual([[], []]);
  });
});

describe("editing a track", () => {
  test("changes its name and credential type", () => {
    const draft = draftAfter(
      { type: "addTrack", name: "Licenciatura" },
      {
        type: "editTrack",
        trackId: 1,
        changes: {
          name: "Licenciatura en Ciencias de la Ingeniería",
          credentialType: "academic",
        },
      },
    );

    expect(draft.curriculum.tracks).toEqual([
      {
        id: 1,
        name: "Licenciatura en Ciencias de la Ingeniería",
        credentialType: "academic",
      },
    ]);
  });

  test("clears the credential type back to none", () => {
    const draft = draftAfter(
      { type: "addTrack", name: "Plan Común" },
      {
        type: "editTrack",
        trackId: 1,
        changes: { credentialType: "academic" },
      },
      { type: "editTrack", trackId: 1, changes: { credentialType: null } },
    );

    expect(draft.curriculum.tracks[0]?.credentialType).toBeNull();
  });
});

describe("assigning tracks to a course", () => {
  test("sets the tracks of the course, sorted and without repeats", () => {
    expect(
      trackIdsOf(
        ...twoCourses,
        { type: "addTrack", name: "Plan Común" },
        { type: "addTrack", name: "Licenciatura" },
        { type: "assignTracks", courseId: 1, trackIds: [2, 1, 2] },
      ),
    ).toEqual([[1, 2], []]);
  });

  test("ignores tracks that do not exist", () => {
    expect(
      trackIdsOf(
        ...twoCourses,
        { type: "addTrack", name: "Plan Común" },
        { type: "assignTracks", courseId: 1, trackIds: [1, 7] },
      ),
    ).toEqual([[1], []]);
  });

  test("removes a course from every track with an empty list", () => {
    expect(
      trackIdsOf(
        ...twoCourses,
        { type: "addTrack", name: "Plan Común" },
        { type: "assignTracks", courseId: 1, trackIds: [1] },
        { type: "assignTracks", courseId: 1, trackIds: [] },
      ),
    ).toEqual([[], []]);
  });
});

describe("deleting a track", () => {
  test("removes it and takes its courses out of it", () => {
    const draft = draftAfter(
      ...twoCourses,
      { type: "addTrack", name: "Plan Común" },
      { type: "addTrack", name: "Licenciatura" },
      { type: "assignTracks", courseId: 1, trackIds: [1, 2] },
      { type: "assignTracks", courseId: 2, trackIds: [1] },
      { type: "deleteTrack", trackId: 1 },
    );

    expect(draft.curriculum.tracks.map((track) => track.id)).toEqual([2]);
    expect(draft.curriculum.courses.map((course) => course.trackIds)).toEqual([
      [2],
      [],
    ]);
  });
});

describe("exporting tracks", () => {
  const exportable: Action[] = [
    {
      type: "editDetails",
      changes: {
        programName: "Derecho",
        institution: "UDP",
        effectiveYear: 2023,
      },
    },
    ...twoCourses,
  ];

  test("allows a curriculum whose tracks are named and have courses", () => {
    const draft = draftAfter(
      ...exportable,
      { type: "addTrack", name: "Licenciatura" },
      { type: "assignTracks", courseId: 1, trackIds: [1] },
    );

    expect(isExportable(draft)).toBe(true);
  });

  test("blocks a track without courses, which would be complete from the start", () => {
    const draft = draftAfter(...exportable, {
      type: "addTrack",
      name: "Licenciatura",
    });

    expect(isExportable(draft)).toBe(false);
  });

  test("blocks a track without a name", () => {
    const draft = draftAfter(
      ...exportable,
      { type: "addTrack", name: "Licenciatura" },
      { type: "assignTracks", courseId: 1, trackIds: [1] },
      { type: "editTrack", trackId: 1, changes: { name: "  " } },
    );

    expect(isExportable(draft)).toBe(false);
  });
});
