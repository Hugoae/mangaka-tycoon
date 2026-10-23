import { join } from "node:path";

import { app, BrowserWindow } from "electron";

const DEV_WINDOW_WIDTH = 1280;
const DEV_WINDOW_HEIGHT = 720;

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: DEV_WINDOW_WIDTH,
    height: DEV_WINDOW_HEIGHT,
    webPreferences: {
      // Security baseline (ADR 0009), spelled out even where it is already the default.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: join(import.meta.dirname, "../preload/index.cjs"),
    },
  });

  const devServerUrl = process.env["ELECTRON_RENDERER_URL"];
  if (devServerUrl !== undefined) {
    void window.loadURL(devServerUrl);
  } else {
    // Transitional: replaced by the `app://` protocol in the next commit (ADR 0009).
    void window.loadFile(join(import.meta.dirname, "../renderer/index.html"));
  }
  return window;
}

void app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
