import {
  SLIDER_KEYS,
  type ArtStyleDefinition,
  type Balance,
  type Sliders,
  type TargetDefinition,
  type ThemeDefinition,
} from "../content/content-types";
import { START_YEAR } from "../calendar/calendar";
import type { AxisBreakdown, ChapterEvaluation } from "../events/game-event";
import { round2 } from "../util/round";

/** Slider points the mangaka can spend this week: fatigue shrinks the budget. */
export function energyBudget(balance: Balance, fatigue: number): number {
  const fatigueShare = fatigue / balance.fatigue.max;
  return Math.floor(balance.energy.base * (1 - balance.energy.fatiguePenalty * fatigueShare));
}

export interface ChapterEvaluationInput {
  readonly balance: Balance;
  readonly theme: ThemeDefinition;
  readonly target: TargetDefinition;
  readonly artStyle: ArtStyleDefinition;
  readonly sliders: Sliders;
  readonly fatigue: number;
  /** Calendar year of the week the chapter comes out. */
  readonly year: number;
}

/**
 * Quality of a chapter (0 to `balance.quality.max`) with the full explanation of how it was reached.
 *
 * Each slider is worth `weight * (points / max) ^ exponent`: a theme rewards some axes more, and the
 * first points of an axis count more than the last ones, so the player has to spread the effort.
 * The result is then multiplied by the year trend, the audience and style fit, and the fatigue penalty.
 */
export function evaluateChapter(input: ChapterEvaluationInput): ChapterEvaluation {
  const { balance, theme, target, artStyle, sliders, fatigue, year } = input;

  const totalWeight = SLIDER_KEYS.reduce((sum, axis) => sum + theme.axisWeights[axis], 0);
  const exact = SLIDER_KEYS.map((axis) => {
    const weight = theme.axisWeights[axis] / totalWeight;
    const score = (sliders[axis] / balance.slider.max) ** balance.slider.exponent;
    return { axis, weight, score, contribution: weight * score * balance.quality.max };
  });
  // The total is computed from exact values and only the displayed lines are rounded.
  const baseQuality = exact.reduce((sum, line) => sum + line.contribution, 0);
  const axes: AxisBreakdown[] = exact.map((line) => ({
    axis: line.axis,
    points: sliders[line.axis],
    weight: round2(line.weight),
    score: round2(line.score),
    contribution: round2(line.contribution),
  }));

  const yearIndex = Math.min(year - START_YEAR, theme.trendByYear.length - 1);
  const trend = theme.trendByYear[yearIndex] ?? 1;
  const targetFit = target.themeAffinity[theme.id] ?? 1;
  const styleFit = artStyle.themeAffinity[theme.id] ?? 1;
  const fatigueFactor = 1 - balance.quality.fatiguePenalty * (fatigue / balance.fatigue.max);

  const raw = baseQuality * trend * targetFit * styleFit * fatigueFactor;
  return {
    axes,
    baseQuality: round2(baseQuality),
    multipliers: {
      trend: round2(trend),
      target: round2(targetFit),
      style: round2(styleFit),
      fatigue: round2(fatigueFactor),
    },
    quality: round2(Math.min(balance.quality.max, Math.max(0, raw))),
  };
}
