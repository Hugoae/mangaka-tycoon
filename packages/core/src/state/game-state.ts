import { freeze } from "immer";

import type { WeekIndex } from "../calendar/calendar";

/** Schema version of {@link GameState}. Bumped with a migration once saves exist (milestone M1). */
export const GAME_STATE_VERSION = 1;

const FIRST_WEEK: WeekIndex = 0;

/**
 * The whole simulation state: plain JSON data only (no class, Map, Set, function or native date).
 *
 * Deliberately minimal for the skeleton. Money, mangaka and series arrive with their milestones.
 */
export interface GameState {
  readonly version: number;
  /** Source of all randomness. Not consumed yet: the PRNG arrives with milestone M1 (ADR 0005). */
  readonly seed: number;
  readonly week: WeekIndex;
}

export interface NewGameOptions {
  readonly seed: number;
}

/** Creates the state of a new game, frozen like every state the core produces. */
export function createNewGame(options: NewGameOptions): GameState {
  return freeze({ version: GAME_STATE_VERSION, seed: options.seed, week: FIRST_WEEK }, true);
}
