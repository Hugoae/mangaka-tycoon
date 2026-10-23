import type { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

import { createProbeLinter, reportedRules } from "./lint-harness";
import type { ProbeCase } from "./lint-harness";

/**
 * Proves that the layer rules inside `packages/game` (eslint/game-layers.js) really fail the lint.
 * Same principle as lint-rules.test.ts: each rule has a case that must fail and, where it matters,
 * a neighbouring case that must stay allowed so the rule cannot pass by blocking everything.
 */

const SHARED_FILE = "packages/game/src/shared/probe.ts";
const MAIN_FILE = "packages/game/src/main/probe.ts";
const PRELOAD_FILE = "packages/game/src/preload/probe.ts";
const STORE_FILE = "packages/game/src/renderer/store/probe.ts";
const UI_FILE = "packages/game/src/renderer/ui/probe.ts";
const SCENE_FILE = "packages/game/src/renderer/scene/probe.ts";
const RENDERER_FILE = "packages/game/src/renderer/i18n/probe.ts";

const RULE = "no-restricted-imports";

/** A snippet that must be reported by `no-restricted-imports`. */
const violation = (name: string, file: string, code: string): ProbeCase => ({
  name,
  file,
  code,
  ruleId: RULE,
});

/** A snippet that must NOT be reported by `no-restricted-imports`. */
const allowed = violation;

const MUST_FAIL: readonly ProbeCase[] = [
  // --- React UI: presentational only ---
  violation(
    "ui calls applyCommand",
    UI_FILE,
    'import { applyCommand } from "@mangaka/core";\nexport const run = applyCommand;\n',
  ),
  violation(
    "ui reaches the core through a namespace import",
    UI_FILE,
    'import * as core from "@mangaka/core";\nexport const run = core.applyCommand;\n',
  ),
  violation(
    "ui imports electron",
    UI_FILE,
    'import { ipcRenderer } from "electron";\nexport const bus = ipcRenderer;\n',
  ),
  violation(
    "ui imports a Node built-in",
    UI_FILE,
    'import { readFileSync } from "node:fs";\nexport const read = readFileSync;\n',
  ),
  violation(
    "ui imports pixi",
    UI_FILE,
    'import { Application } from "pixi.js";\nexport const app = Application;\n',
  ),
  violation(
    "ui imports the scene",
    UI_FILE,
    'import { createScene } from "../scene/scene";\nexport const scene = createScene;\n',
  ),
  // --- Pixi scene: observes, never drives ---
  violation(
    "the scene calls applyCommand",
    SCENE_FILE,
    'import { applyCommand } from "@mangaka/core";\nexport const run = applyCommand;\n',
  ),
  violation(
    "the scene imports react",
    SCENE_FILE,
    'import { useState } from "react";\nexport const hook = useState;\n',
  ),
  violation(
    "the scene imports zustand",
    SCENE_FILE,
    'import { createStore } from "zustand/vanilla";\nexport const make = createStore;\n',
  ),
  violation(
    "the scene imports the UI",
    SCENE_FILE,
    'import { App } from "../ui/app";\nexport const root = App;\n',
  ),
  // --- renderer outside the store ---
  violation(
    "renderer code outside the store calls advanceWeek",
    RENDERER_FILE,
    'import { advanceWeek } from "@mangaka/core";\nexport const run = advanceWeek;\n',
  ),
  violation(
    "renderer code outside the store creates a game",
    RENDERER_FILE,
    'import { createNewGame } from "@mangaka/core";\nexport const run = createNewGame;\n',
  ),
  violation(
    "renderer code imports a Node built-in",
    RENDERER_FILE,
    'import { join } from "node:path";\nexport const joined = join;\n',
  ),
  violation(
    "the store imports electron",
    STORE_FILE,
    'import { app } from "electron";\nexport const name = app;\n',
  ),
  violation(
    "the renderer imports the main process",
    RENDERER_FILE,
    'import { createMainWindow } from "../main/window";\nexport const open = createMainWindow;\n',
  ),
  // --- main process and preload: no UI, never the renderer ---
  violation(
    "main imports react",
    MAIN_FILE,
    'import { useState } from "react";\nexport const hook = useState;\n',
  ),
  violation(
    "main imports the renderer",
    MAIN_FILE,
    'import { createGameStore } from "../renderer/store/game-store";\nexport const store = createGameStore;\n',
  ),
  violation(
    "main calls the core",
    MAIN_FILE,
    'import { applyCommand } from "@mangaka/core";\nexport const run = applyCommand;\n',
  ),
  violation(
    "preload imports zustand",
    PRELOAD_FILE,
    'import { createStore } from "zustand/vanilla";\nexport const make = createStore;\n',
  ),
  // --- shared contracts run in both processes ---
  violation(
    "shared imports electron",
    SHARED_FILE,
    'import { app } from "electron";\nexport const name = app;\n',
  ),
  violation(
    "shared imports react",
    SHARED_FILE,
    'import { useState } from "react";\nexport const hook = useState;\n',
  ),
  // --- the build tool stays confined to its config file (ADR 0011) ---
  violation(
    "main imports electron-vite",
    MAIN_FILE,
    'import { defineConfig } from "electron-vite";\nexport const config = defineConfig;\n',
  ),
  violation(
    "the renderer imports electron-vite",
    RENDERER_FILE,
    'import { defineConfig } from "electron-vite";\nexport const config = defineConfig;\n',
  ),
];

const MUST_PASS: readonly ProbeCase[] = [
  allowed(
    "the store drives the core",
    STORE_FILE,
    'import { applyCommand, createNewGame } from "@mangaka/core";\nexport const run = [applyCommand, createNewGame];\n',
  ),
  allowed(
    "ui reads the calendar and core types",
    UI_FILE,
    'import { weekToDate } from "@mangaka/core";\nimport type { GameState } from "@mangaka/core";\nexport const read = (state: GameState) => weekToDate(state.week);\n',
  ),
  allowed(
    "ui uses React, Zustand and i18next",
    UI_FILE,
    'import { useTranslation } from "react-i18next";\nimport { useStore } from "zustand";\nimport { useState } from "react";\nexport const hooks = [useTranslation, useStore, useState];\n',
  ),
  allowed(
    "the scene uses pixi and reads store types",
    SCENE_FILE,
    'import { Application } from "pixi.js";\nimport type { GameStore } from "../store/game-store";\nexport const make = (store: GameStore) => [Application, store];\n',
  ),
  allowed(
    "the renderer outside ui, store and scene may use pixi",
    RENDERER_FILE,
    'import { Application } from "pixi.js";\nexport const app = Application;\n',
  ),
  allowed(
    "main uses electron",
    MAIN_FILE,
    'import { app } from "electron";\nexport const name = app;\n',
  ),
  allowed(
    "main uses Node built-ins",
    MAIN_FILE,
    'import { join } from "node:path";\nexport const joined = join;\n',
  ),
  allowed(
    "preload uses electron",
    PRELOAD_FILE,
    'import { ipcRenderer } from "electron";\nexport const bus = ipcRenderer;\n',
  ),
  allowed("shared uses zod", SHARED_FILE, 'import { z } from "zod";\nexport const schema = z;\n'),
];

describe("game layer lint rules", () => {
  let eslint: ESLint;

  beforeAll(() => {
    eslint = createProbeLinter([
      SHARED_FILE,
      MAIN_FILE,
      PRELOAD_FILE,
      STORE_FILE,
      UI_FILE,
      SCENE_FILE,
      RENDERER_FILE,
    ]);
  });

  describe("violations must fail the lint", () => {
    it.each(MUST_FAIL)("$name", async ({ file, code, ruleId }) => {
      expect(await reportedRules(eslint, file, code)).toContain(ruleId);
    });
  });

  describe("allowed code must not trigger the rule", () => {
    it.each(MUST_PASS)("$name", async ({ file, code, ruleId }) => {
      expect(await reportedRules(eslint, file, code)).not.toContain(ruleId);
    });
  });
});
