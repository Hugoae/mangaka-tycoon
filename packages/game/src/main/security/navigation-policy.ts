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
 * True when the window may navigate to `url`: only pages of the app itself (ADR 0009). Everything
 * else (web sites, `file:`, `javascript:`) is refused.
 */
export function isAllowedNavigation(url: string, allowedOrigins: readonly string[]): boolean {
  const origin = originOf(url);
  return origin !== null && allowedOrigins.includes(origin);
}
