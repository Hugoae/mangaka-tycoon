import { describe, expect, it } from "vitest";

import { apply, newGame, play, startedGame, START_NEUTRAL, WORST_CHAPTER } from "../testing/play";
import { TEST_CONTENT } from "../testing/test-content";

describe("startSeries", () => {
  it("adds a running series with the chosen content and the starting fans", () => {
    const { state, events } = apply(newGame(), START_NEUTRAL);

    expect(state.series).toEqual([
      {
        id: "series-1",
        title: "Test Series",
        themeId: "adventure",
        targetId: "seinen",
        artStyleId: "cartoon",
        fans: TEST_CONTENT.balance.series.startingFans,
        chaptersPublished: 0,
        badWeekStreak: 0,
        status: "running",
      },
    ]);
    expect(events).toEqual([
      { kind: "seriesStarted", key: "event.seriesStarted", params: { title: "Test Series" } },
    ]);
  });

  it("does not use up a week", () => {
    expect(apply(newGame(), START_NEUTRAL).state.week).toBe(0);
  });

  it("trims the title", () => {
    const { state } = apply(newGame(), { ...START_NEUTRAL, title: "  Padded  " });

    expect(state.series[0]?.title).toBe("Padded");
  });

  it("does not mutate the previous state", () => {
    const before = newGame();

    apply(before, START_NEUTRAL);

    expect(before.series).toEqual([]);
  });

  it.each([
    ["an empty title", ""],
    ["a blank title", "   "],
    ["a title that is too long", "x".repeat(TEST_CONTENT.balance.series.titleMaxLength + 1)],
  ])("rejects %s", (_name, title) => {
    const before = newGame();

    const { state, events } = apply(before, { ...START_NEUTRAL, title });

    expect(state).toBe(before);
    expect(events).toEqual([
      { kind: "commandRejected", key: "event.commandRejected", params: { reason: "invalidTitle" } },
    ]);
  });

  it("accepts a title of exactly the maximum length", () => {
    const title = "x".repeat(TEST_CONTENT.balance.series.titleMaxLength);

    expect(apply(newGame(), { ...START_NEUTRAL, title }).state.series).toHaveLength(1);
  });

  it.each([
    ["theme", { themeId: "unknown" }],
    ["target audience", { targetId: "unknown" }],
    ["art style", { artStyleId: "unknown" }],
  ])("rejects an unknown %s", (_name, override) => {
    const { events } = apply(newGame(), { ...START_NEUTRAL, ...override });

    expect(events[0]).toMatchObject({ params: { reason: "unknownContent" } });
  });

  it("rejects a second series while one is running", () => {
    const { state, events } = apply(startedGame(), START_NEUTRAL);

    expect(state.series).toHaveLength(1);
    expect(events[0]).toMatchObject({ params: { reason: "seriesAlreadyRunning" } });
  });

  it("allows a new series once the previous one is cancelled", () => {
    const cancelled = play(startedGame(), [WORST_CHAPTER, WORST_CHAPTER]);
    expect(cancelled.series[0]?.status).toBe("cancelled");

    const { state } = apply(cancelled, { ...START_NEUTRAL, title: "Second" });

    expect(state.series.map((series) => series.id)).toEqual(["series-1", "series-2"]);
    expect(state.series[1]?.status).toBe("running");
  });

  it("rejects everything once the game is over", () => {
    const broke = { ...newGame(), phase: "bankrupt" as const };

    expect(apply(broke, START_NEUTRAL).events[0]).toMatchObject({ params: { reason: "gameOver" } });
  });
});
