# Architecture Decision Records

One file per significant decision: context, decision, alternatives, consequences.
ADRs are immutable once accepted. To change a decision, add a new ADR that supersedes the old one
and set the old one's status to `Superseded by NNNN`.

Rules and vision live in [`AGENTS.md`](../../AGENTS.md). ADRs record _why_ a choice was made.

## Template

```md
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context

## Decision

## Alternatives considered

## Consequences
```

## Index

| #                                                  | Title                                                   | Status                         |
| -------------------------------------------------- | ------------------------------------------------------- | ------------------------------ |
| [0001](0001-typescript-6.md)                       | TypeScript pinned to 6.0                                | Accepted                       |
| [0002](0002-jsonc-content-format.md)               | JSONC as the content format                             | Accepted                       |
| [0003](0003-package-dependency-direction.md)       | Package dependency direction and enforcement            | Accepted                       |
| [0004](0004-immutability-with-immer.md)            | Immutable state updates with immer                      | Accepted                       |
| [0005](0005-prng-sfc32-derived-streams.md)         | sfc32 PRNG with one stream per (week, system)           | Accepted                       |
| [0006](0006-ui-state-zustand.md)                   | Zustand for UI state                                    | Accepted                       |
| [0007](0007-i18n-i18next.md)                       | i18next for internationalisation                        | Accepted                       |
| [0008](0008-platform-api.md)                       | PlatformApi as the only door to the host                | Accepted                       |
| [0009](0009-electron-runtime-and-security.md)      | Electron 44, `app://` protocol and security baseline    | Accepted                       |
| [0010](0010-pixel-rendering-and-scaling.md)        | 640x360 internal resolution and integer scaling         | Accepted, pending verification |
| [0011](0011-electron-vite-and-exit-strategy.md)    | electron-vite and its exit strategy                     | Accepted                       |
| [0012](0012-calendar-48-weeks.md)                  | Calendar of 48 weeks per year                           | Accepted                       |
| [0013](0013-supply-chain-policy.md)                | Supply-chain policy for dependencies                    | Accepted                       |
| [0014](0014-pixi-imperative-scene.md)              | PixiJS scene driven imperatively, without `@pixi/react` | Accepted                       |
| [0015](0015-prototype-loop-and-content-loading.md) | Playable prototype loop and runtime content loading     | Accepted (values provisional)  |
