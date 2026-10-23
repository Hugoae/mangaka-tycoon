import { describe, expect, it } from "vitest";

import type { PlatformApi } from "../../shared/platform-api";

import { getPlatform } from "./platform";

const fakePlatform: PlatformApi = {
  getAppInfo: () => Promise.resolve({ name: "mangaka", version: "1.0.0" }),
  setFullscreen: () => Promise.resolve(),
};

describe("getPlatform", () => {
  it("returns the API exposed by the preload", () => {
    expect(getPlatform({ platform: fakePlatform })).toBe(fakePlatform);
  });

  it("fails loudly when the preload did not run", () => {
    expect(() => getPlatform({})).toThrow("PlatformApi is unavailable");
  });
});
