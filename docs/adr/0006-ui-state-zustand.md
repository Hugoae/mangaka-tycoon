# 0006. Zustand for UI state

- Status: Accepted
- Date: 2026-10-23

## Context

The renderer needs a store that holds the current `GameState`, exposes a single entry point to send commands to the core,
and can be observed by both React and the PixiJS scene (which is not a React component).

## Decision

Use **Zustand 5**.

- One `dispatch(command)` action: it calls the core, replaces the game state and appends the returned `GameEvent`s.
- Game state and purely visual UI state (open panel, selected tab) live in separate slices.
- The scene subscribes through the vanilla API (`store.subscribe`), outside React.
- Components read through selectors of the core. Selectors that build new arrays or objects must be memoised or wrapped with `useShallow`,
  otherwise they re-render on every update.

## Alternatives considered

- **Redux Toolkit.** More ceremony than needed for a single command channel.
- **Custom store on `useSyncExternalStore`.** About forty lines and zero dependency. A valid fallback if Zustand is ever abandoned.
- **React context + reducer.** Not observable from Pixi without extra plumbing, and re-renders broadly.

## Consequences

- Small, maintained dependency.
- The UI never mutates state: it can only call `dispatch`.
- Replacing Zustand later stays cheap because only `store/` knows about it.
