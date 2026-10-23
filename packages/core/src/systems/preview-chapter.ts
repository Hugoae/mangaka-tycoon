import { weekToDate } from "../calendar/calendar";
import type {
  ArtStyleDefinition,
  GameContent,
  Sliders,
  TargetDefinition,
  ThemeDefinition,
} from "../content/content-types";
import type { ChapterEvaluation } from "../events/game-event";
import { findRunningSeries } from "../state/game-state";
import type { GameState, Series } from "../state/game-state";
import { evaluateChapter } from "./chapter-quality";

/** The content definitions a series refers to. */
export interface SeriesContent {
  readonly theme: ThemeDefinition;
  readonly target: TargetDefinition;
  readonly artStyle: ArtStyleDefinition;
}

/** Looks up the theme, target and art style of a series; `undefined` if one is missing. */
export function resolveSeriesContent(
  series: Series,
  content: GameContent,
): SeriesContent | undefined {
  const theme = content.themes.find((candidate) => candidate.id === series.themeId);
  const target = content.targets.find((candidate) => candidate.id === series.targetId);
  const artStyle = content.artStyles.find((candidate) => candidate.id === series.artStyleId);
  if (theme === undefined || target === undefined || artStyle === undefined) {
    return undefined;
  }
  return { theme, target, artStyle };
}

/**
 * What a chapter would be worth with these sliders, right now. Read-only: it never advances the
 * game, so a screen can call it on every slider move. `undefined` when there is nothing to publish.
 * It does not look at the budget: the command is the one that rejects an over-budget allocation.
 */
export function previewChapter(
  state: GameState,
  content: GameContent,
  sliders: Sliders,
): ChapterEvaluation | undefined {
  const series = findRunningSeries(state);
  if (state.phase !== "playing" || series === undefined) {
    return undefined;
  }
  const resolved = resolveSeriesContent(series, content);
  if (resolved === undefined) {
    return undefined;
  }
  return evaluateChapter({
    balance: content.balance,
    ...resolved,
    sliders,
    fatigue: state.mangaka.fatigue,
    year: weekToDate(state.week).year,
  });
}
