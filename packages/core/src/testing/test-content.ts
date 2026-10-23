import type { GameContent, LocalizedText, Sliders } from "../content/content-types";

/**
 * Small, hand-picked content for the core tests. It is NOT the game's data: it only has to be
 * valid and easy to reason about, so tests do not depend on the balance of the real game.
 */

const text = (name: string): LocalizedText => ({ fr: `${name} (fr)`, en: name });

export const TEST_CONTENT: GameContent = {
  balance: {
    startingMoney: 1000,
    slider: { max: 50, exponent: 1 },
    energy: { base: 100, fatiguePenalty: 0.5 },
    quality: { max: 100, fatiguePenalty: 0.2 },
    fatigue: { max: 100, perChapter: 10, perEnergyPoint: 0.1, restRecovery: 30 },
    magazine: {
      rankFans: [100, 50, 10, -10],
      restFanLoss: 20,
      cancelWorstRank: 4,
      cancelAfterBadWeeks: 2,
    },
    sales: { tomesPerFan: 0.5, tomePrice: 10 },
    expenses: { monthly: 100 },
    series: { startingFans: 0, titleMaxLength: 20 },
  },
  themes: [
    {
      id: "adventure",
      name: text("Adventure"),
      axisWeights: { story: 1, art: 1, characters: 1, worldbuilding: 1, pacing: 1 },
      trendByYear: [1, 1.1],
    },
    {
      id: "sport",
      name: text("Sport"),
      axisWeights: { story: 0, art: 0, characters: 1, worldbuilding: 0, pacing: 1 },
      trendByYear: [1],
    },
  ],
  targets: [
    { id: "shonen", name: text("Shonen"), themeAffinity: { adventure: 1.1 } },
    { id: "seinen", name: text("Seinen"), themeAffinity: {} },
  ],
  artStyles: [
    { id: "classic", name: text("Classic"), themeAffinity: { sport: 0.5 } },
    { id: "cartoon", name: text("Cartoon"), themeAffinity: {} },
  ],
  competitors: [
    { id: "strong", name: text("Strong"), baseStrength: 80, growthPerYear: 0, volatility: 0 },
    { id: "middle", name: text("Middle"), baseStrength: 40, growthPerYear: 0, volatility: 0 },
    { id: "weak", name: text("Weak"), baseStrength: 10, growthPerYear: 0, volatility: 0 },
  ],
};

/** Same content with competitors that swing randomly, for tests of the random streams. */
export const VOLATILE_TEST_CONTENT: GameContent = {
  ...TEST_CONTENT,
  competitors: TEST_CONTENT.competitors.map((competitor) => ({
    ...competitor,
    growthPerYear: 12,
    volatility: 15,
  })),
};

/** Effort spread evenly: `points` on each of the five sliders. */
export function evenSliders(points: number): Sliders {
  return { story: points, art: points, characters: points, worldbuilding: points, pacing: points };
}

export const NO_EFFORT: Sliders = evenSliders(0);
