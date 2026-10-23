import { describe, expect, it } from "vitest";

import { monthName } from "./month-name";

describe("monthName", () => {
  it("names the twelve months in French with a capital letter", () => {
    expect(Array.from({ length: 12 }, (_, month) => monthName(month, "fr"))).toEqual([
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ]);
  });

  it("names months in English", () => {
    expect(monthName(0, "en")).toBe("January");
    expect(monthName(11, "en")).toBe("December");
  });
});
