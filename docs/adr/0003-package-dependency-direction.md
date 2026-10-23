# 0003. Package dependency direction and enforcement

- Status: Accepted
- Date: 2026-10-23

## Context

`AGENTS.md` 5.2 says `core` depends on nothing internal "except types of content, via injection", and `content` depends only on zod.
This is ambiguous: the shape of data files (arrays per folder, before mod merging) is not the shape the simulation needs.
The domain must not depend on the disk format.

## Decision

1. **`core` defines the types it consumes** (a resolved, indexed `ContentDb`, `Balance`, ...).
2. **`content` imports those types from `core` (types only)**; its loader produces a `ContentDb`, and the compiler checks that
   zod outputs are assignable to the types `core` expects.
3. Allowed graph: `core -> nothing internal`; `content -> core (types)`; `game -> core, content`; `tools -> core, content`.
4. Pure libraries are allowed in `core` (`immer`, `zod` for save validation). The ban targets internal packages, UI, rendering,
   DOM, Node and I/O.
5. A single `content.loadPacks(rawPacks)` function validates, merges and cross-checks references (every `themeId` exists)
   for base content and mods alike. Only *reading files* differs by origin (bundled by Vite, read by the Electron main process, read by `fs` in tools).

Enforcement is layered, so no single tool is a point of failure:

- **pnpm strict layout**: a package can only import what its `package.json` declares.
- **`exports: { ".": ... }`** on `core` and `content`: deep imports such as `@mangaka/core/src/...` do not resolve.
- **`tsconfig` of `core` and `content`**: `lib: ["ES2023"]`, `types: []`, so DOM and Node globals do not exist at compile time.
- **ESLint**: `no-restricted-imports` (`react`, `pixi.js`, `electron`, `node:*`), `no-restricted-properties` (`Math.random`),
  `no-restricted-globals` (`Date`), and `eslint-plugin-boundaries` for the layers inside `game` (`ui`, `store`, `scene`).
- **A test** that proves the lint fails when a rule is violated.

## Alternatives considered

- **`core` depends on `content` for types.** Rejected: couples the domain to the file format.
- **A fifth package `@mangaka/types`.** Rejected for now: more indirection with no second consumer. Revisit if `core` types need to be shared with a third party.
- **`dependency-cruiser` instead of `eslint-plugin-boundaries`.** Better for cycles and graphs, but a second tool with a second config.
  `eslint-plugin-boundaries` gives in-editor feedback. Revisit if cycle detection becomes necessary.

## Consequences

- `content` has a type-only dependency on `core`; the loader's output type is owned by `core`.
- Adding a new content kind means: type in `core`, schema in `content`, data files, locale keys.
- The `AGENTS.md` wording of 5.2 is refined by this ADR, and `AGENTS.md` has been aligned.
