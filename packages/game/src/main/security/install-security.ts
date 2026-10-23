import { app, session } from "electron";

import { buildContentSecurityPolicy } from "./csp";
import { isUrlOfApp, originOf } from "./navigation-policy";

/**
 * Installs the Electron security baseline (ADR 0009) that is not a window option:
 * no navigation away from the app, no new windows, no webviews, no permission grants.
 * Must run before the first window is created.
 *
 * `devServerUrl` is only set by `pnpm dev`; that page then receives a relaxed policy for hot
 * reload. The `app://` pages get their policy from the protocol handler.
 */
export function installSecurity(
  devServerUrl: string | undefined,
  allowedOrigins: readonly string[],
): void {
  app.on("web-contents-created", (_event, contents) => {
    contents.setWindowOpenHandler(() => ({ action: "deny" }));
    contents.on("will-navigate", (event, url) => {
      if (!isUrlOfApp(url, allowedOrigins)) {
        event.preventDefault();
      }
    });
    contents.on("will-attach-webview", (event) => {
      event.preventDefault();
    });
  });

  // The game needs no browser permission (camera, location, notifications...).
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => {
    callback(false);
  });
  session.defaultSession.setPermissionCheckHandler(() => false);

  const devOrigin = devServerUrl === undefined ? null : originOf(devServerUrl);
  if (devOrigin !== null) {
    const policy = buildContentSecurityPolicy({ devServerOrigin: devOrigin });
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const isDevPage = originOf(details.url) === devOrigin;
      callback({
        responseHeaders: isDevPage
          ? { ...details.responseHeaders, "Content-Security-Policy": [policy] }
          : (details.responseHeaders ?? {}),
      });
    });
  }
}
