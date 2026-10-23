import type { GameStoreState } from "../store/game-store";

/** What the scene needs to know about the game, and nothing more: no rules live in the scene. */
export interface SceneView {
  /** Position of the placeholder figure along its path; changes once per week. */
  readonly figureStep: number;
}

export const FIGURE_STEPS = 8;

export function sceneViewOf(state: GameStoreState): SceneView {
  return { figureStep: state.game.week % FIGURE_STEPS };
}
