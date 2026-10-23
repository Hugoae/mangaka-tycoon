import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";

/**
 * Build configuration, kept deliberately thin (ADR 0011): entry points use the conventional
 * folders (`src/main`, `src/preload`, `src/renderer`) and the only plugin is React.
 *
 * Every library is a devDependency and is bundled into `out/`, including for main and preload:
 * a sandboxed preload cannot `require` third-party packages at runtime.
 */
export default defineConfig({
  main: { build: { externalizeDeps: false } },
  preload: {
    build: {
      externalizeDeps: false,
      // A sandboxed preload must be CommonJS (an ES module preload needs `sandbox: false`),
      // while the package itself is ESM, hence the explicit format and extension.
      rolldownOptions: { output: { format: "cjs", entryFileNames: "[name].cjs" } },
    },
  },
  renderer: { plugins: [react()] },
});
