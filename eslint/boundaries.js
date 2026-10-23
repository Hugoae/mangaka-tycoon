// @ts-check
/**
 * Architectural boundaries between workspace packages (AGENTS.md 5.2, ADR 0003).
 *
 * The plugin classifies an import of another workspace package (`@mangaka/core`) as an
 * *external module* whose `source` is the package name, so cross-package rules are written
 * on `module.source`. Imports between files of the same package are not checked
 * (`checkInternals` is off). Policies form an allow-list: the last matching policy wins,
 * and anything not allowed is reported.
 */

export const boundariesSettings = {
  "boundaries/elements": [
    { type: "core", pattern: "packages/core", partialMatch: false },
    { type: "content", pattern: "packages/content", partialMatch: false },
    { type: "game", pattern: "packages/game", partialMatch: false },
    { type: "tools", pattern: "tools", partialMatch: false },
  ],
  "boundaries/files": [{ category: "test", pattern: "**/*.test.ts" }],
};

/** Libraries allowed in each package, on top of the workspace packages listed below. */
const CORE_LIBRARIES = ["immer", "zod"];
const CONTENT_LIBRARIES = ["zod", "jsonc-parser"];

export const boundariesRuleOptions = {
  default: "disallow",
  // By default the plugin only checks local files. External packages and Node built-ins are
  // the whole point of the allow-list, so they must be checked too.
  checkAllOrigins: true,
  message:
    "This import is not allowed by the architecture (AGENTS.md 5.2, ADR 0003). " +
    "Allowed: core -> immer, zod; content -> zod, jsonc-parser and types of core.",
  policies: [
    // core: pure libraries only.
    {
      from: { element: { type: "core" } },
      allow: { to: { module: { origin: "external", source: CORE_LIBRARIES } } },
    },
    // content: its libraries, and *types* of core.
    {
      from: { element: { type: "content" } },
      allow: { to: { module: { origin: "external", source: CONTENT_LIBRARIES } } },
    },
    {
      from: { element: { type: "content" } },
      dependency: { kind: "type" },
      allow: { to: { module: { origin: "external", source: "@mangaka/core" } } },
    },
    // game and tools: npm packages, Node built-ins, core and content.
    {
      from: { element: { type: ["game", "tools"] } },
      allow: { to: { module: { origin: ["external", "core"] } } },
    },
    // Tests may use the test libraries anywhere.
    {
      from: { file: { categories: "test" } },
      allow: { to: { module: { origin: "external", source: ["vitest", "fast-check"] } } },
    },
    // Nothing may depend on the application or on the tools (evaluated last, so it wins).
    {
      disallow: {
        to: { module: { origin: "external", source: ["@mangaka/game", "@mangaka/tools"] } },
      },
      message: "Nothing may depend on @mangaka/game or @mangaka/tools.",
    },
  ],
};
