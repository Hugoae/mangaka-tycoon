import type { PlatformApi } from "../../shared/platform-api";

declare global {
  interface Window {
    /** Exposed by the preload through `contextBridge`. Absent in a plain browser. */
    readonly platform?: PlatformApi;
  }
}

/**
 * The host the renderer runs in. The renderer never imports `electron`: it only knows this
 * interface (ADR 0008).
 */
export function getPlatform(host: { readonly platform?: PlatformApi } = window): PlatformApi {
  if (host.platform === undefined) {
    throw new Error("PlatformApi is unavailable: the preload script did not run.");
  }
  return host.platform;
}
