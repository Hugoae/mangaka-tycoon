import { describe, expect, it } from "vitest";

import { LANGUAGES } from "@mangaka/core";
import { CONTENT_FILE_NAMES } from "@mangaka/content";

import { BASE_CONTENT_DIRECTORY, loadBaseContent, readContentFiles } from "./base-content";

describe("base game content", () => {
  it("has every file the loader expects", () => {
    expect(
      readContentFiles(BASE_CONTENT_DIRECTORY)
        .map((file) => file.name)
        .sort(),
    ).toEqual([...CONTENT_FILE_NAMES].sort());
  });

  it("is valid", () => {
    expect(() => loadBaseContent()).not.toThrow();
  });

  it("offers what the first prototype needs: several themes, audiences and styles, and rivals", () => {
    const content = loadBaseContent();

    expect(content.themes.length).toBeGreaterThanOrEqual(3);
    expect(content.targets.length).toBeGreaterThanOrEqual(2);
    expect(content.artStyles.length).toBeGreaterThanOrEqual(2);
    expect(content.competitors.length).toBeGreaterThanOrEqual(5);
  });

  it("has a name in every supported language for every entry", () => {
    const content = loadBaseContent();
    const entries = [
      ...content.themes,
      ...content.targets,
      ...content.artStyles,
      ...content.competitors,
    ];

    for (const entry of entries) {
      for (const language of LANGUAGES) {
        expect(entry.name[language].trim(), `${entry.id} (${language})`).not.toBe("");
      }
    }
  });

  it("states every balance value as provisional until the designer validates it", () => {
    const balance = readContentFiles(BASE_CONTENT_DIRECTORY).find(
      (file) => file.name === "balance.jsonc",
    );

    expect(balance?.text).toContain("TODO(balance)");
  });
});
