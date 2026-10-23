import type {
  ChapterEvaluation,
  GameEvent,
  LanguageCode,
  RejectionReason,
  SliderKey,
} from "@mangaka/core";
import type { TFunction } from "i18next";

import { formatNumber, formatSigned } from "../i18n/language";

/** One literal key per reason: the typed keys of i18next cannot be built from a template string. */
function describeRejection(t: TFunction, reason: RejectionReason): string {
  switch (reason) {
    case "gameOver":
      return t("rejection.gameOver");
    case "noRunningSeries":
      return t("rejection.noRunningSeries");
    case "seriesAlreadyRunning":
      return t("rejection.seriesAlreadyRunning");
    case "invalidTitle":
      return t("rejection.invalidTitle");
    case "unknownContent":
      return t("rejection.unknownContent");
    case "invalidSliders":
      return t("rejection.invalidSliders");
    case "overBudget":
      return t("rejection.overBudget");
  }
}

/**
 * The sentence the journal shows for an event, in the current language, or `undefined` for events
 * that are bookkeeping only. Events carry keys and numbers, never text (ADR 0007).
 */
export function describeEvent(
  t: TFunction,
  event: GameEvent,
  language: LanguageCode,
): string | undefined {
  const number = (value: number): string => formatNumber(value, language);
  switch (event.kind) {
    case "weekAdvanced":
      return undefined;
    case "seriesStarted":
      return t("event.seriesStarted", { title: event.params.title });
    case "chapterPublished":
      return t("event.chapterPublished", {
        quality: formatNumber(event.params.quality, language, 1),
        rank: event.params.rank,
        total: event.params.total,
        fansDelta: formatSigned(event.params.fansDelta, language),
        fans: number(event.params.fans),
      });
    case "weekRested":
      return t("event.weekRested", {
        fatigueRecovered: number(event.params.fatigueRecovered),
        fansLost: number(event.params.fansLost),
      });
    case "monthClosed":
      return t("event.monthClosed", {
        tomesSold: number(event.params.tomesSold),
        revenue: number(event.params.revenue),
        expenses: number(event.params.expenses),
        money: number(event.params.money),
      });
    case "seriesCancelled":
      return t("event.seriesCancelled", { title: event.params.title });
    case "bankrupt":
      return t("event.bankrupt", { money: number(event.params.money) });
    case "commandRejected":
      return t("event.commandRejected", { reason: describeRejection(t, event.params.reason) });
  }
}

/** Why a chapter got its quality, line by line: the player must always understand (AGENTS.md section 1). */
export function describeEvaluation(
  t: TFunction,
  evaluation: ChapterEvaluation,
  language: LanguageCode,
): readonly string[] {
  const axisLines = evaluation.axes.map((axis) =>
    t("report.axis", {
      axis: describeAxis(t, axis.axis),
      points: axis.points,
      contribution: formatNumber(axis.contribution, language, 1),
    }),
  );
  const multiplier = (value: number): string => formatNumber(value, language, 2);
  return [
    ...axisLines,
    t("report.base", { value: formatNumber(evaluation.baseQuality, language, 1) }),
    t("report.multipliers", {
      trend: multiplier(evaluation.multipliers.trend),
      target: multiplier(evaluation.multipliers.target),
      style: multiplier(evaluation.multipliers.style),
      fatigue: multiplier(evaluation.multipliers.fatigue),
    }),
  ];
}

export function describeAxis(t: TFunction, axis: SliderKey): string {
  switch (axis) {
    case "story":
      return t("slider.story");
    case "art":
      return t("slider.art");
    case "characters":
      return t("slider.characters");
    case "worldbuilding":
      return t("slider.worldbuilding");
    case "pacing":
      return t("slider.pacing");
  }
}

export interface Report {
  /** Breakdown of the last published chapter, empty if the last action published nothing. */
  readonly breakdown: readonly string[];
  readonly messages: readonly string[];
}

/** Turns the events of the last command into what the report panel displays. */
export function buildReport(
  t: TFunction,
  events: readonly GameEvent[],
  language: LanguageCode,
): Report {
  const published = events.find((event) => event.kind === "chapterPublished");
  return {
    breakdown: published === undefined ? [] : describeEvaluation(t, published.evaluation, language),
    messages: events.flatMap((event) => describeEvent(t, event, language) ?? []),
  };
}
