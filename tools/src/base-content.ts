import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { loadGameContent } from "@mangaka/content";
import type { ContentFile } from "@mangaka/content";
import type { GameContent } from "@mangaka/core";

/** Where the data of the base game lives. */
export const BASE_CONTENT_DIRECTORY = resolve(
  import.meta.dirname,
  "../../packages/content/data/base",
);

/** Reads the `.jsonc` files of a content directory. */
export function readContentFiles(directory: string): ContentFile[] {
  return readdirSync(directory)
    .filter((name) => name.endsWith(".jsonc"))
    .map((name) => ({ name, text: readFileSync(join(directory, name), "utf8") }));
}

/** Loads and validates the base game content; throws with every problem listed if it is invalid. */
export function loadBaseContent(): GameContent {
  const result = loadGameContent(readContentFiles(BASE_CONTENT_DIRECTORY));
  if (!result.ok) {
    throw new Error(`The base content is invalid:\n${result.errors.join("\n")}`);
  }
  return result.content;
}
