import { app, BrowserWindow, ipcMain } from "electron";
import type { IpcMainInvokeEvent } from "electron";
import type { z } from "zod";

import { createValidatedHandler } from "../../shared/ipc";
import type { IpcEndpoint } from "../../shared/ipc";
import { platformEndpoints } from "../../shared/platform-api";
import { isUrlOfApp } from "../security/navigation-policy";

/**
 * Registers the IPC handlers behind `PlatformApi` (ADR 0008). Every call is checked twice:
 * the sender must be a page of the app (main frame, trusted origin), and the payload must
 * match the endpoint schema.
 */
export function registerIpcHandlers(allowedOrigins: readonly string[]): void {
  function handle<Request extends z.ZodType, Response extends z.ZodType>(
    endpoint: IpcEndpoint<Request, Response>,
    implementation: (
      request: z.output<Request>,
      event: IpcMainInvokeEvent,
    ) => z.input<Response> | Promise<z.input<Response>>,
  ): void {
    const validated = createValidatedHandler(endpoint, implementation);
    ipcMain.handle(endpoint.channel, (event, payload: unknown) => {
      const frame = event.senderFrame;
      const isTrusted =
        frame !== null && frame.parent === null && isUrlOfApp(frame.url, allowedOrigins);
      if (!isTrusted) {
        throw new Error(`Refused IPC call on "${endpoint.channel}" from an untrusted sender.`);
      }
      return validated(payload, event);
    });
  }

  handle(platformEndpoints.getAppInfo, () => ({ name: app.getName(), version: app.getVersion() }));

  handle(platformEndpoints.setFullscreen, (enabled, event) => {
    BrowserWindow.fromWebContents(event.sender)?.setFullScreen(enabled);
  });
}
