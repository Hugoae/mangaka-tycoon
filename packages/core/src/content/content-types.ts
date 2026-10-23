/**
 * Shape of the game data the simulation reads. The data itself lives in `@mangaka/content`
 * (JSONC files validated by zod); the core only knows these types and never loads anything.
 */

export const LANGUAGES = ["fr", "en"] as const;
export type LanguageCode = (typeof LANGUAGES)[number];

/** Player-visible text of a content entry, one string per supported language (ADR 0007). */
export type LocalizedText = Readonly<Record<LanguageCode, string>>;

/** The five effort sliders of a chapter (AGENTS.md section 2). */
export const SLIDER_KEYS = ["story", "art", "characters", "worldbuilding", "pacing"] as const;
export type SliderKey = (typeof SLIDER_KEYS)[number];
export type Sliders = Readonly<Record<SliderKey, number>>;

export interface ThemeDefinition {
  readonly id: string;
  readonly name: LocalizedText;
  /** How much each slider counts for this theme. Relative: the core normalises them. */
  readonly axisWeights: Sliders;
  /** Quality multiplier per year, starting at the first year of the calendar. The last value repeats. */
  readonly trendByYear: readonly number[];
}

/** Target audience (shonen, seinen...). */
export interface TargetDefinition {
  readonly id: string;
  readonly name: LocalizedText;
  /** Quality multiplier per theme id; a missing theme counts as 1. */
  readonly themeAffinity: Readonly<Record<string, number>>;
}

export interface ArtStyleDefinition {
  readonly id: string;
  readonly name: LocalizedText;
  /** Quality multiplier per theme id; a missing theme counts as 1. */
  readonly themeAffinity: Readonly<Record<string, number>>;
}

/** A fictional series of the magazine that the player's chapters are ranked against. */
export interface CompetitorDefinition {
  readonly id: string;
  readonly name: LocalizedText;
  readonly baseStrength: number;
  /** Strength gained per calendar year. */
  readonly growthPerYear: number;
  /** Half-width of the random weekly swing around the expected strength. */
  readonly volatility: number;
}

/**
 * Every tunable number of the simulation. They are PROVISIONAL game-design values (AGENTS.md 10.5):
 * balancing belongs to the designer, and none of them is hard-coded in system code.
 */
export interface Balance {
  readonly startingMoney: number;
  readonly slider: {
    /** Highest value of one slider. */
    readonly max: number;
    /** Below 1: the first points of a slider are worth more than the last ones. */
    readonly exponent: number;
  };
  readonly energy: {
    /** Slider points available in a week with no fatigue. */
    readonly base: number;
    /** Share of the base energy lost at maximum fatigue (0-1). */
    readonly fatiguePenalty: number;
  };
  readonly quality: {
    readonly max: number;
    /** Share of the quality lost at maximum fatigue (0-1). */
    readonly fatiguePenalty: number;
  };
  readonly fatigue: {
    readonly max: number;
    readonly perChapter: number;
    readonly perEnergyPoint: number;
    readonly restRecovery: number;
  };
  readonly magazine: {
    /** Fans gained (or lost, if negative) by the rank of the week: index 0 is first place. */
    readonly rankFans: readonly number[];
    /** Fans lost when no chapter is published. */
    readonly restFanLoss: number;
    /** A rank at or below this one counts as a "bad" week. */
    readonly cancelWorstRank: number;
    /** The series is cancelled after this many bad weeks in a row. */
    readonly cancelAfterBadWeeks: number;
  };
  readonly sales: {
    readonly tomesPerFan: number;
    readonly tomePrice: number;
  };
  readonly expenses: {
    readonly monthly: number;
  };
  readonly series: {
    readonly startingFans: number;
    readonly titleMaxLength: number;
  };
}

/** All the content the simulation needs. */
export interface GameContent {
  readonly balance: Balance;
  readonly themes: readonly ThemeDefinition[];
  readonly targets: readonly TargetDefinition[];
  readonly artStyles: readonly ArtStyleDefinition[];
  readonly competitors: readonly CompetitorDefinition[];
}
