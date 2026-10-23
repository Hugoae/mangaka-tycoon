# 0008. PlatformApi as the only door to the host

- Status: Accepted
- Date: 2026-10-23

## Context

The renderer must save, load, list mods and read settings, but it has no direct access to the system (Electron sandbox).
The target platform is not final: Steam on PC is expected, a browser build (itch.io) is possible.

## Decision

Define a typed `PlatformApi` interface (save slots, load, settings, mod pack discovery, window options).
Electron implements it through the preload script and `contextBridge`, with IPC payloads validated by zod on both sides
(the IPC contract lives in `game/src/shared`). The renderer imports only the interface, never `electron`.

A browser implementation (IndexedDB / `localStorage`) can be added later without touching the UI.
It also lets the renderer run in a plain browser during development.

## Alternatives considered

- **Call `window.electronAPI` directly from components.** Couples the UI to Electron and is hard to test.
- **A local HTTP server.** Unneeded attack surface.

## Consequences

- One small interface to mock in tests.
- Write atomically (temporary file, then rename) with a backup copy in the main-process implementation.
- Timestamps such as `savedAt` are set by the host implementation, never by the core.
