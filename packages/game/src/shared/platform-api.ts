import { z } from "zod";

import { defineEndpoint } from "./ipc";

export const AppInfoSchema = z.strictObject({
  name: z.string().min(1),
  version: z.string().min(1),
});

export type AppInfo = z.infer<typeof AppInfoSchema>;

/**
 * The only door from the renderer to the host (ADR 0008). The renderer imports this interface,
 * never `electron`. A browser implementation can replace the Electron one later.
 *
 * Version 0: saves, mods and settings arrive with their milestones.
 */
export interface PlatformApi {
  getAppInfo(): Promise<AppInfo>;
  setFullscreen(enabled: boolean): Promise<void>;
}

/** The IPC contract implementing {@link PlatformApi} between preload and main. */
export const platformEndpoints = {
  getAppInfo: defineEndpoint("platform:get-app-info", z.undefined(), AppInfoSchema),
  setFullscreen: defineEndpoint("platform:set-fullscreen", z.boolean(), z.void()),
} as const;
