# 0012. Calendar of 48 weeks per year

- Status: Accepted
- Date: 2026-10-23

## Context

One tick is one week. Magazine ratings are weekly and volume sales are monthly. A real calendar has months of 4 or 5 weeks,
which makes monthly revenue irregular and hard to read. `AGENTS.md` listed this as an open question.

## Decision

A **stylised calendar**: 4 weeks per month, 12 months, **48 weeks per year**. The game starts at week 0, January 1980.

With `week` a non-negative integer (`WeekIndex`):

- `year = 1980 + floor(week / 48)`
- `month = floor((week mod 48) / 4)` (0 to 11)
- `weekOfMonth = week mod 4` (0 to 3)
- the end of a month is the week where `weekOfMonth` is 3.

Calendar functions are pure and live in `core/calendar`, with exhaustive tests.

## Alternatives considered

- **Real calendar** (months of 4 or 5 weeks): realistic, but irregular monthly sales and awkward balance.
- **52 weeks split 4-4-5**: closer to a real year, but still irregular months.

## Consequences

- Monthly sales always aggregate exactly 4 weekly ratings, which is easy to explain in the UI.
- A year is shorter than a real year; the UI should show month and week of month, not weekday dates.
- 40 simulated years equal 1,920 ticks.
- Changing this later would affect saves; it would require a migration and a new ADR.
