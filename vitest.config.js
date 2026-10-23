// @ts-check
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/*/src/**/*.test.ts", "tools/src/**/*.test.ts"],
    // Property-based and lint tests can be slower than unit tests; fail loudly instead of hanging.
    testTimeout: 60_000,
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      reportsDirectory: "coverage",
      // The simulation core is the part of the project that must stay fully trustworthy.
      include: ["packages/core/src/**/*.ts"],
      exclude: ["**/*.test.ts"],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
