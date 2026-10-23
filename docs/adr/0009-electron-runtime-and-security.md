# 0009. Electron 44, `app://` protocol and security baseline

- Status: Accepted
- Date: 2026-10-23

## Context

Electron gives the same Chromium on every platform (a requirement of `AGENTS.md`). Electron 45.0.0 was published on 2026-10-23,
the same day as this decision. Our supply-chain policy ([ADR 0013](0013-supply-chain-policy.md)) refuses versions younger than 3 days.

## Decision

- **Electron 44.x**, the latest 44 release that satisfies the 3-day policy at install time, with the exact version recorded in the lockfile.
  Move to Electron 45 in a few weeks, as a dedicated task.
- **No `file://` in production.** The main process registers a custom `app://` protocol with `protocol.handle` for the renderer.
  This gives a stable origin for the content security policy and `fetch`, and leaves room for a `mod://` protocol for mod assets.
  It also avoids fragile `file://` behaviour, which matters for a later Steam build.
- Security baseline: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` when possible, a strict content security policy,
  navigation and `window.open` denied by default, and the renderer talking to the system only through the preload ([ADR 0008](0008-platform-api.md)).
- Saves and settings live under `app.getPath("userData")`.

## Alternatives considered

- **Tauri.** Smaller binaries, but it uses the system WebView: WebKit on macOS, WebKitGTK on Linux (including Steam Deck), where WebGL performance and behaviour differ.
  This contradicts "identical behaviour on every platform".
- **Electron 45 now.** Rejected for the release-age policy only; no known technical blocker.

## Consequences

- Larger install size than a WebView-based runtime; acceptable for a desktop game.
- Electron releases are frequent: the monthly dependency review must include Electron and security advisories.
- Every Electron major upgrade needs a smoke test of the pixel-perfect rendering ([ADR 0010](0010-pixel-rendering-and-scaling.md)).
