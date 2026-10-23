import { describe, expect, it } from "vitest";

import { CONTENT_FILE_NAMES, loadGameContent } from "./loader";
import type { ContentFile } from "./loader";

const text = { fr: "Texte", en: "Text" };

function validBalance() {
  return {
    startingMoney: 1000,
    slider: { max: 50, exponent: 0.7 },
    energy: { base: 100, fatiguePenalty: 0.5 },
    quality: { max: 100, fatiguePenalty: 0.3 },
    fatigue: { max: 100, perChapter: 8, perEnergyPoint: 0.1, restRecovery: 30 },
    magazine: {
      rankFans: [100, 50, 0],
      restFanLoss: 10,
      cancelWorstRank: 3,
      cancelAfterBadWeeks: 2,
    },
    sales: { tomesPerFan: 0.5, tomePrice: 10 },
    expenses: { monthly: 100 },
    series: { startingFans: 0, titleMaxLength: 30 },
  };
}

/**
 * A small valid data set as plain objects, so each test breaks exactly one thing. Values are
 * `unknown` on purpose: tests also feed wrong types and raw text.
 */
function validData(balance: unknown = validBalance()): Record<string, unknown> {
  return {
    "balance.jsonc": balance,
    "themes.jsonc": {
      themes: [
        {
          id: "adventure",
          name: text,
          axisWeights: { story: 1, art: 1, characters: 1, worldbuilding: 1, pacing: 1 },
          trendByYear: [1],
        },
      ],
    },
    "targets.jsonc": { targets: [{ id: "shonen", name: text, themeAffinity: { adventure: 1.1 } }] },
    "art-styles.jsonc": { artStyles: [{ id: "classic", name: text, themeAffinity: {} }] },
    "competitors.jsonc": {
      competitors: [
        { id: "rival-a", name: text, baseStrength: 40, growthPerYear: 1, volatility: 5 },
        { id: "rival-b", name: text, baseStrength: 30, growthPerYear: 0, volatility: 5 },
      ],
    },
  };
}

function toFiles(data: Record<string, unknown>): ContentFile[] {
  return Object.entries(data).map(([name, value]) => ({
    name,
    text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
  }));
}

function errorsOf(data: Record<string, unknown>): readonly string[] {
  const result = loadGameContent(toFiles(data));
  if (result.ok) {
    throw new Error("The content was expected to be rejected.");
  }
  return result.errors;
}

describe("loadGameContent", () => {
  it("builds the content from valid files", () => {
    const result = loadGameContent(toFiles(validData()));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.content.themes.map((theme) => theme.id)).toEqual(["adventure"]);
      expect(result.content.competitors).toHaveLength(2);
      expect(result.content.balance.startingMoney).toBe(1000);
    }
  });

  it("lists the files that make up the content", () => {
    expect(CONTENT_FILE_NAMES).toEqual(Object.keys(validData()));
  });

  it("accepts comments and trailing commas, which are the point of JSONC (ADR 0002)", () => {
    const data = validData();
    data["targets.jsonc"] =
      '// audiences\n{ "targets": [ { "id": "shonen", "name": { "fr": "A", "en": "B", }, "themeAffinity": {}, /* none */ }, ] }';

    expect(loadGameContent(toFiles(data)).ok).toBe(true);
  });

  it("reports every missing file", () => {
    const result = loadGameContent([]);

    expect(result).toEqual({
      ok: false,
      errors: CONTENT_FILE_NAMES.map((name) => `${name}: file is missing.`),
    });
  });

  it("reports a syntax error with the file, line and column", () => {
    const data = validData();
    data["themes.jsonc"] = '{\n  "themes": [\n    { "id": "adventure" "name": 1 }\n  ]\n}';

    expect(errorsOf(data)).toEqual(["themes.jsonc:3:25: CommaExpected."]);
  });

  it("reports a wrong type with the path of the field", () => {
    const data = validData({ ...validBalance(), startingMoney: "a lot" });

    expect(errorsOf(data)).toEqual([expect.stringMatching(/^balance\.jsonc: startingMoney: /)]);
  });

  it("rejects an unknown field: a typo must not be silently ignored", () => {
    const data = validData();
    data["competitors.jsonc"] = {
      competitors: [
        { id: "a", name: text, baseStrength: 1, growthPerYear: 1, volatilty: 5, volatility: 5 },
      ],
    };

    expect(errorsOf(data).join("\n")).toContain("volatilty");
  });

  it("rejects out-of-range numbers", () => {
    const balance = {
      ...validBalance(),
      slider: { max: 50, exponent: 2 },
      energy: { base: 100, fatiguePenalty: 1.5 },
    };

    const errors = errorsOf(validData(balance));

    expect(errors.some((line) => line.includes("slider.exponent"))).toBe(true);
    expect(errors.some((line) => line.includes("energy.fatiguePenalty"))).toBe(true);
  });

  it("rejects a theme whose sliders all weigh nothing", () => {
    const data = validData();
    data["themes.jsonc"] = {
      themes: [
        {
          id: "adventure",
          name: text,
          axisWeights: { story: 0, art: 0, characters: 0, worldbuilding: 0, pacing: 0 },
          trendByYear: [1],
        },
      ],
    };

    expect(errorsOf(data).join("\n")).toContain("at least one slider must have a weight above 0");
  });

  it("rejects an identifier that is not lower-case kebab", () => {
    const data = validData();
    data["targets.jsonc"] = { targets: [{ id: "Shonen!", name: text, themeAffinity: {} }] };

    expect(errorsOf(data).join("\n")).toContain("targets.0.id");
  });

  it("rejects duplicate identifiers in a file", () => {
    const data = validData();
    data["competitors.jsonc"] = {
      competitors: [
        { id: "same", name: text, baseStrength: 1, growthPerYear: 0, volatility: 0 },
        { id: "same", name: text, baseStrength: 2, growthPerYear: 0, volatility: 0 },
      ],
    };

    expect(errorsOf(data)).toContain('competitors.jsonc: duplicate id "same".');
  });

  it("rejects an affinity that refers to a theme that does not exist", () => {
    const data = validData();
    data["art-styles.jsonc"] = {
      artStyles: [{ id: "classic", name: text, themeAffinity: { ghost: 1 } }],
    };

    expect(errorsOf(data)).toEqual([
      'art-styles.jsonc: "classic" refers to the unknown theme "ghost".',
    ]);
  });

  it("rejects a rank table that does not have one entry per place", () => {
    const base = validBalance();
    const balance = { ...base, magazine: { ...base.magazine, rankFans: [100, 50] } };

    expect(errorsOf(validData(balance))).toEqual([
      expect.stringContaining("magazine.rankFans needs one entry per place (3"),
    ]);
  });

  it("rejects a cancellation rank beyond the last place", () => {
    const base = validBalance();
    const balance = { ...base, magazine: { ...base.magazine, cancelWorstRank: 9 } };

    expect(errorsOf(validData(balance))).toEqual([expect.stringContaining("cancelWorstRank (9)")]);
  });

  it("keeps validating the other files when one is broken", () => {
    const data = validData();
    data["themes.jsonc"] = "not json at all {";
    delete data["targets.jsonc"];

    const errors = errorsOf(data);

    expect(errors.some((line) => line.startsWith("themes.jsonc:"))).toBe(true);
    expect(errors).toContain("targets.jsonc: file is missing.");
  });

  it("reports a root that is not an object", () => {
    const data = validData();
    data["themes.jsonc"] = "[]";

    expect(errorsOf(data)[0]).toMatch(/^themes\.jsonc: /);
  });
});
