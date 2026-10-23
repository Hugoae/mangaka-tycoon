import { describe, expect, it } from "vitest";

import { weekToDate } from "../calendar/calendar";

import { createNewGame, GAME_STATE_VERSION } from "./game-state";

describe("createNewGame", () => {
  it("starts at week 0 with the given seed and the current schema version", () => {
    expect(createNewGame({ seed: 42 })).toEqual({ version: GAME_STATE_VERSION, seed: 42, week: 0 });
  });

  it("starts in January 1980", () => {
    expect(weekToDate(createNewGame({ seed: 1 }).week)).toEqual({
      year: 1980,
      month: 0,
      weekOfMonth: 0,
    });
  });

  it("returns a frozen state", () => {
    expect(Object.isFrozen(createNewGame({ seed: 1 }))).toBe(true);
  });

  it("is JSON serialisable without loss", () => {
    const state = createNewGame({ seed: 7 });
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});
