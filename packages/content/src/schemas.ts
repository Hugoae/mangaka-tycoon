import { z } from "zod";

/**
 * zod schemas of the content files (ADR 0002). Every object is strict: a typo such as `volatilty`
 * is an error, not a silently ignored field. The inferred types must stay assignable to the types
 * of `@mangaka/core` (checked in `loader.ts`).
 */

const id = z.string().regex(/^[a-z][a-z0-9-]*$/, "must be lower-case letters, digits and dashes");
const nonNegative = z.number().min(0);
const positive = z.number().gt(0);
const share = z.number().min(0).max(1);
const wholeNonNegative = z.number().int().min(0);

const localizedText = z.strictObject({
  fr: z.string().min(1),
  en: z.string().min(1),
});

const sliders = z
  .strictObject({
    story: nonNegative,
    art: nonNegative,
    characters: nonNegative,
    worldbuilding: nonNegative,
    pacing: nonNegative,
  })
  .refine((weights) => Object.values(weights).some((weight) => weight > 0), {
    message: "at least one slider must have a weight above 0",
  });

export const balanceSchema = z.strictObject({
  startingMoney: wholeNonNegative,
  slider: z.strictObject({ max: positive, exponent: positive.max(1) }),
  energy: z.strictObject({ base: positive, fatiguePenalty: share }),
  quality: z.strictObject({ max: positive, fatiguePenalty: share }),
  fatigue: z.strictObject({
    max: positive,
    perChapter: nonNegative,
    perEnergyPoint: nonNegative,
    restRecovery: nonNegative,
  }),
  magazine: z.strictObject({
    rankFans: z.array(z.number().int()).min(1),
    restFanLoss: wholeNonNegative,
    cancelWorstRank: z.number().int().min(1),
    cancelAfterBadWeeks: z.number().int().min(1),
  }),
  sales: z.strictObject({ tomesPerFan: nonNegative, tomePrice: nonNegative }),
  expenses: z.strictObject({ monthly: nonNegative }),
  series: z.strictObject({
    startingFans: wholeNonNegative,
    titleMaxLength: z.number().int().min(1),
  }),
});

const affinity = z.record(id, positive);

export const themesFileSchema = z.strictObject({
  themes: z
    .array(
      z.strictObject({
        id,
        name: localizedText,
        axisWeights: sliders,
        trendByYear: z.array(positive).min(1),
      }),
    )
    .min(1),
});

export const targetsFileSchema = z.strictObject({
  targets: z.array(z.strictObject({ id, name: localizedText, themeAffinity: affinity })).min(1),
});

export const artStylesFileSchema = z.strictObject({
  artStyles: z.array(z.strictObject({ id, name: localizedText, themeAffinity: affinity })).min(1),
});

export const competitorsFileSchema = z.strictObject({
  competitors: z.array(
    z.strictObject({
      id,
      name: localizedText,
      baseStrength: nonNegative,
      growthPerYear: z.number(),
      volatility: nonNegative,
    }),
  ),
});
