import { contextBridge, ipcRenderer } from "electron";

import { createPlatformApi } from "./platform-api";

/**
 * Preload script: the only bridge between the sandboxed renderer and the host (ADR 0008).
 * It exposes the `PlatformApi` as `window.platform` and nothing else.
 */
contextBridge.exposeInMainWorld(
  "platform",
  createPlatformApi((channel, payload): Promise<unknown> => ipcRenderer.invoke(channel, payload)),
);
