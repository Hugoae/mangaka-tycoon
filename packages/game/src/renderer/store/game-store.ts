import { applyCommand, createNewGame } from "@mangaka/core";
import type { Command, GameContent, GameEvent, GameState } from "@mangaka/core";
import { createStore } from "zustand/vanilla";
import type { StoreApi } from "zustand/vanilla";

export interface GameStoreState {
  /** The game data (balance, themes...). Loaded once at startup, never changes during a session. */
  readonly content: GameContent;
  readonly game: GameState;
  /** Events produced by the last command only; the full journal arrives with the history screens. */
  readonly lastEvents: readonly GameEvent[];
  /** The only way to change the game: the UI sends commands, the core decides (AGENTS.md 5.3.5). */
  readonly dispatch: (command: Command) => void;
  /** Throws the current game away and starts another one. The seed comes from outside (ADR 0005). */
  readonly newGame: (seed: number) => void;
}

export type GameStore = StoreApi<GameStoreState>;

/**
 * UI state wrapped around the pure core. This is the only renderer module allowed to call the
 * core's state functions (enforced by lint); React reads it through hooks and the Pixi scene
 * subscribes to it through the vanilla API (ADR 0006, ADR 0014).
 */
export function createGameStore(seed: number, content: GameContent): GameStore {
  return createStore<GameStoreState>()((set, get) => ({
    content,
    game: createNewGame({ seed }, content),
    lastEvents: [],
    dispatch: (command) => {
      const result = applyCommand(get().game, command, get().content);
      set({ game: result.state, lastEvents: result.events });
    },
    newGame: (newSeed) => {
      set({ game: createNewGame({ seed: newSeed }, get().content), lastEvents: [] });
    },
  }));
}
