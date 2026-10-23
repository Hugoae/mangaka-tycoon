import { describe, expect, it } from "vitest";

import { LANGUAGES, resources } from "./i18n";

interface Tree {
  readonly [key: string]: string | Tree;
}

/** Flattens `{ a: { b: "x" } }` into `{ "a.b": "x" }`. */
function flatten(tree: Tree, prefix = ""): Map<string, string> {
  const entries = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix === "" ? key : `${prefix}.${key}`;
    if (typeof value === "string") {
      entries.set(path, value);
    } else {
      for (const [nestedPath, nested] of flatten(value, path)) {
        entries.set(nestedPath, nested);
      }
    }
  }
  return entries;
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((match) => match[1] ?? "").sort();
}

const french = flatten(resources.fr.translation);

describe("locale files", () => {
  it.each(LANGUAGES)("%s has exactly the keys of the French reference", (language) => {
    const keys = [...flatten(resources[language].translation).keys()].sort();

    expect(keys).toEqual([...french.keys()].sort());
  });

  it.each(LANGUAGES)("%s has no empty text", (language) => {
    for (const [key, text] of flatten(resources[language].translation)) {
      expect(text.trim(), key).not.toBe("");
    }
  });

  it.each(LANGUAGES)("%s uses the same placeholders as French", (language) => {
    const translated = flatten(resources[language].translation);
    for (const [key, frenchText] of french) {
      expect(placeholders(translated.get(key) ?? ""), key).toEqual(placeholders(frenchText));
    }
  });
});
