import { resolve } from "node:path";

import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * These tests prove that the architecture rules of AGENTS.md really fail the lint when violated.
 * A lint rule that silently stops working is worse than no rule, so each rule has a case that must fail.
 * Files are linted from text: nothing is written to disk.
 */

const REPOSITORY_ROOT = resolve(import.meta.dirname, "../..");

const CORE_FILE = "packages/core/src/probe.ts";
const CORE_SYSTEM_FILE = "packages/core/src/systems/probe.ts";
const CONTENT_FILE = "packages/content/src/probe.ts";
const TOOLS_FILE = "tools/src/probe.ts";

interface ViolationCase {
  readonly name: string;
  readonly file: string;
  readonly code: string;
  readonly ruleId: string;
}

const MUST_FAIL: readonly ViolationCase[] = [
  // --- core: purity and determinism (AGENTS.md 5.2, 5.3.1) ---
  {
    name: "core imports react",
    file: CORE_FILE,
    code: 'import { useState } from "react";\nexport const hook = useState;\n',
    ruleId: "no-restricted-imports",
  },
  {
    name: "core imports a Node built-in",
    file: CORE_FILE,
    code: 'import { readFileSync } from "node:fs";\nexport const read = readFileSync;\n',
    ruleId: "no-restricted-imports",
  },
  {
    name: "core imports an unlisted library",
    file: CORE_FILE,
    code: 'import ts from "typescript";\nexport const compiler = ts;\n',
    ruleId: "boundaries/dependencies",
  },
  {
    name: "core imports content",
    file: CORE_FILE,
    code: 'import { loaded } from "@mangaka/content";\nexport const value = loaded;\n',
    ruleId: "boundaries/dependencies",
  },
  {
    name: "core calls Math.random",
    file: CORE_FILE,
    code: "export const roll = (): number => Math.random();\n",
    ruleId: "no-restricted-properties",
  },
  {
    name: "core reads the clock",
    file: CORE_FILE,
    code: "export const now = (): number => new Date().getTime();\n",
    ruleId: "no-restricted-globals",
  },
  {
    name: "core touches the DOM",
    file: CORE_FILE,
    code: "export const width = (): number => window.innerWidth;\n",
    ruleId: "no-restricted-globals",
  },
  {
    name: "core declares a class",
    file: CORE_FILE,
    code: "export class Counter {\n  public value = 0;\n}\n",
    ruleId: "no-restricted-syntax",
  },
  {
    name: "core hard-codes a balance number in a system",
    file: CORE_SYSTEM_FILE,
    code: "export const weeklyRent = (week: number): number => week * 4200;\n",
    ruleId: "@typescript-eslint/no-magic-numbers",
  },
  // --- content: no host access, and only types of core ---
  {
    name: "content imports a Node built-in",
    file: CONTENT_FILE,
    code: 'import { readFileSync } from "node:fs";\nexport const read = readFileSync;\n',
    ruleId: "no-restricted-imports",
  },
  {
    name: "content imports a value from core",
    file: CONTENT_FILE,
    code: 'import { advanceWeek } from "@mangaka/core";\nexport const advance = advanceWeek;\n',
    ruleId: "boundaries/dependencies",
  },
  {
    name: "tools import the game application",
    file: TOOLS_FILE,
    code: 'import { app } from "@mangaka/game";\nexport const started = app;\n',
    ruleId: "boundaries/dependencies",
  },
  // --- project-wide code rules (AGENTS.md 9.1) ---
  {
    name: "default export",
    file: CORE_FILE,
    code: "const answer = 42;\nexport default answer;\n",
    ruleId: "no-restricted-syntax",
  },
  {
    name: "explicit any",
    file: CORE_FILE,
    code: "export const value: any = 1;\n",
    ruleId: "@typescript-eslint/no-explicit-any",
  },
  {
    name: "non-null assertion",
    file: CORE_FILE,
    code: "const values: number[] = [1];\nexport const first = values[0]!;\n",
    ruleId: "@typescript-eslint/no-non-null-assertion",
  },
  {
    name: "unjustified `as` assertion",
    file: CORE_FILE,
    code: "const input: unknown = 1;\nexport const count = input as number;\n",
    ruleId: "@typescript-eslint/consistent-type-assertions",
  },
  {
    name: "@ts-ignore",
    file: CORE_FILE,
    code: '// @ts-ignore\nexport const wrong: number = "text";\n',
    ruleId: "@typescript-eslint/ban-ts-comment",
  },
  {
    name: "disable comment without description",
    file: CORE_FILE,
    code: "// eslint-disable-next-line @typescript-eslint/no-explicit-any\nexport const value: any = 1;\n",
    ruleId: "@eslint-community/eslint-comments/require-description",
  },
  {
    name: "non-exhaustive switch on a union",
    file: CORE_FILE,
    code: 'export const label = (kind: "a" | "b"): string => {\n  switch (kind) {\n    case "a":\n      return "A";\n  }\n  return "?";\n};\n',
    ruleId: "@typescript-eslint/switch-exhaustiveness-check",
  },
];

interface AllowedCase {
  readonly name: string;
  readonly file: string;
  readonly code: string;
  /** The rule that must NOT report anything, proving the allow-list is not simply blocking everything. */
  readonly ruleId: string;
}

const MUST_PASS: readonly AllowedCase[] = [
  {
    name: "core imports an allowed pure library",
    file: CORE_FILE,
    code: 'import { produce } from "immer";\nexport const update = produce;\n',
    ruleId: "boundaries/dependencies",
  },
  {
    name: "content imports a type from core",
    file: CONTENT_FILE,
    code: 'import type { GameState } from "@mangaka/core";\nexport type Loaded = GameState;\n',
    ruleId: "boundaries/dependencies",
  },
  {
    name: "content imports zod",
    file: CONTENT_FILE,
    code: 'import { z } from "zod";\nexport const schema = z;\n',
    ruleId: "boundaries/dependencies",
  },
  {
    name: "tools import core and content",
    file: TOOLS_FILE,
    code: 'import { advanceWeek } from "@mangaka/core";\nimport { loadPacks } from "@mangaka/content";\nexport const run = [advanceWeek, loadPacks];\n',
    ruleId: "boundaries/dependencies",
  },
  {
    name: "a system uses 0 and 1 without naming them",
    file: CORE_SYSTEM_FILE,
    code: "export const nextWeek = (week: number): number => week + 1;\nexport const isZero = (week: number): boolean => week === 0;\n",
    ruleId: "@typescript-eslint/no-magic-numbers",
  },
  {
    name: "a justified disable comment is accepted",
    file: CORE_FILE,
    code: "// eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy payload validated by zod right after\nexport const value: any = 1;\n",
    ruleId: "@eslint-community/eslint-comments/require-description",
  },
];

describe("architecture lint rules", () => {
  let eslint: ESLint;

  beforeAll(() => {
    eslint = new ESLint({
      cwd: REPOSITORY_ROOT,
      // The probe files do not exist on disk, so typescript-eslint must treat them as
      // "default project" files. Everything else comes from the real eslint.config.js.
      overrideConfig: {
        languageOptions: {
          parserOptions: {
            projectService: {
              allowDefaultProject: [CORE_FILE, CORE_SYSTEM_FILE, CONTENT_FILE, TOOLS_FILE],
              defaultProject: "tsconfig.base.json",
              maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 10,
            },
            tsconfigRootDir: REPOSITORY_ROOT,
          },
        },
      },
    });
  });

  async function reportedRules(file: string, code: string): Promise<readonly string[]> {
    const [result] = await eslint.lintText(code, { filePath: resolve(REPOSITORY_ROOT, file) });
    if (result === undefined) {
      throw new Error(`ESLint returned no result for ${file}`);
    }
    // A parsing or configuration error has no rule id: it would make a "must fail" case pass for the wrong reason.
    const fatal = result.messages.filter((message) => message.fatal === true);
    expect(fatal, `fatal ESLint errors for ${file}`).toEqual([]);
    return result.messages.flatMap((message) => (message.ruleId === null ? [] : [message.ruleId]));
  }

  describe("violations must fail the lint", () => {
    it.each(MUST_FAIL)("$name -> $ruleId", async ({ file, code, ruleId }) => {
      expect(await reportedRules(file, code)).toContain(ruleId);
    });
  });

  describe("allowed code must not trigger the rule", () => {
    it.each(MUST_PASS)("$name", async ({ file, code, ruleId }) => {
      expect(await reportedRules(file, code)).not.toContain(ruleId);
    });
  });
});
