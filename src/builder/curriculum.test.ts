import { describe, expect, test } from "bun:test";
import { apply } from "@/builder/apply";
import { createDraft } from "@/builder/draft";
import { getMissingDetails } from "@/builder/export";
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

  test("a new curriculum is missing the program name and effective year", () => {
    expect(getMissingDetails(createDraft("semester"))).toEqual([
      "programName",
      "effectiveYear",
    ]);
  });

  test("a blank program name is missing", () => {
    const draft = apply(createDraft("semester"), {
      type: "editDetails",
      changes: { programName: "   ", effectiveYear: 2023 },
    });

    expect(getMissingDetails(draft)).toEqual(["programName"]);
  });

  test.each([1899, 2101, 2023.5])(
    "an effective year of %p is missing",
    (effectiveYear) => {
      const draft = apply(createDraft("semester"), {
        type: "editDetails",
        changes: { programName: "Derecho", effectiveYear },
      });

      expect(getMissingDetails(draft)).toEqual(["effectiveYear"]);
    },
  );

  test("a course with a blank name is missing its name", () => {
    const actions: Action[] = [
      {
        type: "editDetails",
        changes: { programName: "Derecho", effectiveYear: 2023 },
      },
      { type: "addCourse", period: { programYear: 1, term: 1 } },
      { type: "addCourse", period: { programYear: 1, term: 1 } },
      { type: "editCourse", courseId: 2, changes: { name: " " } },
    ];
    const draft = actions.reduce(apply, createDraft("semester"));

    expect(getMissingDetails(draft)).toEqual(["courseNames"]);
  });

  test("nothing is missing with a program name and a valid effective year", () => {
    const draft = apply(createDraft("semester"), {
      type: "editDetails",
      changes: { programName: "Derecho", effectiveYear: 1900 },
    });

    expect(getMissingDetails(draft)).toEqual([]);
  });
});
