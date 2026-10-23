import { describe, expect, it } from "vitest";

import { evenSliders, NO_EFFORT, TEST_CONTENT } from "../testing/test-content";
import { energyBudget, evaluateChapter } from "./chapter-quality";
import type { ChapterEvaluationInput } from "./chapter-quality";

const [adventure, sport] = TEST_CONTENT.themes;
const [shonen, seinen] = TEST_CONTENT.targets;
const [classic, cartoon] = TEST_CONTENT.artStyles;
if (
  adventure === undefined ||
  sport === undefined ||
  shonen === undefined ||
  seinen === undefined ||
  classic === undefined ||
  cartoon === undefined
) {
  throw new Error("The test content is incomplete.");
}

const input = (overrides: Partial<ChapterEvaluationInput> = {}): ChapterEvaluationInput => ({
  balance: TEST_CONTENT.balance,
  theme: adventure,
  target: seinen,
  artStyle: cartoon,
  sliders: evenSliders(50),
  fatigue: 0,
  year: 1980,
  ...overrides,
});

describe("energyBudget", () => {
  it("is the full base energy without fatigue", () => {
    expect(energyBudget(TEST_CONTENT.balance, 0)).toBe(100);
  });

  it("shrinks with fatigue, down to the penalty at maximum fatigue", () => {
    expect(energyBudget(TEST_CONTENT.balance, 50)).toBe(75);
    expect(energyBudget(TEST_CONTENT.balance, 100)).toBe(50);
  });

  it("rounds down to whole points", () => {
    expect(energyBudget(TEST_CONTENT.balance, 33)).toBe(83);
  });
});

describe("evaluateChapter", () => {
  it("gives the maximum for full sliders with neutral multipliers", () => {
    const evaluation = evaluateChapter(input());

    expect(evaluation.quality).toBe(100);
    expect(evaluation.baseQuality).toBe(100);
  });

  it("gives zero for no effort", () => {
    expect(evaluateChapter(input({ sliders: NO_EFFORT })).quality).toBe(0);
  });

  it("is linear in the points when the exponent is 1", () => {
    expect(evaluateChapter(input({ sliders: evenSliders(25) })).quality).toBe(50);
  });

  it("explains each slider: points, weight, score and contribution", () => {
    const { axes } = evaluateChapter(input({ sliders: { ...evenSliders(0), story: 25 } }));

    expect(axes.map((line) => line.axis)).toEqual([
      "story",
      "art",
      "characters",
      "worldbuilding",
      "pacing",
    ]);
    expect(axes[0]).toEqual({
      axis: "story",
      points: 25,
      weight: 0.2,
      score: 0.5,
      contribution: 10,
    });
    expect(axes[1]?.contribution).toBe(0);
  });

  it("weights the sliders by theme: only the axes of the theme count", () => {
    const onlyUseful = { ...NO_EFFORT, characters: 50, pacing: 50 };
    const onlyUseless = { ...NO_EFFORT, story: 50, art: 50 };

    expect(evaluateChapter(input({ theme: sport, sliders: onlyUseful })).quality).toBe(100);
    expect(evaluateChapter(input({ theme: sport, sliders: onlyUseless })).quality).toBe(0);
  });

  it("applies diminishing returns when the exponent is below 1", () => {
    const concave = {
      ...TEST_CONTENT.balance,
      slider: { ...TEST_CONTENT.balance.slider, exponent: 0.5 },
    };

    const half = evaluateChapter(input({ balance: concave, sliders: evenSliders(25) }));

    // sqrt(0.5) = 0.71: half the points give more than half the quality.
    expect(half.quality).toBe(70.71);
  });

  it("applies the year trend and repeats the last year after the table ends", () => {
    const quarter = { sliders: evenSliders(25) };

    expect(evaluateChapter(input(quarter)).multipliers.trend).toBe(1);
    expect(evaluateChapter(input({ ...quarter, year: 1981 })).quality).toBe(55);
    expect(evaluateChapter(input({ ...quarter, year: 1989 })).multipliers.trend).toBe(1.1);
  });

  it("applies the audience and art style fit, defaulting to 1 for an unknown pairing", () => {
    const quarter = { sliders: evenSliders(25) };

    expect(evaluateChapter(input({ ...quarter, target: shonen })).multipliers.target).toBe(1.1);
    expect(evaluateChapter(input({ ...quarter, target: seinen })).multipliers.target).toBe(1);
    expect(
      evaluateChapter(input({ ...quarter, theme: sport, artStyle: classic })).multipliers.style,
    ).toBe(0.5);
    expect(evaluateChapter(input({ ...quarter, artStyle: cartoon })).multipliers.style).toBe(1);
  });

  it("lowers the quality with fatigue", () => {
    const tired = evaluateChapter(input({ fatigue: 100 }));

    expect(tired.multipliers.fatigue).toBe(0.8);
    expect(tired.quality).toBe(80);
  });

  it("caps the quality at the maximum even with strong multipliers", () => {
    const evaluation = evaluateChapter(input({ target: shonen, year: 1981 }));

    expect(evaluation.baseQuality).toBe(100);
    expect(evaluation.quality).toBe(100);
  });

  it("never goes below zero", () => {
    const harsh = {
      ...TEST_CONTENT.balance,
      quality: { ...TEST_CONTENT.balance.quality, fatiguePenalty: 3 },
    };

    expect(evaluateChapter(input({ balance: harsh, fatigue: 100 })).quality).toBe(0);
  });
});
