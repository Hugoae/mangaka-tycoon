import { APP_ORIGIN } from "../protocol/app-url";

/** `scheme://host[:port]` of a URL, or `null` when it cannot be parsed. */
export function originOf(url: string): string | null {
  try {
    const parsed = new URL(url);
    // `URL.origin` is the string "null" for custom schemes such as `app:`, so it is rebuilt here.
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

/**
 * Origins of the pages that belong to the app: `app://game`, plus the Vite dev server when
 * `pnpm dev` is running (`devServerUrl` is only set then).
 */
export function allowedOriginsFor(devServerUrl: string | undefined): readonly string[] {
  const devOrigin = devServerUrl === undefined ? null : originOf(devServerUrl);
  return devOrigin === null ? [APP_ORIGIN] : [APP_ORIGIN, devOrigin];
}

/**
 * True when `url` belongs to the app. It decides where a window may navigate (ADR 0009) and which
 * IPC senders are trusted: web sites, `file:` and `javascript:` URLs never are.
 */
export function isUrlOfApp(url: string | undefined, allowedOrigins: readonly string[]): boolean {
  if (url === undefined) {
    return false;
  }
  const origin = originOf(url);
  return origin !== null && allowedOrigins.includes(origin);
}
