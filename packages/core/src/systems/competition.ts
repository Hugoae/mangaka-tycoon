import { WEEKS_PER_YEAR } from "../calendar/calendar";
import type { WeekIndex } from "../calendar/calendar";
import type { CompetitorDefinition, GameContent } from "../content/content-types";
import { createStream, drawSymmetric } from "../rng/streams";
import { round2 } from "../util/round";

/** Name of the random stream of the magazine ranking (ADR 0005). */
const MAGAZINE_STREAM = "magazine";

export interface CompetitorScore {
  readonly id: string;
  readonly score: number;
}

/** What a competitor is worth on average at a given week, before the weekly random swing. */
function expectedStrength(competitor: CompetitorDefinition, week: WeekIndex, max: number): number {
  const expected = competitor.baseStrength + competitor.growthPerYear * (week / WEEKS_PER_YEAR);
  return Math.min(max, Math.max(0, expected));
}

/**
 * Average strength of each competing series at a given week: public information the player can
 * read ("this series is strong this year"), without the random swing of the exact week.
 */
export function expectedCompetitorStrengths(
  content: GameContent,
  week: WeekIndex,
): readonly CompetitorScore[] {
  return content.competitors.map((competitor) => ({
    id: competitor.id,
    score: round2(expectedStrength(competitor, week, content.balance.quality.max)),
  }));
}

/**
 * Strength of every competing series this week: its expected strength for the date plus a random
 * swing. Pure function of `(content, seed, week)`: ranking a week twice gives the same result, and
 * adding a draw elsewhere in the simulation never changes it.
 */
export function competitorScores(
  content: GameContent,
  seed: number,
  week: WeekIndex,
): readonly CompetitorScore[] {
  const stream = createStream(seed, week, MAGAZINE_STREAM);
  const { max } = content.balance.quality;

  // Exactly one draw per competitor, always in content order, so the sequence stays stable.
  return content.competitors.map((competitor) => {
    const swing = drawSymmetric(stream) * competitor.volatility;
    const score = expectedStrength(competitor, week, Number.POSITIVE_INFINITY) + swing;
    return { id: competitor.id, score: round2(Math.min(max, Math.max(0, score))) };
  });
}

/** Rank of a chapter in the magazine: 1 is first. A tie goes to the player. */
export function rankAmong(quality: number, scores: readonly CompetitorScore[]): number {
  return 1 + scores.filter((competitor) => competitor.score > quality).length;
}
