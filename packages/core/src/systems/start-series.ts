import { produce } from "immer";

import type { GameContent } from "../content/content-types";
import { findRunningSeries } from "../state/game-state";
import type { GameState, Series } from "../state/game-state";
import type { StepResult } from "../state/step-result";
import { rejectCommand } from "./rejection";

export interface StartSeriesCommand {
  readonly kind: "startSeries";
  readonly title: string;
  readonly themeId: string;
  readonly targetId: string;
  readonly artStyleId: string;
}

/** Starts a new series: theme, target audience and art style are chosen once and kept (AGENTS.md section 2). */
export function startSeries(
  state: GameState,
  content: GameContent,
  command: StartSeriesCommand,
): StepResult {
  if (state.phase !== "playing") {
    return rejectCommand(state, "gameOver");
  }
  if (findRunningSeries(state) !== undefined) {
    return rejectCommand(state, "seriesAlreadyRunning");
  }

  const title = command.title.trim();
  if (title.length === 0 || title.length > content.balance.series.titleMaxLength) {
    return rejectCommand(state, "invalidTitle");
  }

  const known =
    content.themes.some((theme) => theme.id === command.themeId) &&
    content.targets.some((target) => target.id === command.targetId) &&
    content.artStyles.some((style) => style.id === command.artStyleId);
  if (!known) {
    return rejectCommand(state, "unknownContent");
  }

  const series: Series = {
    id: `series-${String(state.series.length + 1)}`,
    title,
    themeId: command.themeId,
    targetId: command.targetId,
    artStyleId: command.artStyleId,
    fans: content.balance.series.startingFans,
    chaptersPublished: 0,
    badWeekStreak: 0,
    status: "running",
  };

  return {
    state: produce(state, (draft) => {
      draft.series.push(series);
    }),
    events: [{ kind: "seriesStarted", key: "event.seriesStarted", params: { title } }],
  };
}
