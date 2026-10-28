import { describe, expect, test } from "bun:test";
import { type Box, routeConnections } from "@/builder/routing";

function box(column: number, row: number, duration = 1, height = 1): Box {
  return { column, row, duration, height };
}

// The x and y of every point the path goes through, corners included.
function pointsOf(data: string | undefined) {
  const numbers = (data ?? "").match(/-?[\d.]+/g)?.map(Number) ?? [];
  return numbers.flatMap((value, i) =>
    i % 2 === 0 ? [{ x: value, y: numbers[i + 1] ?? 0 }] : [],
  );
}

describe("routing connections", () => {
  test("joins cards side by side with a straight line between their edges", () => {
    const from = box(1, 1);
    const to = box(2, 1);
    const paths = routeConnections([{ id: "a", from, to }], [from, to], {
      rows: 2,
      columns: 2,
    });

    expect(paths.get("a")).toBe("M 8.5 2.5 L 9 2.5");
  });

  test("goes around the cards in its way", () => {
    const from = box(1, 1);
    const blocker = box(2, 1);
    const to = box(3, 1);
    const paths = routeConnections(
      [{ id: "a", from, to }],
      [from, blocker, to],
      { rows: 2, columns: 3 },
    );

    // The blocker covers x 9 to 17 and y 0.5 to 4.5.
    const crossesBlocker = pointsOf(paths.get("a")).some(
      ({ x, y }) => x > 9 && x < 17 && y > 0.5 && y < 4.5,
    );
    expect(paths.has("a")).toBe(true);
    expect(crossesBlocker).toBe(false);
  });

  test("draws connections that share a gap side by side", () => {
    const first = box(1, 1);
    const second = box(1, 2);
    const to = box(2, 3);
    const paths = routeConnections(
      [
        { id: "first", from: first, to },
        { id: "second", from: second, to },
      ],
      [first, second, to],
      { rows: 4, columns: 2 },
    );

    const gapXs = (id: string) =>
      pointsOf(paths.get(id))
        .map(({ x }) => x)
        .filter((x) => x > 8.5 && x < 9);
    expect(gapXs("first")).not.toContain(gapXs("second")[0]);
  });

  test("joins cards of the same period through the gap beside them", () => {
    const from = box(1, 1);
    const to = box(1, 2);
    const paths = routeConnections([{ id: "a", from, to }], [from, to], {
      rows: 3,
      columns: 2,
    });

    const points = pointsOf(paths.get("a"));
    expect(points[0]).toEqual({ x: 8.5, y: 2.5 });
    expect(points.at(-1)).toEqual({ x: 8.5, y: 7 });
  });
});
