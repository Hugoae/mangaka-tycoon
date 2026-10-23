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

## Next step

- Commit 3: TypeScript configuration (`tsconfig.base.json`, project references, `core` without DOM/Node types, TypeScript pinned to `~6.0.3`).
