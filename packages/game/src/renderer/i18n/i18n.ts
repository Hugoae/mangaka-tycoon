import { createInstance } from "i18next";
import type { i18n } from "i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

/** Shape of a locale, taken from French: a missing key in another locale is a compile error. */
export type Locale = typeof fr;

const english: Locale = en;

export const LANGUAGES = ["fr", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "fr";

export const resources = {
  fr: { translation: fr },
  en: { translation: english },
} as const;

/** Creates an i18next instance. One per app, passed to React through `I18nextProvider`. */
export async function createI18n(language: Language = DEFAULT_LANGUAGE): Promise<i18n> {
  const instance = createInstance();
  await instance.init({
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    resources,
    // React already escapes what it renders.
    interpolation: { escapeValue: false },
  });
  return instance;
}
