import { describe, expect, it } from "vitest";

import { createSfc32, createStream, drawSymmetric } from "./streams";

function draw(count: number, stream: () => number): number[] {
  return Array.from({ length: count }, () => stream());
}

describe("createSfc32", () => {
  it("matches reference values of an independent sfc32 implementation (after 12 warm-up rounds)", () => {
    // Computed with the plain public-domain sfc32 formulation, seeded with (1, 2, 3, 4).
    expect(draw(4, createSfc32(1, 2, 3, 4))).toEqual([
      0.09715683059766889, 0.2785244262777269, 0.02877408149652183, 0.18638652772642672,
    ]);
  });

  it("is deterministic", () => {
    expect(draw(20, createSfc32(9, 8, 7, 6))).toEqual(draw(20, createSfc32(9, 8, 7, 6)));
  });

  it("gives other sequences for other seeds", () => {
    expect(draw(5, createSfc32(1, 2, 3, 4))).not.toEqual(draw(5, createSfc32(1, 2, 3, 5)));
  });
});

describe("createStream", () => {
  it("always gives the same sequence for the same (seed, week, system)", () => {
    expect(draw(50, createStream(42, 7, "magazine"))).toEqual(
      draw(50, createStream(42, 7, "magazine")),
    );
  });

  it("gives unrelated sequences when the seed, the week or the system changes", () => {
    const base = draw(8, createStream(42, 7, "magazine"));

    expect(draw(8, createStream(43, 7, "magazine"))).not.toEqual(base);
    expect(draw(8, createStream(42, 8, "magazine"))).not.toEqual(base);
    expect(draw(8, createStream(42, 7, "events"))).not.toEqual(base);
  });

  it("is not perturbed by the draws of another system", () => {
    const alone = draw(10, createStream(1, 1, "magazine"));

    draw(1000, createStream(1, 1, "events"));
    const afterOtherSystem = draw(10, createStream(1, 1, "magazine"));

    expect(afterOtherSystem).toEqual(alone);
  });

  it("only returns floats in [0, 1)", () => {
    const stream = createStream(5, 5, "check");

    for (const value of draw(10_000, stream)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("spreads values evenly (10 buckets, 20 000 draws)", () => {
    const buckets = Array.from({ length: 10 }, () => 0);
    for (const value of draw(20_000, createStream(2026, 3, "uniformity"))) {
      const index = Math.floor(value * 10);
      buckets[index] = (buckets[index] ?? 0) + 1;
    }

    for (const count of buckets) {
      // Expected 2 000 per bucket; +-15 % is far beyond random noise yet catches a broken mixer.
      expect(count).toBeGreaterThan(1700);
      expect(count).toBeLessThan(2300);
    }
  });

  it("does not correlate neighbouring weeks", () => {
    const firstDraws = Array.from({ length: 2000 }, (_, week) =>
      createStream(7, week, "magazine")(),
    );
    const mean = firstDraws.reduce((sum, value) => sum + value, 0) / firstDraws.length;

    expect(mean).toBeGreaterThan(0.45);
    expect(mean).toBeLessThan(0.55);
    // Adjacent weeks must not rise or fall together systematically.
    let rises = 0;
    for (let index = 1; index < firstDraws.length; index += 1) {
      if ((firstDraws[index] ?? 0) > (firstDraws[index - 1] ?? 0)) {
        rises += 1;
      }
    }
    expect(rises).toBeGreaterThan(900);
    expect(rises).toBeLessThan(1100);
  });
});

describe("drawSymmetric", () => {
  it("maps a draw to [-1, 1)", () => {
    expect(drawSymmetric(() => 0)).toBe(-1);
    expect(drawSymmetric(() => 0.5)).toBe(0);
    expect(drawSymmetric(() => 0.75)).toBe(0.5);
  });
});
