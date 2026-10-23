import { applyCommand, createNewGame } from "@mangaka/core";
import type { Command, GameEvent, GameState } from "@mangaka/core";
import { createStore } from "zustand/vanilla";
import type { StoreApi } from "zustand/vanilla";

export interface GameStoreState {
  readonly game: GameState;
  /** Events produced by the last command only; the full journal arrives with the history screens. */
  readonly lastEvents: readonly GameEvent[];
  /** The only way to change the game: the UI sends commands, the core decides (AGENTS.md 5.3.5). */
  readonly dispatch: (command: Command) => void;
}

export type GameStore = StoreApi<GameStoreState>;

/**
 * UI state wrapped around the pure core. This is the only renderer module allowed to call the
 * core's state functions (enforced by lint); React reads it through hooks and the Pixi scene
 * subscribes to it through the vanilla API (ADR 0006, ADR 0014).
 */
export function createGameStore(seed: number): GameStore {
  return createStore<GameStoreState>()((set, get) => ({
    game: createNewGame({ seed }),
    lastEvents: [],
    dispatch: (command) => {
      const result = applyCommand(get().game, command);
      set({ game: result.state, lastEvents: result.events });
    },
  }));
}
