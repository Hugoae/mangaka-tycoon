import { produce } from "immer";

import type { GameState } from "../state/game-state";
import type { StepResult } from "../state/step-result";

/**
 * Advances the simulation by one week. Pure: the input state is never mutated and the same
 * input always gives the same output.
 */
export function advanceWeek(state: GameState): StepResult {
  const next = produce(state, (draft) => {
    draft.week += 1;
  });

  return {
    state: next,
    events: [{ kind: "weekAdvanced", key: "event.weekAdvanced", params: { week: next.week } }],
  };
}
