import { describe, expect, it } from "vitest";

import { createNewGame } from "../state/game-state";
import { advanceWeek } from "../systems/advance-week";

import { applyCommand } from "./command";

describe("applyCommand", () => {
  it("routes advanceWeek to the advanceWeek system", () => {
    const state = createNewGame({ seed: 1 });
    expect(applyCommand(state, { kind: "advanceWeek" })).toEqual(advanceWeek(state));
  });

  it("refuses a command that bypassed the type system", () => {
    const state = createNewGame({ seed: 1 });
    // @ts-expect-error -- a corrupted command that the type system would normally reject
    expect(() => applyCommand(state, { kind: "unknown" })).toThrow("Unexpected value");
  });
});
