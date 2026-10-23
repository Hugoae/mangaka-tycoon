import { describe, expect, it } from "vitest";

import { formatNumber, formatSigned, localized, otherLanguage, toLanguageCode } from "./language";

describe("toLanguageCode", () => {
  it.each([
    ["fr", "fr"],
    ["en", "en"],
    ["en-US", "en"],
    ["fr-FR", "fr"],
    ["de", "fr"],
    ["english", "fr"],
  ])("maps %s to %s", (input, expected) => {
    expect(toLanguageCode(input)).toBe(expected);
  });
});

describe("otherLanguage", () => {
  it("switches between the two shipped languages", () => {
    expect(otherLanguage("fr")).toBe("en");
    expect(otherLanguage("en")).toBe("fr");
  });
});

describe("localized", () => {
  it("picks the text of the language", () => {
    expect(localized({ fr: "Sport", en: "Sports" }, "en")).toBe("Sports");
  });
});

describe("number formats", () => {
  it("rounds to whole numbers by default", () => {
    expect(formatNumber(12.6, "en")).toBe("13");
  });

  it("keeps the requested decimals but no trailing zero", () => {
    expect(formatNumber(1.5, "en", 2)).toBe("1.5");
    expect(formatNumber(1.234, "en", 2)).toBe("1.23");
  });

  it("groups thousands the way the language does", () => {
    expect(formatNumber(1234567, "en")).toBe("1,234,567");
  });

  it("always signs a signed number, except zero", () => {
    expect(formatSigned(5, "en")).toBe("+5");
    expect(formatSigned(-5, "en")).toBe("-5");
    expect(formatSigned(0, "en")).toBe("0");
  });
});
