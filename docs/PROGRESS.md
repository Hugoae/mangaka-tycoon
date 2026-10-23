# Progress

Relay file between work sessions. Updated at the end of every task.
Source of truth for rules and vision: [`AGENTS.md`](../AGENTS.md).

## Current state

- **Phase**: Task 1 (architecture review and foundations), Phase B in progress.
- **Phase A**: review validated by Hugo on 2026-10-23.

## Decisions validated in Phase A

| Topic | Decision |
|---|---|
| TypeScript | Pinned to `~6.0.x` everywhere (typescript-eslint does not support TS 7 yet). |
| Content format | JSONC (comments allowed), read with `jsonc-parser`. |
| Electron | Latest 44.x (not 45, for consistency with `minimumReleaseAge`). Upgrade to 45 in a few weeks. |
| Dependency direction | `core` defines the types it consumes; `content` imports them (types only). `core -> nothing`, `content -> core (types) + zod`. |
| Immutability | `immer`. |
| PRNG | `sfc32`, one stream per `(week, system)` derived from the seed. |
| UI store | Zustand 5. |
| i18n | i18next + react-i18next. |
| Platform access | `PlatformApi` interface, implemented through the Electron preload. |
| Protocol | Custom `app://` protocol in production (no `file://`). |
| Internal resolution | 640x360, integer scaling only, borderless fullscreen by default. |
| Calendar | 48 weeks per year, 4 weeks per month (option B). |
| Scaling | `force-device-scale-factor=1`; pixel-perfect rendering must be verified at 100%, 125% and 150% Windows scaling. |
| Licence | Proprietary, all rights reserved. |
| Repository | https://github.com/Hugoae/mangaka-tycoon |

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
  - ADR 0003 refines `AGENTS.md` 5.2 (`content -> core` for types). `AGENTS.md` has not been edited: awaiting Hugo's approval to align it.
  - ADR 0005 stores only the seed in saves (streams are derived from seed, week and system), which replaces "serialise the PRNG state" of 5.3.2 with an equivalent guarantee.
  - ADR 0010 stays "pending verification" until the skeleton proves pixel-perfect rendering at 100%, 125% and 150%.

## Open technical points

- `tools` will run TypeScript on Node or through a runner (`tsx` / Vite). Relative imports are extensionless for now (bundler resolution);
  decide with the simulation bot (M3) whether to run through a bundler-aware runner or require `.ts` extensions.
- `game/tsconfig.json` is a placeholder: split into main/preload (Node) and renderer (DOM) projects with the Electron skeleton.

## Next step

- Commit 5: ESLint (flat config, typescript-eslint strict, `core` restrictions, boundaries), Prettier, Husky + lint-staged.
- Then, in order of section 11.2: Vitest + coverage threshold, CI, Cursor rules, `docs/ARCHITECTURE.md`, Electron skeleton, smoke tests.
