import { callEndpoint } from "../shared/ipc";
import type { RawInvoke } from "../shared/ipc";
import { platformEndpoints } from "../shared/platform-api";
import type { PlatformApi } from "../shared/platform-api";

/** Builds the renderer-facing API on top of a raw IPC `invoke`. Pure, so it can be tested. */
export function createPlatformApi(invoke: RawInvoke): PlatformApi {
  return {
    getAppInfo: () => callEndpoint(invoke, platformEndpoints.getAppInfo, undefined),
    setFullscreen: (enabled) => callEndpoint(invoke, platformEndpoints.setFullscreen, enabled),
  };
}
