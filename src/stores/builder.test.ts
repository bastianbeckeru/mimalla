import { describe, expect, test } from "bun:test";
import { createDraft } from "@/builder/draft";
import { migrateToStableIds } from "@/stores/builder";

type SavedDraft = Parameters<typeof migrateToStableIds>[0];

function savedCourse(id: number, changes: Partial<SavedCourse> = {}) {
  return {
    id,
    name: `Curso ${id}`,
    code: "",
    credits: 5,
    areaId: null,
    trackIds: [],
    duration: 1,
    prerequisiteIds: [],
    prerequisiteCredits: 0,
    isElective: false,
    slots: [{ programYear: 1, term: id, position: 1 }],
    ...changes,
  };
}
type SavedCourse = SavedDraft["curriculum"]["courses"][number];

function savedDraft(): SavedDraft {
  const draft = createDraft("semester");
  return {
    ...draft,
    handColoredAreaIds: [2],
    curriculum: {
      ...draft.curriculum,
      areas: [
        { id: 1, name: "Privado", color: "#4f46e5" },
        { id: 2, name: "Público", color: "#ff8800" },
      ],
      tracks: [{ id: 1, name: "Licenciatura", credentialType: null }],
      courses: [
        savedCourse(1, { areaId: 2, trackIds: [1] }),
        savedCourse(2, { prerequisiteIds: [1] }),
      ],
    },
  };
}

describe("migrateToStableIds", () => {
  test("gives every course, area and track a prefixed id", () => {
    const { curriculum } = migrateToStableIds(savedDraft());

    expect(curriculum.areas.map((area) => area.id)).toEqual([
      expect.stringMatching(/^are_[A-Za-z0-9]{8}$/),
      expect.stringMatching(/^are_[A-Za-z0-9]{8}$/),
    ]);
    expect(curriculum.tracks[0]?.id).toMatch(/^trk_[A-Za-z0-9]{8}$/);
    expect(curriculum.courses.map((course) => course.id)).toEqual([
      expect.stringMatching(/^crs_[A-Za-z0-9]{8}$/),
      expect.stringMatching(/^crs_[A-Za-z0-9]{8}$/),
    ]);
  });

  test("points areas, tracks, prerequisites and hand coloring to the new ids", () => {
    const { curriculum, handColoredAreaIds } = migrateToStableIds(savedDraft());
    const [, publico] = curriculum.areas;
    const [first, second] = curriculum.courses;

    expect(first?.areaId).toBe(publico?.id ?? null);
    expect(first?.trackIds).toEqual(curriculum.tracks.map((track) => track.id));
    expect(second?.prerequisiteIds).toEqual(first ? [first.id] : []);
    expect(handColoredAreaIds).toEqual(publico ? [publico.id] : []);
  });

  test("keeps everything else about the draft", () => {
    const saved = savedDraft();
    const { curriculum, baseColor } = migrateToStableIds(saved);

    expect(baseColor).toBe(saved.baseColor);
    expect(curriculum.courses.map((course) => course.name)).toEqual([
      "Curso 1",
      "Curso 2",
    ]);
    expect(curriculum.areas.map((area) => area.color)).toEqual([
      "#4f46e5",
      "#ff8800",
    ]);
  });
});
