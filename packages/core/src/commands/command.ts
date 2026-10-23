import type { GameContent } from "../content/content-types";
import type { GameState } from "../state/game-state";
import type { StepResult } from "../state/step-result";
import { advanceWeek } from "../systems/advance-week";
import { produceChapter } from "../systems/produce-chapter";
import type { ProduceChapterCommand } from "../systems/produce-chapter";
import { startSeries } from "../systems/start-series";
import type { StartSeriesCommand } from "../systems/start-series";
import { assertNever } from "../util/assert-never";

/** Player actions. The UI sends commands and never mutates the state itself. */
export interface AdvanceWeekCommand {
  /** Lets the week pass without publishing a chapter: the mangaka rests. */
  readonly kind: "advanceWeek";
}

export type { ProduceChapterCommand, StartSeriesCommand };

export type Command = AdvanceWeekCommand | StartSeriesCommand | ProduceChapterCommand;

/** Validates and applies a command, returning the new state and the events it produced. */
export function applyCommand(state: GameState, command: Command, content: GameContent): StepResult {
  switch (command.kind) {
    case "advanceWeek":
      return advanceWeek(state, content);
    case "startSeries":
      return startSeries(state, content, command);
    case "produceChapter":
      return produceChapter(state, content, command);
    default:
      return assertNever(command);
  }
}
