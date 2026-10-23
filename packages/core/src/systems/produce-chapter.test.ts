import { describe, expect, it } from "vitest";

import type { ChapterPublishedEvent } from "../events/game-event";
import type { GameState } from "../state/game-state";
import {
  apply,
  BEST_CHAPTER,
  GOOD_CHAPTER,
  MIDDLE_CHAPTER,
  newGame,
  play,
  REST,
  startedGame,
  START_SPORT,
  WORST_CHAPTER,
} from "../testing/play";
import { evenSliders } from "../testing/test-content";

function publishedEvent(events: readonly { kind: string }[]): ChapterPublishedEvent {
  const found = events.find(
    (event): event is ChapterPublishedEvent => event.kind === "chapterPublished",
  );
  if (found === undefined) {
    throw new Error("No chapterPublished event.");
  }
  return found;
}

describe("produceChapter: rejections leave the state untouched", () => {
  const rejected = (state: GameState, command = BEST_CHAPTER) => apply(state, command);

  it("without a running series", () => {
    const before = newGame();
    const { state, events } = rejected(before);

    expect(state).toBe(before);
    expect(events).toEqual([
      {
        kind: "commandRejected",
        key: "event.commandRejected",
        params: { reason: "noRunningSeries" },
      },
    ]);
  });

  it("when the game is over", () => {
    const before = { ...startedGame(START_SPORT), phase: "bankrupt" as const };

    expect(rejected(before).events[0]).toMatchObject({ params: { reason: "gameOver" } });
    expect(rejected(before).state).toBe(before);
  });

  it("when the series points at content that no longer exists", () => {
    const before = startedGame(START_SPORT);
    const broken: GameState = {
      ...before,
      series: before.series.map((series) => ({ ...series, themeId: "removed-by-a-mod" })),
    };

    expect(rejected(broken).events[0]).toMatchObject({ params: { reason: "unknownContent" } });
    expect(rejected(broken).state).toBe(broken);
  });

  it.each([
    ["a negative slider", { ...evenSliders(0), art: -1 }],
    ["a slider above the maximum", { ...evenSliders(0), art: 51 }],
    ["a slider that is not a number", { ...evenSliders(0), art: Number.NaN }],
    ["an infinite slider", { ...evenSliders(0), art: Number.POSITIVE_INFINITY }],
  ])("for %s", (_name, sliders) => {
    const before = startedGame(START_SPORT);
    const { state, events } = apply(before, { kind: "produceChapter", sliders });

    expect(state).toBe(before);
    expect(events[0]).toMatchObject({ params: { reason: "invalidSliders" } });
  });

  it("when the total goes over the energy budget", () => {
    const before = startedGame(START_SPORT);
    const { state, events } = apply(before, {
      kind: "produceChapter",
      sliders: evenSliders(21),
    });

    expect(state).toBe(before);
    expect(events[0]).toMatchObject({ params: { reason: "overBudget" } });
  });

  it("accepts a total exactly equal to the budget", () => {
    const { events } = apply(startedGame(START_SPORT), {
      kind: "produceChapter",
      sliders: evenSliders(20),
    });

    expect(events[0]?.kind).toBe("chapterPublished");
  });

  it("when fatigue has shrunk the budget below the allocation", () => {
    // One best chapter leaves fatigue 20, so the budget falls from 100 to 90.
    const tired = play(startedGame(START_SPORT), [BEST_CHAPTER]);

    const { state, events } = apply(tired, BEST_CHAPTER);

    expect(tired.mangaka.fatigue).toBe(20);
    expect(state).toBe(tired);
    expect(events[0]).toMatchObject({ params: { reason: "overBudget" } });
  });
});

describe("produceChapter: a published chapter", () => {
  it("ranks first with the best chapter and wins the fans of first place", () => {
    const { state, events } = apply(startedGame(START_SPORT), BEST_CHAPTER);
    const published = publishedEvent(events);

    expect(published.params).toEqual({
      quality: 100,
      rank: 1,
      total: 4,
      fansDelta: 100,
      fans: 100,
    });
    expect(state.series[0]).toMatchObject({ fans: 100, chaptersPublished: 1, badWeekStreak: 0 });
  });

  it("ranks second with a tie against the middle competitor", () => {
    const { events } = apply(startedGame(), MIDDLE_CHAPTER);

    expect(publishedEvent(events).params).toMatchObject({ quality: 40, rank: 2, fansDelta: 50 });
  });

  it("loses fans in last place but never goes below zero", () => {
    const { state, events } = apply(startedGame(), WORST_CHAPTER);

    expect(publishedEvent(events).params).toMatchObject({ rank: 4, fansDelta: 0, fans: 0 });
    expect(state.series[0]?.fans).toBe(0);
  });

  it("subtracts the fans of a bad rank from an existing audience", () => {
    const withFans = play(startedGame(START_SPORT), [BEST_CHAPTER]);
    expect(withFans.series[0]?.fans).toBe(100);

    const { events } = apply(withFans, WORST_CHAPTER);

    expect(publishedEvent(events).params).toMatchObject({ rank: 4, fansDelta: -10, fans: 90 });
  });

  it("carries the explanation of the result", () => {
    const { evaluation } = publishedEvent(apply(startedGame(START_SPORT), BEST_CHAPTER).events);

    expect(evaluation.quality).toBe(100);
    expect(evaluation.axes.find((line) => line.axis === "pacing")).toMatchObject({
      points: 50,
      weight: 0.5,
      contribution: 50,
    });
  });

  it("adds fatigue from the chapter and from the effort spent", () => {
    // 10 per chapter + 0.1 per point * 100 points.
    expect(apply(startedGame(START_SPORT), BEST_CHAPTER).state.mangaka.fatigue).toBe(20);
  });

  it("caps fatigue at the maximum", () => {
    const exhausted = {
      ...startedGame(START_SPORT),
      mangaka: { fatigue: 95 },
    };

    // Budget is 52 at fatigue 95: a light chapter still pushes fatigue past 100.
    const { state } = apply(exhausted, {
      kind: "produceChapter",
      sliders: { ...evenSliders(0), characters: 50 },
    });

    expect(state.mangaka.fatigue).toBe(100);
  });

  it("lowers the quality of a tired mangaka", () => {
    const rested = publishedEvent(apply(startedGame(START_SPORT), BEST_CHAPTER).events);
    const tired = publishedEvent(
      apply(
        { ...startedGame(START_SPORT), mangaka: { fatigue: 40 } },
        {
          kind: "produceChapter",
          sliders: { ...evenSliders(0), characters: 30, pacing: 30 },
        },
      ).events,
    );

    expect(rested.evaluation.multipliers.fatigue).toBe(1);
    expect(tired.evaluation.multipliers.fatigue).toBe(0.92);
  });

  it("moves the calendar and records the week", () => {
    const { state, events } = apply(startedGame(START_SPORT), BEST_CHAPTER);

    expect(state.week).toBe(1);
    expect(events.at(-1)).toEqual({
      kind: "weekAdvanced",
      key: "event.weekAdvanced",
      params: { week: 1 },
    });
    expect(state.history).toEqual([{ week: 0, quality: 100, rank: 1, fans: 100, money: 1000 }]);
  });

  it("does not mutate the previous state", () => {
    const before = startedGame(START_SPORT);

    apply(before, BEST_CHAPTER);

    expect(before.week).toBe(0);
    expect(before.history).toEqual([]);
    expect(before.series[0]?.fans).toBe(0);
  });

  it("is deterministic: the same state and command give the same result", () => {
    const before = startedGame(START_SPORT, 77);

    expect(apply(before, BEST_CHAPTER)).toEqual(apply(before, BEST_CHAPTER));
  });
});

describe("produceChapter: cancellation", () => {
  it("cancels the series after two bad weeks in a row", () => {
    const firstBad = apply(startedGame(), WORST_CHAPTER);
    expect(firstBad.state.series[0]).toMatchObject({ status: "running", badWeekStreak: 1 });

    const secondBad = apply(firstBad.state, WORST_CHAPTER);

    expect(secondBad.state.series[0]).toMatchObject({ status: "cancelled", badWeekStreak: 2 });
    expect(secondBad.events.map((event) => event.kind)).toEqual([
      "chapterPublished",
      "seriesCancelled",
      "weekAdvanced",
    ]);
    expect(secondBad.events[1]).toMatchObject({ params: { title: "Test Series" } });
  });

  it("resets the streak when a week goes well", () => {
    const state = play(startedGame(START_SPORT), [WORST_CHAPTER, GOOD_CHAPTER]);

    expect(state.series[0]).toMatchObject({ status: "running", badWeekStreak: 0 });
  });

  it("then rejects chapters: there is no running series", () => {
    const cancelled = play(startedGame(), [WORST_CHAPTER, WORST_CHAPTER]);

    expect(apply(cancelled, WORST_CHAPTER).events[0]).toMatchObject({
      params: { reason: "noRunningSeries" },
    });
  });
});

describe("produceChapter: month end", () => {
  it("pays the tome sales of the fans and the living costs on the fourth week", () => {
    // Week 1: a first-place chapter wins 100 fans. Weeks 2 to 4: three rests lose 20 fans each.
    const beforeLastWeek = play(startedGame(START_SPORT), [BEST_CHAPTER, REST, REST]);
    expect(beforeLastWeek.money).toBe(1000);

    const { state, events } = apply(beforeLastWeek, REST);
    const closed = events.find((event) => event.kind === "monthClosed");

    // 40 fans x 0.5 tome per fan = 20 tomes x 10 = 200 revenue, minus 100 of living costs.
    expect(closed).toEqual({
      kind: "monthClosed",
      key: "event.monthClosed",
      params: { tomesSold: 20, revenue: 200, expenses: 100, money: 1100 },
    });
    expect(state.money).toBe(1100);
  });

  it("sells nothing once the series is cancelled, but the living costs remain", () => {
    const cancelled = play(startedGame(), [WORST_CHAPTER, WORST_CHAPTER, REST]);

    const { events } = apply(cancelled, REST);

    expect(events.find((event) => event.kind === "monthClosed")).toMatchObject({
      params: { tomesSold: 0, revenue: 0, expenses: 100, money: 900 },
    });
  });

  it("does not close the month before its last week", () => {
    const { events } = apply(startedGame(START_SPORT), BEST_CHAPTER);

    expect(events.some((event) => event.kind === "monthClosed")).toBe(false);
  });

  it("ends the game when the money runs out", () => {
    const poor = { ...startedGame(START_SPORT), money: 50 };

    const state = play(poor, [REST, REST, REST]);
    expect(state.phase).toBe("playing");

    const last = apply(state, REST);

    expect(last.state.phase).toBe("bankrupt");
    expect(last.state.money).toBe(-50);
    expect(last.events.map((event) => event.kind)).toEqual([
      "weekRested",
      "monthClosed",
      "bankrupt",
      "weekAdvanced",
    ]);
    expect(last.events.find((event) => event.kind === "bankrupt")).toMatchObject({
      params: { money: -50 },
    });
  });

  it("stays playable at exactly zero money", () => {
    const exact = { ...startedGame(START_SPORT), money: 100 };

    expect(play(exact, [REST, REST, REST, REST]).phase).toBe("playing");
  });
});
