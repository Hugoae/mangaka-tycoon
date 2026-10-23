// @ts-check
// Layer rules *inside* packages/game (see docs/ARCHITECTURE.md, ADR 0006, ADR 0009, ADR 0011).
//
// `no-restricted-imports` options are replaced, not merged, when several config blocks match one
// file. Every file therefore belongs to exactly one block below, each with its complete list.
import { builtinModules } from "node:module";

const NODE_BUILTINS = builtinModules.flatMap((name) => [name, `node:${name}`]);

const SRC = "packages/game/src";

/** Functions that read or change the game: only the renderer store may call them. */
const ENGINE_FUNCTIONS = ["applyCommand", "advanceWeek", "createNewGame"];

const UI_LIBRARIES = ["react", "react-dom", "react-i18next", "zustand", "i18next"];
const RENDERING_LIBRARIES = ["pixi.js"];
const HOST = ["electron", ...NODE_BUILTINS];

/**
 * @param {readonly string[]} names
 * @param {string} reason
 */
const forbid = (names, reason) =>
  names.map((name) => ({ name, message: `\`${name}\` is forbidden here: ${reason}` }));

const noToolingInSource = forbid(
  ["electron-vite"],
  "the build tool must stay replaceable and only appear in its config file (ADR 0011).",
);

const noEngineCalls = {
  name: "@mangaka/core",
  importNames: ENGINE_FUNCTIONS,
  message:
    "only the renderer store may call the core: the UI dispatches commands and reads state (AGENTS.md 5.3.5).",
};

/**
 * @param {readonly string[]} files
 * @param {readonly string[]} ignores
 * @param {ReadonlyArray<{ name: string, message?: string, importNames?: readonly string[] }>} paths
 * @param {readonly string[]} patterns
 */
const layer = (files, ignores, paths, patterns) => ({
  files: [...files],
  ignores: [...ignores],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [...paths],
        patterns: patterns.length === 0 ? [] : [{ group: [...patterns], message: patternMessage }],
      },
    ],
  },
});

const patternMessage = "this import crosses a layer boundary (docs/ARCHITECTURE.md).";

/** @param {readonly string[]} names */
const subpaths = (names) => names.map((name) => `${name}/*`);

export const gameLayerConfigs = [
  // Shared contracts run in both processes: no host, no UI, no rendering, no engine.
  layer(
    [`${SRC}/shared/**/*.{ts,tsx}`],
    [],
    [
      ...forbid(HOST, "shared code runs in both the main process and the renderer."),
      ...forbid([...UI_LIBRARIES, ...RENDERING_LIBRARIES], "shared code must stay framework-free."),
      ...noToolingInSource,
      noEngineCalls,
    ],
    [...subpaths([...UI_LIBRARIES, ...RENDERING_LIBRARIES, "electron"])],
  ),

  // Main process and preload: no UI or rendering, never reach into the renderer.
  layer(
    [`${SRC}/main/**/*.{ts,tsx}`, `${SRC}/preload/**/*.{ts,tsx}`],
    [],
    [
      ...forbid(
        [...UI_LIBRARIES, ...RENDERING_LIBRARIES],
        "the main process and the preload do not render anything (ADR 0009).",
      ),
      ...noToolingInSource,
      noEngineCalls,
    ],
    [...subpaths([...UI_LIBRARIES, ...RENDERING_LIBRARIES]), "**/renderer", "**/renderer/**"],
  ),

  // Renderer store: the one place allowed to drive the core.
  layer(
    [`${SRC}/renderer/store/**/*.{ts,tsx}`],
    [],
    [...forbid(HOST, "the renderer is sandboxed: go through PlatformApi."), ...noToolingInSource],
    [...subpaths(["electron"]), "**/main", "**/main/**", "**/preload", "**/preload/**"],
  ),

  // React UI: presentational, no rendering engine, no scene, no engine calls.
  layer(
    [`${SRC}/renderer/ui/**/*.{ts,tsx}`],
    [],
    [
      ...forbid(HOST, "the renderer is sandboxed: go through PlatformApi."),
      ...forbid(RENDERING_LIBRARIES, "the Pixi scene is separate from the React UI (ADR 0006)."),
      ...noToolingInSource,
      noEngineCalls,
    ],
    [
      ...subpaths(["electron", ...RENDERING_LIBRARIES]),
      "**/scene",
      "**/scene/**",
      "**/main",
      "**/main/**",
      "**/preload",
      "**/preload/**",
    ],
  ),

  // Everything else in the renderer (i18n, platform, scene, bootstrap).
  layer(
    [`${SRC}/renderer/**/*.{ts,tsx}`],
    [`${SRC}/renderer/store/**`, `${SRC}/renderer/ui/**`],
    [
      ...forbid(HOST, "the renderer is sandboxed: go through PlatformApi."),
      ...noToolingInSource,
      noEngineCalls,
    ],
    [...subpaths(["electron"]), "**/main", "**/main/**", "**/preload", "**/preload/**"],
  ),
];
