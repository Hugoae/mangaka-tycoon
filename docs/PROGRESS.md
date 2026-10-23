# Progress

Relay file between work sessions. Updated at the end of every task.
Source of truth for rules and vision: [`AGENTS.md`](../AGENTS.md).

## Current state

- **Phase**: Task 1 (architecture review and foundations), Phase B in progress.
- **Phase A**: review validated by Hugo on 2026-10-23.

## Decisions validated in Phase A

| Topic                | Decision                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| TypeScript           | Pinned to `~6.0.x` everywhere (typescript-eslint does not support TS 7 yet).                                                   |
| Content format       | JSONC (comments allowed), read with `jsonc-parser`.                                                                            |
| Electron             | Latest 44.x (not 45, for consistency with `minimumReleaseAge`). Upgrade to 45 in a few weeks.                                  |
| Dependency direction | `core` defines the types it consumes; `content` imports them (types only). `core -> nothing`, `content -> core (types) + zod`. |
| Immutability         | `immer`.                                                                                                                       |
| PRNG                 | `sfc32`, one stream per `(week, system)` derived from the seed.                                                                |
| UI store             | Zustand 5.                                                                                                                     |
| i18n                 | i18next + react-i18next.                                                                                                       |
| Platform access      | `PlatformApi` interface, implemented through the Electron preload.                                                             |
| Protocol             | Custom `app://` protocol in production (no `file://`).                                                                         |
| Internal resolution  | 640x360, integer scaling only, borderless fullscreen by default.                                                               |
| Calendar             | 48 weeks per year, 4 weeks per month (option B).                                                                               |
| Scaling              | `force-device-scale-factor=1`; pixel-perfect rendering must be verified at 100%, 125% and 150% Windows scaling.                |
| Licence              | Proprietary, all rights reserved.                                                                                              |
| Repository           | https://github.com/Hugoae/mangaka-tycoon                                                                                       |

## Open design questions (to settle with Hugo before M3, never guess)

- How does a series start (pitch to the publisher, acceptance)?
- Parallel series in the MVP?
- Chapters per volume, volume release rhythm, meaning of "monthly sales".
- What happens after December 1989 with a single era?
- Is there a lose condition (bankruptcy, game over)?

## Done

- Phase A review.
- Commit 1: repository initialisation (pushed to `origin/main`).
- Commit 2: pnpm workspace.
  - pnpm pinned to `11.28.6` through `packageManager` (Corepack downloads it automatically).
    pnpm 12.15.0 exists; staying on the 11.x line the machine already uses. Upgrade is a separate, deliberate step.
  - `minimumReleaseAge: 4320` (3 days, strict), `strictDepBuilds: true`, `allowBuilds: {}` (each allowed build will be listed with its reason), `engineStrict: true`.
  - Packages: `@mangaka/core`, `@mangaka/content`, `@mangaka/game`, `@mangaka/tools` (empty `index.ts`).
  - The dependency graph of section 5.2 is encoded in the `package.json` files, so pnpm's strict layout enforces it:
    `core -> nothing`, `content -> core`, `game -> core, content`, `tools -> core, content`.
  - `core` and `content` expose only `"."` in `exports`: deep imports fail with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
    Workspace packages export their TypeScript source directly (no build step between packages).

- Commit 3: TypeScript configuration.
  - `typescript@~6.0.3` at the root; `@types/node@~24.19.2` in `tools` only.
  - `tsconfig.base.json`: all options of AGENTS.md 9.1, plus `noImplicitReturns`, `noUnused*`, `noPropertyAccessFromIndexSignature`,
    `verbatimModuleSyntax`, `isolatedModules`, `erasableSyntaxOnly` (no enums or namespaces, compatible with Node type stripping), `types: []`.
  - Project references (`tsc -b`, declarations only, output in git-ignored `dist/`). `pnpm typecheck` passes with no output.
  - `core` and `content`: `lib: ["ES2023"]`, `types: []`. `window`, `document`, `process`, `setTimeout` do not exist there at compile time.
  - Verified with a throw-away file in `core`: 8 expected errors (DOM, Node, unchecked index, enum, exact optional, missing return). The file was deleted.
    This manual probe becomes an automated test with the lint boundary tests.

- Commit 4: 13 ADRs in `docs/adr/` (index in `docs/adr/README.md`), one per decision:
  TypeScript 6.0, JSONC, package dependency direction, immer, sfc32 derived streams, Zustand, i18next, PlatformApi,
  Electron 44 + `app://`, 640x360 scaling, electron-vite exit strategy, 48-week calendar, supply-chain policy.
  - ADR 0003 refines `AGENTS.md` 5.2 (`content -> core` for types).
  - ADR 0005 stores only the seed in saves (streams are derived from seed, week and system), which replaces "serialise the PRNG state" of 5.3.2 with an equivalent guarantee.
- Commit 5: `AGENTS.md` aligned with the validated decisions (5.2 dependency graph, 5.3.2 RNG, 5.3.4 immer, JSONC and `balance.jsonc`,
  48-week calendar, 640x360, version policy exceptions). Resolved questions removed from section 14.
  - ADR 0010 stays "pending verification" until the skeleton proves pixel-perfect rendering at 100%, 125% and 150%.

- Commit 6: ESLint, Prettier, Husky, lint-staged.
  - ESLint 10 flat config (`eslint.config.js`): `typescript-eslint` `strictTypeChecked` + `stylisticTypeChecked`, `reportUnusedDisableDirectives: error`,
    `--max-warnings 0`. Bans: `as` assertions (`as const` allowed), `any`, `!`, `@ts-ignore`, default exports, `console`, files over 300 lines.
    Disable comments need a description and a matching enable (`eslint-comments`).
  - `core`: forbidden imports (react, pixi, electron, zustand, i18next, all Node built-ins, `@mangaka/*`), forbidden globals (`Date`, `window`, `process`, `fetch`, ...),
    `Math.random`, classes. `core/src/systems`: `no-magic-numbers` (0, 1, -1 allowed). `content`: no DOM/Node imports.
  - `eslint-plugin-boundaries` (7.2.0, as 7.2.1 and 7.3.0 are younger than 3 days): allow-list in `eslint/boundaries.js`
    (core -> immer, zod; content -> zod, jsonc-parser, types of core; nothing imports game or tools).
    Lessons learned: the plugin only checks local files unless `checkAllOrigins: true`, and it classifies `@mangaka/*` imports as _external_ modules.
  - Verified with throw-away files (deleted): every rule above fires. Boundaries policies were first silent, and fixed after this check.
  - Prettier (`printWidth: 100`, `endOfLine: lf`), `AGENTS.md` excluded. The whole repository was formatted (this also fixes CRLF in the working tree).
  - Husky: `pre-commit` runs lint-staged then `pnpm typecheck`; `commit-msg` rejects non Conventional Commits messages (no extra dependency).
  - Scripts: `pnpm lint`, `pnpm format`, `pnpm format:check`, `pnpm typecheck`.

- Commit 7: Vitest 5.
  - `pnpm test`, `pnpm test:watch`, `pnpm test:coverage`. Config in `vitest.config.js` (tests live next to the code, `*.test.ts`).
  - Coverage (v8) restricted to `packages/core/src`, thresholds 90% (statements, branches, functions, lines). Files without code (empty `index.ts`) count for nothing.
    Verified: an untested function in `core` makes `pnpm test:coverage` fail.
  - `tools/src/lint-rules.test.ts`: 25 tests that lint probe code from text (nothing written to disk) with the real `eslint.config.js`.
    19 violations must be reported by the expected rule; 6 allowed cases must not trigger it. Fatal parser errors fail the test, so a case cannot pass for the wrong reason.
    Verified by sabotage: setting `checkAllOrigins: false` makes 4 boundary tests fail. This covers the "boundary rules really break" test of section 11.2, point 9.
  - `pre-commit` now runs lint-staged, `pnpm typecheck` and `pnpm test`.

- Commit 8: GitHub Actions CI (`.github/workflows/ci.yml`).
  - Runs on push to `main` and on pull requests, on Ubuntu and Windows (`fail-fast: false`). Steps: install (`--frozen-lockfile`), `format:check`, `lint`, `typecheck`, `test:coverage`.
  - Actions pinned by commit SHA (`actions/checkout` v7.0.1, `actions/setup-node` v7.1.0), `permissions: contents: read`, concurrency cancels superseded runs, 15 minute timeout.
  - pnpm comes from Corepack (`packageManager` field), no third-party action. No dependency cache yet (install takes seconds).
  - No `build` step yet: there is nothing to build until the Electron skeleton exists. It is added then, and the CI must be extended.

- Commit 9: CI runner images pinned (`ubuntu-24.04`, `windows-2025`) instead of `*-latest`, which moves to Ubuntu 26.
- Commit 10: Cursor rules and ADR 0014.
  - `.cursor/rules/`: `architecture`, `typescript`, `core`, `content-and-mods`, `react`, `pixi`, `electron`, `tests`, `git-commits`, `game-design`.
    Each rule is short (under 35 lines), scoped by `globs` (`git-commits` is requested by the agent on demand), and points to `AGENTS.md` and the ADRs, which stay the source of truth.
  - ADR 0014 records the decision to drive PixiJS imperatively without `@pixi/react` (validated in Phase A, but not yet written down).

- Commit 11: `.cursor/rules/language.mdc`, always applied. Rules stay in English but state that replies to Hugo are always in French
  (code, identifiers, comments, commits and technical docs stay in English).

- Commit 12: `docs/ARCHITECTURE.md`. Five mermaid diagrams: packages and dependency direction, command to event flow, weekly tick,
  Electron layers (main, preload, renderer), content loading and saves. Plus a table of how each rule is enforced.
  - It summarises the ADRs and introduces no decision. Items not built yet are marked `planned`.
  - The order of systems inside a tick is explicitly left open (M3, Hugo decides). The diagram is a flow, not a specification.
  - Diagrams checked with the real mermaid 11 engine (parse and render), not only by eye.

- Commit 13: minimal core for the skeleton (`packages/core`), no gameplay.
  - `calendar` (ADR 0012: zero-based `WeekIndex`, `weekToDate`, `isMonthEnd`), `GameState = { version, seed, week }` with `createNewGame`,
    `GameEvent` (`weekAdvanced`, carries an i18n key and params), `Command` (`advanceWeek`) with `applyCommand`, `advanceWeek` through immer (output frozen).
  - Decisions taken with Hugo: `advanceWeek(state)` has **no `content` parameter yet** (added with the first system that needs it, to avoid an invented placeholder type);
    **no RNG yet** (sfc32 arrives with M1), so the "deterministic for a seed" test checks purity and reproducibility, not random draws.
    The seeded determinism test must be added with the PRNG.
  - Calendar tested exhaustively over all 1,920 weeks of 40 years against an independent walk (the domain is finite, so no `fast-check` needed yet).
  - `immer` added to `core` (ADR 0004). 46 tests, 100% coverage on `core`.
  - `assertNever` receives `command.kind`, because TypeScript does not narrow a single-member union itself.
    One justified `eslint-disable` in `applyCommand` (single-member union): it turns into a lint error by itself as soon as a second command exists, and must then be removed.

- Commit 14: `game` package scaffold (electron-vite 6, Electron 44.9.2, Vite 8.3.4, React 19.3.1). Window opens and React renders (checked on the built app through CDP).
  - Plan for the whole skeleton validated with Hugo: i18next wired now (ADR 0007), `electron-builder` deferred to M6, windowed 1280x720 in dev and borderless fullscreen in production.
  - `game` tsconfig split in `tsconfig.node.json` (main, preload, shared, build config) and `tsconfig.web.json` (renderer, shared), tied by a solution `tsconfig.json`.
  - Root scripts: `pnpm dev`, `pnpm build`, `pnpm start` (build then run the production bundle).
  - Findings: (1) electron-vite 6 emitted the preload as ES module `index.mjs`, which a sandboxed preload cannot load: format forced to CommonJS `index.cjs`, ADR 0011 amended.
    (2) `pnpm` flagged an Electron build script; it is explicitly denied (`allowBuilds: electron: false`) and works: the binary downloads on first launch, checked against `checksums.json`.
    (3) electron-vite builds the renderer unminified by default; left as is, to review at M6.
  - Main still loads the page with `loadFile` (transitional): `app://` replaces it in the next commit.

- Commit 15: `app://` protocol and security baseline in the main process (`packages/game/src/main`).
  - `protocol/app-url.ts` (pure): maps `app://game/...` to a file inside the renderer root, refuses foreign scheme or host, NUL bytes, bad escapes and any path leaving the root.
    `protocol/app-protocol.ts` registers the scheme (standard, secure, fetch) and serves files with the production CSP.
  - `security/csp.ts` (pure): `default-src 'none'`, scripts and connections `'self'`, no `unsafe-eval`, no inline script, no framing. Dev adds only the dev server origin and inline script/style for hot reload.
    `security/navigation-policy.ts` + `install-security.ts`: navigation only inside the app, no new window, no webview, all browser permissions denied.
  - `window.ts`: borderless fullscreen in production and `pnpm start`, 1280x720 window in `pnpm dev`, F11 toggles. `force-device-scale-factor=1` is set in `index.ts`.
  - 40 unit tests (path traversal, CSP, navigation). Verified by sabotage: neutralising the root check makes 5 traversal tests fail.
  - Verified on the running app through the DevTools protocol (production): served from `app://game/index.html`, `eval` and inline script blocked, CSP header present,
    traversal refused (403), missing file 404, remote fetch blocked, `window.open` returns null, navigation to an external site refused, no `require`/`process` in the page.
    Dev mode: same except inline script allowed by design.
  - Findings: (1) `net.fetch` of a missing file rejects and also emits an unhandled error that aborts the response (`ERR_UNEXPECTED`): the handler checks the file with `stat` first.
    (2) A DevTools `Runtime.evaluate` bypasses the page CSP unless `allowUnsafeEvalBlockedByCSP: false` is passed: my first `eval` test was a false negative.
  - Not verified automatically: F11 (injected key events do not go through the main-process input hook). To check by hand.

- Commit 16: `PlatformApi` v0, preload and validated IPC.
  - `shared/ipc.ts`: typed endpoints (channel + zod request and response schemas), `callEndpoint` (validates before sending and after receiving) and `createValidatedHandler` (validates on the main side).
    `shared/platform-api.ts`: `PlatformApi` (`getAppInfo`, `setFullscreen`) and its IPC contract. Saves, mods and settings come with their milestones.
  - `preload/`: `createPlatformApi(invoke)` (pure, tested with a fake host) and the `contextBridge` exposure as `window.platform`. Nothing else is exposed (no `ipcRenderer`, no `electron`).
  - `main/ipc/register-ipc.ts`: every call must come from the main frame of an app page (`app://game`, or the dev server in `pnpm dev`), then goes through schema validation.
    `security/navigation-policy.ts`: `isUrlOfApp` (renamed from `isAllowedNavigation`, now also used for IPC senders) and `allowedOriginsFor`.
  - `renderer/platform/platform.ts`: `getPlatform()` (the renderer only knows the interface; it fails loudly if the preload did not run).
  - `window.ts` now reports a failing preload on stderr (`preload-error`).
  - `zod` added to `game` (devDependency, bundled). 106 tests in total.
  - Verified on the built app through the DevTools protocol: `window.platform` has exactly `getAppInfo` and `setFullscreen`; app info returned; a wrong argument is rejected before it is sent;
    `setFullscreen(false/true)` really toggles the window (784x535 windowed, 1920x1080 fullscreen).
  - **Open point**: on the very first run after a fresh build, `window.platform` was missing once, with no error reported. It did not reproduce in 5 further launches
    (all fine, `preload-error` silent), and I could not explain it. If it shows up again, the `preload-error` message on stderr is the first thing to read.

- Commit 17: `test(game)` fix for POSIX (3ed6cc3). CI was red on Ubuntu for two commits: the test helper `isInsideRoot` used `startsWith("..")`, which misjudges `..\..\x`
  (a plain file name on POSIX). It is now segment-based, like the code under test. Lesson: wait for CI before moving on.

- Commit 18: store, i18n and React shell (Electron skeleton, step 4).
  - `renderer/store/`: vanilla Zustand store `{ game, lastEvents, dispatch }` wrapping the core. It is the only renderer module allowed to call `applyCommand` / `createNewGame`.
    `selectors.ts` returns primitives or existing references only (Zustand 5 loops on selectors that build new objects). `GameStoreProvider` / `useGameStore` expose it to React.
  - `renderer/i18n/`: i18next instance (`createI18n`, fr by default, en fallback), `locales/fr.json` and `en.json`, typed keys (`i18next.d.ts`: an unknown key is a compile error),
    `monthName` through `Intl`. English must have the keys of French at compile time, and a test checks keys, empty texts and placeholders both ways.
  - `renderer/ui/hub/`: `HubScreen` (presentational, props only) and `ConnectedHub` (store + i18n; the core counts from 0, the UI shows +1). `styles.css` is placeholder styling (CSP-safe external file).
  - `main.tsx`: picks the seed with `crypto.getRandomValues` (entropy stays outside the core) and mounts the providers.
  - Lint: `eslint/game-layers.js` gives every `game` layer its own `no-restricted-imports` block (options are replaced, not merged, so each file belongs to exactly one block):
    shared / main+preload / renderer store / renderer ui / rest of renderer. Forbidden: `applyCommand`, `advanceWeek`, `createNewGame` outside the store (namespace imports included),
    `electron` and Node built-ins in the renderer and shared, React/Pixi/Zustand/i18next in main, preload and shared, Pixi and the scene in the UI, main/renderer cross imports, `electron-vite` anywhere in `src`.
  - `tools/src/game-layer-rules.test.ts` (19 must-fail, 8 must-pass cases); the ESLint harness moved to `tools/src/lint-harness.ts` (the single test file would have exceeded 300 lines).
    Sabotage check: removing the engine-call restriction makes 5 of those tests fail.
  - 156 tests in total. `tsconfig.web.json` now uses the `vite/client` types (CSS import) and includes the JSON locale files.
  - Verified on the built app through the DevTools protocol: "Janvier 1980 · semaine 1" at start; 5 clicks give "Février 1980 · semaine 2"; 49 clicks give "Janvier 1981 · semaine 2";
    the event message shows; the stylesheet loads under the strict CSP (no console error). Screenshot: `docs/verification/step4-hub.png`.
  - Event text carries no number on purpose: `WeekAdvancedEvent.params.week` is the 0-based absolute index and i18n cannot add 1. Decide what an event shows when real events arrive.

- Commit 19: Pixi scene, integer-scale stage and `build` in CI (Electron skeleton, steps 5 and 6).
  - `renderer/stage/integer-scale.ts`: `computeIntegerScale` (1280x720 -> 2, 1366x768 -> 2, 1920x1080 -> 3, 2560x1440 -> 4, 3840x2160 -> 6; never below 1; invalid sizes -> 1).
    `Stage` centres the 640x360 area, exposes `--scale` through the CSSOM (an inline style attribute would need `unsafe-inline`), and fills the letterbox with a pattern. Layouts are written in game pixels (`var(--px)`).
  - `renderer/scene/`: plain-TypeScript Pixi scene (ADR 0014): `createGameScene(host, store)` observes the store, never calls the core; `sceneViewOf` is the pure state-to-view mapping (tested).
    Placeholder art is coloured rectangles (`Texture.WHITE` sprites). `pixi.js/unsafe-eval` is imported first because the CSP forbids `eval`. `stage/scene-host.tsx` mounts and disposes it (StrictMode-safe).
  - Dev window uses `useContentSize` so the 1280x720 content area gives x2 instead of x1.
  - Lint: new `scene` block (Pixi allowed; no React/Zustand/i18n/UI, no engine calls); 5 more probe cases.
  - CI now runs `pnpm build` on Ubuntu and Windows.
  - Verified on the built app: 1920x1080 viewport gives scale 3, a 640x360 canvas displayed at 1920x1080, WebGL2 active, no console or CSP error, the figure moves one step per week. Screenshot: `docs/verification/step5-scene.png`.

## Open technical points

- Scene rules (Pixi allowed, no `applyCommand`, types only from core) come with the Pixi scene (step 5): today the "rest of renderer" block applies to `scene/`.
- Naming conventions (kebab-case files) are not enforced yet; adding `eslint-plugin-unicorn` for `filename-case` needs a justification (dependency size).

- `tools` will run TypeScript on Node or through a runner (`tsx` / Vite). Relative imports are extensionless for now (bundler resolution);
  decide with the simulation bot (M3) whether to run through a bundler-aware runner or require `.ts` extensions.

## Next step

Electron skeleton (section 11.2, point 8), one green light per step:

- Step 5: Pixi scene 640x360 with `computeIntegerScale` (tests: 1366x768 -> 2, 1920x1080 -> 3, 2560x1440 -> 4, 3840x2160 -> 6, edge cases), imperative scene (ADR 0014),
  placeholder sprite generated by code, `pixi.js/unsafe-eval` import (CSP), scene observes the store and never calls `applyCommand`. Add the scene lint block.
- Step 6: `build` step in CI (Ubuntu and Windows).
- Step 7: pixel-perfect verification at 100%, 125% and 150% Windows scaling (needs Hugo to change the Windows scale), CDP script in `tools`, screenshots in `docs/verification/`, ADR 0010 status.
