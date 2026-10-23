import type { RejectionReason } from "../events/game-event";
import type { GameState } from "../state/game-state";
import type { StepResult } from "../state/step-result";

/** A refused command: the state is returned untouched and one event tells the UI why. */
export function rejectCommand(state: GameState, reason: RejectionReason): StepResult {
  return {
    state,
    events: [{ kind: "commandRejected", key: "event.commandRejected", params: { reason } }],
  };
}
