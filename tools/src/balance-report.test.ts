import { describe, it } from "vitest";

import { loadBaseContent } from "./base-content";
import { playCareer, STRATEGIES } from "./balance-bot";
import type { BotChoice } from "./balance-bot";

/**
 * Prints how fixed strategies fare on the shipped balance. Opt-in, because it judges game design:
 *   BALANCE_REPORT=1 pnpm exec vitest run tools/src/balance-report.test.ts
 */
const ENABLED = process.env["BALANCE_REPORT"] === "1";
const SEEDS = Array.from({ length: 30 }, (_, index) => index + 1);
const TEN_YEARS = 480;

const CHOICES: readonly BotChoice[] = [
  { themeId: "adventure", targetId: "shonen", artStyleId: "classic" },
  { themeId: "sport", targetId: "shonen", artStyleId: "realistic" },
  { themeId: "comedy", targetId: "seinen", artStyleId: "cartoon" },
  { themeId: "combat", targetId: "shonen", artStyleId: "classic" },
];

const mean = (values: readonly number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);

describe.runIf(ENABLED)("balance report", () => {
  it("prints the outcome of each strategy", () => {
    const content = loadBaseContent();
    const lines: string[] = [];
    for (const choice of CHOICES) {
      lines.push(`\n== ${choice.themeId} / ${choice.targetId} / ${choice.artStyleId}`);
      for (const strategy of STRATEGIES) {
        const reports = SEEDS.map((seed) => playCareer(strategy, content, choice, seed, TEN_YEARS));
        const bankrupt = reports.filter((report) => report.endedBankrupt);
        lines.push(
          [
            strategy.name.padEnd(46),
            `bankrupt ${String(bankrupt.length).padStart(2)}/${String(reports.length)}`,
            `weeks ${mean(reports.map((r) => r.weeksPlayed))
              .toFixed(0)
              .padStart(4)}`,
            `money ${mean(reports.map((r) => r.finalMoney))
              .toFixed(0)
              .padStart(9)}`,
            `fans ${mean(reports.map((r) => r.peakFans))
              .toFixed(0)
              .padStart(6)}`,
            `series ${mean(reports.map((r) => r.seriesStarted)).toFixed(1)}`,
            `rank ${mean(reports.map((r) => r.averageRank)).toFixed(2)}`,
            `1st ${mean(reports.map((r) => r.firstPlaces))
              .toFixed(0)
              .padStart(3)}`,
          ].join("  "),
        );
      }
    }
    process.stdout.write(`${lines.join("\n")}\n`);
  });
});
