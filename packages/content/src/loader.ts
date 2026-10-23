import type { GameContent } from "@mangaka/core";
import { parse, printParseErrorCode } from "jsonc-parser";
import type { ParseError } from "jsonc-parser";
import type { z } from "zod";

import {
  artStylesFileSchema,
  balanceSchema,
  competitorsFileSchema,
  targetsFileSchema,
  themesFileSchema,
} from "./schemas";

/** The files that make up the content of the game, in the order they are reported. */
export const CONTENT_FILE_NAMES = [
  "balance.jsonc",
  "themes.jsonc",
  "targets.jsonc",
  "art-styles.jsonc",
  "competitors.jsonc",
] as const;

export type ContentFileName = (typeof CONTENT_FILE_NAMES)[number];

/** A content file already read by the host (disk, network...): the loader never reads anything itself. */
export interface ContentFile {
  readonly name: string;
  readonly text: string;
}

export type LoadResult =
  | { readonly ok: true; readonly content: GameContent }
  | { readonly ok: false; readonly errors: readonly string[] };

function lineAndColumn(text: string, offset: number): string {
  const before = text.slice(0, offset);
  const line = before.split("\n").length;
  const column = offset - (before.lastIndexOf("\n") + 1) + 1;
  return `${String(line)}:${String(column)}`;
}

/** Parses JSONC and validates it; every problem becomes one readable line prefixed by the file name. */
function readFile<Schema extends z.ZodType>(
  files: readonly ContentFile[],
  name: ContentFileName,
  schema: Schema,
  errors: string[],
): z.output<Schema> | undefined {
  const file = files.find((candidate) => candidate.name === name);
  if (file === undefined) {
    errors.push(`${name}: file is missing.`);
    return undefined;
  }

  const parseErrors: ParseError[] = [];
  const value: unknown = parse(file.text, parseErrors, { allowTrailingComma: true });
  if (parseErrors.length > 0) {
    for (const error of parseErrors) {
      errors.push(
        `${name}:${lineAndColumn(file.text, error.offset)}: ${printParseErrorCode(error.error)}.`,
      );
    }
    return undefined;
  }

  const result = schema.safeParse(value);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.length === 0 ? "(root)" : issue.path.map(String).join(".");
      errors.push(`${name}: ${path}: ${issue.message}`);
    }
    return undefined;
  }
  return result.data;
}

interface AffinityOwner {
  readonly id: string;
  readonly themeAffinity: Readonly<Record<string, number>>;
}

function findDuplicates(ids: readonly string[]): string[] {
  return ids.filter((value, index) => ids.indexOf(value) !== index);
}

/** Rules that span several files: references between entries and consistency of the balance. */
function crossCheck(content: GameContent): string[] {
  const errors: string[] = [];
  const themeIds = content.themes.map((theme) => theme.id);

  const lists: readonly (readonly [string, readonly { readonly id: string }[]])[] = [
    ["themes.jsonc", content.themes],
    ["targets.jsonc", content.targets],
    ["art-styles.jsonc", content.artStyles],
    ["competitors.jsonc", content.competitors],
  ];
  for (const [file, entries] of lists) {
    for (const duplicate of findDuplicates(entries.map((entry) => entry.id))) {
      errors.push(`${file}: duplicate id "${duplicate}".`);
    }
  }

  const affinityOwners: readonly (readonly [string, readonly AffinityOwner[]])[] = [
    ["targets.jsonc", content.targets],
    ["art-styles.jsonc", content.artStyles],
  ];
  for (const [file, entries] of affinityOwners) {
    for (const entry of entries) {
      for (const themeId of Object.keys(entry.themeAffinity)) {
        if (!themeIds.includes(themeId)) {
          errors.push(`${file}: "${entry.id}" refers to the unknown theme "${themeId}".`);
        }
      }
    }
  }

  const places = content.competitors.length + 1;
  const { magazine } = content.balance;
  if (magazine.rankFans.length !== places) {
    errors.push(
      `balance.jsonc: magazine.rankFans needs one entry per place (${String(places)}: the player and ${String(content.competitors.length)} competitors), got ${String(magazine.rankFans.length)}.`,
    );
  }
  if (magazine.cancelWorstRank > places) {
    errors.push(
      `balance.jsonc: magazine.cancelWorstRank (${String(magazine.cancelWorstRank)}) is beyond the last place (${String(places)}).`,
    );
  }
  return errors;
}

/**
 * Validates the content files and builds the {@link GameContent} the core needs.
 * Never throws: every problem comes back in `errors`, with the file and the position.
 */
export function loadGameContent(files: readonly ContentFile[]): LoadResult {
  const errors: string[] = [];
  const balance = readFile(files, "balance.jsonc", balanceSchema, errors);
  const themes = readFile(files, "themes.jsonc", themesFileSchema, errors);
  const targets = readFile(files, "targets.jsonc", targetsFileSchema, errors);
  const artStyles = readFile(files, "art-styles.jsonc", artStylesFileSchema, errors);
  const competitors = readFile(files, "competitors.jsonc", competitorsFileSchema, errors);

  if (
    balance === undefined ||
    themes === undefined ||
    targets === undefined ||
    artStyles === undefined ||
    competitors === undefined
  ) {
    return { ok: false, errors };
  }

  // Assigning to GameContent is the compile-time proof that the schemas match the core's types.
  const content: GameContent = {
    balance,
    themes: themes.themes,
    targets: targets.targets,
    artStyles: artStyles.artStyles,
    competitors: competitors.competitors,
  };
  const crossErrors = crossCheck(content);
  return crossErrors.length > 0 ? { ok: false, errors: crossErrors } : { ok: true, content };
}
