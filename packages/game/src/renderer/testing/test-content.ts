import type { GameContent } from "@mangaka/core";

/**
 * A small, round-numbered content set for the renderer tests. The renderer is sandboxed and must
 * not read the disk, and its tests are about screens, not balance: the real data is covered by
 * `tools/src/base-content.test.ts`.
 */
export const TEST_CONTENT: GameContent = {
  balance: {
    startingMoney: 1000,
    slider: { max: 50, exponent: 1 },
    energy: { base: 100, fatiguePenalty: 0.5 },
    quality: { max: 100, fatiguePenalty: 0.2 },
    fatigue: { max: 100, perChapter: 5, perEnergyPoint: 0.1, restRecovery: 30 },
    magazine: {
      rankFans: [100, 50, 10, 0],
      restFanLoss: 10,
      cancelWorstRank: 4,
      cancelAfterBadWeeks: 3,
    },
    sales: { tomesPerFan: 1, tomePrice: 10 },
    expenses: { monthly: 100 },
    series: { startingFans: 0, titleMaxLength: 20 },
  },
  themes: [
    {
      id: "sport",
      name: { fr: "Sport", en: "Sports" },
      axisWeights: { story: 0, art: 0, characters: 0.5, worldbuilding: 0, pacing: 0.5 },
      trendByYear: [1],
    },
    {
      id: "comedy",
      name: { fr: "Comédie", en: "Comedy" },
      axisWeights: { story: 0.2, art: 0.2, characters: 0.2, worldbuilding: 0.2, pacing: 0.2 },
      trendByYear: [1],
    },
  ],
  targets: [{ id: "shonen", name: { fr: "Shonen", en: "Shonen" }, themeAffinity: {} }],
  artStyles: [{ id: "classic", name: { fr: "Classique", en: "Classic" }, themeAffinity: {} }],
  competitors: [
    {
      id: "rival",
      name: { fr: "Rival", en: "Rival" },
      baseStrength: 40,
      growthPerYear: 0,
      volatility: 0,
    },
  ],
};
