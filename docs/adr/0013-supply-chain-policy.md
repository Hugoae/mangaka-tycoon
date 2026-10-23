# 0013. Supply-chain policy for dependencies

- Status: Accepted
- Date: 2026-10-23

## Context

AI-assisted development can suggest packages that do not exist, are abandoned, or have just been compromised.
Most malicious releases are detected and removed within days. `AGENTS.md` also asks that no dependency is added without justification.

## Decision

Configured in `pnpm-workspace.yaml`:

- `minimumReleaseAge: 4320` (3 days). Because the value is explicit, strict mode is on: a version that is too fresh fails resolution.
- `strictDepBuilds: true` with an explicit `allowBuilds` list. A dependency's install script runs only if it is listed with a reason
  (expected entries: `electron`, `esbuild`).
- `engineStrict: true`, with `engines` set for Node and pnpm.
- The package manager is pinned in `packageManager`, and the lockfile is committed.
- `pnpm` stays on the 11.x line for now; moving to 12 is a deliberate step.

Process rules:

- Before adding a dependency: check it exists on the registry, its last release date, maintainers, licence and size; justify it in the commit or an ADR.
- Prefer small hand-written code over a dependency for trivial needs.
- A monthly review covers updates, advisories (`pnpm audit`), and the triggers in [ADR 0011](0011-electron-vite-and-exit-strategy.md).

## Alternatives considered

- **`trustPolicy: no-downgrade`.** Blocks versions whose publish trust level dropped, a useful signal against hijacked packages,
  but it can reject legitimate installs. Left disabled for now; revisit once the dependency set is stable.
- **Shorter or longer delay.** One day gives little protection; seven days would force older versions of fast-moving tools such as Electron.

## Consequences

- Brand new releases are not installable for 3 days, including security fixes.
  For an urgent fix, add a time-boxed `minimumReleaseAgeExclude` entry with a comment and a removal date.
- Every allowed build script is an explicit, reviewable line.
