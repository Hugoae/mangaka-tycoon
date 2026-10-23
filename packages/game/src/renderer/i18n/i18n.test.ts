import { describe, expect, it } from "vitest";

import { createI18n } from "./i18n";

describe("createI18n", () => {
  it("speaks French by default", async () => {
    const i18n = await createI18n();

    expect(i18n.t("hub.nextWeek")).toBe("Semaine suivante");
  });

  it("can speak English", async () => {
    const i18n = await createI18n("en");

    expect(i18n.t("hub.nextWeek")).toBe("Next week");
  });

  it("interpolates parameters", async () => {
    const i18n = await createI18n();

    expect(i18n.t("hub.date", { month: "Janvier", year: 1980, week: 1 })).toBe(
      "Janvier 1980 · semaine 1",
    );
  });

  it("translates a core event from its key and params", async () => {
    const i18n = await createI18n();

    expect(i18n.t("event.weekAdvanced", { week: 3 })).toBe("Une nouvelle semaine commence.");
  });

  it("gives each call its own independent instance", async () => {
    const french = await createI18n("fr");
    const english = await createI18n("en");

    expect(french.t("hub.nextWeek")).not.toBe(english.t("hub.nextWeek"));
  });
});
