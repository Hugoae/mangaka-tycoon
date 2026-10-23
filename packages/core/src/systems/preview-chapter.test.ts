import { describe, expect, it } from "vitest";

import { applyCommand } from "../commands/command";
import { MIDDLE_CHAPTER, newGame, startedGame } from "../testing/play";
import { evenSliders, TEST_CONTENT } from "../testing/test-content";
import { previewChapter } from "./preview-chapter";

describe("previewChapter", () => {
  it("returns nothing when there is no running series", () => {
    expect(previewChapter(newGame(), TEST_CONTENT, evenSliders(20))).toBeUndefined();
  });

  it("returns the quality the chapter would get", () => {
    const state = startedGame();
    const preview = previewChapter(state, TEST_CONTENT, evenSliders(20));
    const published = applyCommand(state, MIDDLE_CHAPTER, TEST_CONTENT).events[0];

    expect(preview?.quality).toBe(40);
    expect(published?.kind === "chapterPublished" ? published.evaluation : undefined).toEqual(
      preview,
    );
  });

  it("does not change the game", () => {
    const state = startedGame();

    previewChapter(state, TEST_CONTENT, evenSliders(50));

    expect(state).toEqual(startedGame());
  });

  it("returns nothing when the series refers to content that does not exist", () => {
    const state = startedGame();
    const broken = {
      ...state,
      series: state.series.map((series) => ({ ...series, themeId: "unknown" })),
    };

    expect(previewChapter(broken, TEST_CONTENT, evenSliders(20))).toBeUndefined();
  });

  it("returns nothing once the game is over", () => {
    const state = { ...startedGame(), phase: "bankrupt" as const };

    expect(previewChapter(state, TEST_CONTENT, evenSliders(20))).toBeUndefined();
  });
});
