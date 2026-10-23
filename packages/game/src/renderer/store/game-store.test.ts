import { createNewGame } from "@mangaka/core";
import { describe, expect, it, vi } from "vitest";

import { TEST_CONTENT } from "../testing/test-content";
import { createGameStore } from "./game-store";
import { selectContent, selectGame, selectLastEvents, selectWeek } from "./selectors";

const START = {
  kind: "startSeries",
  title: "Test",
  themeId: "sport",
  targetId: "shonen",
  artStyleId: "classic",
} as const;

describe("createGameStore", () => {
  it("starts a new game from the given seed and content", () => {
    const store = createGameStore(42, TEST_CONTENT);

    expect(store.getState().game).toEqual(createNewGame({ seed: 42 }, TEST_CONTENT));
    expect(selectContent(store.getState())).toBe(TEST_CONTENT);
    expect(store.getState().lastEvents).toEqual([]);
  });

  it("applies the commands it receives", () => {
    const store = createGameStore(1, TEST_CONTENT);

    store.getState().dispatch(START);
    store.getState().dispatch({ kind: "advanceWeek" });

    expect(selectWeek(store.getState())).toBe(1);
    expect(selectGame(store.getState()).series).toHaveLength(1);
  });

  it("exposes only the events of the last command", () => {
    const store = createGameStore(1, TEST_CONTENT);

    store.getState().dispatch(START);
    store.getState().dispatch({ kind: "advanceWeek" });

    expect(selectLastEvents(store.getState()).map((event) => event.kind)).toEqual([
      "weekRested",
      "weekAdvanced",
    ]);
  });

  it("reports a rejected command without changing the game", () => {
    const store = createGameStore(1, TEST_CONTENT);
    const before = store.getState().game;

    store.getState().dispatch({
      kind: "produceChapter",
      sliders: { story: 0, art: 0, characters: 0, worldbuilding: 0, pacing: 0 },
    });

    expect(store.getState().game).toBe(before);
    expect(selectLastEvents(store.getState())[0]?.kind).toBe("commandRejected");
  });

  it("notifies subscribers of every change", () => {
    const store = createGameStore(1, TEST_CONTENT);
    const listener = vi.fn();
    store.subscribe(listener);

    store.getState().dispatch(START);
    store.getState().dispatch({ kind: "advanceWeek" });

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("replaces the game state instead of mutating it", () => {
    const store = createGameStore(1, TEST_CONTENT);
    const before = store.getState().game;

    store.getState().dispatch(START);

    expect(before.series).toHaveLength(0);
    expect(store.getState().game).not.toBe(before);
  });

  it("starts over with a new seed and clears the events", () => {
    const store = createGameStore(1, TEST_CONTENT);
    store.getState().dispatch(START);
    store.getState().dispatch({ kind: "advanceWeek" });

    store.getState().newGame(7);

    expect(store.getState().game).toEqual(createNewGame({ seed: 7 }, TEST_CONTENT));
    expect(store.getState().lastEvents).toEqual([]);
  });

  it("isolates stores from each other", () => {
    const first = createGameStore(1, TEST_CONTENT);
    const second = createGameStore(1, TEST_CONTENT);

    first.getState().dispatch(START);

    expect(selectGame(second.getState()).series).toHaveLength(0);
  });
});
