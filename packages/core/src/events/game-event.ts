import type { WeekIndex } from "../calendar/calendar";
import type { SliderKey } from "../content/content-types";

/**
 * Events are the journal the UI displays. They carry translation keys and parameters, never
 * formatted text, so the language can change at any time (ADR 0007). Some also carry the structured
 * explanation of a result, because the player must always understand why (AGENTS.md section 1).
 */

export interface WeekAdvancedEvent {
  readonly kind: "weekAdvanced";
  readonly key: "event.weekAdvanced";
  readonly params: { readonly week: WeekIndex };
}

export interface SeriesStartedEvent {
  readonly kind: "seriesStarted";
  readonly key: "event.seriesStarted";
  readonly params: { readonly title: string };
}

/** How one slider contributed to the quality of a chapter. */
export interface AxisBreakdown {
  readonly axis: SliderKey;
  /** Points the player put in this slider. */
  readonly points: number;
  /** Share of this slider in the theme, 0-1. */
  readonly weight: number;
  /** Return of the points after diminishing returns, 0-1. */
  readonly score: number;
  /** What it adds to the quality before multipliers. */
  readonly contribution: number;
}

/** Why a chapter got the quality it got. */
export interface ChapterEvaluation {
  readonly axes: readonly AxisBreakdown[];
  /** Sum of the axis contributions. */
  readonly baseQuality: number;
  readonly multipliers: {
    /** Year trend of the theme. */
    readonly trend: number;
    /** Theme x target audience fit. */
    readonly target: number;
    /** Theme x art style fit. */
    readonly style: number;
    /** Penalty from the mangaka's fatigue. */
    readonly fatigue: number;
  };
  /** Final quality, capped to the maximum. */
  readonly quality: number;
}

export interface ChapterPublishedEvent {
  readonly kind: "chapterPublished";
  readonly key: "event.chapterPublished";
  readonly params: {
    readonly quality: number;
    readonly rank: number;
    readonly total: number;
    readonly fansDelta: number;
    readonly fans: number;
  };
  readonly evaluation: ChapterEvaluation;
}

export interface WeekRestedEvent {
  readonly kind: "weekRested";
  readonly key: "event.weekRested";
  readonly params: { readonly fansLost: number; readonly fatigueRecovered: number };
}

export interface MonthClosedEvent {
  readonly kind: "monthClosed";
  readonly key: "event.monthClosed";
  readonly params: {
    readonly tomesSold: number;
    readonly revenue: number;
    readonly expenses: number;
    readonly money: number;
  };
}

export interface SeriesCancelledEvent {
  readonly kind: "seriesCancelled";
  readonly key: "event.seriesCancelled";
  readonly params: { readonly title: string };
}

export interface BankruptEvent {
  readonly kind: "bankrupt";
  readonly key: "event.bankrupt";
  readonly params: { readonly money: number };
}

export type RejectionReason =
  | "gameOver"
  | "noRunningSeries"
  | "seriesAlreadyRunning"
  | "invalidTitle"
  | "unknownContent"
  | "invalidSliders"
  | "overBudget";

/** A command that broke a rule. The state is left untouched. */
export interface CommandRejectedEvent {
  readonly kind: "commandRejected";
  readonly key: "event.commandRejected";
  readonly params: { readonly reason: RejectionReason };
}

export type GameEvent =
  | WeekAdvancedEvent
  | SeriesStartedEvent
  | ChapterPublishedEvent
  | WeekRestedEvent
  | MonthClosedEvent
  | SeriesCancelledEvent
  | BankruptEvent
  | CommandRejectedEvent;
