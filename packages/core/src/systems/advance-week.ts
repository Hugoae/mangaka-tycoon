import { produce } from "immer";

import type { GameContent } from "../content/content-types";
import type { GameEvent } from "../events/game-event";
import { findRunningSeries } from "../state/game-state";
import type { GameState } from "../state/game-state";
import type { StepResult } from "../state/step-result";
import { round2 } from "../util/round";
import { rejectCommand } from "./rejection";
import { closeWeek } from "./week-end";

/**
 * Lets a week pass without publishing: the mangaka rests, but the readers drift away from a series
 * that misses its slot. Pure: the input state is never mutated and the same input gives the same output.
 */
export function advanceWeek(state: GameState, content: GameContent): StepResult {
  if (state.phase !== "playing") {
    return rejectCommand(state, "gameOver");
  }

  const { balance } = content;
  const running = findRunningSeries(state);
  const fansLost = running === undefined ? 0 : Math.min(running.fans, balance.magazine.restFanLoss);
  const fatigueRecovered = Math.min(state.mangaka.fatigue, balance.fatigue.restRecovery);

  const events: GameEvent[] = [
    { kind: "weekRested", key: "event.weekRested", params: { fansLost, fatigueRecovered } },
  ];

  const next = produce(state, (draft) => {
    const playedWeek = draft.week;
    draft.mangaka.fatigue = round2(draft.mangaka.fatigue - fatigueRecovered);
    const series = draft.series.find((candidate) => candidate.status === "running");
    if (series !== undefined) {
      series.fans -= fansLost;
    }
    closeWeek(draft, content, events);
    draft.history.push({
      week: playedWeek,
      quality: null,
      rank: null,
      fans: series?.fans ?? 0,
      money: draft.money,
    });
  });

  return { state: next, events };
}
