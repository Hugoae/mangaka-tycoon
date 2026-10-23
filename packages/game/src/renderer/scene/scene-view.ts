import { findRunningSeries } from "@mangaka/core";

import type { GameStoreState } from "../store/game-store";

export type Mood = "fresh" | "tired" | "exhausted";

/** What the scene needs to know about the game, and nothing more: no rules live in the scene. */
export interface SceneView {
  /** How the mangaka looks, from the fatigue gauge. */
  readonly mood: Mood;
  /** Height of the pile of finished pages on the desk, 0 to {@link MAX_PAGES}. */
  readonly pages: number;
}

export const MAX_PAGES = 10;

/** Share of the fatigue gauge from which the mangaka looks tired, then exhausted (presentation only). */
const TIRED_FROM = 0.4;
const EXHAUSTED_FROM = 0.75;

export function sceneViewOf(state: GameStoreState): SceneView {
  const share = state.game.mangaka.fatigue / state.content.balance.fatigue.max;
  const mood: Mood =
    share >= EXHAUSTED_FROM ? "exhausted" : share >= TIRED_FROM ? "tired" : "fresh";
  const chapters = findRunningSeries(state.game)?.chaptersPublished ?? 0;
  return { mood, pages: Math.min(MAX_PAGES, chapters) };
}
