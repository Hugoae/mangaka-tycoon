import { describe, expect, it } from "vitest";

import { createI18n } from "./i18n";

describe("createI18n", () => {
  it("speaks French by default", async () => {
    const i18n = await createI18n();

    expect(i18n.t("production.publish")).toBe("Publier le chapitre");
  });

  it("can speak English", async () => {
    const i18n = await createI18n("en");

    expect(i18n.t("production.publish")).toBe("Publish the chapter");
  });

  it("interpolates parameters", async () => {
    const i18n = await createI18n();

    expect(i18n.t("hud.date", { month: "Janvier", year: 1980, week: 1 })).toBe(
      "Janvier 1980 · semaine 1",
    );
  });

  it("can switch language at runtime", async () => {
    const i18n = await createI18n("fr");

    await i18n.changeLanguage("en");

    expect(i18n.t("gameOver.newGame")).toBe("New game");
  });

  it("gives each call its own independent instance", async () => {
    const french = await createI18n("fr");
    const english = await createI18n("en");

    expect(french.t("gameOver.newGame")).not.toBe(english.t("gameOver.newGame"));
  });
});
