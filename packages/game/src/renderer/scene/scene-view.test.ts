import { describe, expect, it } from "vitest";

import { createGameStore } from "../store/game-store";
import { TEST_CONTENT } from "../testing/test-content";
import { MAX_PAGES, sceneViewOf } from "./scene-view";

const START = {
  kind: "startSeries",
  title: "Test",
  themeId: "sport",
  targetId: "shonen",
  artStyleId: "classic",
} as const;

const chapter = (points: number) =>
  ({
    kind: "produceChapter",
    sliders: { story: 0, art: 0, characters: points, worldbuilding: 0, pacing: points },
  }) as const;

describe("sceneViewOf", () => {
  it("shows a rested mangaka and an empty desk at the start", () => {
    expect(sceneViewOf(createGameStore(1, TEST_CONTENT).getState())).toEqual({
      mood: "fresh",
      pages: 0,
    });
  });

  it("piles up one page per published chapter", () => {
    const store = createGameStore(1, TEST_CONTENT);
    store.getState().dispatch(START);

    store.getState().dispatch(chapter(10));
    store.getState().dispatch(chapter(10));

    expect(sceneViewOf(store.getState()).pages).toBe(2);
  });

  it("stops piling up at the maximum", () => {
    const store = createGameStore(1, TEST_CONTENT);
    store.getState().dispatch(START);

    for (let week = 0; week < MAX_PAGES + 3; week += 1) {
      store.getState().dispatch({ kind: "advanceWeek" });
      store.getState().dispatch(chapter(0));
    }

    expect(sceneViewOf(store.getState()).pages).toBeLessThanOrEqual(MAX_PAGES);
  });

  it("looks tired, then exhausted, as fatigue builds up", () => {
    const store = createGameStore(1, TEST_CONTENT);
    store.getState().dispatch(START);

    const moods = [];
    for (let week = 0; week < 8; week += 1) {
      store.getState().dispatch(chapter(25));
      moods.push(sceneViewOf(store.getState()).mood);
    }

    expect(moods).toContain("tired");
    expect(moods).toContain("exhausted");
    expect(moods[0]).toBe("fresh");
  });

  it("recovers when resting", () => {
    const store = createGameStore(1, TEST_CONTENT);
    store.getState().dispatch(START);
    store.getState().dispatch(chapter(25));
    store.getState().dispatch(chapter(25));
    store.getState().dispatch(chapter(25));

    for (let week = 0; week < 4; week += 1) {
      store.getState().dispatch({ kind: "advanceWeek" });
    }

    expect(sceneViewOf(store.getState()).mood).toBe("fresh");
  });
});
