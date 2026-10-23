import { describe, expect, it } from "vitest";

import { computeIntegerScale, GAME_HEIGHT, GAME_WIDTH } from "./integer-scale";

describe("computeIntegerScale", () => {
  it.each([
    // [viewport width, viewport height, expected scale]: the screens listed in ADR 0010.
    [1280, 720, 2],
    [1366, 768, 2],
    [1920, 1080, 3],
    [2560, 1440, 4],
    [3840, 2160, 6],
  ])("fits %ix%i at x%i", (width, height, expected) => {
    expect(computeIntegerScale(width, height)).toBe(expected);
  });

  it("is exact at the internal resolution", () => {
    expect(computeIntegerScale(GAME_WIDTH, GAME_HEIGHT)).toBe(1);
  });

  it("stays on the lower factor when one side is just short of the next one", () => {
    expect(computeIntegerScale(1919, 1080)).toBe(2);
    expect(computeIntegerScale(1920, 1079)).toBe(2);
  });

  it("is limited by the tighter dimension", () => {
    expect(computeIntegerScale(3840, 720)).toBe(2);
    expect(computeIntegerScale(1280, 2160)).toBe(2);
  });

  it("never goes below 1, even for a viewport smaller than the game", () => {
    expect(computeIntegerScale(320, 180)).toBe(1);
  });

  it.each([NaN, Infinity, -Infinity, 0, -100])(
    "falls back to 1 for an invalid size (%s)",
    (bad) => {
      expect(computeIntegerScale(bad, 1080)).toBe(1);
      expect(computeIntegerScale(1920, bad)).toBe(1);
    },
  );
});
