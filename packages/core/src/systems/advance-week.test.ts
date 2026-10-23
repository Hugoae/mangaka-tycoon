import { describe, expect, it } from "vitest";

import { weekToDate } from "../calendar/calendar";
import { createNewGame } from "../state/game-state";
import type { GameState } from "../state/game-state";

import { advanceWeek } from "./advance-week";

const SEED = 20240229;
const WEEKS_IN_FORTY_YEARS = 1920;

function playWeeks(initial: GameState, count: number): GameState {
  let state = initial;
  for (let i = 0; i < count; i++) {
    state = advanceWeek(state).state;
  }
  return state;
}

describe("advanceWeek", () => {
  it("moves the calendar forward by exactly one week", () => {
    const { state } = advanceWeek(createNewGame({ seed: SEED }));
    expect(state.week).toBe(1);
  });

  it("emits one weekAdvanced event carrying the new week", () => {
    const { events } = advanceWeek(createNewGame({ seed: SEED }));
    expect(events).toEqual([
      { kind: "weekAdvanced", key: "event.weekAdvanced", params: { week: 1 } },
    ]);
  });

  it("does not mutate its input and returns a new frozen state", () => {
    const before = createNewGame({ seed: SEED });
    const { state: after } = advanceWeek(before);

    expect(before.week).toBe(0);
    expect(after).not.toBe(before);
    expect(Object.isFrozen(after)).toBe(true);
  });

  it("keeps the seed and the schema version untouched", () => {
    const before = createNewGame({ seed: SEED });
    const { state } = advanceWeek(before);
    expect(state.seed).toBe(before.seed);
    expect(state.version).toBe(before.version);
  });

  it("is deterministic: the same state always gives the same result", () => {
    const initial = createNewGame({ seed: SEED });
    expect(advanceWeek(initial)).toEqual(advanceWeek(initial));
    expect(playWeeks(initial, WEEKS_IN_FORTY_YEARS)).toEqual(
      playWeeks(createNewGame({ seed: SEED }), WEEKS_IN_FORTY_YEARS),
    );
  });

  it("reaches January 2020 after 40 simulated years", () => {
    const state = playWeeks(createNewGame({ seed: SEED }), WEEKS_IN_FORTY_YEARS);
    expect(weekToDate(state.week)).toEqual({ year: 2020, month: 0, weekOfMonth: 0 });
  });
});
