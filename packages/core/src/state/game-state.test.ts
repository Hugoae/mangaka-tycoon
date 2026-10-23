import { describe, expect, it } from "vitest";

import { TEST_CONTENT } from "../testing/test-content";
import { createNewGame, findRunningSeries, GAME_STATE_VERSION } from "./game-state";
import type { GameState, Series } from "./game-state";

describe("createNewGame", () => {
  it("starts in the first week with the starting money, no fatigue and no series", () => {
    expect(createNewGame({ seed: 42 }, TEST_CONTENT)).toEqual({
      version: GAME_STATE_VERSION,
      seed: 42,
      week: 0,
      phase: "playing",
      money: TEST_CONTENT.balance.startingMoney,
      mangaka: { fatigue: 0 },
      series: [],
      history: [],
    });
  });

  it("is deterministic", () => {
    expect(createNewGame({ seed: 7 }, TEST_CONTENT)).toEqual(
      createNewGame({ seed: 7 }, TEST_CONTENT),
    );
  });

  it("keeps the seed it is given", () => {
    expect(createNewGame({ seed: 123 }, TEST_CONTENT).seed).toBe(123);
    expect(createNewGame({ seed: 456 }, TEST_CONTENT).seed).toBe(456);
  });

  it("returns a deeply frozen state", () => {
    const state = createNewGame({ seed: 1 }, TEST_CONTENT);

    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.mangaka)).toBe(true);
    expect(Object.isFrozen(state.series)).toBe(true);
  });

  it("can be serialised to JSON without loss", () => {
    const state = createNewGame({ seed: 99 }, TEST_CONTENT);

    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});

describe("findRunningSeries", () => {
  const series = (id: string, status: Series["status"]): Series => ({
    id,
    title: id,
    themeId: "adventure",
    targetId: "shonen",
    artStyleId: "classic",
    fans: 0,
    chaptersPublished: 0,
    badWeekStreak: 0,
    status,
  });
  const withSeries = (list: readonly Series[]): GameState => ({
    ...createNewGame({ seed: 1 }, TEST_CONTENT),
    series: list,
  });

  it("is undefined when nothing has been started", () => {
    expect(findRunningSeries(withSeries([]))).toBeUndefined();
  });

  it("skips cancelled series", () => {
    const state = withSeries([series("old", "cancelled"), series("current", "running")]);

    expect(findRunningSeries(state)?.id).toBe("current");
    expect(findRunningSeries(withSeries([series("old", "cancelled")]))).toBeUndefined();
  });
});
