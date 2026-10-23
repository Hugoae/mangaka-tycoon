import { join } from "node:path";

import { app, BrowserWindow } from "electron";

import { registerIpcHandlers } from "./ipc/register-ipc";
import { handleAppProtocol, registerAppScheme } from "./protocol/app-protocol";
import { allowedOriginsFor } from "./security/navigation-policy";
import { installSecurity } from "./security/install-security";
import { createMainWindow } from "./window";

// Set only by `electron-vite dev`: the Vite dev server serving the renderer.
const devServerUrl = process.env["ELECTRON_RENDERER_URL"];
const allowedOrigins = allowedOriginsFor(devServerUrl);

// Render one CSS pixel as one physical pixel whatever the Windows display scale, so the game can
// compute its own integer scale (ADR 0010). Must be set before the app is ready.
app.commandLine.appendSwitch("force-device-scale-factor", "1");
registerAppScheme();

void app.whenReady().then(() => {
  installSecurity(devServerUrl, allowedOrigins);
  registerIpcHandlers(allowedOrigins);
  handleAppProtocol(join(import.meta.dirname, "../renderer"));
  createMainWindow(devServerUrl);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow(devServerUrl);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
