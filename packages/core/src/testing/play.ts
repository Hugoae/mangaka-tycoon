import { applyCommand } from "../commands/command";
import type { Command, StartSeriesCommand } from "../commands/command";
import type { GameContent } from "../content/content-types";
import { createNewGame } from "../state/game-state";
import type { GameState } from "../state/game-state";
import type { StepResult } from "../state/step-result";
import { evenSliders, TEST_CONTENT } from "./test-content";

/** A neutral series (no theme, target or style bonus) in the test content. */
export const START_NEUTRAL: StartSeriesCommand = {
  kind: "startSeries",
  title: "Test Series",
  themeId: "adventure",
  targetId: "seinen",
  artStyleId: "cartoon",
};

/** A series whose theme only counts two sliders, so 50 + 50 points reach a quality of 100. */
export const START_SPORT: StartSeriesCommand = {
  ...START_NEUTRAL,
  themeId: "sport",
};

export function newGame(seed = 1, content: GameContent = TEST_CONTENT): GameState {
  return createNewGame({ seed }, content);
}

export function apply(
  state: GameState,
  command: Command,
  content: GameContent = TEST_CONTENT,
): StepResult {
  return applyCommand(state, command, content);
}

/** A new game with one running series. */
export function startedGame(
  start: StartSeriesCommand = START_NEUTRAL,
  seed = 1,
  content: GameContent = TEST_CONTENT,
): GameState {
  return apply(newGame(seed, content), start, content).state;
}

/** Applies commands one after the other and returns the final state. */
export function play(state: GameState, commands: readonly Command[]): GameState {
  return commands.reduce((current, command) => apply(current, command).state, state);
}

/** Quality 100 in the sport series: first place in the test magazine. */
export const BEST_CHAPTER: Command = {
  kind: "produceChapter",
  sliders: { ...evenSliders(0), characters: 50, pacing: 50 },
};

/** No effort at all: last place in the test magazine. */
export const WORST_CHAPTER: Command = { kind: "produceChapter", sliders: evenSliders(0) };

/** Quality 40 in the neutral series: second place (a tie with the middle competitor goes to the player). */
export const MIDDLE_CHAPTER: Command = { kind: "produceChapter", sliders: evenSliders(20) };

export const REST: Command = { kind: "advanceWeek" };

/** Quality 90 in the sport series for 90 points: affordable after a tiring week, still first place. */
export const GOOD_CHAPTER: Command = {
  kind: "produceChapter",
  sliders: { ...evenSliders(0), characters: 45, pacing: 45 },
};
