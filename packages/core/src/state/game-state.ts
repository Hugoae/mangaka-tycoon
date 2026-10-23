import { freeze } from "immer";

import type { WeekIndex } from "../calendar/calendar";
import type { GameContent } from "../content/content-types";

/** Schema version of {@link GameState}. Bumped with a migration once saves exist (milestone M1). */
export const GAME_STATE_VERSION = 1;

const FIRST_WEEK: WeekIndex = 0;
const NO_FATIGUE = 0;

export type GamePhase = "playing" | "bankrupt";

export type SeriesStatus = "running" | "cancelled";

export interface Series {
  readonly id: string;
  readonly title: string;
  /** References into the game content, never copies (AGENTS.md 5.4). */
  readonly themeId: string;
  readonly targetId: string;
  readonly artStyleId: string;
  readonly fans: number;
  readonly chaptersPublished: number;
  /** Consecutive weeks ranked at or below the cancellation rank. */
  readonly badWeekStreak: number;
  readonly status: SeriesStatus;
}

/** One line of the weekly journal, kept for the stats screens and the headless bot. */
export interface WeekRecord {
  readonly week: WeekIndex;
  /** Quality of the published chapter, or `null` when the week was spent resting. */
  readonly quality: number | null;
  /** Rank in the magazine, or `null` when no chapter was published. */
  readonly rank: number | null;
  readonly fans: number;
  readonly money: number;
}

/**
 * The whole simulation state: plain JSON data only (no class, Map, Set, function or native date).
 */
export interface GameState {
  readonly version: number;
  /** Source of all randomness (ADR 0005): streams are derived from it, so the seed is all a save needs. */
  readonly seed: number;
  readonly week: WeekIndex;
  readonly phase: GamePhase;
  readonly money: number;
  readonly mangaka: { readonly fatigue: number };
  /** Every series ever started; at most one is running. */
  readonly series: readonly Series[];
  readonly history: readonly WeekRecord[];
}

export interface NewGameOptions {
  readonly seed: number;
}

/** Creates the state of a new game, frozen like every state the core produces. */
export function createNewGame(options: NewGameOptions, content: GameContent): GameState {
  return freeze(
    {
      version: GAME_STATE_VERSION,
      seed: options.seed,
      week: FIRST_WEEK,
      phase: "playing",
      money: content.balance.startingMoney,
      mangaka: { fatigue: NO_FATIGUE },
      series: [],
      history: [],
    },
    true,
  );
}

/** The series currently being published, if any. */
export function findRunningSeries(state: GameState): Series | undefined {
  return state.series.find((series) => series.status === "running");
}
