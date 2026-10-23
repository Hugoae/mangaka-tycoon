import { describe, expect, it } from "vitest";

import { round2 } from "./round";

describe("round2", () => {
  it.each([
    [1.234, 1.23],
    [1.235, 1.24],
    [0, 0],
    [-1.234, -1.23],
    [100, 100],
  ])("rounds %s to %s", (value, expected) => {
    expect(round2(value)).toBe(expected);
  });
});
