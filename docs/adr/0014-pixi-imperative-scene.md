# 0014. PixiJS scene driven imperatively, without `@pixi/react`

- Status: Accepted
- Date: 2026-10-23

## Context

`AGENTS.md` 5.2 and 9.4 require that the scene contains no game logic, observes the state and cleans up its resources.
The UI is React and the scene is PixiJS (8.22 at the time of writing). `@pixi/react` 8 lets components declare Pixi objects in JSX,
but its last release dates from December 2025, and it makes the scene a React tree: its updates then follow React's render cycle.
A pixel scene needs full control of its own frame loop, decoupled from the simulation ([ADR 0010](0010-pixel-rendering-and-scaling.md)).

## Decision

The scene is a plain TypeScript module (`game/renderer/scene`) that creates and owns the Pixi `Application`.
A single React component mounts it into a container element and disposes it on unmount.
The scene subscribes to the store through the vanilla Zustand API ([ADR 0006](0006-ui-state-zustand.md)) and updates its display objects from state changes.
It never calls the core to change state: user input goes through the React UI as commands.

## Alternatives considered

- **`@pixi/react`.** Convenient for declarative scenes, but couples Pixi rendering to React reconciliation, adds a dependency with a single maintainer cadence, and makes per-frame allocations and ticker control less explicit.
- **No React at all for the scene and the UI.** Rejected: the UI (menus, sliders, charts) is a good fit for React ([AGENTS.md](../../AGENTS.md) section 4).

## Consequences

- We manage object lifecycles ourselves (create, update, destroy). Lifecycle tests and a disposal checklist are part of the scene work (M5).
- The scene can be tested and developed without React.
- Every PixiJS API use must be checked against the current Pixi documentation.
