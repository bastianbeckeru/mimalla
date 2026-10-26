import { describe, expect, test } from "bun:test";
import { createHistory, historyReducer } from "@/hooks/use-history";

describe("historyReducer", () => {
  test("undo after a commit restores the previous state", () => {
    const committed = historyReducer(createHistory("a"), {
      type: "commit",
      present: "b",
    });

    expect(committed.present).toBe("b");
    expect(historyReducer(committed, { type: "undo" }).present).toBe("a");
  });

  test("redo after an undo reapplies the undone state", () => {
    const history = run(
      createHistory("a"),
      commit("b"),
      { type: "undo" },
      {
        type: "redo",
      },
    );

    expect(history.present).toBe("b");
    expect(history.future).toEqual([]);
  });

  test("a commit after an undo discards the redo steps", () => {
    const history = run(
      createHistory("a"),
      commit("b"),
      { type: "undo" },
      commit("c"),
    );

    expect(history.present).toBe("c");
    expect(run(history, { type: "redo" }).present).toBe("c");
    expect(run(history, { type: "undo" }).present).toBe("a");
  });

  test("undo and redo do nothing when there is no step to take", () => {
    const history = createHistory("a");

    expect(run(history, { type: "undo" })).toBe(history);
    expect(run(history, { type: "redo" })).toBe(history);
  });

  test("reset replaces the present and forgets every step", () => {
    const history = run(
      createHistory("a"),
      commit("b"),
      commit("c"),
      { type: "undo" },
      { type: "reset", present: "z" },
    );

    expect(history).toEqual({ past: [], present: "z", future: [] });
  });

  test("keeps at most 50 undo steps, dropping the oldest", () => {
    let history = createHistory(0);
    for (let step = 1; step <= 60; step++) {
      history = historyReducer(history, commit(step));
    }

    for (let undo = 0; undo < 60; undo++) {
      history = historyReducer(history, { type: "undo" });
    }

    expect(history.present).toBe(10);
    expect(history.future).toHaveLength(50);
  });

  test("a commit equal to the present state does not create an undo step", () => {
    const history = run(
      createHistory({ courses: [{ id: 1, position: 1 }] }),
      commit({ courses: [{ id: 1, position: 2 }] }),
      { type: "undo" },
    );

    const recommitted = run(
      history,
      commit({ courses: [{ id: 1, position: 1 }] }),
    );

    expect(recommitted).toBe(history);
    expect(recommitted.future).toHaveLength(1);
  });

  test("consecutive commits of the same group are undone as one step", () => {
    const history = run(
      createHistory("a"),
      commit("ab", "name"),
      commit("abc", "name"),
      { type: "undo" },
    );

    expect(history.present).toBe("a");
    expect(run(history, { type: "redo" }).present).toBe("abc");
  });

  test("a commit of the same group after an undo starts a new step", () => {
    const history = run(
      createHistory("a"),
      commit("b", "name"),
      commit("bc", "name"),
      { type: "undo" },
      commit("ad", "name"),
    );

    expect(history.future).toEqual([]);
    expect(run(history, { type: "undo" }).present).toBe("a");
  });

  test("a group that returns to the state before it leaves no undo step", () => {
    const history = run(
      createHistory("a"),
      commit("ab", "name"),
      commit("a", "name"),
    );

    expect(history.present).toBe("a");
    expect(history.past).toEqual([]);
  });
});

function commit<T>(present: T, group?: string) {
  return { type: "commit", present, group } as const;
}

type History<T> = ReturnType<typeof createHistory<T>>;

function run<T>(
  history: History<T>,
  ...actions: Parameters<typeof historyReducer<T>>[1][]
): History<T> {
  return actions.reduce(
    (state, action) => historyReducer(state, action),
    history,
  );
}
