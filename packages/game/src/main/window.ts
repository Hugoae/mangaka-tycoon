import { join } from "node:path";

import { BrowserWindow } from "electron";

import { APP_ENTRY_URL } from "./protocol/app-url";

const DEV_WINDOW_WIDTH = 1280;
const DEV_WINDOW_HEIGHT = 720;
const FULLSCREEN_KEY = "F11";

/**
 * Creates the game window. Production (and `pnpm start`) is borderless fullscreen and loads the
 * renderer over `app://`; `pnpm dev` is a 1280x720 window on the Vite dev server so the editor
 * stays visible. F11 toggles fullscreen in both.
 */
export function createMainWindow(devServerUrl: string | undefined): BrowserWindow {
  const isDev = devServerUrl !== undefined;

  const window = new BrowserWindow({
    ...(isDev
      ? // Content size, not window size: the frame must not eat into the 1280x720 that fits x2.
        { width: DEV_WINDOW_WIDTH, height: DEV_WINDOW_HEIGHT, useContentSize: true }
      : { fullscreen: true }),
    backgroundColor: "#000000",
    webPreferences: {
      // Security baseline (ADR 0009), spelled out even where it is already the default.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: join(import.meta.dirname, "../preload/index.cjs"),
    },
  });

  // Without its preload the renderer has no PlatformApi and cannot work: make that visible.
  window.webContents.on("preload-error", (_event, preloadPath, error) => {
    process.stderr.write(`Preload script failed to load (${preloadPath}): ${error.message}\n`);
  });

  window.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === FULLSCREEN_KEY) {
      window.setFullScreen(!window.isFullScreen());
      event.preventDefault();
    }
  });

  void window.loadURL(isDev ? devServerUrl : APP_ENTRY_URL);
  return window;
}
