# 0011. electron-vite and its exit strategy

- Status: Accepted
- Date: 2026-10-23

## Context

Electron apps need three build targets (main, preload, renderer) and a packaging step.
`electron-vite` 6 wires the three targets on top of Vite (its peer range includes Vite 8) and `electron-builder` 26 handles packaging.
Electron Forge is the officially maintained alternative, but it is oriented towards Squirrel installers and auto-update, which matter little for a Steam release.

The main risk of `electron-vite` is a very small maintainer base. A build tool that nobody maintains would block Electron upgrades,
which are security-relevant. We therefore decide the exit plan _before_ adopting the tool.

## Decision

Adopt **electron-vite** (dev server, HMR, build of the three targets) and **electron-builder** (installers), with the rule that
**`electron-vite` stays a thin, replaceable layer**:

1. Its config file only declares entry points, aliases and the renderer plugins. No business logic, no custom plugin of our own inside it.
2. No source file imports from `electron-vite` or relies on its special import suffixes (such as `?asset`). Assets are referenced through our own helpers.
3. The `app://` protocol and the security baseline ([ADR 0009](0009-electron-runtime-and-security.md)) live in application code, not in build config.
4. `electron-builder` is configured by its own file and does not depend on `electron-vite`.
5. Output layout is documented here: `out/main/index.js`, `out/preload/index.js`, `out/renderer/**`.

### Exit plan

If a trigger below happens, replace `electron-vite` by plain tools **without changing application code**:

| Target           | Replacement                                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Renderer         | Plain **Vite** with the same plugins (React) and the same aliases; dev server on a local port; production build into `out/renderer`.                                           |
| Main and preload | **Vite library mode** (or `esbuild`) producing `out/main/index.js` and `out/preload/index.js` in ESM/CJS as required by Electron, with `electron` and Node built-ins external. |
| Dev loop         | A small script that starts the Vite dev server, builds main/preload in watch mode, and launches Electron pointing at the dev URL.                                              |
| Packaging        | Unchanged (`electron-builder`).                                                                                                                                                |

Estimated effort: one to two days, thanks to rules 1 to 4.

### Triggers

- No release for 6 months while Electron or Vite has a new major.
- A Vite or Electron upgrade we need is blocked for more than 4 weeks by `electron-vite`.
- An unpatched security issue in `electron-vite` or its dependencies.

## Alternatives considered

- **Electron Forge with its Vite plugin.** Official and maintained. Not retained because its packaging and update tooling targets installer-based distribution rather than Steam.
  Its Vite plugin maturity was not re-verified for this decision; revisit if `electron-vite` hits an exit trigger.
- **Hand-rolled Vite + esbuild from day one.** No third-party risk, but we would own a dev loop that `electron-vite` already provides.

## Consequences

- A short, reviewable build configuration.
- A tested exit plan is cheap insurance: the monthly dependency review checks the trigger conditions.
- If the exit is ever triggered, record it in a superseding ADR.
