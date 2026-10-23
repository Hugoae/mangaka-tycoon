import { describe, expect, it } from "vitest";

import { apply, BEST_CHAPTER, newGame, REST, START_SPORT } from "../testing/play";
import { TEST_CONTENT } from "../testing/test-content";
import { applyCommand } from "./command";
import type { Command } from "./command";

describe("applyCommand", () => {
  it("routes advanceWeek", () => {
    expect(apply(newGame(), REST).events[0]?.kind).toBe("weekRested");
  });

  it("routes startSeries", () => {
    expect(apply(newGame(), START_SPORT).events[0]?.kind).toBe("seriesStarted");
  });

  it("routes produceChapter", () => {
    const started = apply(newGame(), START_SPORT).state;

    expect(apply(started, BEST_CHAPTER).events[0]?.kind).toBe("chapterPublished");
  });

  it("returns a frozen state: the UI cannot mutate it by accident", () => {
    const { state } = apply(newGame(), START_SPORT);

    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.series)).toBe(true);
    expect(Object.isFrozen(state.series[0])).toBe(true);
  });

  it("fails loudly on a command it does not know (data from outside the type system)", () => {
    // @ts-expect-error a corrupted command, as could come from a save or a mod, must not pass silently
    const corrupted: Command = { kind: "teleport" };

    expect(() => applyCommand(newGame(), corrupted, TEST_CONTENT)).toThrow();
  });
});
