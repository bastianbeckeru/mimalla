import { describe, expect, test } from "bun:test";
import { createConnectionPaths } from "@/utils/pathfinding";

function card(
  id: string,
  courseId: number,
  x: number,
  y: number,
  prerequisiteIds: number[] | null = null,
) {
  return {
    id,
    x,
    y,
    w: 1,
    h: 1,
    programYear: Math.ceil(x / 2),
    term: x % 2 === 1 ? 1 : 3,
    courseId,
    course: prerequisiteIds && { prerequisiteIds },
  };
}

const cards = [
  card("earlier", 1, 1, 1),
  card("course", 2, 2, 1, [1, 3, 4]),
  card("same", 3, 2, 2),
  card("later", 4, 3, 1),
];

function connections(paths: ReturnType<typeof createConnectionPaths>) {
  return paths.map(({ originCardId, destinationCardId, data }) => [
    originCardId,
    destinationCardId,
    data !== "",
  ]);
}

describe("connection paths", () => {
  test("connect only prerequisites in an earlier period by default", () => {
    expect(connections(createConnectionPaths(4, 3, cards))).toEqual([
      ["earlier", "course", true],
    ]);
  });

  test("connect every prerequisite when asked to", () => {
    expect(
      connections(
        createConnectionPaths(4, 3, cards, { includeAllPrerequisites: true }),
      ),
    ).toEqual([
      ["earlier", "course", true],
      ["same", "course", true],
      ["later", "course", true],
    ]);
  });
});
