import type { GameState } from "../state/game-state";
import type { StepResult } from "../state/step-result";
import { advanceWeek } from "../systems/advance-week";
import { assertNever } from "../util/assert-never";

/** Player actions. The UI sends commands and never mutates the state itself. */
export interface AdvanceWeekCommand {
  readonly kind: "advanceWeek";
}

export type Command = AdvanceWeekCommand;

/** Validates and applies a command, returning the new state and the events it produced. */
export function applyCommand(state: GameState, command: Command): StepResult {
  switch (command.kind) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- single-member union for now; this comment becomes an error (unused directive) once a second command exists
    case "advanceWeek":
      return advanceWeek(state);
    default:
      // `command.kind` narrows to `never` even while the union has a single member.
      return assertNever(command.kind);
  }
}
