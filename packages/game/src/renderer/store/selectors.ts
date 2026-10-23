import type { GameStoreState } from "./game-store";

/**
 * Selectors must return stable values: Zustand 5 re-renders forever on a selector that builds a
 * new object each call. They therefore return primitives or existing references, and derived
 * values (such as the calendar date) are computed by the caller.
 */
export const selectWeek = (state: GameStoreState): number => state.game.week;
export const selectGame = (state: GameStoreState): GameStoreState["game"] => state.game;
export const selectContent = (state: GameStoreState): GameStoreState["content"] => state.content;
export const selectLastEvents = (state: GameStoreState): GameStoreState["lastEvents"] =>
  state.lastEvents;
export const selectDispatch = (state: GameStoreState): GameStoreState["dispatch"] => state.dispatch;
export const selectNewGame = (state: GameStoreState): GameStoreState["newGame"] => state.newGame;
