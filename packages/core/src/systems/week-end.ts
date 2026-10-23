import type { Draft } from "immer";

import { isMonthEnd } from "../calendar/calendar";
import type { GameContent } from "../content/content-types";
import type { GameEvent } from "../events/game-event";
import { findRunningSeries } from "../state/game-state";
import type { GameState } from "../state/game-state";

/**
 * Month-end accounting: tome sales of the running series, then the living costs.
 * Running out of money ends the game.
 */
function closeMonth(draft: Draft<GameState>, content: GameContent, events: GameEvent[]): void {
  const { sales, expenses } = content.balance;
  const running = findRunningSeries(draft);

  const tomesSold = running === undefined ? 0 : Math.floor(running.fans * sales.tomesPerFan);
  const revenue = tomesSold * sales.tomePrice;
  draft.money += revenue - expenses.monthly;

  events.push({
    kind: "monthClosed",
    key: "event.monthClosed",
    params: { tomesSold, revenue, expenses: expenses.monthly, money: draft.money },
  });

  if (draft.money < 0) {
    draft.phase = "bankrupt";
    events.push({ kind: "bankrupt", key: "event.bankrupt", params: { money: draft.money } });
  }
}

/** Ends the current week: closes the month when it is the last week of one, then moves the calendar. */
export function closeWeek(
  draft: Draft<GameState>,
  content: GameContent,
  events: GameEvent[],
): void {
  if (isMonthEnd(draft.week)) {
    closeMonth(draft, content, events);
  }
  draft.week += 1;
  events.push({ kind: "weekAdvanced", key: "event.weekAdvanced", params: { week: draft.week } });
}
