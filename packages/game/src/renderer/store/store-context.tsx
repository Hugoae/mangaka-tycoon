import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useStore } from "zustand";

import type { GameStore, GameStoreState } from "./game-store";

const GameStoreContext = createContext<GameStore | null>(null);

export function GameStoreProvider(props: {
  readonly store: GameStore;
  readonly children: ReactNode;
}) {
  return <GameStoreContext value={props.store}>{props.children}</GameStoreContext>;
}

/** Reads a slice of the game store. Must be used under {@link GameStoreProvider}. */
export function useGameStore<Selected>(selector: (state: GameStoreState) => Selected): Selected {
  const store = useContext(GameStoreContext);
  if (store === null) {
    throw new Error("useGameStore must be used inside a GameStoreProvider.");
  }
  return useStore(store, selector);
}
