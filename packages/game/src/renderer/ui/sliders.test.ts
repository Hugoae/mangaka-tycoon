import { totalPoints } from "@mangaka/core";
import { describe, expect, it } from "vitest";

import { fitToBudget, setSlider, STARTING_SLIDERS } from "./sliders";

const ZERO = { story: 0, art: 0, characters: 0, worldbuilding: 0, pacing: 0 };

describe("setSlider", () => {
  it("sets the value when it fits", () => {
    expect(setSlider(ZERO, "art", 30, 100, 50).art).toBe(30);
  });

  it("does not go above the slider maximum", () => {
    expect(setSlider(ZERO, "art", 80, 100, 50).art).toBe(50);
  });

  it("does not go below zero", () => {
    expect(setSlider(STARTING_SLIDERS, "art", -5, 100, 50).art).toBe(0);
  });

  it("keeps the total within the budget, counting the other sliders", () => {
    const sliders = { ...ZERO, story: 40, pacing: 30 };

    expect(setSlider(sliders, "art", 50, 100, 50).art).toBe(30);
  });

  it("rounds to whole points", () => {
    expect(setSlider(ZERO, "art", 12.6, 100, 50).art).toBe(13);
  });

  it("can always lower a slider, even when the allocation is over budget", () => {
    const sliders = { ...ZERO, story: 50, art: 50, pacing: 50 };

    expect(setSlider(sliders, "story", 10, 100, 50).story).toBe(0);
  });

  it("leaves the other sliders alone", () => {
    const sliders = { ...ZERO, story: 10 };

    expect(setSlider(sliders, "art", 5, 100, 50)).toEqual({ ...sliders, art: 5 });
  });
});

describe("fitToBudget", () => {
  it("returns the same values when the allocation fits", () => {
    expect(fitToBudget(STARTING_SLIDERS, 100)).toEqual(STARTING_SLIDERS);
  });

  it("takes points from the last sliders first", () => {
    expect(fitToBudget(STARTING_SLIDERS, 35)).toEqual({
      story: 10,
      art: 10,
      characters: 10,
      worldbuilding: 5,
      pacing: 0,
    });
  });

  it("ends exactly on the budget", () => {
    expect(totalPoints(fitToBudget(STARTING_SLIDERS, 23))).toBe(23);
  });

  it("empties everything when there is no budget left", () => {
    expect(fitToBudget(STARTING_SLIDERS, 0)).toEqual(ZERO);
    expect(fitToBudget(STARTING_SLIDERS, -5)).toEqual(ZERO);
  });
});
