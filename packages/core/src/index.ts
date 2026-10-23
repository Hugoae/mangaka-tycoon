/**
 * Public API of `@mangaka/core`: the pure simulation. No DOM, no Node, no I/O.
 *
 * The UI sends a {@link Command} to {@link applyCommand} and gets back the new state and events.
 * Game data (balance, themes...) is passed in as {@link GameContent}: the core never loads files.
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
export type {
  AdvanceWeekCommand,
  Command,
  ProduceChapterCommand,
  StartSeriesCommand,
} from "./commands/command";
export { LANGUAGES, SLIDER_KEYS } from "./content/content-types";
export type {
  ArtStyleDefinition,
  Balance,
  CompetitorDefinition,
  GameContent,
  LanguageCode,
  LocalizedText,
  SliderKey,
  Sliders,
  TargetDefinition,
  ThemeDefinition,
} from "./content/content-types";
export type {
  AxisBreakdown,
  BankruptEvent,
  ChapterEvaluation,
  ChapterPublishedEvent,
  CommandRejectedEvent,
  GameEvent,
  MonthClosedEvent,
  RejectionReason,
  SeriesCancelledEvent,
  SeriesStartedEvent,
  WeekAdvancedEvent,
  WeekRestedEvent,
} from "./events/game-event";
export { createNewGame, findRunningSeries, GAME_STATE_VERSION } from "./state/game-state";
export type {
  GamePhase,
  GameState,
  NewGameOptions,
  Series,
  SeriesStatus,
  WeekRecord,
} from "./state/game-state";
export type { StepResult } from "./state/step-result";
export { advanceWeek } from "./systems/advance-week";
export { energyBudget, evaluateChapter } from "./systems/chapter-quality";
export type { ChapterEvaluationInput } from "./systems/chapter-quality";
export { competitorScores, expectedCompetitorStrengths, rankAmong } from "./systems/competition";
export { previewChapter } from "./systems/preview-chapter";
export type { CompetitorScore } from "./systems/competition";
export { totalPoints } from "./systems/produce-chapter";
