# 0015. Playable prototype loop and runtime content loading

- Status: Accepted (the loop and every number are provisional, see [PROTOTYPE.md](../PROTOTYPE.md))
- Date: 2026-10-23

## Context

The architecture was in place but nothing could be played. To judge the game, Hugo needs the smallest loop that
exercises the pillars of `AGENTS.md` section 1 (every result is explainable, the player chooses, risk is visible):
sliders, a magazine ranking, fans, monthly sales, fatigue, series cancellation and bankruptcy.

The game design is Hugo's, so the loop is deliberately naive and every value lives in the data files, not in code.

## Decision

**The loop (core).** Each week the player either publishes a chapter or rests.

- Five sliders (story, art, characters, worldbuilding, pacing) share an energy budget that shrinks with fatigue.
  Each slider is worth `weight * (points / max) ^ exponent` (diminishing returns), then multiplied by the year trend of the theme,
  the theme x audience and theme x art style fits, and a fatigue penalty. `evaluateChapter` returns the whole breakdown, not only the score.
- The chapter is ranked against the fictional series of the magazine. Their strength is a pure function of `(content, seed, week)`
  (`competitorScores`), drawn from a stream of its own ([ADR 0005](0005-prng-sfc32-derived-streams.md)): ranking a week twice gives the same result.
- The rank gives or takes fans. Three bad ranks in a row cancel the series. Resting recovers fatigue but loses fans.
- The last week of a month sells tomes (fans x tomes per fan x price) and pays the living costs. Negative money is bankruptcy.
- Read-only helpers (`previewChapter`, `expectedCompetitorStrengths`) let the UI show an estimate without duplicating any formula.

**Content loading (game).** The renderer reads the five `.jsonc` files at startup and validates them with `@mangaka/content`.

- `electron-vite` copies `packages/content/data` next to the page (`publicDir`), so the files are served as `/base/<file>.jsonc`
  by the `app://` protocol in production and by the Vite server in development. The CSP already allows `connect-src 'self'`.
- Data is **not bundled**: it stays editable text, and modders will later add folders next to `base/` without any build.
- `loadContent` never throws: a missing file, a syntax error or a wrong value becomes a list of readable lines
  (`balance.jsonc:12:3: ...`), and the app shows them on an error screen instead of a blank window.

**Boundaries.** The core API takes the content as a parameter (`applyCommand(state, command, content)`). The renderer store holds the content
and is still the only module calling the engine. The UI may call the read-only helpers above.

## Alternatives considered

- **Importing the JSONC through the bundler** (`?raw`, JSON plugin): rejected by [ADR 0011](0011-electron-vite-and-exit-strategy.md) (no build-tool-specific imports) and it would freeze the data into the bundle.
- **Reading the files in the main process and sending them over IPC:** more moving parts for no gain today. It will come back with the mod loader, which needs the disk.
- **A richer first loop** (fan decay, money sinks, several series): left out on purpose, these are design decisions. They are listed in [PROTOTYPE.md](../PROTOTYPE.md).

## Consequences

- Balancing is editing `packages/content/data/base/balance.jsonc` and restarting: no code change.
- A headless bot (`tools/src/balance-bot.ts`) plays whole careers with fixed strategies, so balance can be argued with numbers
  (`BALANCE_REPORT=1 pnpm exec vitest run tools/src/balance-report.test.ts`).
- Saves, migrations and the cumulative effect of a long career (snowballing money, no fan decay) are not handled yet.
