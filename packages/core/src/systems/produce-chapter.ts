import { produce } from "immer";

import { weekToDate } from "../calendar/calendar";
import { SLIDER_KEYS } from "../content/content-types";
import type { GameContent, Sliders } from "../content/content-types";
import type { GameEvent } from "../events/game-event";
import { findRunningSeries } from "../state/game-state";
import type { GameState, Series } from "../state/game-state";
import type { StepResult } from "../state/step-result";
import { round2 } from "../util/round";
import { energyBudget, evaluateChapter } from "./chapter-quality";
import { competitorScores, rankAmong } from "./competition";
import { resolveSeriesContent } from "./preview-chapter";
import { rejectCommand } from "./rejection";
import { closeWeek } from "./week-end";

export interface ProduceChapterCommand {
  readonly kind: "produceChapter";
  readonly sliders: Sliders;
}

/** Total points of a slider allocation. */
export function totalPoints(sliders: Sliders): number {
  return SLIDER_KEYS.reduce((sum, axis) => sum + sliders[axis], 0);
}

function areSlidersValid(sliders: Sliders, max: number): boolean {
  return SLIDER_KEYS.every((axis) => {
    const points = sliders[axis];
    return Number.isFinite(points) && points >= 0 && points <= max;
  });
}

/** Fans won or lost for a rank. Ranks beyond the table get its last entry. */
function fansForRank(rankFans: readonly number[], rank: number): number {
  return rankFans[Math.min(rank, rankFans.length) - 1] ?? 0;
}

/**
 * The weekly action of the loop (AGENTS.md section 2): spend effort on the five sliders, publish the
 * chapter, get ranked against the magazine's other series, win or lose fans, get tired. The week then
 * ends, which closes the month (tome sales and living costs) when it is the last week of one.
 */
export function produceChapter(
  state: GameState,
  content: GameContent,
  command: ProduceChapterCommand,
): StepResult {
  const { balance } = content;
  if (state.phase !== "playing") {
    return rejectCommand(state, "gameOver");
  }
  const series = findRunningSeries(state);
  if (series === undefined) {
    return rejectCommand(state, "noRunningSeries");
  }
  const resolved = resolveSeriesContent(series, content);
  if (resolved === undefined) {
    return rejectCommand(state, "unknownContent");
  }
  if (!areSlidersValid(command.sliders, balance.slider.max)) {
    return rejectCommand(state, "invalidSliders");
  }
  const spent = totalPoints(command.sliders);
  if (spent > energyBudget(balance, state.mangaka.fatigue)) {
    return rejectCommand(state, "overBudget");
  }

  const evaluation = evaluateChapter({
    balance,
    ...resolved,
    sliders: command.sliders,
    fatigue: state.mangaka.fatigue,
    year: weekToDate(state.week).year,
  });
  const scores = competitorScores(content, state.seed, state.week);
  const rank = rankAmong(evaluation.quality, scores);
  const fansDelta = fansForRank(balance.magazine.rankFans, rank);

  const badWeekStreak = rank >= balance.magazine.cancelWorstRank ? series.badWeekStreak + 1 : 0;
  const cancelled = badWeekStreak >= balance.magazine.cancelAfterBadWeeks;
  const updated: Series = {
    ...series,
    fans: Math.max(0, series.fans + fansDelta),
    chaptersPublished: series.chaptersPublished + 1,
    badWeekStreak,
    status: cancelled ? "cancelled" : "running",
  };

  const events: GameEvent[] = [
    {
      kind: "chapterPublished",
      key: "event.chapterPublished",
      params: {
        quality: evaluation.quality,
        rank,
        total: scores.length + 1,
        fansDelta: updated.fans - series.fans,
        fans: updated.fans,
      },
      evaluation,
    },
  ];
  if (cancelled) {
    events.push({
      kind: "seriesCancelled",
      key: "event.seriesCancelled",
      params: { title: series.title },
    });
  }

  const next = produce(state, (draft) => {
    const playedWeek = draft.week;
    draft.series = draft.series.map((candidate) =>
      candidate.id === updated.id ? updated : candidate,
    );
    draft.mangaka.fatigue = round2(
      Math.min(
        balance.fatigue.max,
        draft.mangaka.fatigue + balance.fatigue.perChapter + balance.fatigue.perEnergyPoint * spent,
      ),
    );
    closeWeek(draft, content, events);
    draft.history.push({
      week: playedWeek,
      quality: evaluation.quality,
      rank,
      fans: updated.fans,
      money: draft.money,
    });
  });

  return { state: next, events };
}
