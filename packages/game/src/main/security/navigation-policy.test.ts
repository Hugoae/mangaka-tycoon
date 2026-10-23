import { describe, expect, it } from "vitest";

import { isAllowedNavigation, originOf } from "./navigation-policy";

const APP = ["app://game"];

describe("originOf", () => {
  it("rebuilds the origin of a custom scheme", () => {
    expect(originOf("app://game/index.html?x=1")).toBe("app://game");
  });

  it("keeps the port of a web origin", () => {
    expect(originOf("http://localhost:5173/")).toBe("http://localhost:5173");
  });

  it("returns null for something that is not a URL", () => {
    expect(originOf("not a url")).toBeNull();
  });
});

describe("isAllowedNavigation", () => {
  it("allows pages of the app", () => {
    expect(isAllowedNavigation("app://game/index.html", APP)).toBe(true);
    expect(isAllowedNavigation("app://game/other/page.html#x", APP)).toBe(true);
  });

  it.each([
    "https://example.com/",
    "http://localhost:5173/",
    "file:///C:/Windows/win.ini",
    "javascript:alert(1)",
    "app://evil/index.html",
    "data:text/html,<h1>x</h1>",
    "not a url",
    "",
  ])("refuses %j", (url) => {
    expect(isAllowedNavigation(url, APP)).toBe(false);
  });

  it("allows the dev server only when it is listed", () => {
    const allowed = [...APP, "http://localhost:5173"];
    expect(isAllowedNavigation("http://localhost:5173/", allowed)).toBe(true);
    expect(isAllowedNavigation("http://localhost:9999/", allowed)).toBe(false);
  });
});
