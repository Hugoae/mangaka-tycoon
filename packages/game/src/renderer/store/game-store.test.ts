import { createNewGame, weekToDate } from "@mangaka/core";
import { describe, expect, it, vi } from "vitest";

import { createGameStore } from "./game-store";
import { selectLastEvents, selectWeek } from "./selectors";

describe("createGameStore", () => {
  it("starts a new game from the given seed", () => {
    const store = createGameStore(42);

    expect(store.getState().game).toEqual(createNewGame({ seed: 42 }));
    expect(store.getState().lastEvents).toEqual([]);
  });

  it("advances the week when an advanceWeek command is dispatched", () => {
    const store = createGameStore(1);

    store.getState().dispatch({ kind: "advanceWeek" });

    expect(selectWeek(store.getState())).toBe(1);
    expect(weekToDate(selectWeek(store.getState())).weekOfMonth).toBe(1);
  });

  it("exposes only the events of the last command", () => {
    const store = createGameStore(1);

    store.getState().dispatch({ kind: "advanceWeek" });
    store.getState().dispatch({ kind: "advanceWeek" });

    expect(selectLastEvents(store.getState())).toEqual([
      { kind: "weekAdvanced", key: "event.weekAdvanced", params: { week: 2 } },
    ]);
  });

  it("notifies subscribers of every change", () => {
    const store = createGameStore(1);
    const listener = vi.fn();
    store.subscribe(listener);

    store.getState().dispatch({ kind: "advanceWeek" });
    store.getState().dispatch({ kind: "advanceWeek" });

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("replaces the game state instead of mutating it", () => {
    const store = createGameStore(1);
    const before = store.getState().game;

    store.getState().dispatch({ kind: "advanceWeek" });

    expect(before.week).toBe(0);
    expect(store.getState().game).not.toBe(before);
  });

  it("isolates stores from each other", () => {
    const first = createGameStore(1);
    const second = createGameStore(1);

    first.getState().dispatch({ kind: "advanceWeek" });

    expect(selectWeek(second.getState())).toBe(0);
  });
});
