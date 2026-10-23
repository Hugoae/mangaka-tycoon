import { applyCommand, createNewGame, energyBudget, SLIDER_KEYS, weekToDate } from "@mangaka/core";
import type { Command, GameContent, GameState, Sliders, ThemeDefinition } from "@mangaka/core";

/**
 * A headless player, the first brick of the simulation bot planned for M3. It plays whole careers
 * with fixed strategies so that balance values can be judged on numbers, not on feelings.
 */

export interface BotChoice {
  readonly themeId: string;
  readonly targetId: string;
  readonly artStyleId: string;
}

export interface Strategy {
  readonly name: string;
  /** The next command of the player, given the state. */
  readonly decide: (state: GameState, content: GameContent, choice: BotChoice) => Command;
}

/** Spreads `budget` points over the sliders in proportion to the weights of the theme. */
function allocate(theme: ThemeDefinition, budget: number, max: number): Sliders {
  const total = SLIDER_KEYS.reduce((sum, axis) => sum + theme.axisWeights[axis], 0);
  const share = (axis: (typeof SLIDER_KEYS)[number]): number =>
    Math.min(max, Math.floor((budget * theme.axisWeights[axis]) / total));
  return {
    story: share("story"),
    art: share("art"),
    characters: share("characters"),
    worldbuilding: share("worldbuilding"),
    pacing: share("pacing"),
  };
}

/**
 * What a player who understood the rules would do: put each point where it adds the most quality.
 * With diminishing returns this concentrates the effort on the theme's main sliders, up to the cap.
 */
function allocateOptimal(
  theme: ThemeDefinition,
  budget: number,
  max: number,
  exponent: number,
): Sliders {
  const points: Record<(typeof SLIDER_KEYS)[number], number> = {
    story: 0,
    art: 0,
    characters: 0,
    worldbuilding: 0,
    pacing: 0,
  };
  for (let spent = 0; spent < budget; spent += 1) {
    let best: (typeof SLIDER_KEYS)[number] | undefined;
    let bestGain = 0;
    for (const axis of SLIDER_KEYS) {
      if (points[axis] >= max) {
        continue;
      }
      const gain =
        theme.axisWeights[axis] * ((points[axis] + 1) ** exponent - points[axis] ** exponent);
      if (gain > bestGain) {
        best = axis;
        bestGain = gain;
      }
    }
    if (best === undefined) {
      break;
    }
    points[best] += 1;
  }
  return points;
}

function startCommand(state: GameState, choice: BotChoice): Command {
  return { kind: "startSeries", title: `Series ${String(state.series.length + 1)}`, ...choice };
}

function hasRunningSeries(state: GameState): boolean {
  return state.series.some((series) => series.status === "running");
}

/** Publishes with `effort` points whenever the budget allows it, otherwise rests. */
function publisher(name: string, effort: number, restAbove: number, smart: boolean): Strategy {
  return {
    name,
    decide: (state, content, choice) => {
      if (!hasRunningSeries(state)) {
        return startCommand(state, choice);
      }
      const theme = content.themes.find((candidate) => candidate.id === choice.themeId);
      const budget = Math.min(effort, energyBudget(content.balance, state.mangaka.fatigue));
      if (theme === undefined || state.mangaka.fatigue > restAbove) {
        return { kind: "advanceWeek" };
      }
      const { max, exponent } = content.balance.slider;
      return {
        kind: "produceChapter",
        sliders: smart
          ? allocateOptimal(theme, budget, max, exponent)
          : allocate(theme, budget, max),
      };
    },
  };
}

export const STRATEGIES: readonly Strategy[] = [
  {
    name: "does nothing (rests every week)",
    decide: (state, _content, choice) =>
      hasRunningSeries(state) ? { kind: "advanceWeek" } : startCommand(state, choice),
  },
  publisher("smart, all-in every week", Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, true),
  publisher("smart, steady (70 points, rests above 60)", 70, 60, true),
  publisher("smart, careful (50 points, rests above 40)", 50, 40, true),
  publisher("naive, steady (spreads by theme weight)", 70, 60, false),
  {
    name: "lazy (spreads 20 points evenly)",
    decide: (state, _content, choice) =>
      hasRunningSeries(state)
        ? {
            kind: "produceChapter",
            sliders: { story: 4, art: 4, characters: 4, worldbuilding: 4, pacing: 4 },
          }
        : startCommand(state, choice),
  },
];

export interface CareerReport {
  readonly strategy: string;
  readonly seed: number;
  readonly weeksPlayed: number;
  readonly endedBankrupt: boolean;
  readonly finalMoney: number;
  readonly peakFans: number;
  readonly seriesStarted: number;
  readonly averageRank: number;
  readonly firstPlaces: number;
  readonly lastYear: number;
}

export function playCareer(
  strategy: Strategy,
  content: GameContent,
  choice: BotChoice,
  seed: number,
  maxWeeks: number,
): CareerReport {
  let state = createNewGame({ seed }, content);
  let peakFans = 0;
  let guard = maxWeeks * 3;
  while (state.week < maxWeeks && state.phase === "playing" && guard > 0) {
    guard -= 1;
    state = applyCommand(state, strategy.decide(state, content, choice), content).state;
    for (const series of state.series) {
      peakFans = Math.max(peakFans, series.fans);
    }
  }

  const ranks = state.history.flatMap((record) => (record.rank === null ? [] : [record.rank]));
  return {
    strategy: strategy.name,
    seed,
    weeksPlayed: state.week,
    endedBankrupt: state.phase === "bankrupt",
    finalMoney: state.money,
    peakFans,
    seriesStarted: state.series.length,
    averageRank: ranks.length === 0 ? 0 : ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length,
    firstPlaces: ranks.filter((rank) => rank === 1).length,
    lastYear: weekToDate(state.week).year,
  };
}
