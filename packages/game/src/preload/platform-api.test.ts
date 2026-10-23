import { describe, expect, it, vi } from "vitest";

import { createValidatedHandler } from "../shared/ipc";
import type { RawInvoke } from "../shared/ipc";
import { platformEndpoints } from "../shared/platform-api";
import type { AppInfo } from "../shared/platform-api";

import { createPlatformApi } from "./platform-api";

/**
 * Wires the preload side to fake main-process implementations through a raw `invoke`, the way
 * `ipcRenderer.invoke` and `ipcMain.handle` are wired in the real app.
 */
function createFakeHost(appInfo: AppInfo = { name: "mangaka", version: "1.2.3" }) {
  const setFullscreen = vi.fn<(enabled: boolean) => void>();
  const getAppInfo = createValidatedHandler(platformEndpoints.getAppInfo, () => appInfo);
  const setFullscreenHandler = createValidatedHandler(
    platformEndpoints.setFullscreen,
    (enabled) => {
      setFullscreen(enabled);
    },
  );

  const invoke: RawInvoke = (channel, payload) => {
    switch (channel) {
      case platformEndpoints.getAppInfo.channel:
        return getAppInfo(payload, undefined);
      case platformEndpoints.setFullscreen.channel:
        return setFullscreenHandler(payload, undefined);
      default:
        return Promise.reject(new Error(`No handler for ${channel}`));
    }
  };
  return { invoke, setFullscreen };
}

describe("createPlatformApi", () => {
  it("returns the app info provided by the host", async () => {
    const { invoke } = createFakeHost();
    await expect(createPlatformApi(invoke).getAppInfo()).resolves.toEqual({
      name: "mangaka",
      version: "1.2.3",
    });
  });

  it("forwards setFullscreen to the host", async () => {
    const { invoke, setFullscreen } = createFakeHost();
    await createPlatformApi(invoke).setFullscreen(true);
    expect(setFullscreen).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("rejects an app info that does not match the contract", async () => {
    const { invoke } = createFakeHost({ name: "", version: "1" });
    await expect(createPlatformApi(invoke).getAppInfo()).rejects.toThrow();
  });

  it("does not let a forged payload reach the host implementation", async () => {
    const { invoke, setFullscreen } = createFakeHost();

    await expect(invoke(platformEndpoints.setFullscreen.channel, "yes")).rejects.toThrow();
    expect(setFullscreen).not.toHaveBeenCalled();
  });
});
