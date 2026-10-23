/**
 * Public API of `@mangaka/core`: the pure simulation. No DOM, no Node, no I/O.
 *
 * The UI sends a {@link Command} to {@link applyCommand} and gets back the new state and events.
 */
export {
  isMonthEnd,
  MONTHS_PER_YEAR,
  START_YEAR,
  weekToDate,
  WEEKS_PER_MONTH,
  WEEKS_PER_YEAR,
} from "./calendar/calendar";
export type { GameDate, WeekIndex } from "./calendar/calendar";
export { applyCommand } from "./commands/command";
export type { AdvanceWeekCommand, Command } from "./commands/command";
export type { GameEvent, WeekAdvancedEvent } from "./events/game-event";
export { createNewGame, GAME_STATE_VERSION } from "./state/game-state";
export type { GameState, NewGameOptions } from "./state/game-state";
export type { StepResult } from "./state/step-result";
export { advanceWeek } from "./systems/advance-week";
