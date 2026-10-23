import { stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { net, protocol } from "electron";

import { buildContentSecurityPolicy } from "../security/csp";

import { APP_SCHEME, resolveAppRequest } from "./app-url";

const NOT_FOUND = 404;
const FORBIDDEN = 403;

/**
 * Declares `app://` as a standard, secure scheme with `fetch` support. Electron requires this
 * before the `ready` event, hence a separate function from {@link handleAppProtocol}.
 */
export function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: APP_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
  ]);
}

/** Serves the renderer bundle from `rendererRoot` over `app://`, with the production CSP. */
export function handleAppProtocol(rendererRoot: string): void {
  const policy = buildContentSecurityPolicy();

  protocol.handle(APP_SCHEME, async (request) => {
    const file = resolveAppRequest(request.url, rendererRoot);
    if (file === null) {
      return new Response("Forbidden", { status: FORBIDDEN });
    }

    // Checked first on purpose: for a missing file, `net.fetch` rejects and also emits an
    // unhandled error that aborts the response (`ERR_UNEXPECTED`) instead of giving a 404.
    const info = await stat(file).catch(() => null);
    if (info?.isFile() !== true) {
      return new Response("Not found", { status: NOT_FOUND });
    }

    const upstream = await net.fetch(pathToFileURL(file).toString());

    const headers = new Headers(upstream.headers);
    headers.set("Content-Security-Policy", policy);
    return new Response(upstream.body, { status: upstream.status, headers });
  });
}
