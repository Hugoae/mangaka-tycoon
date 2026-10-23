import type fr from "./locales/fr.json";

// Typed translation keys (ADR 0007): `t("hub.nope")` is a compile error.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof fr };
  }
}
