# Playable prototype

The smallest loop that can be played end to end. **Everything here is provisional**: it exists so that the game can be
judged and argued about, not because it is the design. Hugo owns the design; nothing below is a decision.
Rationale of the architecture: [ADR 0015](adr/0015-prototype-loop-and-content-loading.md).

## Run it

```bash
pnpm install
pnpm dev                      # development window, hot reload
# or, the real thing:
pnpm build && pnpm --filter @mangaka/game start
```

Balancing needs no code: edit `packages/content/data/base/*.jsonc`, then restart.

## What you can do

1. **Start a series**: title, theme (adventure, sport, comedy, combat), audience (shonen, seinen), art style (classic, cartoon, realistic). Chosen once.
2. **Each week**, spread energy over five sliders and **publish**, or **rest**.
   The planner shows the energy left, the estimated quality, what each slider is worth for the theme (the percentages), and the average strength of the magazine's series.
3. After publishing, the **report** (top left) explains the result line by line: points and contribution per slider, base quality, then the multipliers (trend, audience, style, fatigue).
4. The last week of a month closes the accounts. Negative money is **bankruptcy**; three bad ranks in a row get the series **cancelled**.
5. `EN` / `FR` in the top bar switches the language at any time. The pixel scene shows the mangaka's fatigue (cream, orange, red) and a pile of pages that grows with each chapter.

Things worth trying: do nothing (bankrupt in about 6 months); push every chapter to the maximum (burnout, then cancellation);
rest at the right time; put the effort where the theme's percentages are.

## Provisional choices to review (current values in `balance.jsonc`)

| Choice                                                                          | Where                          |
| ------------------------------------------------------------------------------- | ------------------------------ |
| Starting money 250 000, living costs 50 000 per month, currency `¥`             | `balance.jsonc`, `fr/en.json`  |
| Energy 100 points per week, 50% less at maximum fatigue                         | `energy`                       |
| Quality: diminishing returns (exponent 0.7), slider cap 60, -30% at max fatigue | `slider`, `quality`            |
| Fatigue: +8 per chapter and +0.12 per point, -30 per rest week                  | `fatigue`                      |
| Rank to fans table `[120, 80, 50, 25, 5, -20, -50]`                             | `magazine.rankFans`            |
| Cancellation: rank 6 or worse, 3 weeks in a row                                 | `magazine`                     |
| Rest week: -40 fans                                                             | `magazine.restFanLoss`         |
| Sales: 0.5 tome per fan per month, 500 per tome                                 | `sales`                        |
| Theme weights, yearly trends, audience and style affinities                     | `themes/targets/art-styles`    |
| Competitors: 6 fictional series, strength 28 to 52, growth per year             | `competitors.jsonc`            |
| Bankruptcy = money below 0 at a month end                                       | `core/systems/week-end.ts`     |
| A tie with a competitor goes to the player                                      | `core/systems/competition.ts`  |
| Starting a series takes no time and costs nothing                               | `core/systems/start-series.ts` |
| Title: 1 to 30 characters                                                       | `series.titleMaxLength`        |

## What the headless bot says (30 careers per line, `tools/src/balance-report.test.ts`)

- Doing nothing, resting every week, or putting a tiny effort everywhere: bankrupt around week 24 (six months).
- Spending the whole energy every week: burns out, cancelled or bankrupt within 30 to 130 weeks.
- A player who understands the rules (about 70 points per week, rests when fatigue goes above 60, concentrates on the heavy sliders of the theme):
  survives all 40 years in the four themes and gets rich.
- Spreading the effort by theme weights without resting: mixed results by theme, from comfortable to bankrupt.

## Open design questions (to settle with Hugo, I did not guess)

1. **Money has no use and nothing slows it down.** A good player ends with tens of millions: nothing to buy (assistants, studio, equipment, promotion), nothing to lose. What is the goal and the spending of the mid-game?
2. **Fans never decay by themselves**, only through rank and rest. Should readers drift away over time, with quality, or with the year's competition?
3. **Competitors are not affected by the player** and are public through their expected strength. Should the player see them, rival them, or lose to a trend?
4. **Cancellation rule**: three bad ranks in a row. Should sales matter too ("notes et ventes" in AGENTS.md section 2)?
5. **Rest**: costs fans. Should fatigue also have a consequence of its own (illness, a forced break)?
6. **Starting a series**: instant and free here. The pitch to the publisher (accepted or not, with an editor) is an open question since Phase A.
7. **Series that end well**: there is no way to finish a story and start another one on purpose (only to be cancelled).
8. **Several series in parallel**: one at a time here.
9. **Rank-to-fans and monthly sales** are crude: no volumes (tomes) as such, no print runs.
10. **The 7th-place magazine**: six fictional competitors are enough to show the idea; their personality (genre, rivals) is not designed.
11. **Art direction and pixel font**: the scene is coloured rectangles and the UI uses the system font.

## Known limits

- No save yet (a save only needs the seed and the commands; migrations come with milestone M1).
- The rest-week sentence can read "fatigue -0" when there is nothing to recover.
- Pixel-perfect verification at 100%, 125% and 150% Windows scaling is still pending ([ADR 0010](adr/0010-pixel-rendering-and-scaling.md)).
