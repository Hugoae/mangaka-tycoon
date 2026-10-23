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

## Open technical points

- `boundaries` rules for the layers inside `game` (`ui`, `store`, `scene`, `main`, `preload`) are added with the Electron skeleton, once those folders exist.
- Naming conventions (kebab-case files) are not enforced yet; adding `eslint-plugin-unicorn` for `filename-case` needs a justification (dependency size).

- `tools` will run TypeScript on Node or through a runner (`tsx` / Vite). Relative imports are extensionless for now (bundler resolution);
  decide with the simulation bot (M3) whether to run through a bundler-aware runner or require `.ts` extensions.
- `game/tsconfig.json` is a placeholder: split into main/preload (Node) and renderer (DOM) projects with the Electron skeleton.

## Next step

- Commit 8: GitHub Actions CI (install, lint, typecheck, test with coverage, build).
- Then, in order of section 11.2: Cursor rules, `docs/ARCHITECTURE.md`, Electron skeleton (with `advanceWeek` and its determinism test), smoke tests.
