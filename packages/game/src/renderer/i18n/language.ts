import { LANGUAGES } from "@mangaka/core";
import type { LanguageCode, LocalizedText } from "@mangaka/core";

export const DEFAULT_LANGUAGE: LanguageCode = "fr";

/** Narrows the language reported by i18next (which may be `fr-FR`...) to one the game ships. */
export function toLanguageCode(language: string): LanguageCode {
  return (
    LANGUAGES.find((code) => language === code || language.startsWith(`${code}-`)) ??
    DEFAULT_LANGUAGE
  );
}

/** The language the toggle button switches to. */
export function otherLanguage(language: LanguageCode): LanguageCode {
  return LANGUAGES.find((code) => code !== language) ?? DEFAULT_LANGUAGE;
}

/** Text of a content entry (theme name...) in the given language. */
export function localized(text: LocalizedText, language: LanguageCode): string {
  return text[language];
}

/** Whole numbers by default; the player never sees a raw float (values arrive rounded by the core). */
export function formatNumber(value: number, language: LanguageCode, fractionDigits = 0): string {
  return new Intl.NumberFormat(language, {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Same, always with its sign (`+12`, `-3`, `0`). */
export function formatSigned(value: number, language: LanguageCode, fractionDigits = 0): string {
  return new Intl.NumberFormat(language, {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
    signDisplay: "exceptZero",
  }).format(value);
}
