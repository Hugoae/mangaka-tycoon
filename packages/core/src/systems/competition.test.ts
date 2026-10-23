import { describe, expect, it } from "vitest";

import { TEST_CONTENT, VOLATILE_TEST_CONTENT } from "../testing/test-content";
import { competitorScores, expectedCompetitorStrengths, rankAmong } from "./competition";

describe("expectedCompetitorStrengths", () => {
  it("is the base strength at the start, in content order", () => {
    expect(expectedCompetitorStrengths(TEST_CONTENT, 0)).toEqual([
      { id: "strong", score: 80 },
      { id: "middle", score: 40 },
      { id: "weak", score: 10 },
    ]);
  });

  it("grows with the years and has no random swing", () => {
    const yearTwo = expectedCompetitorStrengths(VOLATILE_TEST_CONTENT, 104);
    const yearOne = expectedCompetitorStrengths(VOLATILE_TEST_CONTENT, 0);

    expect(yearTwo.map((entry) => entry.score)).not.toEqual(yearOne.map((entry) => entry.score));
    expect(expectedCompetitorStrengths(VOLATILE_TEST_CONTENT, 104)).toEqual(yearTwo);
  });
});

describe("competitorScores", () => {
  it("is the base strength when there is no growth and no volatility", () => {
    expect(competitorScores(TEST_CONTENT, 1, 0).map((entry) => entry.score)).toEqual([80, 40, 10]);
  });

  it("returns one score per competitor, in content order", () => {
    expect(competitorScores(TEST_CONTENT, 1, 0).map((entry) => entry.id)).toEqual([
      "strong",
      "middle",
      "weak",
    ]);
  });

  it("grows with the years", () => {
    const yearTwo = competitorScores(VOLATILE_TEST_CONTENT, 5, 96);
    const yearOne = competitorScores(VOLATILE_TEST_CONTENT, 5, 0);

    const mean = (scores: readonly { score: number }[]): number =>
      scores.reduce((sum, entry) => sum + entry.score, 0) / scores.length;
    // +12 per year over 2 years, noise of +-15: the gap is large enough to be certain.
    expect(mean(yearTwo)).toBeGreaterThan(mean(yearOne));
  });

  it("is a pure function of content, seed and week", () => {
    expect(competitorScores(VOLATILE_TEST_CONTENT, 9, 30)).toEqual(
      competitorScores(VOLATILE_TEST_CONTENT, 9, 30),
    );
  });

  it("changes with the seed and with the week", () => {
    const base = competitorScores(VOLATILE_TEST_CONTENT, 9, 30);

    expect(competitorScores(VOLATILE_TEST_CONTENT, 10, 30)).not.toEqual(base);
    expect(competitorScores(VOLATILE_TEST_CONTENT, 9, 31)).not.toEqual(base);
  });

  it("stays between 0 and the maximum quality", () => {
    for (let week = 0; week < 480; week += 1) {
      for (const { score } of competitorScores(VOLATILE_TEST_CONTENT, 3, week)) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(TEST_CONTENT.balance.quality.max);
      }
    }
  });
});

describe("rankAmong", () => {
  const scores = [
    { id: "a", score: 80 },
    { id: "b", score: 40 },
    { id: "c", score: 10 },
  ];

  it.each([
    [90, 1],
    [60, 2],
    [20, 3],
    [5, 4],
  ])("ranks a quality of %s at %s", (quality, rank) => {
    expect(rankAmong(quality, scores)).toBe(rank);
  });

  it("gives a tie to the player", () => {
    expect(rankAmong(80, scores)).toBe(1);
    expect(rankAmong(40, scores)).toBe(2);
  });

  it("ranks first when nobody competes", () => {
    expect(rankAmong(0, [])).toBe(1);
  });
});
