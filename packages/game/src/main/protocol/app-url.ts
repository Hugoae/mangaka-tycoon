import { isAbsolute, relative, resolve, sep } from "node:path";

/** Custom protocol serving the renderer in production, instead of `file://` (ADR 0009). */
export const APP_SCHEME = "app";
/** Fixed host: it gives the renderer a stable origin, `app://game`. */
export const APP_HOST = "game";
export const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`;
/** URL of the renderer entry page. */
export const APP_ENTRY_URL = `${APP_ORIGIN}/index.html`;

const ENTRY_FILE = "index.html";
const PARENT_DIRECTORY = "..";

function isInside(root: string, candidate: string): boolean {
  const path = relative(root, candidate);
  return (
    path !== PARENT_DIRECTORY && !path.startsWith(`${PARENT_DIRECTORY}${sep}`) && !isAbsolute(path)
  );
}

/**
 * Maps an `app://` request URL to a file inside `rendererRoot`, or returns `null` when the request
 * must be refused: wrong scheme or host, malformed URL, or a path that would leave the root.
 *
 * This is a security boundary: the renderer (and anything it loads) must never read files outside
 * the renderer bundle through this protocol.
 */
export function resolveAppRequest(requestUrl: string, rendererRoot: string): string | null {
  let url: URL;
  try {
    url = new URL(requestUrl);
  } catch {
    return null;
  }
  if (url.protocol !== `${APP_SCHEME}:` || url.host !== APP_HOST) {
    return null;
  }

  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  if (pathname.includes("\0")) {
    return null;
  }

  const root = resolve(rendererRoot);
  const target = resolve(root, pathname === "/" ? ENTRY_FILE : pathname.slice(1));
  return isInside(root, target) ? target : null;
}
