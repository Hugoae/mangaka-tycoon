import { describe, expect, it } from "vitest";

import {
  apply,
  BEST_CHAPTER,
  newGame,
  play,
  REST,
  startedGame,
  START_SPORT,
} from "../testing/play";
import { TEST_CONTENT } from "../testing/test-content";
import { advanceWeek } from "./advance-week";

describe("advanceWeek (resting)", () => {
  it("moves the calendar by one week and says so", () => {
    const { state, events } = advanceWeek(newGame(), TEST_CONTENT);

    expect(state.week).toBe(1);
    expect(events.at(-1)).toEqual({
      kind: "weekAdvanced",
      key: "event.weekAdvanced",
      params: { week: 1 },
    });
  });

  it("works without any series", () => {
    const { state, events } = advanceWeek(newGame(), TEST_CONTENT);

    expect(events[0]).toEqual({
      kind: "weekRested",
      key: "event.weekRested",
      params: { fansLost: 0, fatigueRecovered: 0 },
    });
    expect(state.history).toEqual([{ week: 0, quality: null, rank: null, fans: 0, money: 1000 }]);
  });

  it("recovers fatigue, but not below zero", () => {
    const tired = play(startedGame(START_SPORT), [BEST_CHAPTER]);
    expect(tired.mangaka.fatigue).toBe(20);

    const once = advanceWeek(tired, TEST_CONTENT);

    expect(once.state.mangaka.fatigue).toBe(0);
    expect(once.events[0]).toMatchObject({ params: { fatigueRecovered: 20 } });
  });

  it("makes the running series lose fans, but not below zero", () => {
    const withFans = play(startedGame(START_SPORT), [BEST_CHAPTER]);
    expect(withFans.series[0]?.fans).toBe(100);

    const rested = advanceWeek(withFans, TEST_CONTENT);

    expect(rested.state.series[0]?.fans).toBe(80);
    expect(rested.events[0]).toMatchObject({ params: { fansLost: 20 } });
    expect(
      advanceWeek(
        { ...withFans, series: withFans.series.map((series) => ({ ...series, fans: 5 })) },
        TEST_CONTENT,
      ).state.series[0]?.fans,
    ).toBe(0);
  });

  it("records the resting week in the history", () => {
    const state = play(startedGame(START_SPORT), [BEST_CHAPTER, REST]);

    expect(state.history[1]).toEqual({ week: 1, quality: null, rank: null, fans: 80, money: 1000 });
  });

  it("does not touch a cancelled series", () => {
    const cancelled = {
      ...startedGame(START_SPORT),
      series: startedGame(START_SPORT).series.map((series) => ({
        ...series,
        fans: 50,
        status: "cancelled" as const,
      })),
    };

    expect(advanceWeek(cancelled, TEST_CONTENT).state.series[0]?.fans).toBe(50);
  });

  it("is refused once the game is over", () => {
    const over = { ...newGame(), phase: "bankrupt" as const };

    const { state, events } = advanceWeek(over, TEST_CONTENT);

    expect(state).toBe(over);
    expect(events[0]).toMatchObject({ params: { reason: "gameOver" } });
  });

  it("does not mutate its input and is deterministic", () => {
    const before = startedGame();

    expect(advanceWeek(before, TEST_CONTENT)).toEqual(advanceWeek(before, TEST_CONTENT));
    expect(before.week).toBe(0);
  });

  it("is reachable through applyCommand", () => {
    expect(apply(newGame(), REST).state.week).toBe(1);
  });
});
