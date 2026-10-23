# 0004. Immutable state updates with immer

- Status: Accepted
- Date: 2026-10-23

## Context

`GameState` is plain JSON and every system returns a new state. A headless bot must simulate 1,920 weeks
(40 years x 48 weeks, see [ADR 0012](0012-calendar-48-weeks.md)) quickly, and the UI needs cheap change detection.

## Decision

Use **immer** (`produce`) inside `core` systems. Rely on structural sharing: untouched branches keep the same reference.
Auto-freeze is enabled in development and tests so accidental mutation throws instead of corrupting state silently.
The state contains no `Map` or `Set` (see `AGENTS.md` 5.3.3), so no immer plugin is needed.

## Alternatives considered

- **`structuredClone` per tick.** Copies the whole state every tick, shares nothing, and `structuredClone` is not part of the
  ES library (it comes from DOM/Node typings), which conflicts with [ADR 0003](0003-package-dependency-direction.md).
- **Mutative.** Faster, API-compatible, but performance is not a constraint at our scale and immer is the better known option.
- **Hand-written spreads.** Error-prone on nested state; one missed spread is a silent mutation.

## Consequences

- One pure runtime dependency in `core`.
- Selectors and React can compare references (`===`) to skip work.
- The `history` array grows with every tick; keep it small in the MVP and decide its granularity with the stats screen (v1).
