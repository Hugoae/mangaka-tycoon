# 0002. JSONC as the content format

- Status: Accepted
- Date: 2026-10-23

## Context

All game content is data (themes, genres, eras, works, talents, events, balance), validated by zod.
`AGENTS.md` requires `TODO(balance)` comments inside `balance.json`, which plain JSON cannot hold.
Mod authors also benefit from commenting their data.

## Decision

Content files are **JSONC** (JSON with comments and trailing commas), with the `.jsonc` extension, parsed with `jsonc-parser`
(the parser used by VS Code). Parse errors report file, line and column.
Comments are discarded at load time: they are documentation for humans, never data.

## Alternatives considered

- **Plain JSON with a `"$comment"` field.** Rejected: noisy to write, and every schema must tolerate the field.
- **YAML.** Rejected: implicit typing pitfalls (`no` becoming `false`), and a heavier parser.
- **TOML.** Rejected: weaker tooling and awkward for deeply nested data.
- **TypeScript files.** Rejected: contradicts the "data only, no code in mods" rule.

## Consequences

- One small dependency (`jsonc-parser`), vetted under [ADR 0013](0013-supply-chain-policy.md).
- Editors need a file association (`*.jsonc`) for schema-aware completion; JSON Schemas can be generated from the zod schemas later.
- Locale files (`fr`, `en`) stay plain JSON: they are consumed by i18next as-is.
