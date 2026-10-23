import type { GameState } from "@mangaka/core";

import type { GameOverStats } from "./game-over-panel";

/** The numbers of the end-of-career screen, read from the state and its weekly history. */
export function gameOverStats(game: GameState): GameOverStats {
  return {
    weeks: game.week,
    chapters: game.series.reduce((sum, series) => sum + series.chaptersPublished, 0),
    peakFans: game.history.reduce((peak, record) => Math.max(peak, record.fans), 0),
    money: game.money,
  };
}
