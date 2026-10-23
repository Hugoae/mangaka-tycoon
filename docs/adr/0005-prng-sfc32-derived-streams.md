# 0005. sfc32 PRNG with one stream per (week, system)

- Status: Accepted
- Date: 2026-10-23

## Context

The simulation must be deterministic: same seed and same inputs give the same result. `AGENTS.md` 5.3.2 asks for a seeded,
restorable PRNG whose state is saved.

A single shared stream has a known weakness: adding or removing one draw in one system (say, random events) shifts every later draw
in every other system. Bot runs stop being comparable between two balance versions, and bugs become hard to reproduce.

## Decision

- Algorithm: **sfc32** (four 32-bit words), implemented by hand (about fifteen lines) and tested against reference vectors.
  Its state is plain JSON.
- **One stream per `(week, systemId)`.** The state of a stream is derived by hashing `(seed, week, systemId)` into four words,
  with a well-known integer mixer. Systems never share a stream.
- Because a stream is a pure function of `(seed, week, systemId)`, the save file only needs the `seed`: loading and resuming
  reproduces the exact same draws. This provides the guarantee of 5.3.2 without serialising live generator state.
- Draws made outside the weekly tick (for instance new-game generation) use a named stream with a fixed key.
- Core code never calls `Math.random()` (blocked by lint).

## Alternatives considered

- **mulberry32.** Simpler, but a single 32-bit state and weaker statistical quality.
- **pure-rand / seedrandom.** Maintained, but one more dependency for fifteen lines, and not designed around derived streams.
- **One global stream with saved state.** Works, but has the fragility described above.

## Consequences

- Systems can evolve independently without perturbing each other's randomness.
- A test must cover: same seed gives same output; different systems get different streams; a run interrupted by save and load equals an uninterrupted run.
- The hash quality matters: weak mixing would correlate neighbouring weeks. Tests include a basic uniformity check.
- A system that must draw a variable number of values per week is still safe, since its stream is private.
