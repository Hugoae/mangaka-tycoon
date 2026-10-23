// @ts-check
import { builtinModules } from "node:module";

import eslint from "@eslint/js";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import { defineConfig, globalIgnores } from "eslint/config";
import boundaries from "eslint-plugin-boundaries";
import tseslint from "typescript-eslint";

import { boundariesRuleOptions, boundariesSettings } from "./eslint/boundaries.js";

/** Every Node.js built-in, with and without the `node:` prefix. */
const NODE_BUILTINS = builtinModules.flatMap((name) => [name, `node:${name}`]);

/** Packages that must never be imported by the pure simulation core (AGENTS.md 5.2). */
const FORBIDDEN_IN_CORE = [
  "react",
  "react-dom",
  "pixi.js",
  "electron",
  "zustand",
  "i18next",
  "react-i18next",
  ...NODE_BUILTINS,
];

/** Global names that make a simulation non-deterministic or tie it to a host (AGENTS.md 5.3.1). */
const NON_DETERMINISTIC_GLOBALS = [
  "Date",
  "window",
  "document",
  "navigator",
  "localStorage",
  "sessionStorage",
  "process",
  "performance",
  "fetch",
  "crypto",
  "setTimeout",
  "setInterval",
  "requestAnimationFrame",
  "structuredClone",
].map((name) => ({
  name,
  message: `\`${name}\` is forbidden in core: the simulation must be pure and deterministic.`,
}));

const CORE_FILES = ["packages/core/src/**/*.ts"];
const CONTENT_FILES = ["packages/content/src/**/*.ts"];
const TEST_FILES = ["**/*.test.ts", "**/*.test.tsx"];

export default defineConfig(
  globalIgnores([
    "**/node_modules/**",
    "**/dist/**",
    "**/out/**",
    "**/release/**",
    "**/coverage/**",
    "pnpm-lock.yaml",
  ]),

  // --- Baseline: strict, type-aware TypeScript rules everywhere. ---
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      // A disable comment that no longer suppresses anything is a lie: fail on it.
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      eqeqeq: ["error", "always"],
      "no-console": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportDefaultDeclaration",
          message: "Use named exports only (AGENTS.md 9.1).",
        },
      ],
      // "Pas de fichier > ~300 lignes sans raison": a disable comment must give the reason.
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,
          "ts-nocheck": true,
          "ts-check": false,
          minimumDescriptionLength: 10,
        },
      ],
      // `as` assertions are forbidden. `as const` stays allowed. A justified exception needs a disable comment with a reason.
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      // Exhaustive `switch` on discriminated unions (assertNever in `default`).
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        { allowDefaultCaseForExhaustiveSwitch: true, requireDefaultForNonUnion: false },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowBoolean: false, allowNullish: false },
      ],
    },
  },

  // --- Disable comments must be justified, paired and never global. ---
  eslintComments.recommended,
  {
    rules: {
      "@eslint-community/eslint-comments/disable-enable-pair": ["error", { allowWholeFile: false }],
      "@eslint-community/eslint-comments/no-unlimited-disable": "error",
      "@eslint-community/eslint-comments/require-description": ["error", { ignore: [] }],
    },
  },

  // --- Pure simulation core: no host, no clock, no entropy, no classes. ---
  {
    files: CORE_FILES,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: FORBIDDEN_IN_CORE.map((name) => ({
            name,
            message: `\`${name}\` must not be imported by core (AGENTS.md 5.2).`,
          })),
          patterns: [
            { group: ["react/*", "react-dom/*", "pixi.js/*", "electron/*", "@mangaka/*"] },
          ],
        },
      ],
      "no-restricted-globals": ["error", ...NON_DETERMINISTIC_GLOBALS],
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message: "Use the seeded PRNG of core/rng: Math.random() breaks determinism.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        { selector: "ExportDefaultDeclaration", message: "Use named exports only." },
        {
          selector: "ClassDeclaration",
          message: "No classes in core: use pure functions and types.",
        },
        {
          selector: "ClassExpression",
          message: "No classes in core: use pure functions and types.",
        },
      ],
    },
  },

  // --- Balance values belong in balance.jsonc, not in system code. ---
  {
    files: ["packages/core/src/systems/**/*.ts"],
    ignores: TEST_FILES,
    rules: {
      "@typescript-eslint/no-magic-numbers": [
        "error",
        {
          ignore: [0, 1, -1],
          ignoreArrayIndexes: true,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],
    },
  },

  // --- Content never touches the DOM, Node or the disk: files are read elsewhere and passed in. ---
  {
    files: CONTENT_FILES,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: ["react", "react-dom", "pixi.js", "electron", ...NODE_BUILTINS].map((name) => ({
            name,
            message: `\`${name}\` must not be imported by content (AGENTS.md 5.2).`,
          })),
        },
      ],
    },
  },

  // --- Architectural boundaries between packages (see eslint/boundaries.js). ---
  {
    files: ["packages/*/src/**/*.ts", "tools/src/**/*.ts"],
    plugins: { boundaries },
    settings: boundariesSettings,
    rules: { "boundaries/dependencies": ["error", boundariesRuleOptions] },
  },

  // --- The build tool requires a default export in its config file (AGENTS.md 9.1: "sauf contrainte d'outil"). ---
  {
    files: ["packages/game/electron.vite.config.ts"],
    rules: { "no-restricted-syntax": "off" },
  },

  // --- Plain JavaScript config files: no type information, default exports allowed. ---
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
);
