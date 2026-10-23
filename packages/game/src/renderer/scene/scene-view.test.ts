import { describe, expect, it } from "vitest";

import { createGameStore } from "../store/game-store";
import { FIGURE_STEPS, sceneViewOf } from "./scene-view";

describe("sceneViewOf", () => {
  it("starts at the first step", () => {
    expect(sceneViewOf(createGameStore(1).getState())).toEqual({ figureStep: 0 });
  });

  it("moves one step per week and wraps around", () => {
    const store = createGameStore(1);

    for (let week = 1; week <= FIGURE_STEPS; week += 1) {
      store.getState().dispatch({ kind: "advanceWeek" });
      expect(sceneViewOf(store.getState()).figureStep).toBe(week % FIGURE_STEPS);
    }
  });
});
