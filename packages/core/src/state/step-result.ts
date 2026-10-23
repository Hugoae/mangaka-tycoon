import type { GameEvent } from "../events/game-event";

import type { GameState } from "./game-state";

/** What every state transition returns: the new state and the events it produced. */
export interface StepResult {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}
