# 0001. TypeScript pinned to 6.0

- Status: Accepted
- Date: 2026-10-23

## Context

`AGENTS.md` asks for the latest stable versions. On 2026-10-23 the latest TypeScript is 7.0.2 (the native compiler).
`typescript-eslint` 8.72 declares the peer range `typescript >=4.8.4 <6.1.0`, so TypeScript 7 cannot be used with our lint setup.

## Decision

Pin TypeScript to `~6.0.3` in the root `package.json`, for typecheck, lint and editor alike.
Re-evaluate when `typescript-eslint` supports TypeScript 7.

## Alternatives considered

- **TypeScript 7 for the typecheck, 6 for lint.** Rejected: two compilers can disagree, and the day they do,
  a green typecheck would not mean a green lint.
- **TypeScript 7 and no type-aware lint.** Rejected: type-aware rules (`no-floating-promises`, `no-unsafe-*`) are a main guard rail against AI-assisted mistakes.

## Consequences

- Slower compiler than TypeScript 7 until the migration. Acceptable at this project size.
- The migration is a dedicated task: bump, run `tsc -b`, run lint, fix, and write a superseding ADR.
- Reviewing `typescript-eslint` release notes is part of the monthly dependency review.
