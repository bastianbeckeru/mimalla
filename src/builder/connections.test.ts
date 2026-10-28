import { describe, expect, test } from "bun:test";
import { apply } from "@/builder/apply";
import {
  type ConnectionCard,
  getConnectionRole,
  getConnections,
} from "@/builder/connections";
import { createDraft } from "@/builder/draft";
import type { Action } from "@/types/builder";

const FIRST_SEMESTER = { programYear: 1, term: 1 };
const SECOND_SEMESTER = { programYear: 1, term: 3 };
const THIRD_SEMESTER = { programYear: 2, term: 1 };

function curriculumAfter(...actions: Action[]) {
  return actions.reduce(apply, createDraft("semester")).curriculum;
}

function card(
  id: string,
  courseId: number,
  column: number,
  row = 1,
): ConnectionCard {
  return { id, courseId, column, row, duration: 1, height: 1 };
}

function summarize(connections: ReturnType<typeof getConnections>) {
  return connections.map(({ kind, isMisplaced, from, to }) => ({
    kind,
    isMisplaced,
    from: from.id,
    to: to.id,
  }));
}

// Course 1 in the first semester, 2 in the second and 3 in the third, where
// 2 requires 1.
const chain = curriculumAfter(
  { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
  { type: "addCourse", name: "Nuevo curso", period: SECOND_SEMESTER },
  { type: "addCourse", name: "Nuevo curso", period: THIRD_SEMESTER },
  { type: "addPrerequisite", courseId: 2, prerequisiteId: 1 },
);
const chainCards = [card("1/0", 1, 1), card("2/0", 2, 2), card("3/0", 3, 3)];

describe("connections of a course", () => {
  test("lead into it from its prerequisites", () => {
    expect(summarize(getConnections(chain, chainCards, 2))).toEqual([
      { kind: "prerequisite", isMisplaced: false, from: "1/0", to: "2/0" },
    ]);
  });

  test("lead out of it into its successors", () => {
    expect(summarize(getConnections(chain, chainCards, 1))).toEqual([
      { kind: "successor", isMisplaced: false, from: "1/0", to: "2/0" },
    ]);
  });

  test("are the same link whichever end is focused", () => {
    const [intoCourse] = getConnections(chain, chainCards, 2);
    const [outOfPrerequisite] = getConnections(chain, chainCards, 1);

    expect(intoCourse?.id).toBe(outOfPrerequisite?.id ?? "");
  });

  test("are misplaced when the prerequisite does not end before the course", () => {
    const cards = [card("1/0", 1, 2), card("2/0", 2, 2, 2), card("3/0", 3, 3)];

    expect(summarize(getConnections(chain, cards, 2))).toEqual([
      { kind: "prerequisite", isMisplaced: true, from: "1/0", to: "2/0" },
    ]);
  });

  test("come from the prerequisite's slot that ends closest before the course", () => {
    const cards = [
      card("1/0", 1, 1),
      card("1/1", 1, 3),
      card("2/0", 2, 4),
      card("3/0", 3, 2),
    ];

    expect(summarize(getConnections(chain, cards, 2))).toEqual([
      { kind: "prerequisite", isMisplaced: false, from: "1/1", to: "2/0" },
    ]);
  });

  test("reach every slot of the focused course", () => {
    const cards = [
      card("1/0", 1, 1),
      card("2/0", 2, 2),
      card("2/1", 2, 3),
      card("3/0", 3, 4),
    ];

    expect(summarize(getConnections(chain, cards, 2))).toEqual([
      { kind: "prerequisite", isMisplaced: false, from: "1/0", to: "2/0" },
      { kind: "prerequisite", isMisplaced: false, from: "1/0", to: "2/1" },
    ]);
  });

  test("are none for a course that is not in the curriculum", () => {
    expect(getConnections(chain, chainCards, 99)).toEqual([]);
  });
});

describe("the role of a course toward the focused one", () => {
  test("is none while no course is focused", () => {
    expect(getConnectionRole(chain, null, 1)).toBeNull();
  });

  test("tells the focused course, its connections and the rest apart", () => {
    expect([1, 2, 3].map((id) => getConnectionRole(chain, 2, id))).toEqual([
      "related",
      "focused",
      "unrelated",
    ]);
  });

  test("is misplaced from either end of a misplaced prerequisite", () => {
    const curriculum = curriculumAfter(
      { type: "addCourse", name: "Nuevo curso", period: FIRST_SEMESTER },
      { type: "addCourse", name: "Nuevo curso", period: SECOND_SEMESTER },
      { type: "addPrerequisite", courseId: 1, prerequisiteId: 2 },
    );

    expect(getConnectionRole(curriculum, 1, 2)).toBe("misplaced");
    expect(getConnectionRole(curriculum, 2, 1)).toBe("misplaced");
  });

  test("is none when the focused course is no longer in the curriculum", () => {
    expect(getConnectionRole(chain, 99, 1)).toBeNull();
  });
});
