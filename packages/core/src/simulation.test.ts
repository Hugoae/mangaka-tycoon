import { describe, expect, it } from "vitest";

import { weekToDate, WEEKS_PER_YEAR } from "./calendar/calendar";
import { applyCommand } from "./commands/command";
import type { Command } from "./commands/command";
import { energyBudget } from "./systems/chapter-quality";
import { createNewGame } from "./state/game-state";
import type { GameState } from "./state/game-state";
import { START_NEUTRAL } from "./testing/play";
import { evenSliders, VOLATILE_TEST_CONTENT } from "./testing/test-content";

const CONTENT = VOLATILE_TEST_CONTENT;
const FORTY_YEARS = 40 * WEEKS_PER_YEAR;

/** A simple player: publishes a chapter with all the energy it has, rests when exhausted or cancelled. */
function nextCommand(state: GameState): Command {
  const running = state.series.some((series) => series.status === "running");
  if (!running) {
    return { ...START_NEUTRAL, title: `Series ${String(state.series.length + 1)}` };
  }
  const budget = energyBudget(CONTENT.balance, state.mangaka.fatigue);
  const each = Math.floor(budget / 5);
  return each < 10
    ? { kind: "advanceWeek" }
    : { kind: "produceChapter", sliders: evenSliders(each) };
}

function simulate(seed: number, weeks: number): readonly GameState[] {
  const states: GameState[] = [];
  let state = createNewGame({ seed }, CONTENT);
  while (state.week < weeks && state.phase === "playing") {
    state = applyCommand(state, nextCommand(state), CONTENT).state;
    states.push(state);
  }
  return states;
}

describe("a whole career", () => {
  it("is reproducible: same seed and same decisions give the same game", () => {
    expect(simulate(2026, FORTY_YEARS)).toEqual(simulate(2026, FORTY_YEARS));
  });

  it("depends on the seed", () => {
    expect(simulate(1, FORTY_YEARS)).not.toEqual(simulate(2, FORTY_YEARS));
  });

  it("keeps every number inside its bounds, week after week", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      let previousWeek = 0;
      for (const state of simulate(seed, FORTY_YEARS)) {
        // Starting a series is free, every other command uses exactly one week.
        expect([previousWeek, previousWeek + 1]).toContain(state.week);
        previousWeek = state.week;
        expect(Number.isFinite(state.money)).toBe(true);
        expect(state.mangaka.fatigue).toBeGreaterThanOrEqual(0);
        expect(state.mangaka.fatigue).toBeLessThanOrEqual(CONTENT.balance.fatigue.max);
        expect(
          state.series.filter((series) => series.status === "running").length,
        ).toBeLessThanOrEqual(1);
        for (const series of state.series) {
          expect(series.fans).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("only ends by bankruptcy, never by an inconsistent state", () => {
    for (const seed of [1, 2, 3]) {
      const states = simulate(seed, FORTY_YEARS);
      const last = states.at(-1);

      expect(last).toBeDefined();
      if (last?.phase === "bankrupt") {
        expect(last.money).toBeLessThan(0);
      } else {
        expect(weekToDate(last?.week ?? 0).year).toBeGreaterThanOrEqual(2019);
      }
    }
  });

  it("writes one history entry per week", () => {
    const states = simulate(7, 200);

    const last = states.at(-1);

    expect(last?.history).toHaveLength(last?.week ?? -1);
    expect(last?.history.map((record) => record.week)).toEqual(
      Array.from({ length: last?.week ?? 0 }, (_, week) => week),
    );
  });
});
