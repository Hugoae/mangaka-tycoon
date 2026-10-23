import type { GameEvent, RejectionReason } from "@mangaka/core";
import { describe, expect, it } from "vitest";

import { createI18n } from "../i18n/i18n";
import { buildReport, describeEvaluation, describeEvent } from "./report";

const EVALUATION = {
  axes: [
    { axis: "story", points: 10, weight: 0.5, score: 0.5, contribution: 25 },
    { axis: "art", points: 20, weight: 0.5, score: 0.8, contribution: 40.25 },
  ],
  baseQuality: 65.25,
  multipliers: { trend: 1.05, target: 1, style: 0.9, fatigue: 0.95 },
  quality: 58.6,
} as const;

const PUBLISHED: GameEvent = {
  kind: "chapterPublished",
  key: "event.chapterPublished",
  params: { quality: 58.6, rank: 2, total: 7, fansDelta: 50, fans: 1234 },
  evaluation: EVALUATION,
};

describe("describeEvent", () => {
  it("describes a published chapter in French", async () => {
    const i18n = await createI18n("fr");

    const text = describeEvent(i18n.t, PUBLISHED, "fr");

    expect(text).toContain("qualité 58,6");
    expect(text).toContain("n°2 sur 7");
    expect(text).toContain("+50 fans");
  });

  it("describes the same event in English", async () => {
    const i18n = await createI18n("en");

    const text = describeEvent(i18n.t, PUBLISHED, "en");

    expect(text).toBe("Chapter published: quality 58.6, rank #2 of 7, +50 fans (total: 1,234).");
  });

  it("ignores the bookkeeping event of the calendar", async () => {
    const i18n = await createI18n();

    expect(
      describeEvent(
        i18n.t,
        { kind: "weekAdvanced", key: "event.weekAdvanced", params: { week: 1 } },
        "fr",
      ),
    ).toBeUndefined();
  });

  it("describes every other kind of event", async () => {
    const i18n = await createI18n("en");
    const events: readonly GameEvent[] = [
      { kind: "seriesStarted", key: "event.seriesStarted", params: { title: "Naruto-ish" } },
      {
        kind: "weekRested",
        key: "event.weekRested",
        params: { fansLost: 3, fatigueRecovered: 30 },
      },
      {
        kind: "monthClosed",
        key: "event.monthClosed",
        params: { tomesSold: 10, revenue: 5000, expenses: 3000, money: 12000 },
      },
      { kind: "seriesCancelled", key: "event.seriesCancelled", params: { title: "Naruto-ish" } },
      { kind: "bankrupt", key: "event.bankrupt", params: { money: -500 } },
    ];

    const texts = events.map((event) => describeEvent(i18n.t, event, "en"));

    expect(texts).toEqual([
      'New series started: "Naruto-ish".',
      "Rest week: fatigue -30, fans lost: 3.",
      "Month end: 10 tomes sold, 5,000 ¥ in sales, 3,000 ¥ in expenses. Money: 12,000 ¥.",
      'The magazine cancels "Naruto-ish": too many bad rankings in a row.',
      "Bankruptcy: only -500 ¥ left.",
    ]);
  });

  it.each<RejectionReason>([
    "gameOver",
    "noRunningSeries",
    "seriesAlreadyRunning",
    "invalidTitle",
    "unknownContent",
    "invalidSliders",
    "overBudget",
  ])("explains the rejection %s in both languages", async (reason) => {
    const event: GameEvent = {
      kind: "commandRejected",
      key: "event.commandRejected",
      params: { reason },
    };
    const french = await createI18n("fr");
    const english = await createI18n("en");

    const frenchText = describeEvent(french.t, event, "fr");
    const englishText = describeEvent(english.t, event, "en");

    expect(frenchText).toMatch(/^Action impossible : .+/);
    expect(englishText).toMatch(/^Action not possible: .+/);
  });
});

describe("describeEvaluation", () => {
  it("explains each slider, the base quality and the multipliers", async () => {
    const i18n = await createI18n("en");

    expect(describeEvaluation(i18n.t, EVALUATION, "en")).toEqual([
      "Story: 10 pts → 25",
      "Art: 20 pts → 40.3",
      "Base quality: 65.3",
      "Trend ×1.05 · Audience ×1 · Style ×0.9 · Fatigue ×0.95",
    ]);
  });
});

describe("buildReport", () => {
  it("has a breakdown only when a chapter was published", async () => {
    const i18n = await createI18n("en");

    expect(buildReport(i18n.t, [PUBLISHED], "en").breakdown).toHaveLength(4);
    expect(buildReport(i18n.t, [], "en")).toEqual({ breakdown: [], messages: [] });
  });

  it("keeps one message per event that has a sentence", async () => {
    const i18n = await createI18n("en");
    const report = buildReport(
      i18n.t,
      [PUBLISHED, { kind: "weekAdvanced", key: "event.weekAdvanced", params: { week: 1 } }],
      "en",
    );

    expect(report.messages).toHaveLength(1);
  });
});
