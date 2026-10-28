import { describe, expect, test } from "bun:test";
import { apply } from "@/builder/apply";
import { createDraft } from "@/builder/draft";
import { isExportable } from "@/builder/export";
import type { Action } from "@/types/builder";

describe("curriculum details", () => {
  test("editing sets the program name and effective year", () => {
    const draft = apply(createDraft("semester"), {
      type: "editDetails",
      changes: { programName: "Derecho", effectiveYear: 2023 },
    });

    expect(draft.curriculum).toMatchObject({
      programName: "Derecho",
      effectiveYear: 2023,
    });
  });

  test("a new curriculum without a program name and effective year cannot be exported", () => {
    expect(isExportable(createDraft("semester"))).toBe(false);
  });

  test("a blank program name blocks the export", () => {
    const draft = apply(createDraft("semester"), {
      type: "editDetails",
      changes: { programName: "   ", effectiveYear: 2023 },
    });

    expect(isExportable(draft)).toBe(false);
  });

  test.each([1899, 2101, 2023.5])(
    "an effective year of %p blocks the export",
    (effectiveYear) => {
      const draft = apply(createDraft("semester"), {
        type: "editDetails",
        changes: { programName: "Derecho", effectiveYear },
      });

      expect(isExportable(draft)).toBe(false);
    },
  );

  test("a course with a blank name blocks the export", () => {
    const actions: Action[] = [
      {
        type: "editDetails",
        changes: { programName: "Derecho", effectiveYear: 2023 },
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
      { type: "editCourse", courseId: 2, changes: { name: " " } },
    ];
    const draft = actions.reduce(apply, createDraft("semester"));

    expect(isExportable(draft)).toBe(false);
  });

  test("a program name and a valid effective year allow the export", () => {
    const draft = apply(createDraft("semester"), {
      type: "editDetails",
      changes: { programName: "Derecho", effectiveYear: 1900 },
    });

    expect(isExportable(draft)).toBe(true);
  });
});
